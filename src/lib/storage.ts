// =============================================================================
// STORAGE SERVICE - Persistenza dati su file JSON
// =============================================================================

import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import type {
  Position,
  EmailTemplate,
  ScreeningPreset,
  EmailLog,
  CandidateStatus,
} from "@/types";
import { getDefaultSetterPreset } from "./screening-engine";

const DATA_DIR = path.join(process.cwd(), "data");

// Assicura che la directory data esista
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Lettura/Scrittura generica
function readJsonFile<T>(filename: string, defaultValue: T): T {
  ensureDataDir();
  const filepath = path.join(DATA_DIR, filename);
  try {
    if (fs.existsSync(filepath)) {
      const content = fs.readFileSync(filepath, "utf-8");
      return JSON.parse(content) as T;
    }
  } catch (error) {
    console.error(`Errore lettura ${filename}:`, error);
  }
  return defaultValue;
}

function writeJsonFile<T>(filename: string, data: T): void {
  ensureDataDir();
  const filepath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2), "utf-8");
}

// =============================================================================
// POSITIONS
// =============================================================================

export function getPositions(): Position[] {
  const positions = readJsonFile<Position[]>("positions.json", []);
  if (positions.length === 0) {
    // Crea posizione default
    const defaultPosition = createDefaultPosition();
    return [defaultPosition];
  }
  return positions;
}

export function getPosition(id: string): Position | undefined {
  return getPositions().find((p) => p.id === id);
}

export function savePosition(position: Omit<Position, "id" | "createdAt" | "updatedAt">): Position {
  const positions = getPositions();
  const newPosition: Position = {
    ...position,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  positions.push(newPosition);
  writeJsonFile("positions.json", positions);
  return newPosition;
}

export function updatePosition(id: string, updates: Partial<Position>): Position | null {
  const positions = getPositions();
  const index = positions.findIndex((p) => p.id === id);
  if (index === -1) return null;

  positions[index] = {
    ...positions[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  writeJsonFile("positions.json", positions);
  return positions[index];
}

export function deletePosition(id: string): boolean {
  const positions = getPositions();
  const filtered = positions.filter((p) => p.id !== id);
  if (filtered.length === positions.length) return false;
  writeJsonFile("positions.json", filtered);
  return true;
}

function createDefaultPosition(): Position {
  const pos: Position = {
    id: "default-setter-position",
    name: "Appointment Setter",
    description: "Appointment Setter per Leone Master School - Ricerca da Indeed",
    sheetId: process.env.GOOGLE_SHEET_ID || "",
    sheetName: process.env.GOOGLE_SHEET_NAME || "Setter Appointment - 2026",
    calendlyLink: process.env.CALENDLY_LINK || "https://calendly.com/tuo-link",
    emailTemplateId: "default-setter-email",
    screeningPresetId: "default-setter",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Salva anche il preset e il template di default
  const presets = readJsonFile<ScreeningPreset[]>("presets.json", []);
  if (!presets.find((p) => p.id === "default-setter")) {
    presets.push(getDefaultSetterPreset(pos.id));
    writeJsonFile("presets.json", presets);
  }

  const templates = readJsonFile<EmailTemplate[]>("templates.json", []);
  if (!templates.find((t) => t.id === "default-setter-email")) {
    templates.push(createDefaultEmailTemplate(pos.id));
    writeJsonFile("templates.json", templates);
  }

  const positions = readJsonFile<Position[]>("positions.json", []);
  positions.push(pos);
  writeJsonFile("positions.json", positions);

  return pos;
}

// =============================================================================
// SCREENING PRESETS
// =============================================================================

export function getPresets(): ScreeningPreset[] {
  return readJsonFile<ScreeningPreset[]>("presets.json", []);
}

export function getPreset(id: string): ScreeningPreset | undefined {
  return getPresets().find((p) => p.id === id);
}

export function savePreset(
  preset: Omit<ScreeningPreset, "id" | "createdAt" | "updatedAt">
): ScreeningPreset {
  const presets = getPresets();
  const newPreset: ScreeningPreset = {
    ...preset,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  presets.push(newPreset);
  writeJsonFile("presets.json", presets);
  return newPreset;
}

export function updatePreset(
  id: string,
  updates: Partial<ScreeningPreset>
): ScreeningPreset | null {
  const presets = getPresets();
  const index = presets.findIndex((p) => p.id === id);
  if (index === -1) return null;

  presets[index] = {
    ...presets[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  writeJsonFile("presets.json", presets);
  return presets[index];
}

// =============================================================================
// EMAIL TEMPLATES
// =============================================================================

export function getEmailTemplates(): EmailTemplate[] {
  return readJsonFile<EmailTemplate[]>("templates.json", []);
}

export function getEmailTemplate(id: string): EmailTemplate | undefined {
  return getEmailTemplates().find((t) => t.id === id);
}

export function saveEmailTemplate(
  template: Omit<EmailTemplate, "id" | "createdAt" | "updatedAt">
): EmailTemplate {
  const templates = getEmailTemplates();
  const newTemplate: EmailTemplate = {
    ...template,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  templates.push(newTemplate);
  writeJsonFile("templates.json", templates);
  return newTemplate;
}

export function updateEmailTemplate(
  id: string,
  updates: Partial<EmailTemplate>
): EmailTemplate | null {
  const templates = getEmailTemplates();
  const index = templates.findIndex((t) => t.id === id);
  if (index === -1) return null;

  templates[index] = {
    ...templates[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  writeJsonFile("templates.json", templates);
  return templates[index];
}

function createDefaultEmailTemplate(positionId: string): EmailTemplate {
  return {
    id: "default-setter-email",
    name: "Invito Colloquio - Appointment Setter",
    subject: "Leone Master School - Invito al colloquio per Appointment Setter",
    body: `<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; padding: 20px 0; border-bottom: 3px solid #4263eb;">
    <h1 style="color: #4263eb; margin: 0;">Leone Master School</h1>
  </div>
  
  <div style="padding: 30px 0;">
    <p>Gentile <strong>{{nome}}</strong>,</p>
    
    <p>Grazie per aver completato il questionario di candidatura per la posizione di <strong>{{posizione}}</strong> presso Leone Master School.</p>
    
    <p>Siamo lieti di comunicarti che il tuo profilo ha superato la fase di pre-screening e vorremmo invitarti a fissare un colloquio conoscitivo con il nostro team.</p>
    
    <p>Per fissare il tuo appuntamento, clicca sul pulsante qui sotto e scegli la data e l'orario che preferisci:</p>
    
    <div style="text-align: center; padding: 25px 0;">
      <a href="{{calendly_link}}" 
         style="background-color: #4263eb; color: white; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
        📅 Prenota il tuo Colloquio
      </a>
    </div>
    
    <p>Durante il colloquio avremo modo di:</p>
    <ul style="line-height: 1.8;">
      <li>Conoscerti meglio</li>
      <li>Presentarti nel dettaglio il ruolo e le aspettative</li>
      <li>Rispondere a tutte le tue domande</li>
    </ul>
    
    <p>Se hai domande prima del colloquio, non esitare a rispondere a questa email.</p>
    
    <p>A presto,<br>
    <strong>Team HR - Leone Master School</strong></p>
  </div>
  
  <div style="border-top: 1px solid #e0e0e0; padding: 15px 0; text-align: center; color: #888; font-size: 12px;">
    <p>Leone Master School - Formazione d'Eccellenza nel Real Estate</p>
  </div>
</div>`,
    positionId,
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// =============================================================================
// EMAIL LOGS
// =============================================================================

export function getEmailLogs(): EmailLog[] {
  return readJsonFile<EmailLog[]>("email-logs.json", []);
}

export function addEmailLog(log: Omit<EmailLog, "id">): EmailLog {
  const logs = getEmailLogs();
  const newLog: EmailLog = { ...log, id: uuidv4() };
  logs.push(newLog);
  writeJsonFile("email-logs.json", logs);
  return newLog;
}

export function getEmailLogsByCandidateId(candidateId: string): EmailLog[] {
  return getEmailLogs().filter((l) => l.candidateId === candidateId);
}

// =============================================================================
// CANDIDATE STATUS OVERRIDES
// Salva gli override manuali dello status dei candidati
// =============================================================================

interface CandidateOverride {
  candidateId: string;
  status?: CandidateStatus;
  notes?: string;
  positionId: string;
  updatedAt: string;
}

export function getCandidateOverrides(): CandidateOverride[] {
  return readJsonFile<CandidateOverride[]>("candidate-overrides.json", []);
}

export function setCandidateOverride(
  candidateId: string,
  positionId: string,
  updates: { status?: CandidateStatus; notes?: string }
): CandidateOverride {
  const overrides = getCandidateOverrides();
  const existingIndex = overrides.findIndex(
    (o) => o.candidateId === candidateId && o.positionId === positionId
  );

  const override: CandidateOverride = {
    candidateId,
    positionId,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    overrides[existingIndex] = { ...overrides[existingIndex], ...override };
  } else {
    overrides.push(override);
  }

  writeJsonFile("candidate-overrides.json", overrides);
  return override;
}
