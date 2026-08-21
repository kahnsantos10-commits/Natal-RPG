import React, { useState } from "react";
import {
  RPGSystem,
  UserRole,
  MapData,
  MapToken,
  InitiativeCombatant,
  ChatMessage,
  DiceRollResult,
} from "../types";
import { rpgAudio } from "../utils/audioSynth";
import {
  Tv,
  FileText,
  Dice5,
  Clock,
  Sparkles,
  Printer,
  Eye,
  EyeOff,
  Volume2,
  Plus,
  Minus,
  Heart,
  Brain,
  Zap,
  Shield,
  Search,
  BookOpen,
  Image as ImageIcon,
  Share2,
  Maximize2,
  HelpCircle,
  Skull,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  FolderOpen
} from "lucide-react";

interface PhysicalCompanionProps {
  system: RPGSystem;
  userRole: UserRole;
  tokens: MapToken[];
  mapData: MapData;
  combatants: InitiativeCombatant[];
  onUpdateTokens: (tokens: MapToken[]) => void;
  onSendChatMessage: (msg: string, type?: ChatMessage["type"], role?: ChatMessage["role"]) => void;
  onOpenPlayerDisplay: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
  undoCount?: number;
  lastUndoDescription?: string;
  onSaveSnapshot?: (description: string) => void;
}

interface Handout {
  id: string;
  title: string;
  type: "document" | "photo" | "letter" | "symbol" | "riddle";
  system: RPGSystem;
  dateOrEra: string;
  author: string;
  content: string;
  isRevealedToPlayers: boolean;
  imageUrl?: string;
  secretNotes?: string;
}

export const PhysicalTabletopCompanion: React.FC<PhysicalCompanionProps> = ({
  system,
  userRole,
  tokens,
  mapData,
  combatants,
  onUpdateTokens,
  onSendChatMessage,
  onOpenPlayerDisplay,
  onUndo,
  canUndo,
  undoCount,
  lastUndoDescription,
  onSaveSnapshot,
}) => {
  const [activeTab, setActiveTab] = useState<"handouts" | "screen" | "physical_dice" | "combat_tracker" | "tension_timer" | "improvisation">("handouts");

  // Handouts state
  const [handouts, setHandouts] = useState<Handout[]>([
    {
      id: "h1",
      title: "Bilhete Rasgado com Resíduos de Lodo",
      type: "letter",
      system: "ordem",
      dateOrEra: "14 de Outubro, 2024",
      author: "Dr. Alistair Vance (Desaparecido)",
      content:
        "O tempo aqui dentro não corre como lá fora. Cada tique-taque do relógio do corredor central consome memórias. Se você estiver lendo isso, NÃO olhe nos espelhos com moldura dourada. O Lodo da Morte se alimenta de quem busca seu próprio reflexo...",
      isRevealedToPlayers: true,
      secretNotes: "Encontrado no bolso do jaleco ensanguentado no piso 2.",
      imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80",
    },
    {
      id: "h2",
      title: "Laudo Necroscópico Confidencial - Caso 404",
      type: "document",
      system: "ordem",
      dateOrEra: "Instituto Médico Legal - São Paulo",
      author: "Perita Dra. Camila Rocha",
      content:
        "Causa mortis: Desidratação celular instantânea e envelhecimento ósseo estimado em 200 anos ocorrido em menos de 10 segundos. Nenhuma perfuração mecânica. Tecido cardíaco coberto por uma substância viscosa negra de pH nulo.",
      isRevealedToPlayers: false,
      secretNotes: "Requer teste de Investigação ou Medicina DT 15 para correlacionar com o Ritual de Decadência.",
      imageUrl: "https://images.unsplash.com/photo-1568667256549-094345857637?w=600&auto=format&fit=crop&q=80",
    },
    {
      id: "h3",
      title: "Mapa Antigo das Catacumbas Esquecidas",
      type: "photo",
      system: "dnd5e",
      dateOrEra: "Era dos Dragões - Reino de Cormyr",
      author: "Cartógrafo Real Elorien",
      content:
        "A passagem secreta atrás do sarcófago do Rei Maldito só abre quando o cálice de prata é preenchido com água benta no solstício. Cuidado com os carniçais nas galerias subterrâneas.",
      isRevealedToPlayers: true,
      imageUrl: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=600&auto=format&fit=crop&q=80",
    },
  ]);

  const [selectedHandout, setSelectedHandout] = useState<Handout>(handouts[0]);
  const [isGeneratingHandout, setIsGeneratingHandout] = useState(false);
  const [handoutPrompt, setHandoutPrompt] = useState("");

  // Physical Dice Calculator State
  const [physRolledValue, setPhysRolledValue] = useState<number>(14);
  const [physModifier, setPhysModifier] = useState<number>(5);
  const [physTargetDC, setPhysTargetDC] = useState<number>(15);
  const [physDamageFormula, setPhysDamageFormula] = useState<string>("2d8+4");
  const [physRolledDamage, setPhysRolledDamage] = useState<number>(13);
  const [selectedTargetToken, setSelectedTargetToken] = useState<string>(tokens[0]?.id || "");

  // Tension Timer State
  const [timerSeconds, setTimerSeconds] = useState<number>(60);
  const [initialTimerSeconds, setInitialTimerSeconds] = useState<number>(60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Timer Tick Effect
  React.useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            rpgAudio.playSwordHit();
            return 0;
          }
          // Play tick sound every second or when urgent
          if (prev <= 10) {
            rpgAudio.playDiceRoll();
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timerSeconds]);

  // Safely stop timer when it reaches 0
  React.useEffect(() => {
    if (timerSeconds === 0 && isTimerRunning) {
      setIsTimerRunning(false);
    }
  }, [timerSeconds, isTimerRunning]);

  // Quick HP Modifier for physical table tracking
  const handleModifyTokenHp = (tokenId: string, amount: number) => {
    const updated = tokens.map((t) => {
      if (t.id === tokenId) {
        const newHp = Math.max(0, Math.min(t.maxHp, t.hp + amount));
        return { ...t, hp: newHp };
      }
      return t;
    });
    onUpdateTokens(updated);
  };

  const handleModifyTokenSan = (tokenId: string, amount: number) => {
    const updated = tokens.map((t) => {
      if (t.id === tokenId && t.san !== undefined && t.maxSan !== undefined) {
        const newSan = Math.max(0, Math.min(t.maxSan, t.san + amount));
        return { ...t, san: newSan };
      }
      return t;
    });
    onUpdateTokens(updated);
  };

  const handleModifyTokenPe = (tokenId: string, amount: number) => {
    const updated = tokens.map((t) => {
      if (t.id === tokenId && t.pe !== undefined && t.maxPe !== undefined) {
        const newPe = Math.max(0, Math.min(t.maxPe, t.pe + amount));
        return { ...t, pe: newPe };
      }
      return t;
    });
    onUpdateTokens(updated);
  };

  // Generate AI Handout
  const handleGenerateAIHandout = async () => {
    if (!handoutPrompt.trim()) return;
    setIsGeneratingHandout(true);
    try {
      const response = await fetch("/api/generate-handout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system,
          prompt: handoutPrompt,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        const newH: Handout = {
          id: `h-${Date.now()}`,
          title: data.title || "Documento Encontrado",
          type: data.type || "letter",
          system,
          dateOrEra: data.dateOrEra || "Desconhecido",
          author: data.author || "Anônimo",
          content: data.content || "O texto está ilegível...",
          isRevealedToPlayers: false,
          secretNotes: data.secretNotes,
          imageUrl: data.imageUrl || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80",
        };
        setHandouts((prev) => [newH, ...prev]);
        setSelectedHandout(newH);
        setHandoutPrompt("");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingHandout(false);
    }
  };

  // Toggle Handout Reveal
  const handleToggleReveal = (id: string) => {
    let revealedTitle: string | null = null;
    setHandouts((prev) =>
      prev.map((h) => {
        if (h.id === id) {
          const nextState = !h.isRevealedToPlayers;
          if (nextState) {
            revealedTitle = h.title;
          }
          return { ...h, isRevealedToPlayers: nextState };
        }
        return h;
      })
    );

    if (revealedTitle) {
      onSendChatMessage(
        `📜 O Mestre revelou uma nova pista no Telão de Mesa: **"${revealedTitle}"**!`,
        "narration",
        "gm"
      );
    }
  };

  // Quick Print Current Handout
  const handlePrintHandout = () => {
    window.print();
  };

  return (
    <div className="w-full h-full flex flex-col bg-neutral-950 text-neutral-100 overflow-hidden select-none">
      {/* Top Banner: Mode Indicator */}
      <div className="bg-gradient-to-r from-amber-950/80 via-neutral-900 to-amber-950/80 border-b border-amber-800/40 px-3 sm:px-6 py-2.5 sm:py-3 flex flex-wrap items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="p-1.5 sm:p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
            <Tv className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="font-serif font-bold text-xs sm:text-sm text-amber-200">
                Central de Apoio à Mesa Física / Presencial
              </span>
              <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/30">
                Modo Presencial & Telão
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-neutral-400 hidden xs:block">
              Projetor de TV/Telão para jogadores, gerador de pistas impressas/exibidas, registro de dados reais e áudio imersivo.
            </p>
          </div>
        </div>

        {/* Action Buttons: GM Undo & Open Player Screen */}
        <div className="flex items-center gap-2">
          {userRole === "gm" && onUndo && (
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className={`px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                canUndo
                  ? "bg-amber-950/90 border-amber-500/80 text-amber-300 hover:bg-amber-900 shadow-md active:scale-95"
                  : "bg-neutral-900 border-neutral-800 text-neutral-600 cursor-not-allowed opacity-50"
              }`}
              title={
                canUndo
                  ? `Desfazer última ação: ${lastUndoDescription || "Desfazer"} [Ctrl+Z]`
                  : "Nenhuma ação recente para desfazer"
              }
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Desfazer</span>
              {canUndo && undoCount && undoCount > 0 ? (
                <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded text-[10px] font-mono">
                  {undoCount}
                </span>
              ) : null}
            </button>
          )}

          <button
            onClick={onOpenPlayerDisplay}
            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-neutral-950 font-bold rounded-xl text-xs flex items-center gap-1.5 sm:gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all whitespace-nowrap"
          >
            <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Abrir Telão / TV</span>
          </button>
        </div>
      </div>

      {/* Sub Navigation Bar for Physical Tabletop Tools */}
      <div className="bg-neutral-900 border-b border-neutral-800 px-3 sm:px-6 py-2 flex items-center gap-1.5 sm:gap-2 overflow-x-auto">
        {[
          { id: "handouts", label: "Pistas & Handouts (Telão)", icon: FileText },
          { id: "combat_tracker", label: "Painel de Vida dos Jogadores", icon: Heart },
          { id: "physical_dice", label: "Calculadora de Dados Físicos", icon: Dice5 },
          { id: "tension_timer", label: "Timer de Tensão com Áudio", icon: Clock },
          { id: "improvisation", label: "Tabelas de Improviso Rápido", icon: Sparkles },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                isActive
                  ? "bg-amber-500 text-neutral-950 font-bold shadow-md shadow-amber-500/10"
                  : "bg-neutral-950 border border-neutral-800/80 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 pb-20 sm:pb-6">
        {/* TAB 1: HANDOUTS & PISTAS FÍSICAS / TELÃO */}
        {activeTab === "handouts" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
            {/* Left Column: Handouts List & AI Creator */}
            <div className="lg:col-span-5 space-y-4">
              {/* AI Handout Generator */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-xl space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <h3 className="font-serif font-bold text-xs text-purple-200 uppercase tracking-wider">
                    Gerar Nova Pista ou Documento com IA
                  </h3>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={handoutPrompt}
                    onChange={(e) => setHandoutPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleGenerateAIHandout()}
                    placeholder={
                      system === "ordem"
                        ? "Ex: Relatório policial sobre sangue em quarto trancado..."
                        : "Ex: Carta em pergaminho com enigma élfico antigo..."
                    }
                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-purple-500"
                  />
                  <button
                    onClick={handleGenerateAIHandout}
                    disabled={isGeneratingHandout || !handoutPrompt.trim()}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all"
                  >
                    {isGeneratingHandout ? "Gerando..." : "Criar"}
                  </button>
                </div>
              </div>

              {/* Handouts List */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-neutral-400 tracking-wider">
                    Documentos da Sessão ({handouts.length})
                  </span>
                  <span className="text-[10px] text-amber-400 font-semibold">
                    Clique para inspecionar ou projetar
                  </span>
                </div>

                <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                  {handouts.map((h) => {
                    const isSelected = selectedHandout?.id === h.id;
                    return (
                      <div
                        key={h.id}
                        onClick={() => setSelectedHandout(h)}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? "bg-amber-950/40 border-amber-500/70 ring-1 ring-amber-500/50 shadow"
                            : "bg-neutral-950 border-neutral-800/80 hover:border-neutral-700"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-serif font-bold text-xs text-neutral-200">
                              {h.title}
                            </h4>
                            <p className="text-[10px] text-neutral-400 mt-0.5">
                              {h.author} • <span className="font-mono text-neutral-500">{h.dateOrEra}</span>
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleReveal(h.id);
                            }}
                            className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 ${
                              h.isRevealedToPlayers
                                ? "bg-emerald-950/60 border-emerald-600 text-emerald-300"
                                : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
                            }`}
                            title={h.isRevealedToPlayers ? "Visível no Telão dos Jogadores" : "Oculto no Telão (Privado do Mestre)"}
                          >
                            {h.isRevealedToPlayers ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                            <span className="text-[10px] font-bold">
                              {h.isRevealedToPlayers ? "No Telão" : "Oculto"}
                            </span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column: Handout Detailed Inspection & Print View */}
            <div className="lg:col-span-7 flex flex-col">
              {selectedHandout ? (
                <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl flex-1 flex flex-col space-y-4">
                  {/* Action Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 uppercase">
                        {selectedHandout.type}
                      </span>
                      <span className="text-xs text-neutral-400">{selectedHandout.dateOrEra}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleReveal(selectedHandout.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                          selectedHandout.isRevealedToPlayers
                            ? "bg-emerald-950 border-emerald-600 text-emerald-300"
                            : "bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700"
                        }`}
                      >
                        {selectedHandout.isRevealedToPlayers ? (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            <span>Visível no Telão</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>Revelar aos Jogadores</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={handlePrintHandout}
                        className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                        title="Imprimir pista em folha A4"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Imprimir</span>
                      </button>
                    </div>
                  </div>

                  {/* Stylized Handout Card for In-Person Presentation */}
                  <div
                    id="printable-handout"
                    className={`flex-1 rounded-2xl p-6 border transition-all overflow-y-auto space-y-4 ${
                      selectedHandout.system === "ordem"
                        ? "bg-neutral-950 border-purple-900/60 shadow-inner font-mono text-neutral-200"
                        : "bg-amber-950/20 border-amber-800/40 text-amber-100 font-serif"
                    }`}
                  >
                    <div className="flex items-start justify-between border-b border-neutral-800/80 pb-3">
                      <div>
                        <h2 className="text-base md:text-lg font-bold text-amber-200">
                          {selectedHandout.title}
                        </h2>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          Origem / Autor: <span className="text-neutral-200 font-semibold">{selectedHandout.author}</span>
                        </p>
                      </div>
                      {selectedHandout.system === "ordem" && (
                        <div className="text-[10px] text-purple-400 border border-purple-800/60 px-2 py-0.5 rounded bg-purple-950/40 font-bold uppercase tracking-wider">
                          Ordo Realitas • Confidencial
                        </div>
                      )}
                    </div>

                    {selectedHandout.imageUrl && (
                      <div className="w-full h-48 rounded-xl overflow-hidden border border-neutral-800 relative group">
                        <img
                          src={selectedHandout.imageUrl}
                          alt="Evidência"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-transparent flex items-end p-3">
                          <span className="text-[10px] text-neutral-300 font-sans">
                            Evidência Fotográfica Anexa
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="text-xs md:text-sm leading-relaxed whitespace-pre-wrap">
                      {selectedHandout.content}
                    </div>

                    {selectedHandout.secretNotes && (
                      <div className="mt-4 p-3 bg-red-950/40 border border-red-900/60 rounded-xl text-xs text-red-300">
                        <span className="font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Nota Secreta do Mestre (Não visível aos jogadores):
                        </span>
                        <p className="mt-1 text-[11px] text-red-200/90 font-sans">
                          {selectedHandout.secretNotes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-12 text-center text-neutral-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-neutral-600" />
                  <p>Selecione um documento ao lado para inspecionar ou projetar aos jogadores.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: COMBAT / HP TRACKER FOR IN-PERSON SESSIONS */}
        {activeTab === "combat_tracker" && (
          <div className="space-y-6">
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-serif font-bold text-sm text-amber-200">
                    Controle de Pontos de Vida dos Jogadores e Monstros na Mesa
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Ajuste instantaneamente PV, Sanidade e PE dos combatentes sentados ao redor da mesa física.
                  </p>
                </div>
                <span className="text-xs font-mono bg-neutral-950 px-3 py-1 rounded-xl border border-neutral-800 text-neutral-400">
                  {tokens.length} Combatentes
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tokens.map((tok) => {
                  const hpPct = Math.round((tok.hp / tok.maxHp) * 100);
                  const isLowHp = hpPct <= 25;
                  return (
                    <div
                      key={tok.id}
                      className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 space-y-3 hover:border-neutral-700 transition-all shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-full border border-neutral-700 overflow-hidden flex-shrink-0"
                            style={{ backgroundColor: tok.color }}
                          >
                            {tok.avatar && (
                              <img src={tok.avatar} alt={tok.name} className="w-full h-full object-cover" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold text-xs text-neutral-100">{tok.name}</h4>
                            <span className="text-[10px] uppercase font-semibold text-neutral-400">
                              {tok.type === "hero" ? "Herói / Jogador" : tok.type === "boss" ? "Ameaça Boss" : "Inimigo"}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-amber-400">CA {tok.ac || 10}</span>
                      </div>

                      {/* PV Bar & Adjustments */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-red-400 flex items-center gap-1">
                            <Heart className="w-3 h-3" /> PV:
                          </span>
                          <span className="font-mono font-bold">
                            {tok.hp} / {tok.maxHp}
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
                          <div
                            className={`h-full transition-all duration-300 ${
                              isLowHp ? "bg-red-600 animate-pulse" : "bg-red-500"
                            }`}
                            style={{ width: `${Math.max(0, Math.min(100, hpPct))}%` }}
                          />
                        </div>

                        {/* Quick Quick HP Change Buttons */}
                        <div className="grid grid-cols-4 gap-1.5 pt-1">
                          <button
                            onClick={() => handleModifyTokenHp(tok.id, -10)}
                            className="py-1 bg-red-950/70 hover:bg-red-900 border border-red-800/80 rounded-lg text-[11px] font-bold text-red-300"
                          >
                            -10
                          </button>
                          <button
                            onClick={() => handleModifyTokenHp(tok.id, -1)}
                            className="py-1 bg-red-950/70 hover:bg-red-900 border border-red-800/80 rounded-lg text-[11px] font-bold text-red-300"
                          >
                            -1
                          </button>
                          <button
                            onClick={() => handleModifyTokenHp(tok.id, 1)}
                            className="py-1 bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-800/80 rounded-lg text-[11px] font-bold text-emerald-300"
                          >
                            +1
                          </button>
                          <button
                            onClick={() => handleModifyTokenHp(tok.id, 10)}
                            className="py-1 bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-800/80 rounded-lg text-[11px] font-bold text-emerald-300"
                          >
                            +10
                          </button>
                        </div>
                      </div>

                      {/* Sanidade / PE for Ordem Paranormal */}
                      {tok.san !== undefined && tok.maxSan !== undefined && (
                        <div className="space-y-1 pt-1 border-t border-neutral-850">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-purple-400 flex items-center gap-1">
                              <Brain className="w-3 h-3" /> SAN:
                            </span>
                            <span className="font-mono text-purple-200">
                              {tok.san} / {tok.maxSan}
                            </span>
                          </div>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleModifyTokenSan(tok.id, -1)}
                              className="flex-1 py-0.5 bg-purple-950/70 hover:bg-purple-900 border border-purple-800/70 rounded text-[10px] font-bold text-purple-300"
                            >
                              -1 SAN
                            </button>
                            <button
                              onClick={() => handleModifyTokenSan(tok.id, 1)}
                              className="flex-1 py-0.5 bg-purple-950/70 hover:bg-purple-900 border border-purple-800/70 rounded text-[10px] font-bold text-purple-300"
                            >
                              +1 SAN
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PHYSICAL DICE CALCULATOR */}
        {activeTab === "physical_dice" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Physical Roll Check Evaluator */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2">
                <Dice5 className="w-5 h-5 text-amber-400" />
                <h3 className="font-serif font-bold text-sm text-amber-100">
                  Avaliador de Teste Físico (Dado Real)
                </h3>
              </div>
              <p className="text-xs text-neutral-400">
                O jogador rolou o d20 ou d6 na mesa física? Digite o resultado para somar bônus e verificar sucesso instantâneo contra a DT.
              </p>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-neutral-400">
                    Dado Tirado
                  </label>
                  <input
                    type="number"
                    value={physRolledValue}
                    onChange={(e) => setPhysRolledValue(Number(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-center text-sm font-bold text-amber-300 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-neutral-400">
                    Modificador
                  </label>
                  <input
                    type="number"
                    value={physModifier}
                    onChange={(e) => setPhysModifier(Number(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-center text-sm font-bold text-blue-300 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-neutral-400">
                    DT / CA Alvo
                  </label>
                  <input
                    type="number"
                    value={physTargetDC}
                    onChange={(e) => setPhysTargetDC(Number(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-center text-sm font-bold text-red-300 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Total & Verdict Card */}
              {(() => {
                const total = physRolledValue + physModifier;
                const isSuccess = total >= physTargetDC;
                const isNat20 = physRolledValue === 20;
                const isNat1 = physRolledValue === 1;

                return (
                  <div
                    className={`p-4 rounded-2xl border text-center transition-all ${
                      isNat20
                        ? "bg-amber-950/60 border-amber-400 text-amber-200 shadow-lg"
                        : isNat1
                        ? "bg-red-950/80 border-red-500 text-red-200"
                        : isSuccess
                        ? "bg-emerald-950/60 border-emerald-500 text-emerald-200"
                        : "bg-red-950/50 border-red-800 text-red-300"
                    }`}
                  >
                    <span className="text-[11px] font-bold uppercase tracking-wider block">
                      Resultado Final
                    </span>
                    <span className="text-3xl font-black font-mono my-1 block">{total}</span>
                    <span className="text-xs font-bold">
                      {isNat20
                        ? "CRÍTICO NATURAL! Sucesso Extremo!"
                        : isNat1
                        ? "DESASTRE NATURAL (1)!"
                        : isSuccess
                        ? `SUCESSO! (Superou a DT ${physTargetDC} por +${total - physTargetDC})`
                        : `FALHA (Faltou ${physTargetDC - total} para atingir a DT ${physTargetDC})`}
                    </span>
                  </div>
                );
              })()}
            </div>

            {/* Quick Damage / Resistance Calculator */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2">
                <Skull className="w-5 h-5 text-red-400" />
                <h3 className="font-serif font-bold text-sm text-red-100">
                  Aplicador Rápido de Dano Físico
                </h3>
              </div>
              <p className="text-xs text-neutral-400">
                Selecione o alvo da mesa e aplique o dano rolado com 1 clique (com opções de meio dano ou crítico).
              </p>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-neutral-400">
                    Alvo da Mesa
                  </label>
                  <select
                    value={selectedTargetToken}
                    onChange={(e) => setSelectedTargetToken(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs font-bold text-neutral-200 focus:outline-none focus:border-amber-500"
                  >
                    {tokens.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} (PV: {t.hp}/{t.maxHp})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-neutral-400">
                    Valor do Dano Rolado Físico
                  </label>
                  <input
                    type="number"
                    value={physRolledDamage}
                    onChange={(e) => setPhysRolledDamage(Number(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-center text-lg font-bold text-red-300 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2">
                  <button
                    onClick={() => {
                      handleModifyTokenHp(selectedTargetToken, -physRolledDamage);
                      rpgAudio.playSwordHit();
                    }}
                    className="p-2.5 bg-red-950 hover:bg-red-900 border border-red-800 text-red-200 rounded-xl text-xs font-bold transition-all"
                  >
                    Dano Total (-{physRolledDamage})
                  </button>
                  <button
                    onClick={() => {
                      const half = Math.floor(physRolledDamage / 2);
                      handleModifyTokenHp(selectedTargetToken, -half);
                      rpgAudio.playSwordHit();
                    }}
                    className="p-2.5 bg-neutral-950 hover:bg-neutral-800 border border-neutral-700 text-amber-300 rounded-xl text-xs font-bold transition-all"
                  >
                    Metade (-{Math.floor(physRolledDamage / 2)})
                  </button>
                  <button
                    onClick={() => {
                      handleModifyTokenHp(selectedTargetToken, physRolledDamage);
                      rpgAudio.playMagicSpell();
                    }}
                    className="p-2.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-200 rounded-xl text-xs font-bold transition-all"
                  >
                    Curar (+{physRolledDamage})
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: TENSION TIMER FOR PHYSICAL TABLETOP */}
        {activeTab === "tension_timer" && (
          <div className="max-w-xl mx-auto bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl text-center space-y-6">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-widest text-red-400 flex items-center justify-center gap-1.5">
                <Clock className="w-4 h-4" /> Temporizador de Tensão Presencial
              </span>
              <h3 className="font-serif font-bold text-lg text-neutral-100">
                Contagem Regressiva para a Mesa Física
              </h3>
              <p className="text-xs text-neutral-400">
                Projete o tempo ou coloque na caixa de som para momentos dramáticos (desarmar bombas, fugir do colapso, tempo para decidir ação sob pressão).
              </p>
            </div>

            {/* Timer Clock Visual */}
            <div
              className={`py-8 px-6 rounded-3xl border transition-all ${
                timerSeconds <= 10 && isTimerRunning
                  ? "bg-red-950/80 border-red-500 animate-pulse text-red-300"
                  : "bg-neutral-950 border-neutral-800 text-amber-200"
              }`}
            >
              <span className="text-6xl md:text-7xl font-black font-mono tracking-widest block">
                {Math.floor(timerSeconds / 60)
                  .toString()
                  .padStart(2, "0")}
                :{(timerSeconds % 60).toString().padStart(2, "0")}
              </span>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center justify-center gap-2">
              {[
                { label: "30s", val: 30 },
                { label: "1 min", val: 60 },
                { label: "2 min", val: 120 },
                { label: "5 min", val: 300 },
              ].map((p) => (
                <button
                  key={p.val}
                  onClick={() => {
                    setIsTimerRunning(false);
                    setTimerSeconds(p.val);
                    setInitialTimerSeconds(p.val);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    initialTimerSeconds === p.val
                      ? "bg-amber-500 text-neutral-950 border-amber-400"
                      : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className={`px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 shadow-lg transition-all active:scale-95 ${
                  isTimerRunning
                    ? "bg-amber-600 hover:bg-amber-500 text-neutral-950"
                    : "bg-red-600 hover:bg-red-500 text-white"
                }`}
              >
                {isTimerRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                <span>{isTimerRunning ? "Pausar Tensão" : "Iniciar Contagem"}</span>
              </button>

              <button
                onClick={() => {
                  setIsTimerRunning(false);
                  setTimerSeconds(initialTimerSeconds);
                }}
                className="p-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-2xl transition-all"
                title="Reiniciar Timer"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 5: QUICK IMPROVISATION TABLE */}
        {activeTab === "improvisation" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-xl space-y-3">
              <h4 className="font-serif font-bold text-xs text-amber-200 uppercase tracking-wider">
                Nomes & Personalidades de Improviso
              </h4>
              <div className="space-y-2 text-xs">
                {[
                  { name: "Dr. Marcelo Fagundes", trait: "Mãos trêmulas, esconde um relógio quebrado" },
                  { name: "Sargento Breno Alves", trait: "Veterano cético, recusa acreditar no paranormal" },
                  { name: "Dona Ivone", trait: "Vizinha fofoqueira que ouve passos no sótão à noite" },
                  { name: "Elora Solene", trait: "Elfa arqueira com olhar desconfiado de forasteiros" },
                ].map((npc, i) => (
                  <div key={i} className="p-3 bg-neutral-950 border border-neutral-800/80 rounded-xl space-y-0.5">
                    <span className="font-bold text-neutral-200">{npc.name}</span>
                    <p className="text-[10px] text-neutral-400">{npc.trait}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-xl space-y-3">
              <h4 className="font-serif font-bold text-xs text-purple-200 uppercase tracking-wider">
                Loot Rápido de Bolso / Gaveta
              </h4>
              <div className="space-y-2 text-xs">
                {[
                  { item: "Chave enferrujada com etiqueta 'Porão 3'", note: "Abre a porta secreta" },
                  { item: "Frasco com pó luminescente azul", note: "Resíduo de Energia Paranormal" },
                  { item: "Fotografia antiga com rosto riscado", note: "Pista sobre a vítima anterior" },
                  { item: "Bolsa de veludo com 12 moedas de prata", note: "Recompensa imediata" },
                ].map((loot, i) => (
                  <div key={i} className="p-3 bg-neutral-950 border border-neutral-800/80 rounded-xl space-y-0.5">
                    <span className="font-bold text-neutral-200">{loot.item}</span>
                    <p className="text-[10px] text-neutral-400">{loot.note}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-xl space-y-3">
              <h4 className="font-serif font-bold text-xs text-red-200 uppercase tracking-wider">
                Complicações / Reviravoltas de Cena
              </h4>
              <div className="space-y-2 text-xs">
                {[
                  { event: "Apagão Repentino", desc: "As luzes piscam e estouram. Visibilidade nula." },
                  { event: "Cheiro de Cinzas e Frio", desc: "A temperatura cai para -5°C instantaneamente." },
                  { event: "Passos no Teto", desc: "Algo pesado se arrasta pelo andar de cima." },
                  { event: "Sirenes ao Longe", desc: "A polícia comum está a 2 minutos do local." },
                ].map((twist, i) => (
                  <div key={i} className="p-3 bg-neutral-950 border border-neutral-800/80 rounded-xl space-y-0.5">
                    <span className="font-bold text-neutral-200">{twist.event}</span>
                    <p className="text-[10px] text-neutral-400">{twist.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
