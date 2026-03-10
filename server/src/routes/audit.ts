import { Router, Request, Response } from 'express';
import AuditLog from '../models/AuditLog';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// ─── GET /api/audit ─ Listar registros de auditoría ─────────────────────────
router.get('/', requireAuth, requireRole('Administrador'), async (req: Request, res: Response) => {
  try {
    const {
      usuario,
      accion,
      entidad,
      entidadId,
      page = '1',
      limit = '50',
    } = req.query;

    const filter: any = {};
    if (usuario) filter.usuario = usuario;
    if (accion) filter.accion = accion;
    if (entidad) filter.entidad = entidad;
    if (entidadId) filter.entidadId = entidadId;

    const pageNum = Math.max(1, parseInt(String(page)));
    const limitNum = Math.min(200, Math.max(1, parseInt(String(limit))));

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ fecha: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      AuditLog.countDocuments(filter),
    ]);

    res.json({
      logs,
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

// ─── GET /api/audit/estudiante/:cedula ─ Timeline de un estudiante ──────────
router.get('/estudiante/:cedula', requireAuth, async (req: Request, res: Response) => {
  try {
    const logs = await AuditLog.find({
      entidad: { $in: ['estudiante', 'documento'] },
      entidadId: req.params.cedula,
    }).sort({ fecha: -1 }).limit(100);

    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
