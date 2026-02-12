// =============================================================================
// EMAIL SERVICE - Invio email ai candidati
// =============================================================================

import nodemailer from "nodemailer";
import type { Candidate, EmailTemplate, Position, EmailLog } from "@/types";
import { addEmailLog } from "./storage";

/**
 * Crea il transporter SMTP
 */
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
}

/**
 * Sostituisce i placeholder nel template con i dati del candidato
 */
function replacePlaceholders(
  text: string,
  candidate: Candidate,
  position: Position
): string {
  return text
    .replace(/\{\{nome\}\}/g, candidate.nome)
    .replace(/\{\{email\}\}/g, candidate.email)
    .replace(/\{\{telefono\}\}/g, candidate.telefono)
    .replace(/\{\{citta\}\}/g, candidate.citta)
    .replace(/\{\{posizione\}\}/g, position.name)
    .replace(/\{\{calendly_link\}\}/g, position.calendlyLink)
    .replace(/\{\{azienda\}\}/g, "Leone Master School");
}

/**
 * Invia una email a un candidato usando un template
 */
export async function sendCandidateEmail(
  candidate: Candidate,
  template: EmailTemplate,
  position: Position
): Promise<EmailLog> {
  const transporter = createTransporter();

  const subject = replacePlaceholders(template.subject, candidate, position);
  const html = replacePlaceholders(template.body, candidate, position);

  const fromName = process.env.EMAIL_FROM_NAME || "Leone Master School - HR";
  const fromAddress = process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER;

  try {
    await transporter.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to: candidate.email,
      subject,
      html,
    });

    const log = addEmailLog({
      candidateId: candidate.id,
      candidateEmail: candidate.email,
      candidateName: candidate.nome,
      templateId: template.id,
      positionId: position.id,
      subject,
      sentAt: new Date().toISOString(),
      status: "sent",
    });

    return log;
  } catch (error) {
    const log = addEmailLog({
      candidateId: candidate.id,
      candidateEmail: candidate.email,
      candidateName: candidate.nome,
      templateId: template.id,
      positionId: position.id,
      subject,
      sentAt: new Date().toISOString(),
      status: "failed",
      error: error instanceof Error ? error.message : "Errore sconosciuto",
    });

    return log;
  }
}

/**
 * Invia email a più candidati (bulk)
 */
export async function sendBulkEmails(
  candidates: Candidate[],
  template: EmailTemplate,
  position: Position,
  delayMs: number = 1000 // Delay tra una email e l'altra per evitare rate limiting
): Promise<EmailLog[]> {
  const logs: EmailLog[] = [];

  for (const candidate of candidates) {
    const log = await sendCandidateEmail(candidate, template, position);
    logs.push(log);

    // Delay tra le email
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return logs;
}

/**
 * Testa la configurazione SMTP
 */
export async function testEmailConfig(): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Errore sconosciuto",
    };
  }
}
