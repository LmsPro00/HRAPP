// =============================================================================
// API: /api/email - Invio email e gestione template
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import {
  getEmailTemplates,
  getEmailTemplate,
  saveEmailTemplate,
  updateEmailTemplate,
  getPosition,
  getEmailLogs,
} from "@/lib/storage";
import {
  sendCandidateEmail,
  sendBulkEmails,
  testEmailConfig,
} from "@/lib/email-service";
import type { Candidate } from "@/types";

// GET - Lista template o logs email
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    if (type === "logs") {
      const logs = getEmailLogs();
      return NextResponse.json({ success: true, data: logs });
    }

    if (type === "test") {
      const result = await testEmailConfig();
      return NextResponse.json({ success: true, data: result });
    }

    const templateId = searchParams.get("id");
    if (templateId) {
      const template = getEmailTemplate(templateId);
      return NextResponse.json({ success: true, data: template });
    }

    const templates = getEmailTemplates();
    return NextResponse.json({ success: true, data: templates });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Errore nel recupero dati email" },
      { status: 500 }
    );
  }
}

// POST - Invia email o crea template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Invio email singola o multipla
    if (body.action === "send") {
      const { candidates, templateId, positionId } = body;

      const template = getEmailTemplate(templateId);
      if (!template) {
        return NextResponse.json(
          { success: false, error: "Template non trovato" },
          { status: 404 }
        );
      }

      const position = getPosition(positionId);
      if (!position) {
        return NextResponse.json(
          { success: false, error: "Posizione non trovata" },
          { status: 404 }
        );
      }

      // Invio bulk o singolo
      const candidateList = candidates as Candidate[];
      if (candidateList.length === 1) {
        const log = await sendCandidateEmail(
          candidateList[0],
          template,
          position
        );
        return NextResponse.json({ success: true, data: [log] });
      } else {
        const logs = await sendBulkEmails(candidateList, template, position);
        return NextResponse.json({ success: true, data: logs });
      }
    }

    // Crea nuovo template
    if (body.action === "create_template") {
      const template = saveEmailTemplate(body.template);
      return NextResponse.json({ success: true, data: template });
    }

    return NextResponse.json(
      { success: false, error: "Azione non riconosciuta" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Errore API email:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Errore nell'invio email",
      },
      { status: 500 }
    );
  }
}

// PUT - Aggiorna template
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    const template = updateEmailTemplate(id, updates);
    if (!template) {
      return NextResponse.json(
        { success: false, error: "Template non trovato" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: template });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Errore aggiornamento template" },
      { status: 500 }
    );
  }
}
