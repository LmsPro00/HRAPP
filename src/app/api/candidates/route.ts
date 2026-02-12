// =============================================================================
// API: /api/candidates - Gestione candidati
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { fetchCandidatesFromSheet } from "@/lib/google-sheets";
import { screenAllCandidates } from "@/lib/screening-engine";
import {
  getPosition,
  getPositions,
  getPreset,
  getCandidateOverrides,
  getEmailLogs,
} from "@/lib/storage";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const positionId = searchParams.get("positionId");
    const statusFilter = searchParams.get("status");

    // Trova la posizione
    let position;
    if (positionId) {
      position = getPosition(positionId);
    } else {
      const positions = getPositions();
      position = positions[0]; // Default alla prima posizione
    }

    if (!position) {
      return NextResponse.json(
        { success: false, error: "Posizione non trovata" },
        { status: 404 }
      );
    }

    // Fetch candidati dal Google Sheet
    const candidates = await fetchCandidatesFromSheet(
      position.sheetId,
      position.sheetName
    );

    // Applica screening se c'è un preset
    const preset = getPreset(position.screeningPresetId);
    let screeningResults;
    if (preset) {
      screeningResults = screenAllCandidates(candidates, preset);
    }

    // Applica override manuali
    const overrides = getCandidateOverrides();
    const emailLogs = getEmailLogs();

    // Arricchisci candidati con status e info aggiuntive
    const enrichedCandidates = candidates.map((candidate) => {
      const screening = screeningResults?.get(candidate.id);
      const override = overrides.find(
        (o) => o.candidateId === candidate.id && o.positionId === position!.id
      );
      const candidateEmails = emailLogs.filter(
        (l) => l.candidateId === candidate.id && l.status === "sent"
      );

      return {
        ...candidate,
        status: override?.status || screening?.status || "da_valutare",
        notes: override?.notes || "",
        screening: screening
          ? {
              score: screening.score,
              maxScore: screening.maxScore,
              percentage: screening.percentage,
              matchedFilters: screening.matchedFilters,
              failedFilters: screening.failedFilters,
            }
          : null,
        emailSent: candidateEmails.length > 0,
        emailSentAt: candidateEmails.length > 0
          ? candidateEmails[candidateEmails.length - 1].sentAt
          : null,
        positionId: position!.id,
      };
    });

    // Filtra per status se richiesto
    let filtered = enrichedCandidates;
    if (statusFilter && statusFilter !== "tutti") {
      filtered = enrichedCandidates.filter((c) => c.status === statusFilter);
    }

    // Ordina: idonei prima, poi dubbi, poi non idonei
    const statusOrder: Record<string, number> = {
      idoneo: 0,
      dubbio: 1,
      da_valutare: 2,
      contattato: 3,
      non_idoneo: 4,
    };
    filtered.sort(
      (a, b) =>
        (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99)
    );

    // Stats
    const stats = {
      totale: enrichedCandidates.length,
      idonei: enrichedCandidates.filter((c) => c.status === "idoneo").length,
      nonIdonei: enrichedCandidates.filter((c) => c.status === "non_idoneo").length,
      dubbi: enrichedCandidates.filter((c) => c.status === "dubbio").length,
      daValutare: enrichedCandidates.filter((c) => c.status === "da_valutare").length,
      contattati: enrichedCandidates.filter((c) => c.emailSent).length,
      lastSync: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: {
        candidates: filtered,
        stats,
        position,
      },
    });
  } catch (error) {
    console.error("Errore API candidates:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Errore nel recupero dei candidati",
      },
      { status: 500 }
    );
  }
}
