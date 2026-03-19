import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { encryptFile } from '../services/cryptoService';

// Configurar almacenamiento para Excels
const excelStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `excel_${timestamp}${ext}`);
  },
});

// Configurar almacenamiento para documentos de estudiantes (se cifrarán después)
const docStorage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const cedula = req.params.cedula || 'sin_cedula';
    const dir = path.join(__dirname, '../../documents', cedula);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const name = file.fieldname || 'documento';
    // Agregar extensión .enc para indicar que el archivo será cifrado
    cb(null, `${name}_${timestamp}${ext}.enc`);
  },
});

// Extensiones permitidas para documentos
const ALLOWED_DOC_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'];
const ALLOWED_EXCEL_EXTENSIONS = ['.xlsx', '.xls', '.csv'];

// Validar tipo MIME real del archivo (protección adicional)
const ALLOWED_MIMES: Record<string, string[]> = {
  '.pdf': ['application/pdf'],
  '.jpg': ['image/jpeg'],
  '.jpeg': ['image/jpeg'],
  '.png': ['image/png'],
  '.doc': ['application/msword'],
  '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  '.xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  '.xls': ['application/vnd.ms-excel'],
  '.csv': ['text/csv', 'application/vnd.ms-excel', 'text/plain'],
};

export const uploadExcel = multer({
  storage: excelStorage,
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXCEL_EXTENSIONS.includes(ext)) {
      return cb(new Error('Solo se permiten archivos Excel (.xlsx, .xls, .csv)'));
    }
    // Validar MIME type
    const allowedMimes = ALLOWED_MIMES[ext] || [];
    if (allowedMimes.length > 0 && !allowedMimes.includes(file.mimetype)) {
      return cb(new Error(`Tipo MIME inválido para ${ext}: ${file.mimetype}`));
    }
    cb(null, true);
  },
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

// Middleware base para documentos (sin cifrado)
const uploadDocumentBase = multer({
  storage: docStorage,
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_DOC_EXTENSIONS.includes(ext)) {
      return cb(new Error('Solo se permiten: PDF, JPG, PNG, DOC, DOCX'));
    }
    // Validar MIME type
    const allowedMimes = ALLOWED_MIMES[ext] || [];
    if (allowedMimes.length > 0 && !allowedMimes.includes(file.mimetype)) {
      return cb(new Error(`Tipo MIME inválido para ${ext}: ${file.mimetype}`));
    }
    cb(null, true);
  },
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

// Middleware que cifra el archivo después de subirlo
export const uploadDocument = {
  single: (fieldName: string) => {
    return (req: any, res: any, next: any) => {
      uploadDocumentBase.single(fieldName)(req, res, async (err: any) => {
        if (err) {
          return res.status(400).json({ error: err.message });
        }

        // Si hay archivo, cifrarlo
        if (req.file) {
          try {
            await encryptFile(req.file.path);
            console.log(`📁 Archivo cifrado: ${req.file.filename}`);
          } catch (encryptError: any) {
            // Si falla el cifrado, eliminar el archivo y reportar error
            try {
              fs.unlinkSync(req.file.path);
            } catch { /* ignorar */ }
            return res.status(500).json({ error: 'Error al procesar el archivo de forma segura' });
          }
        }

        next();
      });
    };
  },
};
