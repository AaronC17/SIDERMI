import { Router, Request, Response } from 'express';
import Student from '../models/Student';
import UploadHistory from '../models/UploadHistory';
import path from 'path';
import { generarZipCompletos, getEstudiantesPendientes } from '../services/zipService';

const router = Router();

// GET /api/stats/dashboard - Estadísticas generales del dashboard
router.get('/dashboard', async (_req: Request, res: Response) => {
  try {
    const [
      totalEstudiantes,
      matriculados,
      aspirantesSinMatricula,
      porEstado,
      porTipoMatricula,
      porCarrera,
      documentosStats,
      ultimosUploads,
      porSexo,
      porSede,
      verificacionRegistro,
    ] = await Promise.all([
      // Total activos
      Student.countDocuments({ activo: true }),

      // Matriculados confirmados
      Student.countDocuments({ activo: true, matriculado: true }),

      // Aspirantes que nunca matricularon
      Student.countDocuments({ activo: true, matriculado: { $ne: true } }),

      // Por estado Avatar
      Student.aggregate([
        { $match: { activo: true } },
        { $group: { _id: '$estadoAvatar', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // Por tipo matrícula
      Student.aggregate([
        { $match: { activo: true } },
        { $group: { _id: '$tipoMatricula', count: { $sum: 1 } } },
      ]),

      // Por carrera
      Student.aggregate([
        { $match: { activo: true } },
        {
          $group: {
            _id: {
              $cond: [
                { $ne: ['$codigoCarreraAvatar', ''] },
                '$codigoCarreraAvatar',
                {
                  $cond: [
                    { $ne: ['$codigoCarrera', ''] },
                    '$codigoCarrera',
                    'SIN CARRERA'
                  ]
                }
              ]
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
      ]),

      // Estadísticas de documentos
      Promise.all([
        Student.countDocuments({ activo: true, 'documentos.titulo.estado': 'COMPLETO' }),
        Student.countDocuments({ activo: true, 'documentos.titulo.estado': { $ne: 'COMPLETO' } }),
        Student.countDocuments({ activo: true, 'documentos.cedulaFrente.estado': 'COMPLETO' }),
        Student.countDocuments({ activo: true, 'documentos.cedulaFrente.estado': { $ne: 'COMPLETO' } }),
        Student.countDocuments({ activo: true, 'documentos.cedulaReverso.estado': 'COMPLETO' }),
        Student.countDocuments({ activo: true, 'documentos.cedulaReverso.estado': { $ne: 'COMPLETO' } }),
        Student.countDocuments({
          activo: true,
          'documentos.titulo.estado': 'COMPLETO',
          'documentos.cedulaFrente.estado': 'COMPLETO',
          'documentos.cedulaReverso.estado': 'COMPLETO',
        }),
      ]),

      // Últimas importaciones
      UploadHistory.find().sort({ fecha: -1 }).limit(5),

      // Por sexo
      Student.aggregate([
        { $match: { activo: true } },
        { $group: { _id: { $ifNull: ['$sexo', ''] }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // Por sede
      Student.aggregate([
        { $match: { activo: true } },
        { $group: { _id: { $ifNull: ['$sede', ''] }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // Verificación de registro
      Promise.all([
        Student.countDocuments({ activo: true, verificacionRegistro: true }),
        Student.countDocuments({ activo: true, verificacionRegistro: { $ne: true } }),
      ]),
    ]);

    const [tituloOk, tituloFalta, cedulaFOk, cedulaFFalta, cedulaROk, cedulaRFalta, todosCompletos] = documentosStats;
    const [verificados, noVerificados] = verificacionRegistro;

    res.json({
      totalEstudiantes,
      matriculados,
      aspirantesSinMatricula,
      porEstado: porEstado.reduce((acc: any, item: any) => {
        acc[item._id || 'SIN_ESTADO'] = item.count;
        return acc;
      }, {}),
      porTipoMatricula: porTipoMatricula.reduce((acc: any, item: any) => {
        acc[item._id || 'SIN_TIPO'] = item.count;
        return acc;
      }, {}),
      porCarrera: porCarrera.map((item: any) => ({
        carrera: item._id,
        cantidad: item.count,
      })),
      porSexo: porSexo.map((item: any) => ({
        sexo: item._id === 'M' ? 'Masculino' : item._id === 'F' ? 'Femenino' : 'No especificado',
        cantidad: item.count,
      })),
      porSede: porSede.map((item: any) => ({
        sede: item._id || 'Sin sede',
        cantidad: item.count,
      })),
      verificacionRegistro: {
        verificados,
        noVerificados,
      },
      documentos: {
        titulo: { completo: tituloOk, faltante: tituloFalta },
        cedulaFrente: { completo: cedulaFOk, faltante: cedulaFFalta },
        cedulaReverso: { completo: cedulaROk, faltante: cedulaRFalta },
        todosCompletos,
        todosIncompletos: totalEstudiantes - todosCompletos,
      },
      ultimosUploads,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/stats/pendientes - Lista de estudiantes con documentos faltantes
router.get('/pendientes', async (_req: Request, res: Response) => {
  try {
    const pendientes = await getEstudiantesPendientes();
    res.json({
      total: pendientes.length,
      estudiantes: pendientes,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/stats/por-documento/:tipo - Filtrar por tipo de documento faltante
router.get('/por-documento/:tipo', async (req: Request, res: Response) => {
  try {
    const { tipo } = req.params;
    const docField = `documentos.${tipo}.estado`;

    const faltantes = await Student.find({
      activo: true,
      [docField]: { $ne: 'COMPLETO' },
    })
      .select('cedula nombre primerApellido segundoApellido correoElectronico estadoAvatar documentos')
      .sort({ primerApellido: 1 });

    res.json({
      tipoDocumento: tipo,
      total: faltantes.length,
      estudiantes: faltantes.map(e => ({
        cedula: e.cedula,
        nombre: `${e.nombre} ${e.primerApellido} ${e.segundoApellido}`.trim(),
        correo: e.correoElectronico,
        estado: e.estadoAvatar,
        estadoDocumento: (e.documentos as any)[tipo]?.estado || 'NO_REVISADO',
      })),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/stats/descargar-completos - Generar y descargar ZIP de expedientes completos
router.post('/descargar-completos', async (_req: Request, res: Response) => {
  try {
    const outputDir = path.join(__dirname, '../../downloads');
    const result = await generarZipCompletos(outputDir);

    if (result.totalEstudiantes === 0) {
      return res.status(404).json({
        error: 'No hay estudiantes con todos los documentos completos para descargar',
      });
    }

    res.download(result.archivoZip, path.basename(result.archivoZip), (err) => {
      if (err) {
        console.error('Error descargando ZIP:', err);
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
