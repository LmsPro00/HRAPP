"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Filter,
  Mail,
  Settings,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Send,
  Eye,
  ChevronDown,
  ChevronUp,
  Briefcase,
  BarChart3,
  Clock,
  Phone,
  MapPin,
  Monitor,
  Wifi,
  Home,
  FileText,
  Star,
  Plus,
  Save,
  Trash2,
  Edit3,
  X,
  Check,
} from "lucide-react";

// =============================================================================
// TYPES (client-side)
// =============================================================================

interface Candidate {
  id: string;
  nome: string;
  email: string;
  telefono: string;
  citta: string;
  haPC: boolean;
  connessioneStabile: boolean;
  ambienteTranquillo: boolean;
  partitaIVA: string;
  esperienzaSetter: boolean;
  descrizioneEsperienza: string;
  esperienzaCallCenter: boolean;
  descrizioneCallCenter: string;
  approccioSetter: string;
  rapportoScript: string;
  oreSettimanali: string;
  motivazione: string;
  fasciaOraria: string;
  submittedAt: string;
  token: string;
  status: string;
  notes: string;
  screening: {
    score: number;
    maxScore: number;
    percentage: number;
    matchedFilters: { filterId: string; label: string }[];
    failedFilters: { filterId: string; label: string }[];
  } | null;
  emailSent: boolean;
  emailSentAt: string | null;
  positionId: string;
}

interface Stats {
  totale: number;
  idonei: number;
  nonIdonei: number;
  dubbi: number;
  daValutare: number;
  contattati: number;
  lastSync: string;
}

interface Position {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  calendlyLink: string;
  emailTemplateId: string;
  screeningPresetId: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  positionId: string;
}

interface ScreeningPreset {
  id: string;
  name: string;
  description: string;
  filters: ScreeningFilter[];
  minScoreForIdoneo: number;
  minScoreForDubbio: number;
  positionId: string;
}

interface ScreeningFilter {
  id: string;
  field: string;
  label: string;
  operator: string;
  value: string | boolean;
  isRequired: boolean;
  weight: number;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  idoneo: { label: "Idoneo", color: "text-green-700", bg: "bg-green-100 border-green-200", icon: <CheckCircle className="w-4 h-4" /> },
  non_idoneo: { label: "Non Idoneo", color: "text-red-700", bg: "bg-red-100 border-red-200", icon: <XCircle className="w-4 h-4" /> },
  dubbio: { label: "Dubbio", color: "text-amber-700", bg: "bg-amber-100 border-amber-200", icon: <AlertTriangle className="w-4 h-4" /> },
  da_valutare: { label: "Da Valutare", color: "text-gray-600", bg: "bg-gray-100 border-gray-200", icon: <Search className="w-4 h-4" /> },
  contattato: { label: "Contattato", color: "text-blue-700", bg: "bg-blue-100 border-blue-200", icon: <Mail className="w-4 h-4" /> },
};

function formatPartitaIVA(value: string): string {
  const map: Record<string, string> = { si: "Sì", pronto_ad_aprirla: "Disposto ad aprirla", non_interessato: "Non interessato" };
  return map[value] || value;
}

function formatApproccio(value: string): string {
  const map: Record<string, string> = { qualita: "Solo qualificati", quantita_qualita: "Mix quantità/qualità", quantita: "Più possibili" };
  return map[value] || value;
}

function formatScript(value: string): string {
  const map: Record<string, string> = { guida_personalizza: "Guida + personalizza", lettera: "Alla lettera", improvvisa: "Improvvisa", non_piacciono: "Non li usa" };
  return map[value] || value;
}

function formatFascia(value: string): string {
  const map: Record<string, string> = { mattina: "Mattina (9-13)", pomeriggio: "Pomeriggio (14-18)", flessibile: "Flessibile" };
  return map[value] || value;
}

// =============================================================================
// MAIN APP COMPONENT
// =============================================================================

export default function HRDashboard() {
  const [activeTab, setActiveTab] = useState<"candidates" | "filters" | "email" | "settings">("candidates");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [activePosition, setActivePosition] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("tutti");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
  const [expandedCandidate, setExpandedCandidate] = useState<string | null>(null);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [presets, setPresets] = useState<ScreeningPreset[]>([]);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // -- Fetch positions --
  const fetchPositions = useCallback(async () => {
    try {
      const res = await fetch("/api/positions");
      const data = await res.json();
      if (data.success) {
        setPositions(data.data);
        if (!activePosition && data.data.length > 0) {
          setActivePosition(data.data[0].id);
        }
      }
    } catch (err) {
      console.error("Errore fetch posizioni:", err);
    }
  }, [activePosition]);

  // -- Fetch candidates --
  const fetchCandidates = useCallback(async () => {
    if (!activePosition) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/candidates?positionId=${activePosition}&status=${statusFilter}`);
      const data = await res.json();
      if (data.success) {
        setCandidates(data.data.candidates);
        setStats(data.data.stats);
      } else {
        setError(data.error || "Errore nel caricamento");
      }
    } catch (err) {
      setError("Impossibile connettersi al server. Verifica la configurazione.");
    } finally {
      setLoading(false);
    }
  }, [activePosition, statusFilter]);

  // -- Fetch templates --
  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch("/api/email");
      const data = await res.json();
      if (data.success) setTemplates(data.data);
    } catch (err) {
      console.error("Errore fetch templates:", err);
    }
  }, []);

  // -- Fetch presets --
  const fetchPresets = useCallback(async () => {
    try {
      const res = await fetch("/api/screening");
      const data = await res.json();
      if (data.success) setPresets(data.data);
    } catch (err) {
      console.error("Errore fetch presets:", err);
    }
  }, []);

  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  useEffect(() => {
    if (activePosition) {
      fetchCandidates();
      fetchTemplates();
      fetchPresets();
    }
  }, [activePosition, statusFilter, fetchCandidates, fetchTemplates, fetchPresets]);

  // -- Show notification --
  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // -- Override candidate status --
  const overrideStatus = async (candidateId: string, status: string) => {
    try {
      await fetch("/api/screening", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "override_status",
          candidateId,
          positionId: activePosition,
          status,
        }),
      });
      fetchCandidates();
      showNotification("success", "Status aggiornato");
    } catch {
      showNotification("error", "Errore nell'aggiornamento dello status");
    }
  };

  // -- Send emails --
  const sendEmails = async () => {
    if (selectedCandidates.size === 0) {
      showNotification("error", "Seleziona almeno un candidato");
      return;
    }

    const position = positions.find((p) => p.id === activePosition);
    if (!position) return;

    setSendingEmail(true);
    try {
      const selectedList = candidates.filter((c) => selectedCandidates.has(c.id));
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send",
          candidates: selectedList,
          templateId: position.emailTemplateId,
          positionId: activePosition,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const sent = data.data.filter((l: any) => l.status === "sent").length;
        const failed = data.data.filter((l: any) => l.status === "failed").length;
        showNotification("success", `Email inviate: ${sent} OK, ${failed} errori`);
        setSelectedCandidates(new Set());
        fetchCandidates();
      } else {
        showNotification("error", data.error || "Errore nell'invio");
      }
    } catch {
      showNotification("error", "Errore nell'invio delle email");
    } finally {
      setSendingEmail(false);
    }
  };

  // -- Toggle candidate selection --
  const toggleSelect = (id: string) => {
    setSelectedCandidates((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllVisible = () => {
    const filtered = getFilteredCandidates();
    if (selectedCandidates.size === filtered.length) {
      setSelectedCandidates(new Set());
    } else {
      setSelectedCandidates(new Set(filtered.map((c) => c.id)));
    }
  };

  // -- Filter candidates by search --
  const getFilteredCandidates = () => {
    if (!searchTerm) return candidates;
    const term = searchTerm.toLowerCase();
    return candidates.filter(
      (c) =>
        c.nome.toLowerCase().includes(term) ||
        c.email.toLowerCase().includes(term) ||
        c.citta.toLowerCase().includes(term)
    );
  };

  const filteredCandidates = getFilteredCandidates();

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-lg shadow-lg text-white font-medium transition-all ${
          notification.type === "success" ? "bg-green-600" : "bg-red-600"
        }`}>
          {notification.message}
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">HR Screening Manager</h1>
                <p className="text-xs text-gray-500">Leone Master School</p>
              </div>
            </div>

            {/* Position Selector */}
            <div className="flex items-center gap-3">
              <select
                value={activePosition}
                onChange={(e) => setActivePosition(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium bg-white"
              >
                {positions.map((pos) => (
                  <option key={pos.id} value={pos.id}>
                    {pos.name}
                  </option>
                ))}
              </select>
              <button
                onClick={fetchCandidates}
                className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                Aggiorna
              </button>
            </div>
          </div>

          {/* Tabs */}
          <nav className="flex gap-1 mt-4 -mb-px">
            {[
              { id: "candidates" as const, label: "Candidati", icon: Users },
              { id: "filters" as const, label: "Criteri Screening", icon: Filter },
              { id: "email" as const, label: "Email Templates", icon: Mail },
              { id: "settings" as const, label: "Impostazioni", icon: Settings },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === tab.id
                    ? "bg-white text-brand-700 border border-gray-200 border-b-white"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-6 py-6">
        {activeTab === "candidates" && (
          <CandidatesTab
            candidates={filteredCandidates}
            stats={stats}
            loading={loading}
            error={error}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedCandidates={selectedCandidates}
            toggleSelect={toggleSelect}
            selectAllVisible={selectAllVisible}
            expandedCandidate={expandedCandidate}
            setExpandedCandidate={setExpandedCandidate}
            overrideStatus={overrideStatus}
            sendEmails={sendEmails}
            sendingEmail={sendingEmail}
          />
        )}
        {activeTab === "filters" && (
          <FiltersTab
            presets={presets}
            fetchPresets={fetchPresets}
            activePosition={activePosition}
            showNotification={showNotification}
          />
        )}
        {activeTab === "email" && (
          <EmailTab
            templates={templates}
            fetchTemplates={fetchTemplates}
            activePosition={activePosition}
            showNotification={showNotification}
          />
        )}
        {activeTab === "settings" && <SettingsTab showNotification={showNotification} />}
      </main>
    </div>
  );
}

// =============================================================================
// CANDIDATES TAB
// =============================================================================

function CandidatesTab({
  candidates, stats, loading, error, statusFilter, setStatusFilter,
  searchTerm, setSearchTerm, selectedCandidates, toggleSelect, selectAllVisible,
  expandedCandidate, setExpandedCandidate, overrideStatus, sendEmails, sendingEmail,
}: {
  candidates: Candidate[];
  stats: Stats | null;
  loading: boolean;
  error: string | null;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  selectedCandidates: Set<string>;
  toggleSelect: (id: string) => void;
  selectAllVisible: () => void;
  expandedCandidate: string | null;
  setExpandedCandidate: (id: string | null) => void;
  overrideStatus: (id: string, status: string) => void;
  sendEmails: () => void;
  sendingEmail: boolean;
}) {
  return (
    <div className="space-y-5">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {[
            { label: "Totale", value: stats.totale, color: "bg-gray-100 text-gray-800", icon: Users },
            { label: "Idonei", value: stats.idonei, color: "bg-green-100 text-green-800", icon: CheckCircle },
            { label: "Dubbi", value: stats.dubbi, color: "bg-amber-100 text-amber-800", icon: AlertTriangle },
            { label: "Non Idonei", value: stats.nonIdonei, color: "bg-red-100 text-red-800", icon: XCircle },
            { label: "Da Valutare", value: stats.daValutare, color: "bg-gray-100 text-gray-600", icon: Search },
            { label: "Contattati", value: stats.contattati, color: "bg-blue-100 text-blue-800", icon: Mail },
          ].map((stat) => (
            <div key={stat.label} className={`${stat.color} rounded-xl p-4 flex items-center gap-3`}>
              <stat.icon className="w-5 h-5 opacity-70" />
              <div>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-xs font-medium opacity-80">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-xl border border-gray-200">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cerca per nome, email, città..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium"
        >
          <option value="tutti">Tutti gli status</option>
          <option value="idoneo">✅ Idonei</option>
          <option value="dubbio">⚠️ Dubbi</option>
          <option value="non_idoneo">❌ Non Idonei</option>
          <option value="da_valutare">🔍 Da Valutare</option>
        </select>

        {/* Bulk Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={selectAllVisible}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            {selectedCandidates.size === candidates.length && candidates.length > 0
              ? "Deseleziona"
              : "Seleziona tutti"}
          </button>

          {selectedCandidates.size > 0 && (
            <button
              onClick={sendEmails}
              disabled={sendingEmail}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              <Send className="w-4 h-4" />
              {sendingEmail
                ? "Invio in corso..."
                : `Invia Email (${selectedCandidates.size})`}
            </button>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
          <p className="font-medium">Errore</p>
          <p className="text-sm mt-1">{error}</p>
          <p className="text-xs mt-2 text-red-500">
            Verifica che il file .env.local sia configurato correttamente e che il Google Sheet sia condiviso con il service account.
          </p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="w-8 h-8 text-brand-600 animate-spin" />
          <span className="ml-3 text-gray-600 font-medium">Caricamento candidati dal Google Sheet...</span>
        </div>
      )}

      {/* Candidates List */}
      {!loading && !error && (
        <div className="space-y-2">
          {candidates.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Nessun candidato trovato</p>
              <p className="text-sm mt-1">Verifica i filtri o la connessione al Google Sheet</p>
            </div>
          ) : (
            candidates.map((candidate) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                isSelected={selectedCandidates.has(candidate.id)}
                isExpanded={expandedCandidate === candidate.id}
                onToggleSelect={() => toggleSelect(candidate.id)}
                onToggleExpand={() =>
                  setExpandedCandidate(expandedCandidate === candidate.id ? null : candidate.id)
                }
                onOverrideStatus={(status) => overrideStatus(candidate.id, status)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// CANDIDATE CARD
// =============================================================================

function CandidateCard({
  candidate, isSelected, isExpanded, onToggleSelect, onToggleExpand, onOverrideStatus,
}: {
  candidate: Candidate;
  isSelected: boolean;
  isExpanded: boolean;
  onToggleSelect: () => void;
  onToggleExpand: () => void;
  onOverrideStatus: (status: string) => void;
}) {
  const config = statusConfig[candidate.status] || statusConfig.da_valutare;

  return (
    <div className={`bg-white rounded-xl border transition-all candidate-card ${
      isSelected ? "border-brand-400 ring-2 ring-brand-100" : "border-gray-200"
    }`}>
      {/* Main Row */}
      <div className="flex items-center gap-4 p-4">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
        />

        {/* Status Badge */}
        <span className={`status-badge ${config.bg} ${config.color} border min-w-[110px] justify-center`}>
          {config.icon}
          {config.label}
        </span>

        {/* Score Bar */}
        {candidate.screening && (
          <div className="w-24 flex-shrink-0">
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`score-bar ${
                  candidate.screening.percentage >= 85
                    ? "bg-green-500"
                    : candidate.screening.percentage >= 55
                    ? "bg-amber-500"
                    : "bg-red-500"
                }`}
                style={{ width: `${candidate.screening.percentage}%` }}
              />
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5 text-center font-medium">
              {candidate.screening.percentage}%
            </div>
          </div>
        )}

        {/* Candidate Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900 truncate">{candidate.nome}</span>
            {candidate.emailSent && (
              <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded font-medium">
                EMAIL INVIATA
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
            <span className="flex items-center gap-1">
              <Mail className="w-3 h-3" /> {candidate.email}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {candidate.citta}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {candidate.oreSettimanali}
            </span>
          </div>
        </div>

        {/* Quick Info Icons */}
        <div className="flex items-center gap-1.5">
          <span
            title={`PC: ${candidate.haPC ? "Sì" : "No"}`}
            className={`w-6 h-6 rounded flex items-center justify-center text-xs ${
              candidate.haPC ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
          </span>
          <span
            title={`Internet: ${candidate.connessioneStabile ? "Stabile" : "No"}`}
            className={`w-6 h-6 rounded flex items-center justify-center text-xs ${
              candidate.connessioneStabile ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
          </span>
          <span
            title={`Ambiente: ${candidate.ambienteTranquillo ? "Tranquillo" : "No"}`}
            className={`w-6 h-6 rounded flex items-center justify-center text-xs ${
              candidate.ambienteTranquillo ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
            }`}
          >
            <Home className="w-3.5 h-3.5" />
          </span>
          <span
            title={`P.IVA: ${formatPartitaIVA(candidate.partitaIVA)}`}
            className={`w-6 h-6 rounded flex items-center justify-center text-xs ${
              candidate.partitaIVA !== "non_interessato"
                ? "bg-green-100 text-green-600"
                : "bg-red-100 text-red-600"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
          </span>
          <span
            title={`Esperienza setter: ${candidate.esperienzaSetter ? "Sì" : "No"}`}
            className={`w-6 h-6 rounded flex items-center justify-center text-xs ${
              candidate.esperienzaSetter ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
            }`}
          >
            <Star className="w-3.5 h-3.5" />
          </span>
        </div>

        {/* Expand Button */}
        <button
          onClick={onToggleExpand}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </button>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-gray-100 p-5 bg-gray-50/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - Info */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                <Users className="w-4 h-4" /> Informazioni Candidato
              </h4>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">Telefono:</span> <span className="font-medium">{candidate.telefono}</span></div>
                <div><span className="text-gray-500">Città:</span> <span className="font-medium">{candidate.citta}</span></div>
                <div><span className="text-gray-500">P.IVA:</span> <span className="font-medium">{formatPartitaIVA(candidate.partitaIVA)}</span></div>
                <div><span className="text-gray-500">Ore/sett:</span> <span className="font-medium">{candidate.oreSettimanali}</span></div>
                <div><span className="text-gray-500">Fascia oraria:</span> <span className="font-medium">{formatFascia(candidate.fasciaOraria)}</span></div>
                <div><span className="text-gray-500">Approccio:</span> <span className="font-medium">{formatApproccio(candidate.approccioSetter)}</span></div>
                <div><span className="text-gray-500">Script:</span> <span className="font-medium">{formatScript(candidate.rapportoScript)}</span></div>
                <div><span className="text-gray-500">Exp. Setter:</span> <span className="font-medium">{candidate.esperienzaSetter ? "Sì" : "No"}</span></div>
                <div><span className="text-gray-500">Exp. Call Center:</span> <span className="font-medium">{candidate.esperienzaCallCenter ? "Sì" : "No"}</span></div>
                <div><span className="text-gray-500">Candidatura:</span> <span className="font-medium">{candidate.submittedAt}</span></div>
              </div>

              {candidate.descrizioneEsperienza && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Esperienza Setter</p>
                  <p className="text-sm text-gray-700 bg-white p-3 rounded-lg border border-gray-200 leading-relaxed">
                    {candidate.descrizioneEsperienza}
                  </p>
                </div>
              )}

              {candidate.descrizioneCallCenter && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Esperienza Call Center</p>
                  <p className="text-sm text-gray-700 bg-white p-3 rounded-lg border border-gray-200 leading-relaxed">
                    {candidate.descrizioneCallCenter}
                  </p>
                </div>
              )}

              {candidate.motivazione && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Motivazione</p>
                  <p className="text-sm text-gray-700 bg-white p-3 rounded-lg border border-gray-200 leading-relaxed">
                    {candidate.motivazione}
                  </p>
                </div>
              )}
            </div>

            {/* Right Column - Screening & Actions */}
            <div className="space-y-4">
              {/* Screening Results */}
              {candidate.screening && (
                <div>
                  <h4 className="font-semibold text-gray-800 flex items-center gap-2 mb-3">
                    <BarChart3 className="w-4 h-4" /> Risultato Screening
                  </h4>
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium">Punteggio</span>
                      <span className="text-lg font-bold">
                        {candidate.screening.score}/{candidate.screening.maxScore}{" "}
                        <span className="text-sm text-gray-500">({candidate.screening.percentage}%)</span>
                      </span>
                    </div>
                    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-4">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          candidate.screening.percentage >= 85
                            ? "bg-green-500"
                            : candidate.screening.percentage >= 55
                            ? "bg-amber-500"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${candidate.screening.percentage}%` }}
                      />
                    </div>

                    {/* Matched Filters */}
                    {candidate.screening.matchedFilters.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-semibold text-green-600 mb-1">Criteri soddisfatti:</p>
                        <div className="flex flex-wrap gap-1">
                          {candidate.screening.matchedFilters.map((f) => (
                            <span key={f.filterId} className="text-[11px] px-2 py-0.5 bg-green-50 text-green-700 rounded-full">
                              ✓ {f.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Failed Filters */}
                    {candidate.screening.failedFilters.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-red-600 mb-1">Criteri non soddisfatti:</p>
                        <div className="flex flex-wrap gap-1">
                          {candidate.screening.failedFilters.map((f) => (
                            <span key={f.filterId} className="text-[11px] px-2 py-0.5 bg-red-50 text-red-700 rounded-full">
                              ✗ {f.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Manual Override */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Azione Manuale</h4>
                <div className="flex flex-wrap gap-2">
                  {(["idoneo", "dubbio", "non_idoneo", "contattato"] as const).map((status) => {
                    const sc = statusConfig[status];
                    return (
                      <button
                        key={status}
                        onClick={() => onOverrideStatus(status)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors hover:opacity-80 ${
                          candidate.status === status
                            ? `${sc.bg} ${sc.color} border-current`
                            : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {sc.icon}
                        {sc.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// FILTERS TAB
// =============================================================================

function FiltersTab({
  presets, fetchPresets, activePosition, showNotification,
}: {
  presets: ScreeningPreset[];
  fetchPresets: () => void;
  activePosition: string;
  showNotification: (type: "success" | "error", message: string) => void;
}) {
  const activePreset = presets.find((p) => p.positionId === activePosition) || presets[0];
  const [editingPreset, setEditingPreset] = useState<ScreeningPreset | null>(null);

  useEffect(() => {
    if (activePreset && !editingPreset) {
      setEditingPreset({ ...activePreset });
    }
  }, [activePreset]);

  const updateFilter = (filterId: string, field: string, value: any) => {
    if (!editingPreset) return;
    setEditingPreset({
      ...editingPreset,
      filters: editingPreset.filters.map((f) =>
        f.id === filterId ? { ...f, [field]: value } : f
      ),
    });
  };

  const removeFilter = (filterId: string) => {
    if (!editingPreset) return;
    setEditingPreset({
      ...editingPreset,
      filters: editingPreset.filters.filter((f) => f.id !== filterId),
    });
  };

  const addFilter = () => {
    if (!editingPreset) return;
    const newFilter: ScreeningFilter = {
      id: `f-${Date.now()}`,
      field: "haPC",
      label: "Nuovo filtro",
      operator: "is_true",
      value: true,
      isRequired: false,
      weight: 5,
    };
    setEditingPreset({
      ...editingPreset,
      filters: [...editingPreset.filters, newFilter],
    });
  };

  const savePreset = async () => {
    if (!editingPreset) return;
    try {
      await fetch("/api/screening", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingPreset),
      });
      fetchPresets();
      showNotification("success", "Criteri di screening salvati!");
    } catch {
      showNotification("error", "Errore nel salvataggio");
    }
  };

  if (!editingPreset) {
    return <div className="text-center py-16 text-gray-500">Caricamento criteri di screening...</div>;
  }

  const availableFields = [
    { value: "haPC", label: "Ha PC adeguato" },
    { value: "connessioneStabile", label: "Connessione stabile" },
    { value: "ambienteTranquillo", label: "Ambiente tranquillo" },
    { value: "partitaIVA", label: "Partita IVA" },
    { value: "esperienzaSetter", label: "Esperienza Setter" },
    { value: "esperienzaCallCenter", label: "Esperienza Call Center" },
    { value: "approccioSetter", label: "Approccio Setter" },
    { value: "rapportoScript", label: "Rapporto Script" },
    { value: "oreSettimanali", label: "Ore settimanali" },
    { value: "fasciaOraria", label: "Fascia oraria" },
  ];

  const availableOperators = [
    { value: "equals", label: "Uguale a" },
    { value: "not_equals", label: "Diverso da" },
    { value: "contains", label: "Contiene" },
    { value: "not_contains", label: "Non contiene" },
    { value: "is_true", label: "È vero (Sì)" },
    { value: "is_false", label: "È falso (No)" },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Preset Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-1">{editingPreset.name}</h2>
        <p className="text-sm text-gray-500 mb-4">{editingPreset.description}</p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">
              Soglia Idoneo (% minima)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={editingPreset.minScoreForIdoneo}
              onChange={(e) =>
                setEditingPreset({ ...editingPreset, minScoreForIdoneo: Number(e.target.value) })
              }
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">
              Soglia Dubbio (% minima)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={editingPreset.minScoreForDubbio}
              onChange={(e) =>
                setEditingPreset({ ...editingPreset, minScoreForDubbio: Number(e.target.value) })
              }
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Filtri di Screening ({editingPreset.filters.length})</h3>
          <div className="flex gap-2">
            <button
              onClick={addFilter}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
            >
              <Plus className="w-4 h-4" /> Aggiungi Filtro
            </button>
            <button
              onClick={savePreset}
              className="flex items-center gap-1 px-4 py-1.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700"
            >
              <Save className="w-4 h-4" /> Salva
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {editingPreset.filters.map((filter) => (
            <div
              key={filter.id}
              className={`p-4 rounded-lg border ${
                filter.isRequired ? "border-red-200 bg-red-50/30" : "border-gray-200 bg-gray-50/30"
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Label */}
                <input
                  type="text"
                  value={filter.label}
                  onChange={(e) => updateFilter(filter.id, "label", e.target.value)}
                  className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium"
                  placeholder="Nome del filtro"
                />

                {/* Field */}
                <select
                  value={filter.field}
                  onChange={(e) => updateFilter(filter.id, "field", e.target.value)}
                  className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
                >
                  {availableFields.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>

                {/* Operator */}
                <select
                  value={filter.operator}
                  onChange={(e) => updateFilter(filter.id, "operator", e.target.value)}
                  className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
                >
                  {availableOperators.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>

                {/* Value (only for equals/not_equals/contains) */}
                {!["is_true", "is_false"].includes(filter.operator) && (
                  <input
                    type="text"
                    value={String(filter.value)}
                    onChange={(e) => updateFilter(filter.id, "value", e.target.value)}
                    className="w-32 px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
                    placeholder="Valore"
                  />
                )}

                {/* Weight */}
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500">Peso:</span>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={filter.weight}
                    onChange={(e) => updateFilter(filter.id, "weight", Number(e.target.value))}
                    className="w-14 px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-center"
                  />
                </div>

                {/* Required Toggle */}
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filter.isRequired}
                    onChange={(e) => updateFilter(filter.id, "isRequired", e.target.checked)}
                    className="w-4 h-4 rounded border-red-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-xs font-medium text-red-600">Obbligatorio</span>
                </label>

                {/* Delete */}
                <button
                  onClick={() => removeFilter(filter.id)}
                  className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <p className="font-semibold mb-2">Come funziona lo screening:</p>
        <p>Ogni filtro ha un <strong>peso</strong> (1-10) che contribuisce al punteggio totale. I filtri marcati come <strong className="text-red-600">Obbligatori</strong> causano automaticamente lo status "Non Idoneo" se non soddisfatti, indipendentemente dal punteggio.</p>
        <p className="mt-1">La soglia Idoneo e Dubbio determinano la categorizzazione automatica in base alla percentuale raggiunta.</p>
      </div>
    </div>
  );
}

// =============================================================================
// EMAIL TAB
// =============================================================================

function EmailTab({
  templates, fetchTemplates, activePosition, showNotification,
}: {
  templates: EmailTemplate[];
  fetchTemplates: () => void;
  activePosition: string;
  showNotification: (type: "success" | "error", message: string) => void;
}) {
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    const positionTemplate = templates.find((t) => t.positionId === activePosition);
    if (positionTemplate) {
      setEditingTemplate({ ...positionTemplate });
    } else if (templates.length > 0) {
      setEditingTemplate({ ...templates[0] });
    }
  }, [templates, activePosition]);

  const saveTemplate = async () => {
    if (!editingTemplate) return;
    try {
      await fetch("/api/email", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingTemplate),
      });
      fetchTemplates();
      showNotification("success", "Template email salvato!");
    } catch {
      showNotification("error", "Errore nel salvataggio");
    }
  };

  if (!editingTemplate) {
    return <div className="text-center py-16 text-gray-500">Caricamento template...</div>;
  }

  const previewHtml = editingTemplate.body
    .replace(/\{\{nome\}\}/g, "Mario Rossi")
    .replace(/\{\{email\}\}/g, "mario.rossi@email.com")
    .replace(/\{\{posizione\}\}/g, "Appointment Setter")
    .replace(/\{\{calendly_link\}\}/g, "https://calendly.com/esempio")
    .replace(/\{\{azienda\}\}/g, "Leone Master School");

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Template Selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Template Email</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
            >
              <Eye className="w-4 h-4" />
              {previewMode ? "Modifica" : "Anteprima"}
            </button>
            <button
              onClick={saveTemplate}
              className="flex items-center gap-1 px-4 py-1.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700"
            >
              <Save className="w-4 h-4" /> Salva
            </button>
          </div>
        </div>

        {/* Subject */}
        <div className="mb-4">
          <label className="text-xs font-semibold text-gray-500 uppercase">Oggetto Email</label>
          <input
            type="text"
            value={editingTemplate.subject}
            onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
            className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>

        {/* Body */}
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">
            {previewMode ? "Anteprima" : "Corpo Email (HTML)"}
          </label>
          {previewMode ? (
            <div
              className="border border-gray-300 rounded-lg p-6 bg-white min-h-[400px]"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          ) : (
            <textarea
              value={editingTemplate.body}
              onChange={(e) => setEditingTemplate({ ...editingTemplate, body: e.target.value })}
              className="email-editor w-full p-4 border border-gray-300 rounded-lg resize-y"
              rows={20}
            />
          )}
        </div>
      </div>

      {/* Placeholders Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <p className="font-semibold mb-2">Placeholder disponibili:</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {[
            { tag: "{{nome}}", desc: "Nome candidato" },
            { tag: "{{email}}", desc: "Email candidato" },
            { tag: "{{telefono}}", desc: "Telefono" },
            { tag: "{{citta}}", desc: "Città" },
            { tag: "{{posizione}}", desc: "Nome posizione" },
            { tag: "{{calendly_link}}", desc: "Link Calendly" },
            { tag: "{{azienda}}", desc: "Nome azienda" },
          ].map((p) => (
            <div key={p.tag} className="flex items-center gap-2">
              <code className="px-1.5 py-0.5 bg-blue-100 rounded text-xs font-mono">{p.tag}</code>
              <span className="text-xs">{p.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// SETTINGS TAB
// =============================================================================

function SettingsTab({
  showNotification,
}: {
  showNotification: (type: "success" | "error", message: string) => void;
}) {
  const [testingSheets, setTestingSheets] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [sheetsStatus, setSheetsStatus] = useState<string | null>(null);
  const [emailStatus, setEmailStatus] = useState<string | null>(null);

  const testSheets = async () => {
    setTestingSheets(true);
    try {
      const res = await fetch("/api/settings?action=test-sheets");
      const data = await res.json();
      if (data.success) {
        setSheetsStatus(`✅ Connessione riuscita! Trovate ${data.data.headers.length} colonne.`);
      } else {
        setSheetsStatus(`❌ ${data.error}`);
      }
    } catch {
      setSheetsStatus("❌ Errore nella connessione");
    }
    setTestingSheets(false);
  };

  const testEmail = async () => {
    setTestingEmail(true);
    try {
      const res = await fetch("/api/settings?action=test-email");
      const data = await res.json();
      if (data.success && data.data.success) {
        setEmailStatus("✅ Configurazione SMTP valida!");
      } else {
        setEmailStatus(`❌ ${data.data?.error || data.error}`);
      }
    } catch {
      setEmailStatus("❌ Errore nella connessione");
    }
    setTestingEmail(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Impostazioni e Test Connessioni</h2>

        {/* Google Sheets Test */}
        <div className="mb-6 pb-6 border-b border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-2">Google Sheets</h3>
          <p className="text-sm text-gray-500 mb-3">
            Verifica la connessione al Google Sheet configurato nel file .env.local
          </p>
          <button
            onClick={testSheets}
            disabled={testingSheets}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {testingSheets ? "Test in corso..." : "Testa Connessione Sheets"}
          </button>
          {sheetsStatus && <p className="mt-2 text-sm">{sheetsStatus}</p>}
        </div>

        {/* Email Test */}
        <div className="mb-6 pb-6 border-b border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-2">Email SMTP</h3>
          <p className="text-sm text-gray-500 mb-3">
            Verifica la configurazione SMTP per l&apos;invio email
          </p>
          <button
            onClick={testEmail}
            disabled={testingEmail}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {testingEmail ? "Test in corso..." : "Testa Connessione Email"}
          </button>
          {emailStatus && <p className="mt-2 text-sm">{emailStatus}</p>}
        </div>

        {/* Config Info */}
        <div>
          <h3 className="font-semibold text-gray-800 mb-2">Configurazione</h3>
          <p className="text-sm text-gray-500 mb-3">
            Le impostazioni si trovano nel file <code className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono">.env.local</code> nella root del progetto. Modifica i valori e riavvia il server per applicare le modifiche.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 text-xs font-mono text-gray-600 space-y-1">
            <p>GOOGLE_SHEET_ID=...</p>
            <p>GOOGLE_SERVICE_ACCOUNT_EMAIL=...</p>
            <p>SMTP_HOST=smtp.gmail.com</p>
            <p>SMTP_USER=...</p>
            <p>CALENDLY_LINK=...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
