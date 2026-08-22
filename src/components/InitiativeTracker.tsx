import React, { useState } from "react";
import { ChatMessage, InitiativeCombatant, RPGSystem, UserRole } from "../types";
import {
  Zap,
  Play,
  SkipForward,
  RotateCcw,
  Plus,
  Trash2,
  Heart,
  Shield,
  ShieldAlert,
  Dice5,
  Crown,
  Check,
  X,
  Target,
  AlertCircle,
  Minimize2,
  Maximize2
} from "lucide-react";
import { rpgAudio } from "../utils/audioSynth";

interface InitiativeTrackerProps {
  combatants: InitiativeCombatant[];
  currentTurnIndex: number;
  round: number;
  userRole: UserRole;
  system: RPGSystem;
  onNextTurn: () => void;
  onPreviousTurn: () => void;
  onUpdateCombatants: (combatants: InitiativeCombatant[]) => void;
  onResetEncounter: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
  undoCount?: number;
  lastUndoDescription?: string;
  onSaveSnapshot?: (description: string) => void;
  onSendMessage?: (text: string, type?: ChatMessage["type"]) => void;
}

export const InitiativeTracker: React.FC<InitiativeTrackerProps> = ({
  combatants,
  currentTurnIndex,
  round,
  userRole,
  system,
  onNextTurn,
  onPreviousTurn,
  onUpdateCombatants,
  onResetEncounter,
  onUndo,
  canUndo,
  undoCount,
  lastUndoDescription,
  onSaveSnapshot,
  onSendMessage,
}) => {
  const [selectedCombatantForReaction, setSelectedCombatantForReaction] = useState<InitiativeCombatant | null>(null);
  const [reactionTriggerInput, setReactionTriggerInput] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);

  const activeCombatant = combatants.length > 0 && currentTurnIndex >= 0 && currentTurnIndex < combatants.length
    ? combatants[currentTurnIndex]
    : null;

  const handleSortInitiative = () => {
    if (onSaveSnapshot) {
      onSaveSnapshot("Ordenar Iniciativa");
    }
    const sorted = [...combatants].sort((a, b) => b.initiative - a.initiative);
    onUpdateCombatants(sorted);
  };

  const handleUpdateHp = (id: string, delta: number) => {
    const target = combatants.find((c) => c.id === id);
    if (target && onSaveSnapshot) {
      onSaveSnapshot(`HP de ${target.name} (${delta > 0 ? "+" : ""}${delta})`);
    }

    onUpdateCombatants(
      combatants.map((c) => {
        if (c.id === id) {
          const nextHp = Math.max(0, Math.min(c.maxHp, c.hp + delta));
          return { ...c, hp: nextHp };
        }
        return c;
      })
    );
  };

  const handleRemoveCombatant = (id: string) => {
    const target = combatants.find((c) => c.id === id);
    if (target && onSaveSnapshot) {
      onSaveSnapshot(`Remover ${target.name} do combate`);
    }
    onUpdateCombatants(combatants.filter((c) => c.id !== id));
  };

  const handleOpenReactionModal = (combatant: InitiativeCombatant) => {
    setSelectedCombatantForReaction(combatant);
    setReactionTriggerInput(combatant.reactionTrigger || "");
  };

  const handleSaveReaction = (combatantId: string, triggerText?: string) => {
    const target = combatants.find((c) => c.id === combatantId);
    if (!target) return;

    const trigger = triggerText?.trim() || "";

    if (onSaveSnapshot) {
      onSaveSnapshot(`Guardar Reação de ${target.name}`);
    }

    onUpdateCombatants(
      combatants.map((c) => {
        if (c.id === combatantId) {
          return { ...c, reactionHeld: true, reactionTrigger: trigger };
        }
        return c;
      })
    );

    if (onSendMessage) {
      const msg = `⚡ **${target.name}** guardou uma Ação de Reação!${trigger ? `\n> 🎯 *Gatilho / Ação:* "${trigger}"` : ""}`;
      onSendMessage(msg, "action");
    }

    rpgAudio.playSwordHit();
    setSelectedCombatantForReaction(null);
    setReactionTriggerInput("");
  };

  const handleUseReaction = (combatantId: string) => {
    const target = combatants.find((c) => c.id === combatantId);
    if (!target) return;

    if (onSaveSnapshot) {
      onSaveSnapshot(`Usar Reação de ${target.name}`);
    }

    onUpdateCombatants(
      combatants.map((c) => {
        if (c.id === combatantId) {
          return { ...c, reactionHeld: false, reactionTrigger: "" };
        }
        return c;
      })
    );

    if (onSendMessage) {
      onSendMessage(`⚡ **${target.name}** executou a sua Reação Preparada!`, "action");
    }

    rpgAudio.playSwordHit();
  };

  const handleClearReaction = (combatantId: string) => {
    const target = combatants.find((c) => c.id === combatantId);
    if (!target) return;

    if (onSaveSnapshot) {
      onSaveSnapshot(`Cancelar Reação de ${target.name}`);
    }

    onUpdateCombatants(
      combatants.map((c) => {
        if (c.id === combatantId) {
          return { ...c, reactionHeld: false, reactionTrigger: "" };
        }
        return c;
      })
    );
  };

  if (isCollapsed) {
    return (
      <div className={`text-neutral-100 rounded-2xl py-2 px-3 shadow-2xl flex items-center justify-between gap-3 backdrop-blur-md max-w-sm w-full select-none animate-in fade-in duration-150 border ${
        system === "ordem"
          ? "bg-[#09070f]/95 border-purple-500/40 shadow-lg shadow-purple-950/20"
          : "bg-[#0c0a07]/95 border-amber-600/35 shadow-lg shadow-amber-950/20"
      }`}>
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 flex-shrink-0">
            <Zap className="w-3.5 h-3.5 animate-pulse" />
          </div>
          <div className="min-w-0">
            <span className="text-[9px] text-amber-400 font-extrabold block leading-none">Rodada {round}</span>
            <span className="text-xs font-bold text-neutral-200 truncate block mt-0.5">
              {activeCombatant ? activeCombatant.name : "Nenhum Ativo"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {userRole === "gm" && (
            <>
              <button
                onClick={onPreviousTurn}
                className="p-1 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg transition-colors"
                title="Turno Anterior"
              >
                <SkipForward className="w-3.5 h-3.5 rotate-180" />
              </button>
              <button
                onClick={onNextTurn}
                className="p-1 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg transition-colors"
                title="Próximo Turno"
              >
                <SkipForward className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          <span className="text-neutral-700">|</span>
          <button
            onClick={() => setIsCollapsed(false)}
            className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1"
          >
            <Maximize2 className="w-3 h-3" />
            <span>Expandir</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-3xl p-4 md:p-5 shadow-2xl space-y-4 text-neutral-100 max-w-md w-full relative animate-in fade-in duration-150 border ${
      system === "ordem"
        ? "bg-[#08070e]/98 border-purple-500/35 shadow-lg shadow-purple-950/20"
        : "bg-[#0b0907]/98 border-amber-600/30 shadow-lg shadow-amber-950/20"
    }`}>
      {/* Header with Round & Controls */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-sm text-amber-100">Ordem de Iniciativa</h3>
            <span className="text-[10px] text-amber-400 font-bold">Rodada {round}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {userRole === "gm" && (
            <div className="flex items-center gap-1.5">
              {onUndo && (
                <button
                  onClick={onUndo}
                  disabled={!canUndo}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                    canUndo
                      ? "bg-amber-950/80 border-amber-600/80 text-amber-300 hover:bg-amber-900 shadow-sm"
                      : "bg-neutral-950 border-neutral-800 text-neutral-600 cursor-not-allowed opacity-50"
                  }`}
                  title={
                    canUndo
                      ? `Desfazer última ação: ${lastUndoDescription || "Desfazer"} [Ctrl+Z]`
                      : "Nenhuma ação para desfazer"
                  }
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Desfazer</span>
                  {canUndo && undoCount && undoCount > 0 ? (
                    <span className="px-1 py-0.2 bg-amber-500/20 text-amber-300 rounded text-[9px]">
                      {undoCount}
                    </span>
                  ) : null}
                </button>
              )}

              <button
                onClick={handleSortInitiative}
                className="px-2.5 py-1 bg-neutral-950 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 text-[10px] font-bold rounded-lg"
                title="Ordenar por maior iniciativa"
              >
                Ordenar
              </button>
              <button
                onClick={onResetEncounter}
                className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-neutral-800 rounded-lg"
                title="Reiniciar Combate"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1.5 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-amber-300 rounded-lg"
            title="Minimizar Painel"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Active Turn Banner with Guardar Reação */}
      {activeCombatant && (
        <div className="bg-gradient-to-r from-purple-950/70 via-amber-950/40 to-neutral-950 border border-purple-500/40 rounded-2xl p-3 flex items-center justify-between gap-2 shadow-lg">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl overflow-hidden border border-purple-400 flex-shrink-0">
              <img
                src={activeCombatant.avatar || "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=150&auto=format&fit=crop&q=80"}
                alt={activeCombatant.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] text-purple-300 font-extrabold uppercase tracking-wider block">Turno Atual</span>
              <span className="text-xs font-bold text-neutral-100 truncate block">{activeCombatant.name}</span>
            </div>
          </div>

          {activeCombatant.reactionHeld ? (
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="px-2 py-1 bg-purple-500/20 border border-purple-400/80 text-purple-200 text-[10px] font-bold rounded-lg flex items-center gap-1 shadow-sm animate-pulse">
                <Zap className="w-3 h-3 text-amber-300 fill-amber-300" />
                <span>Reação Guardada</span>
              </span>
              <button
                onClick={() => handleUseReaction(activeCombatant.id)}
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-[10px] rounded-lg shadow active:scale-95 transition-all"
                title="Executar Reação Guardada"
              >
                Usar
              </button>
            </div>
          ) : (
            <button
              onClick={() => handleOpenReactionModal(activeCombatant)}
              className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-[11px] rounded-xl flex items-center gap-1.5 shadow-md shadow-purple-900/40 active:scale-95 transition-all flex-shrink-0"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-300" />
              <span>Guardar Reação</span>
            </button>
          )}
        </div>
      )}

      {/* Combatants List */}
      <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
        {combatants.length === 0 ? (
          <div className="text-center py-8 text-xs text-neutral-500">
            Nenhum combatente na iniciativa. Adicione tokens ou role iniciativa.
          </div>
        ) : (
          combatants.map((c, idx) => {
            const isTurn = idx === currentTurnIndex;
            const hpPercent = Math.max(0, Math.min(100, (c.hp / c.maxHp) * 100));

            return (
              <div
                key={c.id}
                className={`p-2.5 rounded-2xl border transition-all space-y-2 ${
                  isTurn
                    ? "bg-amber-500/10 border-amber-500 shadow-md ring-1 ring-amber-500/50"
                    : c.reactionHeld
                    ? "bg-purple-950/20 border-purple-500/50 hover:border-purple-500"
                    : "bg-neutral-950 border-neutral-800 hover:border-neutral-700"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Avatar & Initiative score */}
                    <div className="relative flex-shrink-0">
                      <div
                        className="w-10 h-10 rounded-xl overflow-hidden border"
                        style={{ borderColor: c.color || "#eab308" }}
                      >
                        <img
                          src={c.avatar || "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=150&auto=format&fit=crop&q=80"}
                          alt={c.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 bg-neutral-900 border border-neutral-700 text-amber-300 font-mono text-[9px] font-bold rounded-md shadow">
                        {c.initiative}
                      </span>
                    </div>

                    <div className="space-y-0.5 min-w-0">
                      <div className="text-xs font-bold text-neutral-100 flex items-center gap-1.5 truncate">
                        <span className="truncate">{c.name}</span>
                        {c.type === "boss" && (
                          <Crown className="w-3 h-3 text-amber-400 flex-shrink-0" />
                        )}
                      </div>
                      {/* HP bar */}
                      <div className="w-24 bg-neutral-900 rounded-full h-1.5 overflow-hidden border border-neutral-800">
                        <div
                          className={`h-full ${
                            hpPercent > 50 ? "bg-emerald-500" : hpPercent > 20 ? "bg-amber-500" : "bg-red-500"
                          }`}
                          style={{ width: `${hpPercent}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-neutral-400 font-mono">
                        {c.hp} / {c.maxHp} HP
                      </div>
                    </div>
                  </div>

                  {/* Quick HP & Action Buttons */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {userRole === "gm" && (
                      <>
                        <button
                          onClick={() => handleUpdateHp(c.id, -5)}
                          className="px-1.5 py-0.5 bg-red-950 hover:bg-red-900 text-red-300 rounded text-[10px] font-bold border border-red-900"
                          title="Tirar 5 de HP"
                        >
                          -5
                        </button>
                        <button
                          onClick={() => handleUpdateHp(c.id, +5)}
                          className="px-1.5 py-0.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 rounded text-[10px] font-bold border border-emerald-900"
                          title="Curar 5 de HP"
                        >
                          +5
                        </button>
                        <button
                          onClick={() => handleRemoveCombatant(c.id)}
                          className="p-1 text-neutral-500 hover:text-red-400 rounded"
                          title="Remover do Combate"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Conditions & Reaction Bar */}
                <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 border-t border-neutral-800/60 text-[10px]">
                  {/* Conditions */}
                  <div className="flex flex-wrap gap-1 items-center">
                    {c.conditions && c.conditions.length > 0 && c.conditions.map((cond, cIdx) => (
                      <span
                        key={cIdx}
                        className="px-1.5 py-0.2 bg-purple-950/80 border border-purple-700/80 text-purple-200 rounded text-[9px] font-bold"
                      >
                        {cond}
                      </span>
                    ))}
                  </div>

                  {/* Reaction Button or Badge */}
                  {c.reactionHeld ? (
                    <div className="flex items-center gap-1.5 ml-auto">
                      <span className="px-2 py-0.5 bg-purple-900/90 border border-purple-400 text-purple-200 rounded-lg text-[9px] font-bold flex items-center gap-1 shadow-sm">
                        <Zap className="w-2.5 h-2.5 text-amber-300 fill-amber-300 animate-pulse" />
                        <span>Reação Guardada</span>
                      </span>
                      <button
                        onClick={() => handleUseReaction(c.id)}
                        className="px-2 py-0.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-md text-[9px] font-bold flex items-center gap-0.5 shadow transition-all active:scale-95"
                        title="Usar / Executar Reação"
                      >
                        <Check className="w-2.5 h-2.5" />
                        Usar
                      </button>
                      <button
                        onClick={() => handleClearReaction(c.id)}
                        className="p-0.5 text-neutral-400 hover:text-red-400 rounded"
                        title="Cancelar Reação"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleOpenReactionModal(c)}
                      className="ml-auto px-2 py-0.5 bg-neutral-900 hover:bg-purple-950/90 border border-neutral-700 hover:border-purple-500/80 text-neutral-300 hover:text-purple-200 rounded-lg text-[9px] font-bold flex items-center gap-1 transition-all active:scale-95"
                      title="Guardar ação de reação para este combatente"
                    >
                      <ShieldAlert className="w-3 h-3 text-amber-400" />
                      <span>Guardar Reação</span>
                    </button>
                  )}
                </div>

                {/* Optional Reaction Trigger Note */}
                {c.reactionHeld && c.reactionTrigger && (
                  <div className="text-[10px] text-purple-200 bg-purple-950/40 px-2.5 py-1 rounded-xl border border-purple-800/50 flex items-start gap-1">
                    <Target className="w-3 h-3 text-amber-300 flex-shrink-0 mt-0.5" />
                    <span className="italic">
                      <strong>Gatilho:</strong> "{c.reactionTrigger}"
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal / Dialog for Reaction Trigger */}
      {selectedCombatantForReaction && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-purple-500/50 rounded-3xl p-5 max-w-sm w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
                  <ShieldAlert className="w-4 h-4 text-amber-300" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-neutral-100">Guardar Reação</h4>
                  <span className="text-[11px] text-purple-300 font-semibold">{selectedCombatantForReaction.name}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedCombatantForReaction(null)}
                className="p-1 text-neutral-400 hover:text-neutral-100 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              Marque uma ação preparada para ser ativada fora do seu turno no combate (ex: ataque de oportunidade, magia de reação ou gatilho específico).
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-amber-300 block">
                Condição / Gatilho da Reação (Opcional):
              </label>
              <input
                type="text"
                value={reactionTriggerInput}
                onChange={(e) => setReactionTriggerInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSaveReaction(selectedCombatantForReaction.id, reactionTriggerInput);
                  }
                }}
                placeholder="Ex: Atacar se o monstro se aproximar, Lançar Escudo Arcano ao ser atacado..."
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-purple-500 rounded-xl px-3 py-2 text-xs text-neutral-100 placeholder:text-neutral-600 focus:outline-none"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setSelectedCombatantForReaction(null)}
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleSaveReaction(selectedCombatantForReaction.id, reactionTriggerInput)}
                className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-900/40 active:scale-95 transition-all"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-300" />
                <span>Confirmar Reação</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Turn Forward Controls */}
      {userRole === "gm" && combatants.length > 0 && (
        <div className="pt-2 border-t border-neutral-800 flex items-center justify-between gap-2">
          <button
            onClick={onPreviousTurn}
            className="px-3 py-2 bg-neutral-950 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 rounded-xl text-xs font-semibold"
          >
            Turno Anterior
          </button>
          <button
            onClick={() => {
              rpgAudio.playSwordHit();
              onNextTurn();
            }}
            className="flex-1 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-neutral-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow"
          >
            <SkipForward className="w-4 h-4" />
            Próximo Turno
          </button>
        </div>
      )}
    </div>
  );
};
