import React, { useState } from "react";
import {
  MapData,
  MapToken,
  InitiativeCombatant,
  RPGSystem,
} from "../types";
import {
  Maximize2,
  Minimize2,
  X,
  Tv,
  Image as ImageIcon,
  Compass,
  FileText,
  Zap,
  Clock,
  Heart,
  Brain,
  Shield,
  Volume2,
  Wifi
} from "lucide-react";
import { RokuCastPanel } from "./RokuCastPanel";

interface PlayerDisplayModalProps {
  system: RPGSystem;
  mapData: MapData;
  tokens: MapToken[];
  combatants: InitiativeCombatant[];
  currentTurnIndex: number;
  revealedHandout?: {
    title: string;
    content: string;
    imageUrl?: string;
    author?: string;
    dateOrEra?: string;
  } | null;
  availableMaps?: MapData[];
  onClose: () => void;
}

export const PlayerDisplayModal: React.FC<PlayerDisplayModalProps> = ({
  system,
  mapData,
  tokens,
  combatants,
  currentTurnIndex,
  revealedHandout,
  availableMaps = [],
  onClose,
}) => {
  const [activeView, setActiveView] = useState<"map" | "handout" | "combat">("map");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showRokuCast, setShowRokuCast] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const activeTurnCombatant = combatants[currentTurnIndex];

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950 flex flex-col text-neutral-100 animate-in fade-in select-none">
      {/* Top Floating Control Bar (Minimalist, designed for TV/Projector & mobile screens) */}
      <header className="h-12 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800/80 px-2 sm:px-4 flex items-center justify-between z-10 gap-2">
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Tv className="w-4 h-4 text-amber-400" />
            <span className="font-serif font-bold text-[11px] sm:text-xs text-amber-200 tracking-wider">
              TELÃO DOS JOGADORES
            </span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono hidden md:inline">
            {mapData.name}
          </span>
        </div>

        {/* View Switcher on TV */}
        <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-xl p-0.5 sm:p-1 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveView("map")}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-lg font-semibold transition-all whitespace-nowrap ${
              activeView === "map"
                ? "bg-amber-500 text-neutral-950 font-bold shadow"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Mapa</span>
          </button>

          {revealedHandout && (
            <button
              onClick={() => setActiveView("handout")}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-lg font-semibold transition-all whitespace-nowrap ${
                activeView === "handout"
                  ? "bg-purple-600 text-white font-bold shadow"
                  : "text-purple-400 hover:text-purple-300 animate-pulse"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Pista</span>
            </button>
          )}

          <button
            onClick={() => setActiveView("combat")}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-lg font-semibold transition-all whitespace-nowrap ${
              activeView === "combat"
                ? "bg-red-600 text-white font-bold shadow"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Turnos</span>
          </button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          <button
            onClick={() => setShowRokuCast(!showRokuCast)}
            className={`p-1.5 border rounded-lg transition-all flex items-center gap-1 text-xs font-bold ${
              showRokuCast
                ? "bg-amber-500 border-amber-400 text-neutral-950 shadow shadow-amber-500/20"
                : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-amber-300"
            }`}
            title="Transmitir para o Roku TV"
          >
            <Wifi className={`w-3.5 h-3.5 ${showRokuCast ? "animate-pulse" : ""}`} />
            <span className="hidden md:inline">Transmitir Roku</span>
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors"
            title="Alternar Tela Cheia"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 bg-neutral-900 hover:bg-red-950 border border-neutral-800 hover:border-red-800 text-neutral-400 hover:text-red-300 rounded-lg transition-colors"
            title="Fechar Telão"
          >
            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </header>

      {/* Main Display Stage */}
      <div className="flex-1 overflow-hidden relative flex">
        {/* VIEW 1: CLEAN MAP DISPLAY */}
        {activeView === "map" && (
          <div className="w-full h-full relative bg-neutral-900 flex items-center justify-center overflow-hidden">
            {mapData.bgUrl ? (
              <img
                src={mapData.bgUrl}
                alt="Mapa da Cena"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="text-center text-neutral-500 p-4">
                <Compass className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2 text-neutral-700" />
                <p className="text-xs sm:text-sm">Nenhum mapa ativo selecionado.</p>
              </div>
            )}

            {/* Floating Initiative overlay on bottom of TV screen */}
            {combatants.length > 0 && (
              <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4 bg-neutral-950/80 backdrop-blur-md border border-neutral-800/90 rounded-2xl p-2.5 sm:p-3 flex items-center gap-2 sm:gap-3 overflow-x-auto shadow-2xl">
                <span className="text-[10px] font-bold uppercase text-amber-400 flex items-center gap-1 flex-shrink-0">
                  <Zap className="w-3.5 h-3.5" /> Turnos:
                </span>
                <div className="flex items-center gap-2 flex-1 overflow-x-auto">
                  {combatants.map((c, idx) => {
                    const isTurn = idx === currentTurnIndex;
                    return (
                      <div
                        key={c.id}
                        className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border flex-shrink-0 transition-all ${
                          isTurn
                            ? "bg-amber-500 text-neutral-950 font-bold border-amber-400 scale-105 shadow-lg shadow-amber-500/20 ring-2 ring-amber-400"
                            : "bg-neutral-900/90 border-neutral-800 text-neutral-300"
                        }`}
                      >
                        <span className="font-mono text-[11px] sm:text-xs opacity-75">#{c.initiative}</span>
                        <span className="text-xs">{c.name}</span>
                        {isTurn && (
                          <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-neutral-950 text-amber-300 font-bold">
                            Vez
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: REVEALED HANDOUT OR CLUE */}
        {activeView === "handout" && revealedHandout && (
          <div className="w-full h-full flex items-center justify-center p-3 sm:p-6 md:p-8 bg-neutral-950 overflow-y-auto">
            <div className="max-w-3xl w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl space-y-4 sm:space-y-6">
              <div className="border-b border-neutral-800 pb-3 sm:pb-4">
                <span className="text-xs font-mono text-amber-400 font-bold uppercase">
                  Documento / Pista de Investigação
                </span>
                <h2 className="text-xl sm:text-2xl font-bold font-serif text-amber-200 mt-1">
                  {revealedHandout.title}
                </h2>
                {revealedHandout.author && (
                  <p className="text-xs text-neutral-400 mt-1">
                    Autor/Origem: {revealedHandout.author} • {revealedHandout.dateOrEra}
                  </p>
                )}
              </div>

              {revealedHandout.imageUrl && (
                <div className="w-full h-48 sm:h-64 rounded-2xl overflow-hidden border border-neutral-800 shadow-lg">
                  <img
                    src={revealedHandout.imageUrl}
                    alt="Pista"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="text-xs sm:text-sm md:text-base text-neutral-200 leading-relaxed font-mono whitespace-pre-wrap p-3 sm:p-4 bg-neutral-950 rounded-2xl border border-neutral-850">
                {revealedHandout.content}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: INITIATIVE & FULL COMBAT DASHBOARD FOR PLAYERS */}
        {activeView === "combat" && (
          <div className="w-full h-full p-4 sm:p-6 md:p-8 bg-neutral-950 overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
              <div className="text-center space-y-1">
                <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
                  Painel Tático de Combate da Mesa
                </span>
                <h2 className="text-lg sm:text-xl font-bold font-serif text-neutral-100">
                  Ordem de Iniciativa e Status dos Personagens
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {combatants.map((c, idx) => {
                  const isCurrent = idx === currentTurnIndex;
                  const tokenMatch = tokens.find((t) => t.id === c.id);
                  return (
                    <div
                      key={c.id}
                      className={`p-4 sm:p-5 rounded-3xl border transition-all ${
                        isCurrent
                          ? "bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/50 shadow-2xl scale-[1.01] sm:scale-[1.02]"
                          : "bg-neutral-900 border-neutral-800 opacity-90"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 sm:gap-3">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl overflow-hidden bg-neutral-800 border border-neutral-700 flex-shrink-0">
                            {c.avatar ? (
                              <img src={c.avatar} alt={c.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center font-bold text-amber-400">
                                {c.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold text-xs sm:text-sm text-neutral-100">{c.name}</h4>
                            <span className="text-[10px] text-neutral-400 uppercase font-semibold">
                              Iniciativa: <span className="font-mono text-amber-300 font-bold">{c.initiative}</span>
                            </span>
                          </div>
                        </div>

                        {isCurrent && (
                          <span className="px-2.5 sm:px-3 py-1 rounded-xl bg-amber-500 text-neutral-950 font-bold text-[10px] sm:text-xs animate-bounce">
                            TURNO ATIVO
                          </span>
                        )}
                      </div>

                      {tokenMatch && (
                        <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span className="text-red-400 font-bold flex items-center gap-1">
                            <Heart className="w-3.5 h-3.5" /> PV: {tokenMatch.hp} / {tokenMatch.maxHp}
                          </span>
                          {tokenMatch.san !== undefined && (
                            <span className="text-purple-400 font-bold flex items-center gap-1">
                              <Brain className="w-3.5 h-3.5" /> SAN: {tokenMatch.san} / {tokenMatch.maxSan}
                            </span>
                          )}
                          <span className="text-neutral-400 font-bold">
                            Defesa: {tokenMatch.ac || 10}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Floating Roku Cast Panel Drawer */}
        {showRokuCast && (
          <div className="absolute top-3 right-3 z-40 max-h-[calc(100%-24px)] overflow-y-auto shadow-2xl animate-in slide-in-from-right-6 duration-200 bg-black/95 rounded-3xl">
            <RokuCastPanel
              system={system}
              mapBgUrl={mapData.bgUrl || ""}
              mapName={mapData.name}
              handoutImageUrl={revealedHandout?.imageUrl}
              handoutTitle={revealedHandout?.title}
              availableMaps={availableMaps}
              onClose={() => setShowRokuCast(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
};
