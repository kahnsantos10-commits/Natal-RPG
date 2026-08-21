import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { DiceRollResult } from "../types";
import { rpgAudio } from "../utils/audioSynth";
import { Sparkles, Zap, ShieldAlert, Check, X, RotateCcw, Volume2 } from "lucide-react";

interface Dice3DAnimationOverlayProps {
  rollResult: DiceRollResult | null;
  onClose: () => void;
  onReplayRoll?: (roll: DiceRollResult) => void;
}

export const Dice3DAnimationOverlay: React.FC<Dice3DAnimationOverlayProps> = ({
  rollResult,
  onClose,
  onReplayRoll,
}) => {
  const [stage, setStage] = useState<"rolling" | "settled">("rolling");
  const [currentDisplayRolls, setCurrentDisplayRolls] = useState<number[]>([]);
  const [shockwave, setShockwave] = useState(false);

  // Extract die type (e.g. d20, d6, d8) from formula if present
  const detectDieType = (formula: string): number => {
    const match = formula.match(/d(\d+)/i);
    return match ? parseInt(match[1], 10) : 20;
  };

  const dieSides = rollResult ? detectDieType(rollResult.formula) : 20;

  useEffect(() => {
    if (!rollResult) return;

    setStage("rolling");
    setShockwave(false);
    rpgAudio.playDiceRoll();

    const rolls = rollResult.rolls && rollResult.rolls.length > 0 ? rollResult.rolls : [rollResult.total];

    // Rapid random number ticker during rolling stage
    const interval = setInterval(() => {
      setCurrentDisplayRolls(
        rolls.map(() => Math.floor(Math.random() * dieSides) + 1)
      );
    }, 55);

    // Settling timer
    const timer = setTimeout(() => {
      clearInterval(interval);
      setCurrentDisplayRolls(rolls);
      setStage("settled");
      setShockwave(true);

      // Play impact sound based on result
      if (rollResult.isCrit || rollResult.isCritical || (dieSides === 20 && rolls.includes(20))) {
        rpgAudio.playSpellCast();
      } else if (rollResult.isFumble || (dieSides === 20 && rolls.includes(1))) {
        rpgAudio.playTokenMove();
      } else {
        rpgAudio.playDiceRoll();
      }
    }, 1250);

    // Auto close timer
    const autoCloseTimer = setTimeout(() => {
      onClose();
    }, 4200);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
      clearTimeout(autoCloseTimer);
    };
  }, [rollResult, dieSides, onClose]);

  if (!rollResult) return null;

  const rolls = rollResult.rolls && rollResult.rolls.length > 0 ? rollResult.rolls : [rollResult.total];
  const isCrit = rollResult.isCrit || rollResult.isCritical || (stage === "settled" && dieSides === 20 && rolls.includes(20));
  const isFumble = rollResult.isFumble || (stage === "settled" && dieSides === 20 && rolls.includes(1));

  // Determine die shape styling based on system / result / index
  const getDieStyle = (index: number) => {
    if (rollResult.system === "ordem") {
      return {
        bg: "from-purple-900 via-indigo-900 to-black",
        border: "border-purple-400/80",
        text: "text-purple-100",
        shadow: "shadow-[0_0_30px_rgba(168,85,247,0.5)]",
        glow: "rgba(168,85,247,0.8)",
      };
    }
    if (isCrit) {
      return {
        bg: "from-amber-400 via-yellow-500 to-amber-700",
        border: "border-yellow-200",
        text: "text-amber-950 font-black",
        shadow: "shadow-[0_0_35px_rgba(251,191,36,0.9)]",
        glow: "rgba(251,191,36,1)",
      };
    }
    if (isFumble) {
      return {
        bg: "from-red-600 via-red-800 to-neutral-950",
        border: "border-red-500",
        text: "text-red-100 font-black",
        shadow: "shadow-[0_0_30px_rgba(239,68,68,0.7)]",
        glow: "rgba(239,68,68,0.9)",
      };
    }
    const colors = [
      { bg: "from-amber-600 via-amber-800 to-neutral-950", border: "border-amber-400/80", text: "text-amber-100", shadow: "shadow-amber-500/40", glow: "rgba(245,158,11,0.6)" },
      { bg: "from-indigo-600 via-blue-800 to-neutral-950", border: "border-blue-400/80", text: "text-blue-100", shadow: "shadow-blue-500/40", glow: "rgba(59,130,246,0.6)" },
      { bg: "from-emerald-600 via-teal-800 to-neutral-950", border: "border-emerald-400/80", text: "text-emerald-100", shadow: "shadow-emerald-500/40", glow: "rgba(16,185,129,0.6)" },
    ];
    return colors[index % colors.length];
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/85 backdrop-blur-md p-4 pointer-events-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.75, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.75, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="relative w-full max-w-xl bg-gradient-to-b from-neutral-900 via-neutral-900/95 to-neutral-950 border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden text-center select-none"
        >
          {/* Ambient Background Aura */}
          <div
            className={`absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl opacity-25 pointer-events-none transition-colors duration-700 ${
              isCrit
                ? "bg-amber-400"
                : isFumble
                ? "bg-red-600"
                : rollResult.system === "ordem"
                ? "bg-purple-600"
                : "bg-blue-500"
            }`}
          />

          {/* Top Control Bar */}
          <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3 mb-4">
            <div className="flex items-center gap-2 text-left">
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full">
                {rollResult.rollerName || "Jogador"} • {rollResult.reason || "Rolagem de Dados"}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  rpgAudio.playDiceRoll();
                  if (onReplayRoll) onReplayRoll(rollResult);
                }}
                className="p-1.5 text-neutral-400 hover:text-amber-300 bg-neutral-800/60 hover:bg-neutral-800 rounded-xl transition-all text-xs font-semibold flex items-center gap-1"
                title="Rolar Novamente"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-neutral-400 hover:text-white bg-neutral-800/60 hover:bg-neutral-800 rounded-xl transition-all"
                title="Fechar (ESC)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <h2 className="text-lg sm:text-xl font-serif font-extrabold text-neutral-100 mb-2">
            {rollResult.formula}
          </h2>

          {/* 3D Dice Tray Stage */}
          <div className="relative min-h-[200px] sm:min-h-[220px] bg-neutral-950/90 border border-neutral-800/80 rounded-3xl p-6 flex flex-wrap items-center justify-center gap-6 shadow-inner my-3 overflow-hidden">
            {/* Felt Pattern Backdrop */}
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#eab308_1px,transparent_1px)] [background-size:18px_18px]" />

            {/* Shockwave ring on settle */}
            {shockwave && (
              <motion.div
                initial={{ scale: 0.2, opacity: 0.9 }}
                animate={{ scale: 2.2, opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`absolute w-32 h-32 rounded-full border-2 pointer-events-none ${
                  isCrit
                    ? "border-amber-400 shadow-[0_0_50px_rgba(251,191,36,0.8)]"
                    : isFumble
                    ? "border-red-500 shadow-[0_0_50px_rgba(239,68,68,0.8)]"
                    : "border-amber-500/50"
                }`}
              />
            )}

            {rolls.map((val, idx) => {
              const displayVal = currentDisplayRolls[idx] ?? val;
              const style = getDieStyle(idx);

              return (
                <div key={idx} className="relative flex flex-col items-center">
                  {/* Polyhedral 3D Dice Container */}
                  <motion.div
                    initial={{
                      scale: 0.1,
                      rotateX: Math.random() * 720,
                      rotateY: Math.random() * 720,
                      rotateZ: Math.random() * 720,
                      y: -120,
                    }}
                    animate={
                      stage === "rolling"
                        ? {
                            scale: [0.4, 1.25, 0.85, 1.15],
                            rotateX: [0, 360, 720, 1080, 1440],
                            rotateY: [0, 720, 1440, 360, 0],
                            rotateZ: [0, 180, 540, 360, 720],
                            y: [-80, 20, -15, 0],
                          }
                        : {
                            scale: isCrit ? [1, 1.25, 1] : [1, 1.08, 1],
                            rotateX: 0,
                            rotateY: 0,
                            rotateZ: 0,
                            y: 0,
                          }
                    }
                    transition={{
                      duration: stage === "rolling" ? 1.2 : 0.35,
                      ease: stage === "rolling" ? "easeOut" : "backOut",
                    }}
                    className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br border-2 flex items-center justify-center shadow-2xl backdrop-blur-md cursor-pointer ${style.bg} ${style.border} ${style.shadow}`}
                    style={{
                      perspective: "1200px",
                      transformStyle: "preserve-3d",
                      clipPath:
                        dieSides === 20 || dieSides === 12
                          ? "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)" // Octagonal / D20 look
                          : dieSides === 8
                          ? "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" // Diamond D8
                          : dieSides === 4
                          ? "polygon(50% 0%, 100% 100%, 0% 100%)" // Triangle D4
                          : "none", // Cube D6
                    }}
                  >
                    {/* Inner Gem Highlight Facet */}
                    <div className="absolute inset-1.5 rounded-xl border border-white/20 bg-gradient-to-b from-white/20 via-transparent to-black/30 pointer-events-none" />

                    {/* Settled Glow Ring */}
                    {stage === "settled" && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1.15 }}
                        className={`absolute -inset-1 rounded-2xl border ${
                          isCrit
                            ? "border-amber-300 bg-amber-400/20 shadow-[0_0_30px_rgba(251,191,36,0.9)]"
                            : isFumble
                            ? "border-red-500 bg-red-600/20 shadow-[0_0_30px_rgba(239,68,68,0.8)]"
                            : "border-amber-500/40"
                        }`}
                      />
                    )}

                    {/* Face Number Display */}
                    <span
                      className={`relative z-10 text-3xl sm:text-4xl font-mono font-black tracking-tighter drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] ${style.text}`}
                    >
                      {displayVal}
                    </span>

                    {/* Die Sides Tag */}
                    <span className="absolute bottom-1 right-2 text-[8px] font-bold opacity-60 font-mono">
                      d{dieSides}
                    </span>
                  </motion.div>

                  {/* Ground Shadow */}
                  <motion.div
                    animate={
                      stage === "rolling"
                        ? { scale: [0.3, 1, 0.6, 1], opacity: [0.2, 0.6, 0.3, 0.7] }
                        : { scale: 1, opacity: 0.7 }
                    }
                    transition={{ duration: 1.2 }}
                    className="w-16 h-3 bg-black/80 rounded-full blur-sm mt-2"
                  />
                </div>
              );
            })}
          </div>

          {/* Settled Result Display Banner */}
          <div className="mt-3 min-h-[75px] flex flex-col items-center justify-center">
            {stage === "settled" ? (
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="space-y-1.5"
              >
                {/* Critical / Fumble Alert Badge */}
                {isCrit && (
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-gradient-to-r from-amber-500/30 via-yellow-500/40 to-amber-500/30 border border-yellow-400 text-yellow-200 rounded-full text-xs font-black animate-bounce shadow-lg shadow-amber-500/40">
                    <Sparkles className="w-4 h-4 text-yellow-300" />
                    ACERTO CRÍTICO SENSACIONAL!
                  </div>
                )}
                {isFumble && (
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-gradient-to-r from-red-600/30 via-red-800/40 to-red-600/30 border border-red-500 text-red-200 rounded-full text-xs font-black animate-pulse shadow-lg shadow-red-500/40">
                    <ShieldAlert className="w-4 h-4 text-red-400" />
                    FALHA CRÍTICA DESASTROSA!
                  </div>
                )}

                {/* Final Score */}
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xs sm:text-sm text-neutral-400 font-semibold uppercase tracking-wider">
                    Resultado Total:
                  </span>
                  <span
                    className={`text-3xl sm:text-4xl font-extrabold font-mono ${
                      isCrit
                        ? "text-yellow-300 drop-shadow-[0_0_20px_rgba(253,224,71,0.9)]"
                        : isFumble
                        ? "text-red-400 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]"
                        : "text-amber-300"
                    }`}
                  >
                    {rollResult.total}
                  </span>
                  {rollResult.modifier !== 0 && (
                    <span className="text-xs text-neutral-400 font-mono bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded-lg">
                      {rollResult.modifier >= 0 ? `+${rollResult.modifier}` : rollResult.modifier} mod
                    </span>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-amber-400 font-bold tracking-widest uppercase animate-pulse">
                <Zap className="w-4 h-4 text-amber-400 animate-spin" />
                Rolando Dados na Mesa...
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400">
            <span className="text-neutral-500 font-medium hidden sm:inline">
              Toque fora ou no X para fechar
            </span>
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => {
                  rpgAudio.playDiceRoll();
                  if (onReplayRoll) onReplayRoll(rollResult);
                }}
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 rounded-xl font-bold flex items-center gap-1 transition-all active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                Rolar de Novo
              </button>
              <button
                onClick={onClose}
                className="px-4 py-1.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-neutral-950 font-extrabold rounded-xl transition-all shadow-md active:scale-95"
              >
                Continuar
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

