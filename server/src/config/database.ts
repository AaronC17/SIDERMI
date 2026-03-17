import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { MongoMemoryServer } from 'mongodb-memory-server-core';

dotenv.config();

let memoryServer: MongoMemoryServer | null = null;

const isTruthy = (value?: string): boolean => {
  if (!value) return false;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
};

export const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/registro_utn';
  const allowInMemory = process.env.ALLOW_IN_MEMORY_DB !== 'false';

  try {
    if (isTruthy(process.env.USE_IN_MEMORY_DB)) {
      memoryServer = await MongoMemoryServer.create({
        instance: { dbName: 'registro_utn' },
      });
      const memoryUri = memoryServer.getUri();
      await mongoose.connect(memoryUri);
      console.log('MongoDB en memoria activo:', memoryUri);
      return;
    }

    await mongoose.connect(uri);
    console.log('MongoDB conectado:', uri);
  } catch (error) {
    if (!allowInMemory) {
      console.error('Error conectando a MongoDB:', error);
      process.exit(1);
    }

    console.warn('No se pudo conectar a MongoDB local. Activando MongoDB en memoria...');
    memoryServer = await MongoMemoryServer.create({
      instance: { dbName: 'registro_utn' },
    });
    const memoryUri = memoryServer.getUri();
    await mongoose.connect(memoryUri);
    console.log('MongoDB en memoria activo:', memoryUri);
  }
};

process.on('SIGINT', async () => {
  if (memoryServer) {
    await memoryServer.stop();
  }
  process.exit(0);
});
