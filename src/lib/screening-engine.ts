// =============================================================================
// SCREENING ENGINE - Motore di valutazione candidati
// =============================================================================

import type {
  Candidate,
  CandidateStatus,
  ScreeningFilter,
  ScreeningPreset,
  ScreeningResult,
} from "@/types";

/**
 * Valuta un singolo filtro contro un candidato
 * Ritorna true se il candidato SODDISFA il filtro
 */
function evaluateFilter(candidate: Candidate, filter: ScreeningFilter): boolean {
  const candidateValue = candidate[filter.field];

  if (candidateValue === undefined || candidateValue === null) {
    return false;
  }

  const strValue = String(candidateValue).toLowerCase().trim();
  const filterValue = String(filter.value).toLowerCase().trim();

  switch (filter.operator) {
    case "equals":
      return strValue === filterValue;
    case "not_equals":
      return strValue !== filterValue;
    case "contains":
      return strValue.includes(filterValue);
    case "not_contains":
      return !strValue.includes(filterValue);
    case "is_true":
      return (
        candidateValue === true ||
        strValue === "true" ||
        strValue === "si" ||
        strValue === "sì"
      );
    case "is_false":
      return (
        candidateValue === false ||
        strValue === "false" ||
        strValue === "no"
      );
    default:
      return false;
  }
}

/**
 * Esegue lo screening di un singolo candidato contro un preset di filtri
 */
export function screenCandidate(
  candidate: Candidate,
  preset: ScreeningPreset
): ScreeningResult {
  const matchedFilters: { filterId: string; label: string }[] = [];
  const failedFilters: { filterId: string; label: string }[] = [];

  let totalWeight = 0;
  let matchedWeight = 0;
  let hasRequiredFailure = false;

  for (const filter of preset.filters) {
    totalWeight += filter.weight;
    const passed = evaluateFilter(candidate, filter);

    if (passed) {
      matchedWeight += filter.weight;
      matchedFilters.push({ filterId: filter.id, label: filter.label });
    } else {
      failedFilters.push({ filterId: filter.id, label: filter.label });
      if (filter.isRequired) {
        hasRequiredFailure = true;
      }
    }
  }

  const percentage = totalWeight > 0 ? (matchedWeight / totalWeight) * 100 : 0;

  // Determina lo status
  let status: CandidateStatus;
  if (hasRequiredFailure) {
    status = "non_idoneo";
  } else if (percentage >= preset.minScoreForIdoneo) {
    status = "idoneo";
  } else if (percentage >= preset.minScoreForDubbio) {
    status = "dubbio";
  } else {
    status = "non_idoneo";
  }

  return {
    candidateId: candidate.id,
    status,
    score: matchedWeight,
    maxScore: totalWeight,
    percentage: Math.round(percentage),
    matchedFilters,
    failedFilters,
  };
}

/**
 * Esegue lo screening di massa su tutti i candidati
 */
export function screenAllCandidates(
  candidates: Candidate[],
  preset: ScreeningPreset
): Map<string, ScreeningResult> {
  const results = new Map<string, ScreeningResult>();

  for (const candidate of candidates) {
    const result = screenCandidate(candidate, preset);
    results.set(candidate.id, result);
  }

  return results;
}

/**
 * Filtri di default per Appointment Setter - Leone Master School
 * Basati sull'analisi del tuo Google Sheet
 */
export function getDefaultSetterFilters(): ScreeningFilter[] {
  return [
    {
      id: "f1",
      field: "haPC",
      label: "Ha un PC adeguato",
      operator: "is_true",
      value: true,
      isRequired: true,
      weight: 10,
    },
    {
      id: "f2",
      field: "connessioneStabile",
      label: "Connessione internet stabile",
      operator: "is_true",
      value: true,
      isRequired: true,
      weight: 10,
    },
    {
      id: "f3",
      field: "ambienteTranquillo",
      label: "Ambiente tranquillo per lavorare",
      operator: "is_true",
      value: true,
      isRequired: true,
      weight: 10,
    },
    {
      id: "f4",
      field: "partitaIVA",
      label: "Partita IVA (ha o è disposto ad aprirla)",
      operator: "not_equals",
      value: "non_interessato",
      isRequired: true,
      weight: 10,
    },
    {
      id: "f5",
      field: "esperienzaSetter",
      label: "Esperienza come Appointment Setter",
      operator: "is_true",
      value: true,
      isRequired: false,
      weight: 8,
    },
    {
      id: "f6",
      field: "esperienzaCallCenter",
      label: "Esperienza in Call Center Outbound",
      operator: "is_true",
      value: true,
      isRequired: false,
      weight: 5,
    },
    {
      id: "f7",
      field: "approccioSetter",
      label: "Approccio qualitativo (non solo quantità)",
      operator: "not_equals",
      value: "quantita",
      isRequired: false,
      weight: 7,
    },
    {
      id: "f8",
      field: "rapportoScript",
      label: "Usa script come guida (non improvvisa)",
      operator: "not_equals",
      value: "improvvisa",
      isRequired: false,
      weight: 5,
    },
    {
      id: "f9",
      field: "oreSettimanali",
      label: "Disponibilità 25h+ settimanali",
      operator: "equals",
      value: "25h+",
      isRequired: false,
      weight: 6,
    },
  ];
}

/**
 * Crea un preset di default per Appointment Setter
 */
export function getDefaultSetterPreset(positionId: string): ScreeningPreset {
  return {
    id: "default-setter",
    name: "Screening Appointment Setter - Standard",
    description:
      "Criteri di screening standard per la posizione di Appointment Setter presso Leone Master School",
    filters: getDefaultSetterFilters(),
    minScoreForIdoneo: 85,
    minScoreForDubbio: 55,
    positionId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
