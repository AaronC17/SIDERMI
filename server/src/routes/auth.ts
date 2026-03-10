import { Router, Request, Response } from 'express';
import User from '../models/User';
import { signToken, requireAuth, requireRole } from '../middleware/auth';
import { registrarAuditoria, auditFromReq } from '../services/auditService';

const router = Router();

// ─── POST /api/auth/login ────────────────────────────────────────────────────
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
    }

    const user = await User.findOne({ username: username.toLowerCase().trim(), activo: true });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    // Update last login
    user.ultimoLogin = new Date();
    await user.save();

    const token = signToken({
      userId: user._id.toString(),
      username: user.username,
      rol: user.rol,
    });

    await registrarAuditoria({
      usuario: user.username,
      accion: 'LOGIN',
      entidad: 'usuario',
      entidadId: user.username,
      detalle: 'Inicio de sesión exitoso',
      ip: req.ip || req.socket.remoteAddress || '',
    });

    res.json({
      token,
      user: {
        username: user.username,
        nombre: user.nombre,
        rol: user.rol,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── GET /api/auth/me ────────────────────────────────────────────────────────
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await User.findOne({ username: req.user!.username, activo: true });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({
      username: user.username,
      nombre: user.nombre,
      rol: user.rol,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── GET /api/auth/users ─ Listar usuarios (solo Admin) ─────────────────────
router.get('/users', requireAuth, requireRole('Administrador'), async (_req: Request, res: Response) => {
  try {
    const users = await User.find().sort({ creadoEn: 1 });
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── POST /api/auth/users ─ Crear usuario (solo Admin) ──────────────────────
router.post('/users', requireAuth, requireRole('Administrador'), async (req: Request, res: Response) => {
  try {
    const { username, nombre, password, rol } = req.body;
    if (!username || !nombre || !password) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    const exists = await User.findOne({ username: username.toLowerCase().trim() });
    if (exists) {
      return res.status(409).json({ error: 'Ese nombre de usuario ya existe' });
    }

    const user = await User.create({
      username: username.toLowerCase().trim(),
      nombre: nombre.trim(),
      password,
      rol: rol || 'Registro',
    });

    const { usuario, ip } = auditFromReq(req);
    await registrarAuditoria({
      usuario, ip,
      accion: 'CREAR',
      entidad: 'usuario',
      entidadId: user.username,
      detalle: `Usuario "${user.username}" creado con rol ${user.rol}`,
    });

    res.status(201).json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── PUT /api/auth/users/:username ─ Editar usuario (solo Admin) ─────────────
router.put('/users/:username', requireAuth, requireRole('Administrador'), async (req: Request, res: Response) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const { nombre, password, rol, activo } = req.body;
    if (nombre !== undefined) user.nombre = nombre.trim();
    if (password) user.password = password; // pre-save hook will hash
    if (rol !== undefined) user.rol = rol;
    if (activo !== undefined) user.activo = activo;

    await user.save();

    const { usuario, ip } = auditFromReq(req);
    await registrarAuditoria({
      usuario, ip,
      accion: 'EDITAR',
      entidad: 'usuario',
      entidadId: user.username,
      detalle: `Usuario "${user.username}" actualizado`,
    });

    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── DELETE /api/auth/users/:username ─ Eliminar usuario (solo Admin) ────────
router.delete('/users/:username', requireAuth, requireRole('Administrador'), async (req: Request, res: Response) => {
  try {
    if (req.params.username === req.user!.username) {
      return res.status(400).json({ error: 'No puede eliminarse a sí mismo' });
    }

    const user = await User.findOneAndDelete({ username: req.params.username });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const { usuario, ip } = auditFromReq(req);
    await registrarAuditoria({
      usuario, ip,
      accion: 'ELIMINAR',
      entidad: 'usuario',
      entidadId: req.params.username,
      detalle: `Usuario "${req.params.username}" eliminado`,
    });

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
