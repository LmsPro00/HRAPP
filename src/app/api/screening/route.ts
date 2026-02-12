// =============================================================================
// API: /api/screening - Gestione criteri di screening
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import {
  getPresets,
  getPreset,
  savePreset,
  updatePreset,
  setCandidateOverride,
} from "@/lib/storage";

// GET - Lista presets o singolo preset
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const presetId = searchParams.get("id");

    if (presetId) {
      const preset = getPreset(presetId);
      if (!preset) {
        return NextResponse.json(
          { success: false, error: "Preset non trovato" },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: preset });
    }

    const presets = getPresets();
    return NextResponse.json({ success: true, data: presets });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Errore nel recupero dei presets" },
      { status: 500 }
    );
  }
}

// POST - Crea nuovo preset o aggiorna status candidato
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Override status candidato
    if (body.action === "override_status") {
      const { candidateId, positionId, status, notes } = body;
      const override = setCandidateOverride(candidateId, positionId, {
        status,
        notes,
      });
      return NextResponse.json({ success: true, data: override });
    }

    // Crea nuovo preset
    const preset = savePreset(body);
    return NextResponse.json({ success: true, data: preset });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Errore nel salvataggio" },
      { status: 500 }
    );
  }
}

// PUT - Aggiorna preset esistente
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID preset richiesto" },
        { status: 400 }
      );
    }

    const preset = updatePreset(id, updates);
    if (!preset) {
      return NextResponse.json(
        { success: false, error: "Preset non trovato" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: preset });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Errore nell'aggiornamento" },
      { status: 500 }
    );
  }
}
