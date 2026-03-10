import multer from 'multer';
import path from 'path';
import fs from 'fs';

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

// Configurar almacenamiento para documentos de estudiantes
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
    cb(null, `${name}_${timestamp}${ext}`);
  },
});

export const uploadExcel = multer({
  storage: excelStorage,
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.xlsx', '.xls', '.csv'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos Excel (.xlsx, .xls, .csv)'));
    }
  },
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

export const uploadDocument = multer({
  storage: docStorage,
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten: PDF, JPG, PNG, DOC, DOCX'));
    }
  },
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});
