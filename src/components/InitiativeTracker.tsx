import React from "react";
import { InitiativeCombatant, RPGSystem, UserRole } from "../types";
import {
  Zap,
  Play,
  SkipForward,
  RotateCcw,
  Plus,
  Trash2,
  Heart,
  Shield,
  Dice5,
  Crown
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
}) => {
  const handleSortInitiative = () => {
    const sorted = [...combatants].sort((a, b) => b.initiative - a.initiative);
    onUpdateCombatants(sorted);
  };

  const handleUpdateHp = (id: string, delta: number) => {
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
    onUpdateCombatants(combatants.filter((c) => c.id !== id));
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-4 md:p-5 shadow-2xl space-y-4 text-neutral-100 max-w-md w-full">
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

        {userRole === "gm" && (
          <div className="flex items-center gap-1.5">
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
      </div>

      {/* Combatants List */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
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
                className={`p-2.5 rounded-2xl border transition-all flex items-center justify-between ${
                  isTurn
                    ? "bg-amber-500/10 border-amber-500 shadow-md ring-1 ring-amber-500/50"
                    : "bg-neutral-950 border-neutral-800 hover:border-neutral-700"
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Avatar & Initiative score */}
                  <div className="relative">
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
                    <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 bg-neutral-900 border border-neutral-700 text-amber-300 font-mono text-[9px] font-bold rounded-md">
                      {c.initiative}
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-neutral-100 flex items-center gap-1.5">
                      {c.name}
                      {c.type === "boss" && (
                        <Crown className="w-3 h-3 text-amber-400" />
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
                    <div className="text-[10px] text-neutral-400">
                      {c.hp} / {c.maxHp} HP
                    </div>
                  </div>
                </div>

                {/* Quick actions */}
                <div className="flex items-center gap-1">
                  {userRole === "gm" && (
                    <>
                      <button
                        onClick={() => handleUpdateHp(c.id, -5)}
                        className="px-1.5 py-0.5 bg-red-950 text-red-300 rounded text-[10px] font-bold border border-red-900"
                      >
                        -5
                      </button>
                      <button
                        onClick={() => handleUpdateHp(c.id, +5)}
                        className="px-1.5 py-0.5 bg-emerald-950 text-emerald-300 rounded text-[10px] font-bold border border-emerald-900"
                      >
                        +5
                      </button>
                      <button
                        onClick={() => handleRemoveCombatant(c.id)}
                        className="p-1 text-neutral-500 hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

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
