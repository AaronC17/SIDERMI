import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'sidermi_utn_2026_secret_key';
const TOKEN_EXPIRY = '7d'; // Token dura 7 días
const REFRESH_THRESHOLD = 24 * 60 * 60; // Renovar si le quedan menos de 24h

export interface AuthPayload {
  userId: string;
  username: string;
  rol: string;
  iat?: number;
  exp?: number;
}

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
      shouldRefreshToken?: boolean;
    }
  }
}

/**
 * Middleware: requiere token JWT válido
 * Marca automáticamente si el token necesita renovación
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado — se requiere token de sesión' });
  }

  try {
    const token = header.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
    req.user = decoded;

    // Verificar si el token necesita renovación (menos de 24h restantes)
    if (decoded.exp) {
      const timeRemaining = decoded.exp - Math.floor(Date.now() / 1000);
      req.shouldRefreshToken = timeRemaining < REFRESH_THRESHOLD;
    }

    next();
  } catch (err: any) {
    // Distinguir entre token expirado y token inválido
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Sesión expirada',
        code: 'TOKEN_EXPIRED',
        message: 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.'
      });
    }
    return res.status(401).json({
      error: 'Token inválido',
      code: 'TOKEN_INVALID'
    });
  }
}

/**
 * Middleware: requiere uno de los roles indicados
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autorizado' });
    }
    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ error: 'No tiene permisos para esta acción' });
    }
    next();
  };
}

/**
 * Genera un JWT firmado con expiración de 7 días
 */
export function signToken(payload: Omit<AuthPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

/**
 * Verifica un token sin lanzar error
 */
export function verifyToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthPayload;
  } catch {
    return null;
  }
}

/**
 * Decodifica un token sin verificar (para obtener payload de token expirado)
 */
export function decodeToken(token: string): AuthPayload | null {
  try {
    return jwt.decode(token) as AuthPayload;
  } catch {
    return null;
  }
}
