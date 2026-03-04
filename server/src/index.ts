import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import studentRoutes from './routes/students';
import uploadRoutes from './routes/uploads';
import documentRoutes from './routes/documents';
import statsRoutes from './routes/stats';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'], credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Servir archivos de documentos subidos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/documents', express.static(path.join(__dirname, '../documents')));

// Rutas API
app.use('/api/students', studentRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/stats', statsRoutes);

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
  app.listen(PORT, () => {
    console.log(`\n🎓 Sistema de Registro UTN`);
    console.log(`   Servidor corriendo en http://localhost:${PORT}`);
    console.log(`   Base de datos: MongoDB local\n`);
  });
};

start().catch(console.error);
