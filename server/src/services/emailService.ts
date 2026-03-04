import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.office365.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export interface EmailData {
  to: string;
  nombre: string;
  documentosFaltantes: string[];
  horasRestantes?: number;
}

/**
 * Envía correo de notificación de documentos faltantes
 */
export async function enviarNotificacionDocumentos(data: EmailData): Promise<boolean> {
  const listaDocumentos = data.documentosFaltantes
    .map(d => `<li style="padding:4px 0;color:#cc0000;">❌ ${d}</li>`)
    .join('');

  const html = `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background-color:#1B3A5C;color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0;">
        <h2 style="margin:0;">Universidad Técnica Nacional</h2>
        <p style="margin:5px 0 0;font-size:14px;">Departamento de Registro y Admisión</p>
      </div>
      <div style="padding:25px;background:#f9f9f9;border:1px solid #ddd;">
        <p>Estimado(a) <strong>${data.nombre}</strong>,</p>
        <p>Le informamos que su proceso de matrícula tiene <strong>documentos pendientes</strong> por entregar:</p>
        <div style="background:white;padding:15px;border-left:4px solid #cc0000;margin:15px 0;">
          <p style="margin:0 0 10px;font-weight:bold;">Documentos faltantes:</p>
          <ul style="list-style:none;padding-left:0;">${listaDocumentos}</ul>
        </div>
        ${data.horasRestantes ? `<p style="color:#cc0000;font-weight:bold;">⏰ Tiene ${data.horasRestantes} horas restantes para completar su documentación.</p>` : ''}
        <p>Por favor, presente los documentos faltantes a la brevedad posible en la sede correspondiente o comuníquese con nosotros.</p>
        <p>Atentamente,<br><strong>${process.env.EMAIL_FIRMA || 'Departamento de Registro y Admisión'}</strong></p>
      </div>
      <div style="background-color:#1B3A5C;color:white;padding:15px;text-align:center;font-size:12px;border-radius:0 0 8px 8px;">
        <p style="margin:0;">Universidad Técnica Nacional - Sede del Pacífico</p>
        <p style="margin:5px 0 0;">Este es un correo automático, por favor no responda a este mensaje.</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'registro@utn.ac.cr',
      to: data.to,
      subject: '📋 Documentos pendientes - Proceso de Matrícula UTN',
      html,
    });
    return true;
  } catch (error) {
    console.error('Error enviando correo:', error);
    return false;
  }
}

/**
 * Envía correo de bienvenida cuando el estudiante está completo
 */
export async function enviarBienvenida(to: string, nombre: string): Promise<boolean> {
  const html = `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background-color:#1B3A5C;color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0;">
        <h2 style="margin:0;">¡Bienvenido(a) a la UTN!</h2>
      </div>
      <div style="padding:25px;background:#f9f9f9;border:1px solid #ddd;">
        <p>Estimado(a) <strong>${nombre}</strong>,</p>
        <div style="background:white;padding:20px;border-left:4px solid #2e7d32;margin:15px 0;">
          <p style="margin:0;">✅ Su matrícula ha sido <strong>verificada exitosamente</strong>.</p>
          <p style="margin:10px 0 0;">Todos sus documentos están en orden. Su expediente ha sido creado.</p>
        </div>
        <p>Atentamente,<br><strong>${process.env.EMAIL_FIRMA || 'Departamento de Registro y Admisión'}</strong></p>
      </div>
      <div style="background-color:#1B3A5C;color:white;padding:15px;text-align:center;font-size:12px;border-radius:0 0 8px 8px;">
        <p style="margin:0;">Universidad Técnica Nacional - Sede del Pacífico</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'registro@utn.ac.cr',
      to,
      subject: '✅ Matrícula verificada - UTN',
      html,
    });
    return true;
  } catch (error) {
    console.error('Error enviando correo:', error);
    return false;
  }
}
