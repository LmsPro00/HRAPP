// =============================================================================
// API: /api/positions - Gestione posizioni lavorative
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import {
  getPositions,
  getPosition,
  savePosition,
  updatePosition,
  deletePosition,
} from "@/lib/storage";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const position = getPosition(id);
      if (!position) {
        return NextResponse.json(
          { success: false, error: "Posizione non trovata" },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: position });
    }

    const positions = getPositions();
    return NextResponse.json({ success: true, data: positions });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Errore nel recupero posizioni" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const position = savePosition(body);
    return NextResponse.json({ success: true, data: position });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Errore nella creazione" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    const position = updatePosition(id, updates);
    if (!position) {
      return NextResponse.json(
        { success: false, error: "Posizione non trovata" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: position });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Errore nell'aggiornamento" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID richiesto" },
        { status: 400 }
      );
    }
    const deleted = deletePosition(id);
    return NextResponse.json({ success: true, data: { deleted } });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Errore nell'eliminazione" },
      { status: 500 }
    );
  }
}
