import { Router, Request, Response } from 'express';
import Student from '../models/Student';
import { enviarNotificacionDocumentos, enviarBienvenida } from '../services/emailService';
import { registrarAuditoria, auditFromReq } from '../services/auditService';
import { requireRole } from '../middleware/auth';

const router = Router();

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Filtra información sensible de documentos según el rol del usuario
 */
function filtrarDocumentosPorRol(documentos: any, rol: string) {
  if (rol === 'Consulta') {
    // Para rol Consulta, solo mostrar estado y observación, NO la ruta del archivo
    const filtrados: any = {};
    for (const [tipo, doc] of Object.entries(documentos || {})) {
      const d = doc as any;
      filtrados[tipo] = {
        estado: d?.estado || 'NO_REVISADO',
        observacion: d?.observacion || '',
        fechaRevision: d?.fechaRevision,
        tieneArchivo: !!d?.archivo, // Solo indicar si tiene archivo, no la ruta
      };
    }
    return filtrados;
  }
  // Para Admin y Registro, devolver todo
  return documentos;
}

/**
 * Filtra un estudiante completo según el rol del usuario
 */
function filtrarEstudiantePorRol(student: any, rol: string) {
  const obj = student.toObject ? student.toObject() : { ...student };

  // Filtrar documentos
  if (obj.documentos) {
    obj.documentos = filtrarDocumentosPorRol(obj.documentos, rol);
  }

  return obj;
}

// GET /api/students - Listar todos los estudiantes (con filtros)
router.get('/', async (req: Request, res: Response) => {
  try {
    const userRole = req.user?.rol || 'Consulta';
    const {
      estado,
      estadoPagoFiltro,
      tipoMatricula,
      carrera,
      buscar,
      docFaltante,
      docPresente,
      page = '1',
      limit = '50',
      sort = 'primerApellido',
      order = 'asc',
    } = req.query;

    const filter: any = { activo: true };

    if (estado) filter.estadoAvatar = estado;
    if (tipoMatricula) filter.tipoMatricula = tipoMatricula;
    if (req.query.fuenteDatos) filter.fuenteDatos = req.query.fuenteDatos;
    // Filtro Aspirantes / Matriculados
    if (req.query.matriculado === 'true') filter.matriculado = true;
    else if (req.query.matriculado === 'false') filter.matriculado = false;
    const andFilters: any[] = [];

    if (carrera) {
      andFilters.push({
        $or: [
        { codigoCarrera: carrera },
        { codigoCarreraAvatar: carrera },
        { codigoCarreraManual: carrera },
        ],
      });
    }

    // Filtro por estado de pago consolidado
    if (estadoPagoFiltro === 'PENDIENTE') {
      andFilters.push({
        estadoPago: { $regex: /^(PEN|PENDIENTE)$/i },
      });
    } else if (estadoPagoFiltro === 'TRAMITADO') {
      andFilters.push({
        estadoPago: { $regex: /^(TRA|TRAMITADO|PAG|PAGADO)$/i },
      });
    } else if (estadoPagoFiltro === 'NULO') {
      andFilters.push({
        $or: [
          { estadoPago: { $in: ['', null] } },
          { estadoPago: { $regex: /^(ANU|ANULADO|NUL|NULO)$/i } },
        ],
      });
    }

    // Filtrar por documento faltante específico
    if (docFaltante) {
      const docField = `documentos.${docFaltante}.estado`;
      filter[docField] = { $ne: 'COMPLETO' };
    }

    // Filtrar por documento presente (COMPLETO)
    if (docPresente) {
      const docField = `documentos.${docPresente}.estado`;
      filter[docField] = 'COMPLETO';
    }

    // Búsqueda por cédula — solo prefijo (debe empezar con el valor buscado)
    if (buscar) {
      // Sanitizar entrada: solo permitir dígitos
      const sanitized = String(buscar).replace(/\D/g, '');
      if (sanitized.length > 0) {
        filter.cedula = new RegExp('^' + sanitized, 'i');
      }
    }

    if (andFilters.length > 0) {
      filter.$and = andFilters;
    }

    const pageNum = Math.max(1, parseInt(String(page)));
    const limitNum = Math.min(200, Math.max(1, parseInt(String(limit))));
    const sortOrder = order === 'desc' ? -1 : 1;

    // Ordenar por cantidad de documentos completos (campo calculado)
    if (String(sort) === 'docsCompletos') {
      const pipeline: any[] = [
        { $match: filter },
        {
          $addFields: {
            docsCompletos: {
              $size: {
                $filter: {
                  input: [
                    '$documentos.titulo.estado',
                    '$documentos.cedulaFrente.estado',
                    '$documentos.cedulaReverso.estado',
                    '$documentos.fotoCarnet.estado',
                  ],
                  as: 'e',
                  cond: { $eq: ['$$e', 'COMPLETO'] },
                },
              },
            },
          },
        },
        { $sort: { docsCompletos: sortOrder, primerApellido: 1 } },
        { $skip: (pageNum - 1) * limitNum },
        { $limit: limitNum },
      ];
      const [students, total] = await Promise.all([
        Student.aggregate(pipeline),
        Student.countDocuments(filter),
      ]);

      // Filtrar documentos según rol
      const filteredStudents = students.map(s => filtrarEstudiantePorRol(s, userRole));

      return res.json({
        students: filteredStudents,
        pagination: { total, page: pageNum, pages: Math.ceil(total / limitNum), limit: limitNum },
      });
    }

    const [students, total] = await Promise.all([
      Student.find(filter)
        .sort({ [String(sort)]: sortOrder })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Student.countDocuments(filter),
    ]);

    // Filtrar documentos según rol
    const filteredStudents = students.map(s => filtrarEstudiantePorRol(s, userRole));

    res.json({
      students: filteredStudents,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/students/:cedula - Obtener un estudiante por cédula
router.get('/:cedula', async (req: Request, res: Response) => {
  try {
    const userRole = req.user?.rol || 'Consulta';

    // Validar cédula: solo dígitos y guiones
    if (!/^[\d-]+$/.test(req.params.cedula)) {
      return res.status(400).json({ error: 'Cédula inválida' });
    }

    const student = await Student.findOne({ cedula: req.params.cedula });
    if (!student) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }

    // Filtrar según rol
    res.json(filtrarEstudiantePorRol(student, userRole));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/students/:cedula - Actualizar datos del estudiante (editar manual)
router.put('/:cedula', requireRole('Administrador', 'Registro'), async (req: Request, res: Response) => {
  try {
    const before = await Student.findOne({ cedula: req.params.cedula });
    if (!before) return res.status(404).json({ error: 'Estudiante no encontrado' });

    const allowedFields = ['estadoAvatar', 'observaciones', 'codigoCarreraManual'] as const;
    const safeUpdate: Record<string, any> = {};
    for (const field of allowedFields) {
      if (field in req.body) safeUpdate[field] = req.body[field];
    }

    const student = await Student.findOneAndUpdate(
      { cedula: req.params.cedula },
      { $set: safeUpdate },
      { new: true, runValidators: true }
    );

    if (!student) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }

    // Verificar si todos los documentos están completos → cambiar estado
    const docs = student.documentos;
    const todosCompletos =
      docs.titulo.estado === 'COMPLETO' &&
      docs.cedulaFrente.estado === 'COMPLETO' &&
      docs.cedulaReverso.estado === 'COMPLETO';

    if (todosCompletos && student.estadoAvatar !== 'COMPLETO' && student.estadoAvatar !== 'ARCHIVADO') {
      student.estadoAvatar = 'COMPLETO';
      student.verificacionRegistro = true;
      await student.save();
    }

    const CAMPOS_AUDITABLES = ['estadoAvatar', 'observaciones', 'codigoCarreraManual'] as const;
    const cambios: Record<string, { antes: any; despues: any }> = {};
    for (const campo of CAMPOS_AUDITABLES) {
      if (campo in req.body && String((before as any)[campo] ?? '') !== String(req.body[campo] ?? '')) {
        cambios[campo] = { antes: (before as any)[campo] ?? '', despues: req.body[campo] ?? '' };
      }
    }
    const detalle = Object.entries(cambios).length > 0
      ? Object.entries(cambios).map(([k, v]) => `${k}: "${v.antes}" → "${v.despues}"`).join(' | ')
      : `Estudiante ${req.params.cedula} actualizado`;

    const { usuario, ip } = auditFromReq(req);
    await registrarAuditoria({
      usuario, ip,
      accion: 'EDITAR',
      entidad: 'estudiante',
      entidadId: req.params.cedula,
      detalle,
      cambios: Object.keys(cambios).length > 0 ? cambios : undefined,
    });

    res.json(student);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/students/:cedula/documentos - Actualizar estado de documentos
router.put('/:cedula/documentos', requireRole('Administrador', 'Registro'), async (req: Request, res: Response) => {
  try {
    const { documentos } = req.body;
    const updateFields: any = {};

    // Construir update para cada tipo de documento
    for (const [tipo, data] of Object.entries(documentos || {})) {
      const docData = data as any;
      if (docData.estado) updateFields[`documentos.${tipo}.estado`] = docData.estado;
      if (docData.observacion !== undefined) updateFields[`documentos.${tipo}.observacion`] = docData.observacion;
      if (docData.estado) updateFields[`documentos.${tipo}.fechaRevision`] = new Date();
    }

    const student = await Student.findOneAndUpdate(
      { cedula: req.params.cedula },
      { $set: updateFields },
      { new: true }
    );

    if (!student) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }

    // Verificar si todos completos
    const docs = student.documentos;
    const todosCompletos =
      docs.titulo.estado === 'COMPLETO' &&
      docs.cedulaFrente.estado === 'COMPLETO' &&
      docs.cedulaReverso.estado === 'COMPLETO';

    if (todosCompletos) {
      await Student.updateOne({ cedula: req.params.cedula }, {
        $set: { estadoAvatar: 'COMPLETO', verificacionRegistro: true }
      });
    } else if (student.estadoAvatar === 'COMPLETO') {
      // Si ya no tiene todos los docs completos, revertir a PENDIENTE
      await Student.updateOne({ cedula: req.params.cedula }, {
        $set: { estadoAvatar: 'PENDIENTE', verificacionRegistro: false }
      });
    }

    res.json(student);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/students/:cedula/notificar - Enviar correo de notificación
router.post('/:cedula/notificar', requireRole('Administrador', 'Registro'), async (req: Request, res: Response) => {
  try {
    const student = await Student.findOne({ cedula: req.params.cedula });
    if (!student) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }

    if (!student.correoElectronico) {
      return res.status(400).json({ error: 'El estudiante no tiene correo electrónico registrado' });
    }

    // Determinar documentos faltantes
    const faltantes: string[] = [];
    const docs = student.documentos;
    if (docs.titulo.estado !== 'COMPLETO') faltantes.push('Título de bachillerato');
    if (docs.cedulaFrente.estado !== 'COMPLETO') faltantes.push('Cédula de identidad (frente)');
    if (docs.cedulaReverso.estado !== 'COMPLETO') faltantes.push('Cédula de identidad (reverso)');
    if (docs.fotoCarnet.estado !== 'COMPLETO') faltantes.push('Fotografía tipo carnet');
    if (docs.formularioMatricula.estado !== 'COMPLETO') faltantes.push('Formulario de matrícula');

    if (faltantes.length === 0) {
      return res.status(400).json({ error: 'El estudiante tiene todos los documentos completos' });
    }

    const nombreCompleto = `${student.nombre} ${student.primerApellido} ${student.segundoApellido}`.trim();

    const enviado = await enviarNotificacionDocumentos({
      to: student.correoElectronico,
      nombre: nombreCompleto,
      documentosFaltantes: faltantes,
      horasRestantes: req.body.horasRestantes,
    });

    if (enviado) {
      // Registrar contacto
      await Student.updateOne(
        { cedula: req.params.cedula },
        {
          $set: {
            estadoAvatar: 'NOTIFICADO',
            medioContacto: 'CORREO',
            fechaContactoCorreo: new Date(),
          },
          $push: {
            historialContactos: {
              fecha: new Date(),
              medio: 'CORREO',
              detalle: `Notificación enviada. Docs faltantes: ${faltantes.join(', ')}`,
            }
          }
        }
      );
      res.json({ success: true, message: 'Correo enviado exitosamente' });
    } else {
      res.status(500).json({ error: 'Error al enviar el correo' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/students/notificar-masivo - Notificar a todos los pendientes
router.post('/notificar-masivo', requireRole('Administrador', 'Registro'), async (req: Request, res: Response) => {
  try {
    const maxPorEjecucion = Number(process.env.EMAIL_MAX_PER_RUN || 300);
    const blockSize = Number(process.env.EMAIL_BATCH_SIZE || 50);
    const pauseMs = Number(process.env.EMAIL_BATCH_PAUSE_MS || 10 * 60 * 1000);
    const delayEntreEnviosMs = Number(process.env.EMAIL_SEND_DELAY_MS || 1000);

    const pendientes = await Student.find({
      activo: true,
      correoElectronico: { $ne: '' },
      estadoAvatar: { $in: ['PENDIENTE', 'LLAMAR'] },
      $or: [
        { 'documentos.titulo.estado': { $ne: 'COMPLETO' } },
        { 'documentos.cedulaFrente.estado': { $ne: 'COMPLETO' } },
        { 'documentos.cedulaReverso.estado': { $ne: 'COMPLETO' } },
      ]
    });

    const objetivo = pendientes.slice(0, Math.max(0, maxPorEjecucion));

    let enviados = 0;
    let errores = 0;
    let procesados = 0;

    for (const student of objetivo) {
      const faltantes: string[] = [];
      if (student.documentos.titulo.estado !== 'COMPLETO') faltantes.push('Título');
      if (student.documentos.cedulaFrente.estado !== 'COMPLETO') faltantes.push('Cédula (frente)');
      if (student.documentos.cedulaReverso.estado !== 'COMPLETO') faltantes.push('Cédula (reverso)');

      const nombreCompleto = `${student.nombre} ${student.primerApellido}`.trim();
      const ok = await enviarNotificacionDocumentos({
        to: student.correoElectronico,
        nombre: nombreCompleto,
        documentosFaltantes: faltantes,
      });

      if (ok) {
        enviados++;
        await Student.updateOne({ _id: student._id }, {
          $set: { estadoAvatar: 'NOTIFICADO', fechaContactoCorreo: new Date() },
        });
      } else {
        errores++;
      }

      procesados++;

      // Pausa corta entre correos para bajar riesgo de bloqueo
      if (delayEntreEnviosMs > 0 && procesados < objetivo.length) {
        await sleep(delayEntreEnviosMs);
      }

      // Pausa larga por bloques (ej. 50 cada 10-15 min)
      if (blockSize > 0 && pauseMs > 0 && procesados % blockSize === 0 && procesados < objetivo.length) {
        await sleep(pauseMs);
      }
    }

    const omitidosPorLimite = Math.max(0, pendientes.length - objetivo.length);

    res.json({
      totalPendientes: pendientes.length,
      totalProcesados: objetivo.length,
      omitidosPorLimite,
      enviados,
      errores,
      configuracion: {
        maxPorEjecucion,
        blockSize,
        pauseMs,
        delayEntreEnviosMs,
      },
      solicitadoPor: req.user?.username || 'desconocido',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/students/:cedula - Desactivar (soft delete)
router.delete('/:cedula', requireRole('Administrador', 'Registro'), async (req: Request, res: Response) => {
  try {
    const student = await Student.findOneAndUpdate(
      { cedula: req.params.cedula },
      { $set: { activo: false } },
      { new: true }
    );
    if (!student) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }
    res.json({ message: 'Estudiante desactivado', cedula: student.cedula });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
