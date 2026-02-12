// =============================================================================
// TYPES - HR Screening App
// =============================================================================

// --- Candidato (mappato dal Google Sheet Typeform) ---
export interface Candidate {
  id: string; // Token dal Typeform
  nome: string;
  email: string;
  telefono: string;
  citta: string;
  haPC: boolean;
  connessioneStabile: boolean;
  ambienteTranquillo: boolean;
  partitaIVA: "si" | "pronto_ad_aprirla" | "non_interessato";
  esperienzaSetter: boolean;
  descrizioneEsperienza: string;
  esperienzaCallCenter: boolean;
  descrizioneCallCenter: string;
  approccioSetter: "qualita" | "quantita_qualita" | "quantita";
  rapportoScript: "guida_personalizza" | "lettera" | "improvvisa" | "non_piacciono";
  oreSettimanali: "25h+" | "20-25h";
  motivazione: string;
  fasciaOraria: "mattina" | "pomeriggio" | "flessibile";
  submittedAt: string;
  token: string;

  // Campi gestiti dall'app
  status?: CandidateStatus;
  positionId?: string;
  emailSent?: boolean;
  emailSentAt?: string;
  notes?: string;
  score?: number;
  matchedCriteria?: string[];
  failedCriteria?: string[];
}

export type CandidateStatus = "idoneo" | "non_idoneo" | "dubbio" | "da_valutare" | "contattato";

// --- Filtro di Screening ---
export interface ScreeningFilter {
  id: string;
  field: keyof Candidate;
  label: string;
  operator: "equals" | "not_equals" | "contains" | "not_contains" | "is_true" | "is_false";
  value: string | boolean;
  isRequired: boolean; // Se true, il mancato rispetto = non idoneo
  weight: number; // Peso per il punteggio (1-10)
}

// --- Preset di Filtri (Criteri di Screening) ---
export interface ScreeningPreset {
  id: string;
  name: string;
  description: string;
  filters: ScreeningFilter[];
  minScoreForIdoneo: number; // % minima per essere idoneo (es. 100 = tutti i filtri)
  minScoreForDubbio: number; // % minima per essere dubbio (es. 60)
  positionId: string;
  createdAt: string;
  updatedAt: string;
}

// --- Posizione Lavorativa ---
export interface Position {
  id: string;
  name: string;
  description: string;
  sheetId: string; // ID del Google Sheet collegato
  sheetName: string; // Nome del tab nello Sheet
  calendlyLink: string;
  emailTemplateId: string;
  screeningPresetId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// --- Template Email ---
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string; // HTML con placeholders: {{nome}}, {{posizione}}, {{calendly_link}}
  positionId: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// --- Log Email ---
export interface EmailLog {
  id: string;
  candidateId: string;
  candidateEmail: string;
  candidateName: string;
  templateId: string;
  positionId: string;
  subject: string;
  sentAt: string;
  status: "sent" | "failed" | "pending";
  error?: string;
}

// --- Risultato Screening ---
export interface ScreeningResult {
  candidateId: string;
  status: CandidateStatus;
  score: number;
  maxScore: number;
  percentage: number;
  matchedFilters: { filterId: string; label: string }[];
  failedFilters: { filterId: string; label: string }[];
}

// --- Stats Dashboard ---
export interface DashboardStats {
  totalCandidates: number;
  idonei: number;
  nonIdonei: number;
  dubbi: number;
  daValutare: number;
  contattati: number;
  emailInviate: number;
  lastSync: string;
}

// --- Mappatura Colonne Sheet ---
export interface SheetColumnMapping {
  nome: number;
  email: number;
  telefono: number;
  citta: number;
  haPC: number;
  connessioneStabile: number;
  ambienteTranquillo: number;
  partitaIVA: number;
  esperienzaSetter: number;
  descrizioneEsperienza: number;
  esperienzaCallCenter: number;
  descrizioneCallCenter: number;
  approccioSetter: number;
  rapportoScript: number;
  oreSettimanali: number;
  motivazione: number;
  fasciaOraria: number;
  submittedAt: number;
  token: number;
}

// --- API Response generica ---
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
