import React, { useState } from "react";
import { SessionHistoryEvent, RPGSystem, UserRole } from "../types";
import {
  Clock,
  Dice5,
  Sparkles,
  Zap,
  FileText,
  Search,
  Download,
  Copy,
  Check,
  X,
  Plus,
  Filter,
  Shield,
  BookOpen,
  Share2,
  Calendar
} from "lucide-react";

interface SessionHistoryModalProps {
  roomName: string;
  roomCode: string;
  system: RPGSystem;
  userRole: UserRole;
  currentUserName: string;
  historyEvents: SessionHistoryEvent[];
  onAddHistoryEvent: (event: Omit<SessionHistoryEvent, "id" | "timestamp">) => void;
  onClose: () => void;
}

export function SessionHistoryModal({
  roomName,
  roomCode,
  system,
  userRole,
  currentUserName,
  historyEvents,
  onAddHistoryEvent,
  onClose,
}: SessionHistoryModalProps) {
  const [filterType, setFilterType] = useState<"all" | "roll" | "narration" | "combat" | "note" | "clue">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedSummary, setCopiedSummary] = useState(false);

  // New Note state
  const [showAddNote, setShowAddNote] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteType, setNoteType] = useState<"note" | "clue" | "narration">("note");

  // Filtered list
  const filteredEvents = historyEvents.filter((ev) => {
    const matchesType = filterType === "all" || ev.type === filterType;
    const matchesSearch =
      searchQuery.trim() === "" ||
      ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ev.author && ev.author.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesSearch;
  });

  // Handle Add Note submit
  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() && !noteContent.trim()) return;

    onAddHistoryEvent({
      type: noteType,
      title: noteTitle.trim() || (noteType === "clue" ? "Nova Pista Descoberta" : "Anotação da Sessão"),
      description: noteContent.trim(),
      author: currentUserName || (userRole === "gm" ? "Mestre" : "Jogador"),
    });

    setNoteTitle("");
    setNoteContent("");
    setShowAddNote(false);
  };

  // Generate full session summary text for sharing
  const generateSessionSummaryText = (): string => {
    const dateStr = new Date().toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    let text = `# 📜 DIÁRIO DE SESSÃO - ${roomName.toUpperCase()}\n`;
    text += `Código da Mesa: ${roomCode} | Sistema: ${system.toUpperCase()} | Data: ${dateStr}\n\n`;
    text += `--- RESUMO CRONOLÓGICO DOS ACONTECIMENTOS ---\n\n`;

    if (historyEvents.length === 0) {
      text += `Nenhum acontecimento registrado até o momento.\n`;
    } else {
      historyEvents.forEach((ev, idx) => {
        const time = new Date(ev.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
        const typeBadge =
          ev.type === "roll"
            ? "🎲 ROLAGEM"
            : ev.type === "combat"
            ? "⚔️ COMBATE"
            : ev.type === "narration"
            ? "📖 NARRAÇÃO"
            : ev.type === "clue"
            ? "🔍 PISTA"
            : "📝 NOTA";

        text += `[${time}] ${typeBadge}: ${ev.title}\n`;
        if (ev.author) text += `Autor: ${ev.author}\n`;
        text += `${ev.description}\n\n`;
      });
    }

    text += `\nGerado via Natal-RPG (https://ais-dev-rujvvxgpxtdrcfejwvngbu-102733332034.us-east1.run.app)`;
    return text;
  };

  // Copy Summary to Clipboard
  const handleCopySummary = () => {
    const text = generateSessionSummaryText();
    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  // Download Markdown file
  const handleDownloadMarkdown = () => {
    const text = generateSessionSummaryText();
    const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `diario-sessao-${roomCode.toLowerCase()}-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getEventIcon = (type: SessionHistoryEvent["type"]) => {
    switch (type) {
      case "roll":
        return <Dice5 className="w-4 h-4 text-amber-400" />;
      case "narration":
        return <Sparkles className="w-4 h-4 text-purple-400" />;
      case "combat":
        return <Zap className="w-4 h-4 text-red-400" />;
      case "clue":
        return <BookOpen className="w-4 h-4 text-blue-400" />;
      case "note":
      default:
        return <FileText className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-serif text-neutral-100 flex items-center gap-2">
                Histórico & Diário da Campanha
              </h2>
              <p className="text-xs text-neutral-400">
                Mesa: <strong className="text-amber-300">{roomName}</strong> ({roomCode}) • {historyEvents.length} registros
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs flex items-center gap-1.5 transition-colors"
              title="Copiar Resumo da Sessão para WhatsApp/Discord"
            >
              {copiedSummary ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
              <span className="hidden sm:inline">{copiedSummary ? "Copiado!" : "Copiar Resumo"}</span>
            </button>

            <button
              onClick={handleDownloadMarkdown}
              className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs flex items-center gap-1.5 transition-colors"
              title="Baixar Diário em formato Markdown (.md)"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Baixar .md</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar: Search, Filters, Add Note button */}
        <div className="p-3 sm:p-4 border-b border-neutral-800 bg-neutral-950/40 flex flex-wrap items-center justify-between gap-2.5">
          {/* Search bar */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar em rolagens, pistas, narrações..."
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Type Filters */}
          <div className="flex items-center gap-1 overflow-x-auto">
            <button
              onClick={() => setFilterType("all")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                filterType === "all" ? "bg-amber-500 text-neutral-950 font-bold shadow" : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterType("narration")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                filterType === "narration" ? "bg-purple-600 text-white font-bold shadow" : "text-neutral-400 hover:text-purple-300"
              }`}
            >
              <Sparkles className="w-3 h-3" /> Narração
            </button>
            <button
              onClick={() => setFilterType("roll")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                filterType === "roll" ? "bg-amber-600 text-white font-bold shadow" : "text-neutral-400 hover:text-amber-300"
              }`}
            >
              <Dice5 className="w-3 h-3" /> Rolagens
            </button>
            <button
              onClick={() => setFilterType("combat")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                filterType === "combat" ? "bg-red-600 text-white font-bold shadow" : "text-neutral-400 hover:text-red-300"
              }`}
            >
              <Zap className="w-3 h-3" /> Combate
            </button>
            <button
              onClick={() => setFilterType("clue")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                filterType === "clue" ? "bg-blue-600 text-white font-bold shadow" : "text-neutral-400 hover:text-blue-300"
              }`}
            >
              <BookOpen className="w-3 h-3" /> Pistas
            </button>
          </div>

          <button
            onClick={() => setShowAddNote(!showAddNote)}
            className="px-3 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/40 border border-emerald-500/50 text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all flex-shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Registrar Acontecimento</span>
          </button>
        </div>

        {/* Add Note Form Slide Down */}
        {showAddNote && (
          <form onSubmit={handleSaveNote} className="p-4 bg-neutral-950 border-b border-neutral-800 space-y-3 animate-in slide-in-from-top duration-150">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Adicionar Entrada ao Diário de Bordo
              </span>
              <div className="flex items-center gap-2">
                <select
                  value={noteType}
                  onChange={(e) => setNoteType(e.target.value as any)}
                  className="bg-neutral-900 border border-neutral-800 rounded-lg px-2 py-1 text-xs text-neutral-300 font-semibold focus:outline-none"
                >
                  <option value="note">Anotação Geral</option>
                  <option value="clue">Pista Importante</option>
                  <option value="narration">Marco Narrativo</option>
                </select>
                <button
                  type="button"
                  onClick={() => setShowAddNote(false)}
                  className="p-1 text-neutral-500 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <input
              type="text"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              placeholder="Título (ex: Encontro com o Ocultista, Segredo Revelado)"
              className="w-full bg-neutral-900 border border-neutral-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-neutral-100 placeholder:text-neutral-600 focus:outline-none"
            />

            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Descreva detalhadamente o que ocorreu..."
              rows={2}
              className="w-full bg-neutral-900 border border-neutral-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-neutral-100 placeholder:text-neutral-600 focus:outline-none resize-none"
              required
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddNote(false)}
                className="px-3 py-1.5 bg-neutral-900 text-neutral-400 hover:text-white rounded-xl text-xs"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow"
              >
                <Check className="w-3.5 h-3.5" /> Salvar no Histórico
              </button>
            </div>
          </form>
        )}

        {/* Timeline Events List */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-12 text-neutral-500">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">Nenhum registro encontrado para este filtro.</p>
            </div>
          ) : (
            <div className="relative border-l border-neutral-800 ml-3 sm:ml-4 pl-4 sm:pl-6 space-y-4">
              {filteredEvents.map((ev) => {
                const time = new Date(ev.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
                return (
                  <div key={ev.id} className="relative group">
                    {/* Node Dot */}
                    <div className="absolute -left-[27px] sm:-left-[35px] top-1.5 w-6 h-6 rounded-full bg-neutral-900 border border-neutral-700 flex items-center justify-center shadow-md">
                      {getEventIcon(ev.type)}
                    </div>

                    <div className="p-3.5 rounded-2xl bg-neutral-950/70 border border-neutral-800/80 hover:border-neutral-700 transition-all space-y-1.5 shadow-sm">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-bold text-neutral-100">{ev.title}</h4>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            ev.type === "roll"
                              ? "bg-amber-950/60 text-amber-300 border border-amber-800/50"
                              : ev.type === "narration"
                              ? "bg-purple-950/60 text-purple-300 border border-purple-800/50"
                              : ev.type === "combat"
                              ? "bg-red-950/60 text-red-300 border border-red-800/50"
                              : ev.type === "clue"
                              ? "bg-blue-950/60 text-blue-300 border border-blue-800/50"
                              : "bg-emerald-950/60 text-emerald-300 border border-emerald-800/50"
                          }`}>
                            {ev.type === "roll" ? "Dado" : ev.type === "combat" ? "Combate" : ev.type === "clue" ? "Pista" : ev.type === "narration" ? "Mestre IA" : "Nota"}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-neutral-500">{time}</span>
                      </div>

                      <p className="text-xs text-neutral-300 leading-relaxed whitespace-pre-line">
                        {ev.description}
                      </p>

                      {ev.details && ev.details.diceFormula && (
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-neutral-900 rounded-lg text-[11px] font-mono text-amber-400 border border-neutral-800 mt-1">
                          <Dice5 className="w-3 h-3" />
                          <span>Fórmula: {ev.details.diceFormula} = <strong>{ev.details.total}</strong></span>
                          {ev.details.isCrit && <span className="text-emerald-400 font-bold">(CRÍTICO!)</span>}
                          {ev.details.isFumble && <span className="text-red-400 font-bold">(DESASTRE!)</span>}
                        </div>
                      )}

                      {ev.author && (
                        <div className="text-[10px] text-neutral-500 pt-1 flex items-center gap-1">
                          <span>Registrado por:</span>
                          <strong className="text-neutral-400">{ev.author}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
