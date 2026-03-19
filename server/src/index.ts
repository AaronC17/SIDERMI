import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import { requireAuth } from './middleware/auth';
import { seedDefaultAdmin } from './seed';
import { initializeCrypto } from './services/cryptoService';
import { securityHeaders, apiRateLimiter, loginRateLimiter, uploadRateLimiter, bulkUploadRateLimiter, sanitizeInput } from './middleware/security';
import authRoutes from './routes/auth';
import auditRoutes from './routes/audit';
import studentRoutes from './routes/students';
import uploadRoutes from './routes/uploads';
import documentRoutes from './routes/documents';
import statsRoutes from './routes/stats';
import secureFilesRoutes from './middleware/secureFiles';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// ========== SEGURIDAD ==========

// Headers de seguridad (antes de todo)
app.use(securityHeaders);

// Deshabilitar header X-Powered-By
app.disable('x-powered-by');

// CORS configurado de forma más segura
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:4000'];

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sin origin (Postman, curl, etc.) solo en desarrollo
    if (!origin && process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting general para todas las rutas API
app.use('/api', apiRateLimiter);

// Parseo de JSON con límite de tamaño (50mb para soportar uploads grandes de Excel/CSV)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Sanitizar entrada
app.use(sanitizeInput);

// ========== RUTAS ==========

// IMPORTANTE: No servir archivos estáticamente desde /documents o /uploads
// Los archivos ahora se sirven a través de rutas protegidas con autenticación

// Rutas públicas (login con rate limiting más estricto)
app.use('/api/auth', loginRateLimiter, authRoutes);

// Rutas protegidas (requieren autenticación)
app.use('/api/students', requireAuth, studentRoutes);
app.use('/api/uploads', requireAuth, uploadRoutes); // Sin rate limiter general para uploads masivos
app.use('/api/documents', requireAuth, uploadRateLimiter, documentRoutes); // Rate limiter solo para documentos individuales
app.use('/api/stats', requireAuth, statsRoutes);
app.use('/api/audit', auditRoutes); // ya tiene requireAuth interno

// Rutas de archivos seguros (con autenticación y descifrado)
app.use('/secure-files', secureFilesRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Servir frontend en producción
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
  });
}

// Manejador de errores global
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error no manejado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Iniciar servidor
const start = async () => {
  await connectDB();
  await seedDefaultAdmin();
  initializeCrypto();
  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`\n🎓 Sistema de Registro UTN`);
    console.log(`   Servidor corriendo en http://0.0.0.0:${PORT}`);
    console.log(`   Accesible por IP en el puerto ${PORT}`);
    console.log(`   Base de datos: MongoDB local`);
    console.log(`   🔒 Seguridad: Headers, Rate Limiting, Cifrado activos\n`);
  });
};

start().catch(console.error);
