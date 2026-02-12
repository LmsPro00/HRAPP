// =============================================================================
// API: /api/settings - Configurazione e test connessioni
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { fetchSheetHeaders } from "@/lib/google-sheets";
import { testEmailConfig } from "@/lib/email-service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "test-sheets") {
      const sheetId = searchParams.get("sheetId") || undefined;
      const sheetName = searchParams.get("sheetName") || undefined;
      const headers = await fetchSheetHeaders(sheetId, sheetName);
      return NextResponse.json({
        success: true,
        data: { headers, message: "Connessione Google Sheet riuscita!" },
      });
    }

    if (action === "test-email") {
      const result = await testEmailConfig();
      return NextResponse.json({ success: true, data: result });
    }

    // Info configurazione (senza dati sensibili)
    return NextResponse.json({
      success: true,
      data: {
        googleSheetConfigured: !!process.env.GOOGLE_SHEET_ID,
        emailConfigured: !!process.env.SMTP_USER,
        calendlyConfigured: !!process.env.CALENDLY_LINK,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Errore di configurazione",
      },
      { status: 500 }
    );
  }
}
