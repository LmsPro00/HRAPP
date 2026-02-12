import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formatta data italiana
 */
export function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

/**
 * Mappa status candidato a colore e label
 */
export function getStatusConfig(status: string) {
  const configs: Record<string, { label: string; color: string; bg: string; icon: string }> = {
    idoneo: { label: "Idoneo", color: "text-green-700", bg: "bg-green-100", icon: "✅" },
    non_idoneo: { label: "Non Idoneo", color: "text-red-700", bg: "bg-red-100", icon: "❌" },
    dubbio: { label: "Dubbio", color: "text-amber-700", bg: "bg-amber-100", icon: "⚠️" },
    da_valutare: { label: "Da Valutare", color: "text-gray-600", bg: "bg-gray-100", icon: "🔍" },
    contattato: { label: "Contattato", color: "text-blue-700", bg: "bg-blue-100", icon: "📧" },
  };
  return configs[status] || configs.da_valutare;
}

/**
 * Mappa valore partita IVA a label leggibile
 */
export function formatPartitaIVA(value: string): string {
  const map: Record<string, string> = {
    si: "Sì, ce l'ho",
    pronto_ad_aprirla: "No, ma disposto ad aprirla",
    non_interessato: "Non interessato",
  };
  return map[value] || value;
}

/**
 * Mappa approccio setter a label
 */
export function formatApproccio(value: string): string {
  const map: Record<string, string> = {
    qualita: "Solo appuntamenti qualificati",
    quantita_qualita: "Mix quantità/qualità",
    quantita: "Più appuntamenti possibili",
  };
  return map[value] || value;
}

/**
 * Mappa rapporto script a label
 */
export function formatRapportoScript(value: string): string {
  const map: Record<string, string> = {
    guida_personalizza: "Usa come guida, personalizza",
    lettera: "Li segue alla lettera",
    improvvisa: "Preferisce improvvisare",
    non_piacciono: "Non gli piacciono",
  };
  return map[value] || value;
}
