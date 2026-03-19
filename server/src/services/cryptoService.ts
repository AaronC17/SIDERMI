import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;

// Cache de la clave de cifrado y control de advertencia
let cachedEncryptionKey: Buffer | null = null;
let warningShown = false;

/**
 * Obtiene la clave de cifrado desde variables de entorno.
 * IMPORTANTE: En producción, esta clave debe ser segura y nunca estar en el código.
 */
function getEncryptionKey(): Buffer {
  // Si ya tenemos la clave en cache, devolverla
  if (cachedEncryptionKey) {
    return cachedEncryptionKey;
  }

  const key = process.env.DOCUMENT_ENCRYPTION_KEY;
  if (!key) {
    // Mostrar advertencia solo una vez
    if (!warningShown) {
      console.warn('⚠️  DOCUMENT_ENCRYPTION_KEY no configurada. Usando clave por defecto (INSEGURO en producción)');
      warningShown = true;
    }
    // Genera una clave derivada de una semilla fija (solo para desarrollo)
    cachedEncryptionKey = crypto.scryptSync('sidermi-dev-key-2026', 'sidermi-salt', 32);
    return cachedEncryptionKey;
  }

  // Si la clave tiene 64 caracteres, es hex
  if (key.length === 64) {
    cachedEncryptionKey = Buffer.from(key, 'hex');
  } else {
    // Si no, derivar la clave usando scrypt
    cachedEncryptionKey = crypto.scryptSync(key, 'sidermi-encryption', 32);
  }

  return cachedEncryptionKey;
}

/**
 * Inicializa el servicio de cifrado y muestra advertencias necesarias
 * Debe llamarse una vez al arranque del servidor
 */
export function initializeCrypto(): void {
  // Forzar la inicialización de la clave para mostrar advertencias
  getEncryptionKey();
}

/**
 * Cifra un buffer de datos usando AES-256-GCM
 */
export function encryptBuffer(data: Buffer): Buffer {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(data),
    cipher.final()
  ]);

  const authTag = cipher.getAuthTag();

  // Formato: [IV (16 bytes)] [AuthTag (16 bytes)] [Encrypted Data]
  return Buffer.concat([iv, authTag, encrypted]);
}

/**
 * Descifra un buffer de datos cifrado con AES-256-GCM
 */
export function decryptBuffer(encryptedData: Buffer): Buffer {
  const key = getEncryptionKey();

  // Extraer IV, AuthTag y datos cifrados
  const iv = encryptedData.subarray(0, IV_LENGTH);
  const authTag = encryptedData.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = encryptedData.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]);
}

/**
 * Cifra un archivo en disco y guarda la versión cifrada
 * @param inputPath - Ruta del archivo original
 * @param outputPath - Ruta donde guardar el archivo cifrado (opcional, por defecto reemplaza el original)
 */
export async function encryptFile(inputPath: string, outputPath?: string): Promise<void> {
  const data = fs.readFileSync(inputPath);
  const encrypted = encryptBuffer(data);

  const finalPath = outputPath || inputPath;
  fs.writeFileSync(finalPath, encrypted);

  // Si se especificó una ruta diferente, eliminar el archivo original
  if (outputPath && outputPath !== inputPath) {
    fs.unlinkSync(inputPath);
  }
}

/**
 * Descifra un archivo y lo devuelve como Buffer
 * @param filePath - Ruta del archivo cifrado
 */
export function decryptFile(filePath: string): Buffer {
  const encryptedData = fs.readFileSync(filePath);
  return decryptBuffer(encryptedData);
}

/**
 * Verifica si un archivo parece estar cifrado (tiene IV + AuthTag al inicio)
 */
export function isEncrypted(filePath: string): boolean {
  try {
    const stats = fs.statSync(filePath);
    // Un archivo cifrado debe tener al menos IV + AuthTag + 1 byte de datos
    if (stats.size < IV_LENGTH + AUTH_TAG_LENGTH + 1) {
      return false;
    }

    // Intentar descifrar los primeros bytes para verificar
    const data = fs.readFileSync(filePath);
    try {
      decryptBuffer(data);
      return true;
    } catch {
      return false;
    }
  } catch {
    return false;
  }
}

/**
 * Genera una clave de cifrado segura para usar en producción
 */
export function generateSecureKey(): string {
  return crypto.randomBytes(32).toString('hex');
}
