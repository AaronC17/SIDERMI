import archiver from 'archiver';
import fs from 'fs';
import path from 'path';
import Student from '../models/Student';

/**
 * Genera un ZIP con carpetas por estudiante que tienen todos los requisitos completos.
 * Cada carpeta: CEDULA_NOMBRE_TIPOMATRICULA/
 *   - titulo.xxx
 *   - cedula_frente.xxx
 *   - cedula_reverso.xxx
 *   - etc.
 */
export async function generarZipCompletos(outputPath: string): Promise<{
  totalEstudiantes: number;
  archivoZip: string;
}> {
  // Solo estudiantes con todos los documentos COMPLETOS
  const estudiantes = await Student.find({
    activo: true,
    'documentos.titulo.estado': 'COMPLETO',
    'documentos.cedulaFrente.estado': 'COMPLETO',
    'documentos.cedulaReverso.estado': 'COMPLETO',
  });

  const zipFileName = `expedientes_completos_${new Date().toISOString().split('T')[0]}.zip`;
  const zipPath = path.join(outputPath, zipFileName);

  // Crear directorio si no existe
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }

  const output = fs.createWriteStream(zipPath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  return new Promise((resolve, reject) => {
    output.on('close', () => {
      resolve({
        totalEstudiantes: estudiantes.length,
        archivoZip: zipPath,
      });
    });

    archive.on('error', reject);
    archive.pipe(output);

    const docsDir = path.join(__dirname, '../../documents');

    for (const est of estudiantes) {
      const folderName = `${est.cedula}_${est.primerApellido}_${est.nombre}_${est.tipoMatricula}`
        .replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ_\-]/g, '_')
        .replace(/_+/g, '_');

      // Agregar cada documento que tenga archivo
      const docTypes = ['titulo', 'cedulaFrente', 'cedulaReverso', 'fotoCarnet', 'formularioMatricula', 'otros'] as const;

      for (const docType of docTypes) {
        const doc = est.documentos[docType];
        if (doc?.archivo) {
          const filePath = path.join(docsDir, doc.archivo);
          if (fs.existsSync(filePath)) {
            const ext = path.extname(doc.archivo);
            archive.file(filePath, { name: `${folderName}/${docType}${ext}` });
          }
        }
      }
    }

    archive.finalize();
  });
}

/**
 * Genera resumen de estudiantes pendientes (no completos)
 */
export async function getEstudiantesPendientes() {
  const pendientes = await Student.find({
    activo: true,
    $or: [
      { 'documentos.titulo.estado': { $ne: 'COMPLETO' } },
      { 'documentos.cedulaFrente.estado': { $ne: 'COMPLETO' } },
      { 'documentos.cedulaReverso.estado': { $ne: 'COMPLETO' } },
    ]
  }).select('cedula nombre primerApellido segundoApellido documentos estadoAvatar correoElectronico');

  return pendientes.map(est => {
    const faltantes: string[] = [];
    if (est.documentos.titulo.estado !== 'COMPLETO') faltantes.push('Título');
    if (est.documentos.cedulaFrente.estado !== 'COMPLETO') faltantes.push('Cédula (frente)');
    if (est.documentos.cedulaReverso.estado !== 'COMPLETO') faltantes.push('Cédula (reverso)');
    if (est.documentos.fotoCarnet.estado !== 'COMPLETO') faltantes.push('Foto carnet');
    if (est.documentos.formularioMatricula.estado !== 'COMPLETO') faltantes.push('Formulario');

    return {
      cedula: est.cedula,
      nombreCompleto: `${est.nombre} ${est.primerApellido} ${est.segundoApellido}`.trim(),
      correo: est.correoElectronico,
      estado: est.estadoAvatar,
      documentosFaltantes: faltantes,
    };
  });
}
