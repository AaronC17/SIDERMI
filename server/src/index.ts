import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import { requireAuth } from './middleware/auth';
import { seedDefaultAdmin } from './seed';
import authRoutes from './routes/auth';
import auditRoutes from './routes/audit';
import studentRoutes from './routes/students';
import uploadRoutes from './routes/uploads';
import documentRoutes from './routes/documents';
import statsRoutes from './routes/stats';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware - permitir acceso desde cualquier origen para desarrollo
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Servir archivos de documentos subidos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/documents', express.static(path.join(__dirname, '../documents')));

// Rutas públicas (login no requiere token)
app.use('/api/auth', authRoutes);

// Rutas protegidas (requieren autenticación)
app.use('/api/students', requireAuth, studentRoutes);
app.use('/api/uploads', requireAuth, uploadRoutes);
app.use('/api/documents', requireAuth, documentRoutes);
app.use('/api/stats', requireAuth, statsRoutes);
app.use('/api/audit', auditRoutes); // ya tiene requireAuth interno

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

// Iniciar servidor
const start = async () => {
  await connectDB();
  await seedDefaultAdmin();
  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`\n🎓 Sistema de Registro UTN`);
    console.log(`   Servidor corriendo en http://0.0.0.0:${PORT}`);
    console.log(`   Accesible por IP en el puerto ${PORT}`);
    console.log(`   Base de datos: MongoDB local\n`);
  });
};

start().catch(console.error);
