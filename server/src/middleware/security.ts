import { Request, Response, NextFunction } from 'express';

/**
 * Configuración de rate limiting por IP
 */
interface RateLimitConfig {
  windowMs: number;      // Ventana de tiempo en ms
  max: number;           // Máximo de requests por ventana
  message: string;       // Mensaje de error
}

// Almacenamiento en memoria para rate limiting (en producción usar Redis)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

/**
 * Middleware de Rate Limiting personalizado
 */
export function rateLimit(config: RateLimitConfig) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    const record = requestCounts.get(ip);

    if (!record || now > record.resetTime) {
      // Nueva ventana
      requestCounts.set(ip, { count: 1, resetTime: now + config.windowMs });
      return next();
    }

    if (record.count >= config.max) {
      res.setHeader('Retry-After', Math.ceil((record.resetTime - now) / 1000));
      return res.status(429).json({ error: config.message });
    }

    record.count++;
    next();
  };
}

/**
 * Rate limiter para login (más estricto)
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20,                   // 20 intentos
  message: 'Demasiados intentos de inicio de sesión. Intente de nuevo en 15 minutos.',
});

/**
 * Rate limiter general para API
 */
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,       // 1 minuto
  max: 1000,                  // 1000 requests por minuto
  message: 'Demasiadas solicitudes. Intente de nuevo en un momento.',
});

/**
 * Rate limiter para uploads de documentos individuales
 */
export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 1000,       // 1 minuto
  max: 200,                   // 200 uploads por minuto
  message: 'Demasiados archivos subidos. Espere un momento.',
});

/**
 * Rate limiter para uploads de Excel/CSV (listas masivas)
 * Más permisivo porque son operaciones administrativas legítimas
 */
export const bulkUploadRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,   // 5 minutos
  max: 50,                    // 50 uploads masivos cada 5 minutos
  message: 'Demasiadas cargas masivas. Espere un momento antes de subir más listas.',
});

/**
 * Middleware de headers de seguridad (similar a helmet)
 */
export function securityHeaders(_req: Request, res: Response, next: NextFunction) {
  // Prevenir XSS
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Prevenir clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevenir MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Content Security Policy básica
  // IMPORTANTE: connect-src permite peticiones AJAX al mismo origen y localhost en desarrollo
  const isProduction = process.env.NODE_ENV === 'production';
  const connectSrc = isProduction
    ? "'self'"
    : "'self' http://localhost:* http://127.0.0.1:*";

  res.setHeader(
    'Content-Security-Policy',
    `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src ${connectSrc};`
  );

  // Strict Transport Security (solo en producción con HTTPS)
  if (isProduction) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  // Permissions Policy
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()'
  );

  next();
}

/**
 * Middleware para sanitizar parámetros de entrada
 */
export function sanitizeInput(req: Request, _res: Response, next: NextFunction) {
  // Sanitizar query params
  for (const key of Object.keys(req.query)) {
    if (typeof req.query[key] === 'string') {
      // Remover caracteres peligrosos
      req.query[key] = (req.query[key] as string)
        .replace(/[<>]/g, '')           // Prevenir XSS básico
        .replace(/\$/g, '')             // Prevenir NoSQL injection
        .trim();
    }
  }

  // Sanitizar body params (solo strings de primer nivel)
  if (req.body && typeof req.body === 'object') {
    for (const key of Object.keys(req.body)) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key]
          .replace(/[<>]/g, '')
          .trim();
      }
    }
  }

  next();
}

/**
 * Limpia registros expirados del rate limiter periódicamente
 */
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of requestCounts.entries()) {
    if (now > record.resetTime) {
      requestCounts.delete(ip);
    }
  }
}, 60 * 1000); // Cada minuto
