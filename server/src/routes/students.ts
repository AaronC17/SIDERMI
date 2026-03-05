import { Router, Request, Response } from 'express';
import Student from '../models/Student';
import { enviarNotificacionDocumentos, enviarBienvenida } from '../services/emailService';

const router = Router();

// GET /api/students - Listar todos los estudiantes (con filtros)
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      estado,
      tipoMatricula,
      carrera,
      buscar,
      docFaltante,
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
    if (carrera) {
      filter.$or = [
        { codigoCarrera: carrera },
        { codigoCarreraAvatar: carrera },
        { codigoCarreraManual: carrera },
      ];
    }

    // Filtrar por documento faltante específico
    if (docFaltante) {
      const docField = `documentos.${docFaltante}.estado`;
      filter[docField] = { $ne: 'COMPLETO' };
    }

    // Búsqueda por cédula — solo prefijo (debe empezar con el valor buscado)
    if (buscar) {
      filter.cedula = new RegExp('^' + String(buscar).replace(/\D/g, ''), 'i');
    }

    const pageNum = Math.max(1, parseInt(String(page)));
    const limitNum = Math.min(200, Math.max(1, parseInt(String(limit))));
    const sortOrder = order === 'desc' ? -1 : 1;

    const [students, total] = await Promise.all([
      Student.find(filter)
        .sort({ [String(sort)]: sortOrder })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Student.countDocuments(filter),
    ]);

    res.json({
      students,
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
    const student = await Student.findOne({ cedula: req.params.cedula });
    if (!student) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }
    res.json(student);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/students/:cedula - Actualizar datos del estudiante (editar manual)
router.put('/:cedula', async (req: Request, res: Response) => {
  try {
    const student = await Student.findOneAndUpdate(
      { cedula: req.params.cedula },
      { $set: req.body },
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

    res.json(student);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/students/:cedula/documentos - Actualizar estado de documentos
router.put('/:cedula/documentos', async (req: Request, res: Response) => {
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
    }

    res.json(student);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/students/:cedula/notificar - Enviar correo de notificación
router.post('/:cedula/notificar', async (req: Request, res: Response) => {
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
router.post('/notificar-masivo', async (_req: Request, res: Response) => {
  try {
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

    let enviados = 0;
    let errores = 0;

    for (const student of pendientes) {
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
    }

    res.json({ total: pendientes.length, enviados, errores });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/students/:cedula - Desactivar (soft delete)
router.delete('/:cedula', async (req: Request, res: Response) => {
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
