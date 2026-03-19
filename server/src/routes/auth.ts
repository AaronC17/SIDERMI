import { Router, Request, Response } from 'express';
import User from '../models/User';
import { signToken, requireAuth, requireRole, decodeToken } from '../middleware/auth';
import { registrarAuditoria, auditFromReq } from '../services/auditService';

const router = Router();

// Almacenamiento en memoria para tracking de intentos fallidos (en producción usar Redis)
const failedAttempts = new Map<string, { count: number; lockUntil: number }>();
const MAX_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000; // 15 minutos

/**
 * Verifica si una IP está bloqueada por intentos fallidos
 */
function isLocked(ip: string): boolean {
  const record = failedAttempts.get(ip);
  if (!record) return false;
  if (Date.now() > record.lockUntil) {
    failedAttempts.delete(ip);
    return false;
  }
  return record.count >= MAX_ATTEMPTS;
}

/**
 * Registra un intento fallido de login
 */
function recordFailedAttempt(ip: string): void {
  const record = failedAttempts.get(ip) || { count: 0, lockUntil: 0 };
  record.count++;
  if (record.count >= MAX_ATTEMPTS) {
    record.lockUntil = Date.now() + LOCK_TIME;
  }
  failedAttempts.set(ip, record);
}

/**
 * Limpia el registro de intentos fallidos después de login exitoso
 */
function clearFailedAttempts(ip: string): void {
  failedAttempts.delete(ip);
}

// ─── POST /api/auth/login ────────────────────────────────────────────────────
router.post('/login', async (req: Request, res: Response) => {
  try {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';

    // Verificar si la IP está bloqueada
    if (isLocked(ip)) {
      await registrarAuditoria({
        usuario: 'SISTEMA',
        accion: 'LOGIN_BLOQUEADO',
        entidad: 'usuario',
        entidadId: req.body.username || 'desconocido',
        detalle: 'Intento de login desde IP bloqueada',
        ip,
      });
      return res.status(429).json({
        error: 'Demasiados intentos fallidos. Cuenta bloqueada temporalmente.',
      });
    }

    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
    }

    // Sanitizar username
    const sanitizedUsername = String(username).toLowerCase().trim().slice(0, 50);

    const user = await User.findOne({ username: sanitizedUsername, activo: true });
    if (!user || !(await user.comparePassword(password))) {
      // Registrar intento fallido
      recordFailedAttempt(ip);

      await registrarAuditoria({
        usuario: sanitizedUsername,
        accion: 'LOGIN_FALLIDO',
        entidad: 'usuario',
        entidadId: sanitizedUsername,
        detalle: 'Credenciales incorrectas',
        ip,
      });

      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    // Login exitoso - limpiar intentos fallidos
    clearFailedAttempts(ip);

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
      ip,
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
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ─── GET /api/auth/me ────────────────────────────────────────────────────────
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await User.findOne({ username: req.user!.username, activo: true });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    // Incluir flag si el token necesita renovación
    const response: any = {
      username: user.username,
      nombre: user.nombre,
      rol: user.rol,
    };

    if (req.shouldRefreshToken) {
      response.shouldRefresh = true;
    }

    res.json(response);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── POST /api/auth/refresh ─ Renovar token ──────────────────────────────────
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token requerido' });
    }

    const oldToken = header.slice(7);

    // Intentar verificar el token actual (puede estar expirado recientemente)
    let payload = decodeToken(oldToken);
    if (!payload || !payload.username) {
      return res.status(401).json({ error: 'Token inválido', code: 'TOKEN_INVALID' });
    }

    // Verificar que el usuario sigue activo
    const user = await User.findOne({ username: payload.username, activo: true });
    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado o inactivo' });
    }

    // Generar nuevo token
    const newToken = signToken({
      userId: user._id.toString(),
      username: user.username,
      rol: user.rol,
    });

    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    await registrarAuditoria({
      usuario: user.username,
      accion: 'REFRESH_TOKEN',
      entidad: 'usuario',
      entidadId: user.username,
      detalle: 'Token de sesión renovado',
      ip,
    });

    res.json({
      token: newToken,
      user: {
        username: user.username,
        nombre: user.nombre,
        rol: user.rol,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al renovar token' });
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
