// =============================================================================
// GOOGLE SHEETS SERVICE - Lettura dati candidati dal Google Sheet
// =============================================================================

import { google } from "googleapis";
import type { Candidate, SheetColumnMapping } from "@/types";

// Mappatura colonne di default (basata sul tuo Sheet Typeform)
const DEFAULT_COLUMN_MAPPING: SheetColumnMapping = {
  nome: 0,
  email: 1,
  telefono: 2,
  citta: 3,
  haPC: 4,
  connessioneStabile: 5,
  ambienteTranquillo: 6,
  partitaIVA: 7,
  esperienzaSetter: 8,
  descrizioneEsperienza: 9,
  esperienzaCallCenter: 10,
  descrizioneCallCenter: 11,
  approccioSetter: 12,
  rapportoScript: 13,
  oreSettimanali: 14,
  motivazione: 15,
  fasciaOraria: 16,
  submittedAt: 17,
  token: 18,
};

/**
 * Crea un client autenticato per Google Sheets API
 */
function getGoogleSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  return google.sheets({ version: "v4", auth });
}

/**
 * Parsing valore booleano dal sheet
 */
function parseBoolean(value: string | undefined): boolean {
  if (!value) return false;
  const v = value.toString().trim().toUpperCase();
  return v === "TRUE" || v === "SI" || v === "SÌ" || v === "YES" || v === "1";
}

/**
 * Parsing valore Partita IVA
 */
function parsePartitaIVA(
  value: string | undefined
): "si" | "pronto_ad_aprirla" | "non_interessato" {
  if (!value) return "non_interessato";
  const v = value.toString().trim().toLowerCase();
  if (v === "si" || v === "sì") return "si";
  if (v.includes("pronto") || v.includes("aprirla")) return "pronto_ad_aprirla";
  return "non_interessato";
}

/**
 * Parsing approccio setter
 */
function parseApproccio(
  value: string | undefined
): "qualita" | "quantita_qualita" | "quantita" {
  if (!value) return "quantita_qualita";
  const v = value.toString().trim().toLowerCase();
  if (v.includes("solo appuntamenti realmente qualificati")) return "qualita";
  if (v.includes("mix") || v.includes("quantità ma con un minimo di qualità"))
    return "quantita_qualita";
  if (v.includes("chiudo più appuntamenti possibili")) return "quantita";
  return "quantita_qualita";
}

/**
 * Parsing rapporto con script
 */
function parseScript(
  value: string | undefined
): "guida_personalizza" | "lettera" | "improvvisa" | "non_piacciono" {
  if (!value) return "guida_personalizza";
  const v = value.toString().trim().toLowerCase();
  if (v.includes("guida ma personalizzo")) return "guida_personalizza";
  if (v.includes("lettera")) return "lettera";
  if (v.includes("improvvis")) return "improvvisa";
  if (v.includes("non mi piacciono")) return "non_piacciono";
  return "guida_personalizza";
}

/**
 * Parsing ore settimanali
 */
function parseOre(value: string | undefined): "25h+" | "20-25h" {
  if (!value) return "20-25h";
  const v = value.toString().trim();
  if (v.includes("25h+") || v.includes("25+")) return "25h+";
  return "20-25h";
}

/**
 * Parsing fascia oraria
 */
function parseFasciaOraria(
  value: string | undefined
): "mattina" | "pomeriggio" | "flessibile" {
  if (!value) return "flessibile";
  const v = value.toString().trim().toLowerCase();
  if (v.includes("mattina") || v.includes("9-13")) return "mattina";
  if (v.includes("pomeriggio") || v.includes("14-18")) return "pomeriggio";
  return "flessibile";
}

/**
 * Converte una riga del Google Sheet in un oggetto Candidate
 */
function rowToCandidate(
  row: string[],
  mapping: SheetColumnMapping = DEFAULT_COLUMN_MAPPING
): Candidate | null {
  try {
    const token = row[mapping.token]?.trim();
    if (!token) return null;

    const nome = row[mapping.nome]?.trim();
    const email = row[mapping.email]?.trim();
    if (!nome || !email) return null;

    return {
      id: token,
      nome,
      email,
      telefono: row[mapping.telefono]?.trim() || "",
      citta: row[mapping.citta]?.trim() || "",
      haPC: parseBoolean(row[mapping.haPC]),
      connessioneStabile: parseBoolean(row[mapping.connessioneStabile]),
      ambienteTranquillo: parseBoolean(row[mapping.ambienteTranquillo]),
      partitaIVA: parsePartitaIVA(row[mapping.partitaIVA]),
      esperienzaSetter: parseBoolean(row[mapping.esperienzaSetter]),
      descrizioneEsperienza: row[mapping.descrizioneEsperienza]?.trim() || "",
      esperienzaCallCenter: parseBoolean(row[mapping.esperienzaCallCenter]),
      descrizioneCallCenter: row[mapping.descrizioneCallCenter]?.trim() || "",
      approccioSetter: parseApproccio(row[mapping.approccioSetter]),
      rapportoScript: parseScript(row[mapping.rapportoScript]),
      oreSettimanali: parseOre(row[mapping.oreSettimanali]),
      motivazione: row[mapping.motivazione]?.trim() || "",
      fasciaOraria: parseFasciaOraria(row[mapping.fasciaOraria]),
      submittedAt: row[mapping.submittedAt]?.trim() || "",
      token,
      status: "da_valutare",
    };
  } catch (error) {
    console.error("Errore parsing riga:", error);
    return null;
  }
}

/**
 * Recupera tutti i candidati dal Google Sheet
 */
export async function fetchCandidatesFromSheet(
  sheetId?: string,
  sheetName?: string,
  columnMapping?: SheetColumnMapping
): Promise<Candidate[]> {
  const sheets = getGoogleSheetsClient();
  const spreadsheetId = sheetId || process.env.GOOGLE_SHEET_ID;
  const tabName = sheetName || process.env.GOOGLE_SHEET_NAME || "Sheet1";

  if (!spreadsheetId) {
    throw new Error("GOOGLE_SHEET_ID non configurato");
  }

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${tabName}'`,
    });

    const rows = response.data.values;
    if (!rows || rows.length <= 1) {
      return [];
    }

    // Salta la prima riga (header)
    const dataRows = rows.slice(1);
    const mapping = columnMapping || DEFAULT_COLUMN_MAPPING;

    const candidates: Candidate[] = [];
    for (const row of dataRows) {
      const candidate = rowToCandidate(row, mapping);
      if (candidate) {
        candidates.push(candidate);
      }
    }

    return candidates;
  } catch (error) {
    console.error("Errore fetch Google Sheet:", error);
    throw new Error(
      `Impossibile leggere il Google Sheet: ${error instanceof Error ? error.message : "Errore sconosciuto"}`
    );
  }
}

/**
 * Recupera le intestazioni (header) dal Google Sheet
 * Utile per la mappatura dinamica delle colonne
 */
export async function fetchSheetHeaders(
  sheetId?: string,
  sheetName?: string
): Promise<string[]> {
  const sheets = getGoogleSheetsClient();
  const spreadsheetId = sheetId || process.env.GOOGLE_SHEET_ID;
  const tabName = sheetName || process.env.GOOGLE_SHEET_NAME || "Sheet1";

  if (!spreadsheetId) {
    throw new Error("GOOGLE_SHEET_ID non configurato");
  }

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${tabName}'!1:1`,
  });

  return response.data.values?.[0] || [];
}

export { DEFAULT_COLUMN_MAPPING };
