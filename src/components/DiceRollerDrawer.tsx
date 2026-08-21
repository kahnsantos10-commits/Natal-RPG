import React, { useState } from "react";
import { RPGSystem, RollResult } from "../types";
import {
  Dice1,
  Dice2,
  Dice3,
  Dice4,
  Dice5,
  Dice6,
  Plus,
  Minus,
  RotateCcw,
  Sparkles,
  Send,
  Zap,
  ShieldAlert,
  Crown
} from "lucide-react";
import { rollDnDCheck, rollOrdemAttribute, parseAndRollFormula } from "../utils/diceEngine";
import { rpgAudio } from "../utils/audioSynth";

interface DiceRollerDrawerProps {
  system: RPGSystem;
  characterName: string;
  onSendRoll: (roll: RollResult) => void;
  onClose?: () => void;
}

export const DiceRollerDrawer: React.FC<DiceRollerDrawerProps> = ({
  system,
  characterName,
  onSendRoll,
  onClose,
}) => {
  const [selectedDice, setSelectedDice] = useState<Record<number, number>>({
    4: 0,
    6: 0,
    8: 0,
    10: 0,
    12: 0,
    20: 0,
    100: 0,
  });
  const [modifier, setModifier] = useState<number>(0);
  const [reason, setReason] = useState("");
  const [customFormula, setCustomFormula] = useState("");

  // D&D 5e advantage mode
  const [advantageMode, setAdvantageMode] = useState<"none" | "advantage" | "disadvantage">("none");

  // Ordem Paranormal pool
  const [ordemAttributeValue, setOrdemAttributeValue] = useState<number>(3);
  const [ordemCritThreshold, setOrdemCritThreshold] = useState<number>(20);

  const diceTypes = [4, 6, 8, 10, 12, 20, 100];

  const handleAddDie = (sides: number) => {
    setSelectedDice((prev) => ({ ...prev, [sides]: (prev[sides] || 0) + 1 }));
    rpgAudio.playDiceRoll();
  };

  const handleClearDice = () => {
    setSelectedDice({ 4: 0, 6: 0, 8: 0, 10: 0, 12: 0, 20: 0, 100: 0 });
    setModifier(0);
    setCustomFormula("");
  };

  const handleRollStandard = () => {
    // Build formula from selected dice
    const parts: string[] = [];
    Object.entries(selectedDice).forEach(([sides, count]) => {
      if (count > 0) parts.push(`${count}d${sides}`);
    });

    if (parts.length === 0 && customFormula.trim()) {
      const res = parseAndRollFormula(customFormula, reason || "Rolagem de Dados", characterName, system);
      onSendRoll(res);
      return;
    }

    if (parts.length === 0) {
      // Default to 1d20
      parts.push("1d20");
    }

    let formulaStr = parts.join("+");
    if (modifier > 0) formulaStr += `+${modifier}`;
    if (modifier < 0) formulaStr += `${modifier}`;

    const res = parseAndRollFormula(
      formulaStr,
      reason || (system === "ordem" ? "Teste Paranormal" : "Rolagem de Dados"),
      characterName,
      system
    );
    onSendRoll(res);
  };

  const handleRollDnDCheck = () => {
    const mode = advantageMode === "advantage" ? "adv" : advantageMode === "disadvantage" ? "dis" : "none";
    const res = rollDnDCheck(modifier, mode, reason || "Teste d20 (D&D 5e)", characterName);
    onSendRoll(res);
  };

  const handleRollOrdemPool = () => {
    const res = rollOrdemAttribute(
      ordemAttributeValue,
      modifier,
      reason || `Teste de Atributo (${ordemAttributeValue}d20)`,
      characterName,
      ordemCritThreshold
    );
    onSendRoll(res);
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-2xl space-y-5 text-neutral-100 max-w-md w-full">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
            <Dice5 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-sm text-amber-100">Torre de Dados Virtual</h3>
            <span className="text-[10px] text-neutral-400">Rolagens com Fórmulas e Efeitos Sonoros</span>
          </div>
        </div>

        <button
          onClick={handleClearDice}
          className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          title="Limpar Dados"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* System Specific Quick Launchers */}
      {system === "dnd5e" && (
        <div className="bg-neutral-950 border border-neutral-800 p-3 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-300">D&D 5e d20 Check:</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setAdvantageMode("advantage")}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                  advantageMode === "advantage"
                    ? "bg-emerald-600 text-white shadow"
                    : "bg-neutral-900 text-neutral-400 hover:text-white"
                }`}
              >
                Vantagem
              </button>
              <button
                onClick={() => setAdvantageMode("none")}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                  advantageMode === "none" ? "bg-amber-600 text-white" : "bg-neutral-900 text-neutral-400"
                }`}
              >
                Normal
              </button>
              <button
                onClick={() => setAdvantageMode("disadvantage")}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                  advantageMode === "disadvantage"
                    ? "bg-red-600 text-white shadow"
                    : "bg-neutral-900 text-neutral-400 hover:text-white"
                }`}
              >
                Desvantagem
              </button>
            </div>
          </div>

          <button
            onClick={handleRollDnDCheck}
            className="w-full py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-neutral-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow"
          >
            <Dice5 className="w-4 h-4" />
            Rolar Teste d20 {modifier !== 0 ? `(${modifier >= 0 ? `+${modifier}` : modifier})` : ""}
          </button>
        </div>
      )}

      {system === "ordem" && (
        <div className="bg-neutral-950 border border-purple-900/40 p-3 rounded-2xl space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-purple-300">Pool de Atributo Ordem:</span>
            <div className="flex items-center gap-1.5">
              <span className="text-neutral-400">Dados:</span>
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  onClick={() => setOrdemAttributeValue(num)}
                  className={`w-5 h-5 rounded-md font-bold text-[10px] transition-all ${
                    ordemAttributeValue === num
                      ? "bg-purple-600 text-white shadow"
                      : "bg-neutral-900 text-neutral-400 hover:bg-neutral-800"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-neutral-400">Margem de Ameaça (Crítico):</span>
            <select
              value={ordemCritThreshold}
              onChange={(e) => setOrdemCritThreshold(parseInt(e.target.value, 10))}
              className="bg-neutral-900 border border-neutral-700 text-purple-200 rounded-lg px-2 py-0.5"
            >
              <option value={20}>20 (Padrão)</option>
              <option value={19}>19 (Arma Perigosa)</option>
              <option value={18}>18 (Crítico Alto)</option>
            </select>
          </div>

          <button
            onClick={handleRollOrdemPool}
            className="w-full py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow"
          >
            <Zap className="w-4 h-4" />
            Rolar {ordemAttributeValue}d20 (Maior Resultado)
          </button>
        </div>
      )}

      {/* Polyhedral Dice Palette */}
      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Dados Poliedrais</span>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {diceTypes.map((sides) => {
            const count = selectedDice[sides] || 0;
            return (
              <button
                key={sides}
                onClick={() => handleAddDie(sides)}
                className={`relative flex flex-col items-center justify-center p-2 rounded-2xl border transition-all active:scale-95 ${
                  count > 0
                    ? "bg-amber-500/20 border-amber-500 text-amber-300 shadow"
                    : "bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700 hover:bg-neutral-900"
                }`}
              >
                {count > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-neutral-950 font-bold rounded-full text-[9px] flex items-center justify-center shadow">
                    {count}
                  </span>
                )}
                <span className="text-xs font-bold font-mono">d{sides}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Modifier and Reason Fields */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] text-neutral-400 font-semibold uppercase">Modificador / Bônus</label>
          <div className="flex items-center gap-1 mt-1">
            <button
              onClick={() => setModifier((m) => m - 1)}
              className="p-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-400 hover:text-white"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <input
              type="number"
              value={modifier}
              onChange={(e) => setModifier(parseInt(e.target.value, 10) || 0)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg text-center font-bold text-xs text-amber-300 py-1.5 focus:outline-none"
            />
            <button
              onClick={() => setModifier((m) => m + 1)}
              className="p-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-400 hover:text-white"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div>
          <label className="text-[10px] text-neutral-400 font-semibold uppercase">Fórmula Livre (Ex: 4d6+2)</label>
          <input
            type="text"
            value={customFormula}
            onChange={(e) => setCustomFormula(e.target.value)}
            placeholder="Ex: 2d8+1d6+3"
            className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-100 font-mono focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      <div>
        <label className="text-[10px] text-neutral-400 font-semibold uppercase">Motivo / Nome da Rolagem</label>
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Ex: Ataque com Espada Longa, Teste de Furtividade..."
          className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-100 focus:outline-none focus:border-amber-500"
        />
      </div>

      {/* Main Roll Trigger Button */}
      <button
        onClick={handleRollStandard}
        className="w-full py-3 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-neutral-950 font-bold rounded-2xl text-sm flex items-center justify-center gap-2 shadow-xl transition-all active:scale-98"
      >
        <Dice6 className="w-5 h-5" />
        Rolar Dados Selecionados
      </button>
    </div>
  );
};
