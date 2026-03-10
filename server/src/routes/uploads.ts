import { Router, Request, Response } from 'express';
import { uploadExcel } from '../middleware/upload';
import {
  parseAspirantesSheet,
  parseMatriculadosSheet,
  parseAvatarSheet,
  parseExcelAutoDetect,
} from '../services/excelService';
import {
  importarAspirantes,
  importarCorteMatriculados,
  importarAvatar,
} from '../services/compareService';
import UploadHistory from '../models/UploadHistory';
import { registrarAuditoria, auditFromReq } from '../services/auditService';

const router = Router();

// POST /api/uploads/aspirantes - Subir lista de Aspirantes (SIGU)
router.post('/aspirantes', uploadExcel.single('archivo'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió archivo' });
    }

    const filePath = req.file.path;
    const rows = parseAspirantesSheet(filePath);

    if (rows.length === 0) {
      return res.status(400).json({
        error: 'No se encontraron datos de aspirantes en el archivo',
        hint: 'Asegúrese de que el archivo tiene una hoja "Aspirantes" con columnas: Identificación, Nombre, etc.'
      });
    }

    const result = await importarAspirantes(rows);

    // Guardar historial
    await UploadHistory.create({
      tipoArchivo: 'ASPIRANTES',
      tipoMatricula: 'ORDINARIA',
      nombreArchivo: req.file.originalname,
      registrosTotales: rows.length,
      registrosNuevos: result.nuevos,
      registrosExistentes: result.existentes,
      registrosActualizados: result.actualizados,
      detalles: `Importación de aspirantes: ${result.nuevos} nuevos, ${result.existentes} ya existían`,
    });

    res.json({
      success: true,
      archivo: req.file.originalname,
      registrosTotales: rows.length,
      ...result,
    });

    const { usuario, ip } = auditFromReq(req);
    registrarAuditoria({
      usuario, ip,
      accion: 'IMPORTAR',
      entidad: 'importacion',
      entidadId: req.file.originalname,
      detalle: `Aspirantes: ${result.nuevos} nuevos, ${result.actualizados} actualizados, ${result.existentes} existentes`,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/uploads/corte - Subir corte de matriculados (SIGU/Avatar)
router.post('/corte', uploadExcel.single('archivo'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió archivo' });
    }

    const tipoMatricula = (req.body.tipoMatricula === 'EXTRAORDINARIA') ? 'EXTRAORDINARIA' : 'ORDINARIA';
    const corte = req.body.corte || `Corte ${new Date().toLocaleDateString('es-CR')}`;
    const filePath = req.file.path;

    // Auto-detectar tipo de archivo
    const info = parseExcelAutoDetect(filePath);

    let result;
    let tipoArchivo: string;

    if (info.hasMatriculados || !info.hasAvatar) {
      // Parsear como datos de matrícula (SIGU)
      const rows = parseMatriculadosSheet(filePath);
      if (rows.length === 0) {
        return res.status(400).json({
          error: 'No se encontraron datos de matriculados en el archivo',
          hojas: info.sheets,
        });
      }
      result = await importarCorteMatriculados(rows, tipoMatricula, corte);
      tipoArchivo = 'CORTE_MATRICULA';
    } else {
      // Parsear como datos de Avatar
      const rows = parseAvatarSheet(filePath);
      if (rows.length === 0) {
        return res.status(400).json({ error: 'No se encontraron datos de Avatar en el archivo' });
      }
      result = await importarAvatar(rows, tipoMatricula);
      tipoArchivo = 'AVATAR';
    }

    // Guardar historial
    await UploadHistory.create({
      tipoArchivo,
      tipoMatricula,
      nombreArchivo: req.file.originalname,
      registrosTotales: result.nuevos + result.existentes + result.actualizados,
      registrosNuevos: result.nuevos,
      registrosExistentes: result.existentes,
      registrosActualizados: result.actualizados,
      corte,
      detalles: `${tipoArchivo} (${tipoMatricula}): ${result.nuevos} nuevos, ${result.actualizados} actualizados, ${result.existentes} sin cambios`,
    });

    res.json({
      success: true,
      archivo: req.file.originalname,
      tipoArchivo,
      tipoMatricula,
      corte,
      registrosTotales: result.nuevos + result.existentes + result.actualizados,
      ...result,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/uploads/avatar - Subir datos específicos de Avatar
router.post('/avatar', uploadExcel.single('archivo'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió archivo' });
    }

    const tipoMatricula = (req.body.tipoMatricula === 'EXTRAORDINARIA') ? 'EXTRAORDINARIA' : 'ORDINARIA';
    const filePath = req.file.path;
    const rows = parseAvatarSheet(filePath);

    if (rows.length === 0) {
      return res.status(400).json({ error: 'No se encontraron datos de Avatar' });
    }

    const result = await importarAvatar(rows, tipoMatricula);

    await UploadHistory.create({
      tipoArchivo: 'AVATAR',
      tipoMatricula,
      nombreArchivo: req.file.originalname,
      registrosTotales: rows.length,
      registrosNuevos: result.nuevos,
      registrosExistentes: result.existentes,
      registrosActualizados: result.actualizados,
      detalles: `Avatar (${tipoMatricula}): ${result.nuevos} nuevos, ${result.actualizados} actualizados`,
    });

    res.json({
      success: true,
      archivo: req.file.originalname,
      tipoMatricula,
      registrosTotales: rows.length,
      ...result,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/uploads/auto - Auto-detectar y procesar todas las hojas del Excel maestro
router.post('/auto', uploadExcel.single('archivo'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió archivo' });
    }

    const filePath = req.file.path;
    const info = parseExcelAutoDetect(filePath);
    const tipoMatricula = (req.body.tipoMatricula === 'EXTRAORDINARIA') ? 'EXTRAORDINARIA' : 'ORDINARIA';
    const corte = req.body.corte || `Auto ${new Date().toLocaleDateString('es-CR')}`;

    const resultados: any = { hojas: info.sheets };

    // Procesar aspirantes si existe
    if (info.hasAspirantes) {
      const rows = parseAspirantesSheet(filePath);
      if (rows.length > 0) {
        resultados.aspirantes = await importarAspirantes(rows);
      }
    }

    // Procesar matriculados si existe
    if (info.hasMatriculados) {
      const rows = parseMatriculadosSheet(filePath);
      if (rows.length > 0) {
        resultados.matriculados = await importarCorteMatriculados(rows, tipoMatricula, corte);
      }
    }

    // Procesar Avatar si existe
    if (info.hasAvatar) {
      const rows = parseAvatarSheet(filePath);
      if (rows.length > 0) {
        resultados.avatar = await importarAvatar(rows, tipoMatricula);
      }
    }

    // Agregar totales acumulados para que el frontend los muestre
    const totales = {
      nuevos:       (resultados.aspirantes?.nuevos      || 0) + (resultados.matriculados?.nuevos      || 0) + (resultados.avatar?.nuevos      || 0),
      existentes:   (resultados.aspirantes?.existentes  || 0) + (resultados.matriculados?.existentes  || 0) + (resultados.avatar?.existentes  || 0),
      actualizados: (resultados.aspirantes?.actualizados|| 0) + (resultados.matriculados?.actualizados|| 0) + (resultados.avatar?.actualizados|| 0),
    };

    res.json({
      success: true,
      archivo: req.file.originalname,
      registrosTotales: totales.nuevos + totales.existentes + totales.actualizados,
      nuevos:       totales.nuevos,
      existentes:   totales.existentes,
      actualizados: totales.actualizados,
      ...resultados,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/uploads/historial - Ver historial de uploads
router.get('/historial', async (_req: Request, res: Response) => {
  try {
    const historial = await UploadHistory.find()
      .sort({ fecha: -1 })
      .limit(50);
    res.json(historial);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/uploads/historial/:id - Eliminar entrada del historial
router.delete('/historial/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await UploadHistory.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Registro no encontrado' });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
