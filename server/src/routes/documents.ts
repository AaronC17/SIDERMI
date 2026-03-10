import { Router, Request, Response } from 'express';
import { uploadDocument } from '../middleware/upload';
import Student from '../models/Student';
import path from 'path';
import { registrarAuditoria, auditFromReq } from '../services/auditService';

const router = Router();

// POST /api/documents/:cedula/upload/:tipoDoc - Subir documento de un estudiante
router.post('/:cedula/upload/:tipoDoc', uploadDocument.single('archivo'), async (req: Request, res: Response) => {
  try {
    const { cedula, tipoDoc } = req.params;
    const validTypes = ['titulo', 'cedulaFrente', 'cedulaReverso', 'fotoCarnet', 'formularioMatricula', 'otros'];

    if (!validTypes.includes(tipoDoc)) {
      return res.status(400).json({ error: `Tipo de documento inválido. Use: ${validTypes.join(', ')}` });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió archivo' });
    }

    const student = await Student.findOne({ cedula });
    if (!student) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }

    // Guardar referencia al archivo
    const relativePath = `${cedula}/${req.file.filename}`;
    const updateField = `documentos.${tipoDoc}`;

    await Student.updateOne(
      { cedula },
      {
        $set: {
          [`${updateField}.archivo`]: relativePath,
          [`${updateField}.fechaRevision`]: new Date(),
          // NO cambiar estado automáticamente - las compañeras verifican manualmente
        }
      }
    );

    res.json({
      success: true,
      tipoDocumento: tipoDoc,
      archivo: relativePath,
      message: 'Documento subido. Pendiente de verificación manual.',
    });

    const { usuario, ip } = auditFromReq(req);
    registrarAuditoria({
      usuario, ip,
      accion: 'SUBIR_ARCHIVO',
      entidad: 'documento',
      entidadId: cedula,
      detalle: `Archivo ${tipoDoc} subido para ${cedula}`,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/documents/:cedula - Listar documentos de un estudiante
router.get('/:cedula', async (req: Request, res: Response) => {
  try {
    const student = await Student.findOne({ cedula: req.params.cedula })
      .select('cedula nombre primerApellido documentos');

    if (!student) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }

    res.json({
      cedula: student.cedula,
      nombre: `${student.nombre} ${student.primerApellido}`.trim(),
      documentos: student.documentos,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
