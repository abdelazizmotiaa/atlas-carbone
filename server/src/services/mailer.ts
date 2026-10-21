import nodemailer from 'nodemailer';
import { db } from '../db/database.js';

let transporter: nodemailer.Transporter | null = null;

if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
} else if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });
}

export interface EmailPayload {
  to: string;
  subject: string;
  templateName: string;
  html: string;
}

export async function sendNotificationEmail(payload: EmailPayload): Promise<{ success: boolean; id: string; dispatched: boolean }> {
  const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  const now = new Date().toISOString();

  // 1. Toujours enregistrer en base de données SQLite pour traçabilité et historique
  try {
    db.prepare(`
      INSERT INTO dev_notifications (id, recipient_email, subject, template_name, content_html, sent_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, payload.to, payload.subject, payload.templateName, payload.html, now);
  } catch (err) {
    console.error("Erreur enregistrement dev_notifications:", err);
  }

  // 2. Si un transport SMTP réel est configuré, envoyer réellement l'email
  let dispatched = false;
  if (transporter) {
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || `"Atlas Carbone" <${process.env.SMTP_USER || process.env.GMAIL_USER || 'contact@mesure-emissions.com'}>`,
        to: payload.to,
        subject: payload.subject,
        html: payload.html
      });
      dispatched = true;
      console.log(`✉️ Email envoyé avec succès à ${payload.to} : ${payload.subject}`);
    } catch (sendErr) {
      console.error(`⚠️ Erreur d'envoi SMTP vers ${payload.to}:`, sendErr);
    }
  } else {
    console.log(`ℹ️ [Mode Local/DB] Email enregistré dans dev_notifications pour ${payload.to} : ${payload.subject}`);
  }

  return { success: true, id, dispatched };
}
