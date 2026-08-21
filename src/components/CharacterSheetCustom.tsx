import React, { useState } from "react";
import { CustomCharacter } from "../types";
import { Plus, Trash2, Dice5, Sparkles, Heart, Package, Edit3 } from "lucide-react";
import { parseAndRollFormula } from "../utils/diceEngine";

interface CharacterSheetCustomProps {
  character: CustomCharacter;
  onUpdate: (char: CustomCharacter) => void;
  onSendRollToChat?: (rollResult: any) => void;
}

export const CharacterSheetCustom: React.FC<CharacterSheetCustomProps> = ({
  character,
  onUpdate,
  onSendRollToChat,
}) => {
  const handleRollCustom = (formula: string, reason: string) => {
    const res = parseAndRollFormula(formula, reason, character.name, "custom");
    if (onSendRollToChat) onSendRollToChat(res);
  };

  const handleAddBar = () => {
    const newBar = {
      id: `bar-${Date.now()}`,
      name: "Novo Recurso (Ex: Mana / Estamina)",
      current: 20,
      max: 20,
      color: "bg-blue-600",
    };
    onUpdate({ ...character, bars: [...character.bars, newBar] });
  };

  const handleAddAttribute = () => {
    const newAttr = {
      id: `attr-${Date.now()}`,
      name: "Novo Atributo",
      value: 10,
      modifier: "+0",
    };
    onUpdate({ ...character, attributes: [...character.attributes, newAttr] });
  };

  const handleAddSkill = () => {
    const newSkill = {
      id: `skill-${Date.now()}`,
      name: "Nova Perícia",
      value: 5,
      formula: "1d20+5",
    };
    onUpdate({ ...character, skills: [...character.skills, newSkill] });
  };

  return (
    <div className="w-full h-full bg-neutral-950 overflow-y-auto p-4 md:p-6 space-y-6 text-neutral-100">
      {/* Header Info */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-center gap-6">
        <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-amber-500/50 shadow-md">
          <img
            src={character.avatar || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80"}
            alt={character.name}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
          <div>
            <label className="text-[10px] text-neutral-400 font-semibold uppercase">Nome do Personagem</label>
            <input
              type="text"
              value={character.name}
              onChange={(e) => onUpdate({ ...character, name: e.target.value })}
              className="w-full bg-transparent font-serif font-bold text-lg text-amber-200 border-b border-neutral-800 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] text-neutral-400 font-semibold uppercase">Sistema / Cenário</label>
            <input
              type="text"
              value={character.systemName}
              onChange={(e) => onUpdate({ ...character, systemName: e.target.value })}
              className="w-full bg-transparent text-sm text-neutral-200 border-b border-neutral-800 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] text-neutral-400 font-semibold uppercase">Conceito / Arquétipo</label>
            <input
              type="text"
              value={character.concept}
              onChange={(e) => onUpdate({ ...character, concept: e.target.value })}
              className="w-full bg-transparent text-sm text-neutral-200 border-b border-neutral-800 focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Dynamic Resource Bars (PV, Mana, Estamina, etc.) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Barras de Recursos Vitais</h3>
          <button
            onClick={handleAddBar}
            className="flex items-center gap-1 px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            Nova Barra
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {character.bars.map((bar) => (
            <div key={bar.id} className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <input
                  type="text"
                  value={bar.name}
                  onChange={(e) =>
                    onUpdate({
                      ...character,
                      bars: character.bars.map((b) => (b.id === bar.id ? { ...b, name: e.target.value } : b)),
                    })
                  }
                  className="bg-transparent text-xs font-bold text-neutral-200 focus:outline-none"
                />
                <button
                  onClick={() =>
                    onUpdate({
                      ...character,
                      bars: character.bars.filter((b) => b.id !== bar.id),
                    })
                  }
                  className="text-neutral-500 hover:text-red-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="w-full bg-neutral-950 rounded-full h-2 overflow-hidden border border-neutral-800">
                <div
                  className={`h-full ${bar.color || "bg-amber-500"} transition-all`}
                  style={{ width: `${Math.max(0, Math.min(100, (bar.current / Math.max(1, bar.max)) * 100))}%` }}
                />
              </div>

              <div className="flex items-center justify-center gap-2">
                <input
                  type="number"
                  value={bar.current}
                  onChange={(e) =>
                    onUpdate({
                      ...character,
                      bars: character.bars.map((b) =>
                        b.id === bar.id ? { ...b, current: parseInt(e.target.value, 10) || 0 } : b
                      ),
                    })
                  }
                  className="w-14 bg-neutral-950 border border-neutral-700 rounded-lg text-center font-bold text-sm text-neutral-200 focus:outline-none"
                />
                <span className="text-neutral-500">/</span>
                <input
                  type="number"
                  value={bar.max}
                  onChange={(e) =>
                    onUpdate({
                      ...character,
                      bars: character.bars.map((b) =>
                        b.id === bar.id ? { ...b, max: parseInt(e.target.value, 10) || 1 } : b
                      ),
                    })
                  }
                  className="w-14 bg-neutral-950 border border-neutral-700 rounded-lg text-center font-bold text-sm text-neutral-400 focus:outline-none"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dynamic Attributes Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Atributos Customizáveis</h3>
          <button
            onClick={handleAddAttribute}
            className="flex items-center gap-1 px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar Atributo
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {character.attributes.map((attr) => (
            <div
              key={attr.id}
              className="bg-neutral-900 border border-neutral-800 p-3 rounded-2xl flex flex-col items-center justify-center relative group"
            >
              <input
                type="text"
                value={attr.name}
                onChange={(e) =>
                  onUpdate({
                    ...character,
                    attributes: character.attributes.map((a) =>
                      a.id === attr.id ? { ...a, name: e.target.value } : a
                    ),
                  })
                }
                className="w-full text-center bg-transparent text-[10px] uppercase font-bold text-neutral-400 focus:outline-none"
              />

              <button
                onClick={() => handleRollCustom(`1d20+${attr.value}`, `Teste de ${attr.name}`)}
                className="font-serif font-bold text-2xl text-amber-200 hover:text-amber-400 flex items-center gap-1 my-1"
                title="Rolar 1d20 + Atributo"
              >
                {attr.value}
                <Dice5 className="w-3.5 h-3.5 text-amber-500" />
              </button>

              <button
                onClick={() =>
                  onUpdate({
                    ...character,
                    attributes: character.attributes.filter((a) => a.id !== attr.id),
                  })
                }
                className="absolute top-1 right-1 text-neutral-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Dynamic Skills & Freeform Formulas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Perícias & Fórmulas Livres</h3>
          <button
            onClick={handleAddSkill}
            className="flex items-center gap-1 px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            Nova Perícia
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {character.skills.map((sk) => (
            <div
              key={sk.id}
              className="bg-neutral-900 border border-neutral-800 p-3 rounded-2xl flex items-center justify-between"
            >
              <div className="space-y-0.5">
                <input
                  type="text"
                  value={sk.name}
                  onChange={(e) =>
                    onUpdate({
                      ...character,
                      skills: character.skills.map((s) => (s.id === sk.id ? { ...s, name: e.target.value } : s)),
                    })
                  }
                  className="bg-transparent font-bold text-xs text-neutral-100 focus:outline-none"
                />
                <input
                  type="text"
                  value={sk.formula || "1d20+5"}
                  onChange={(e) =>
                    onUpdate({
                      ...character,
                      skills: character.skills.map((s) => (s.id === sk.id ? { ...s, formula: e.target.value } : s)),
                    })
                  }
                  className="bg-transparent font-mono text-[10px] text-neutral-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleRollCustom(sk.formula || "1d20+5", sk.name)}
                  className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl text-xs flex items-center gap-1 shadow"
                >
                  <Dice5 className="w-3.5 h-3.5" />
                  Rolar
                </button>
                <button
                  onClick={() =>
                    onUpdate({
                      ...character,
                      skills: character.skills.filter((s) => s.id !== sk.id),
                    })
                  }
                  className="p-1 text-neutral-500 hover:text-red-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
