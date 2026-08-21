import React, { useState } from "react";
import { OrdemCharacter } from "../types";
import {
  Shield,
  Heart,
  Zap,
  Sword,
  Sparkles,
  BookOpen,
  Plus,
  Trash2,
  Dice5,
  Eye,
  Crosshair,
  Package,
  Activity,
  Flame,
  Radio,
  Skull,
  Printer
} from "lucide-react";
import { rollOrdemAttribute, parseAndRollFormula } from "../utils/diceEngine";
import { rpgAudio } from "../utils/audioSynth";

interface CharacterSheetOrdemProps {
  character: OrdemCharacter;
  onUpdate: (char: OrdemCharacter) => void;
  onSendRollToChat?: (rollResult: any) => void;
}

export const CharacterSheetOrdem: React.FC<CharacterSheetOrdemProps> = ({
  character,
  onUpdate,
  onSendRollToChat,
}) => {
  const [activeTab, setActiveTab] = useState<"stats" | "attacks" | "rituals" | "inventory" | "abilities">("stats");

  // Element color map
  const elementColors: Record<string, { border: string; bg: string; text: string }> = {
    Sangue: { border: "border-red-600", bg: "bg-red-950/60", text: "text-red-400" },
    Morte: { border: "border-neutral-700", bg: "bg-neutral-900", text: "text-neutral-400" },
    Conhecimento: { border: "border-amber-500", bg: "bg-amber-950/60", text: "text-amber-400" },
    Energia: { border: "border-purple-600", bg: "bg-purple-950/60", text: "text-purple-400" },
    Medo: { border: "border-teal-500", bg: "bg-teal-950/60", text: "text-teal-400" },
  };

  const handleRollAttribute = (attrName: string, attrKey: keyof OrdemCharacter["attributes"]) => {
    const attrVal = character.attributes[attrKey];
    const res = rollOrdemAttribute(attrVal, 0, `Teste de Atributo: ${attrName.toUpperCase()}`, character.name);
    if (onSendRollToChat) onSendRollToChat(res);
  };

  const handleRollSkill = (skillName: string, skillData: OrdemCharacter["skills"][string]) => {
    const attrVal = character.attributes[skillData.attribute];
    const trainingBonus = skillData.bonus || 0;
    const res = rollOrdemAttribute(
      attrVal,
      trainingBonus,
      `Perícia: ${skillName} (${skillData.attribute.toUpperCase()})`,
      character.name
    );
    if (onSendRollToChat) onSendRollToChat(res);
  };

  const handleRollAttack = (weapon: OrdemCharacter["weapons"][0]) => {
    rpgAudio.playSwordHit();
    // Default to AGI or FOR
    const isRanged = weapon.range && weapon.range !== "Toque" && weapon.range !== "Corpo a corpo";
    const attrKey = isRanged ? "agi" : "for";
    const attrVal = character.attributes[attrKey];

    const hitRoll = rollOrdemAttribute(
      attrVal,
      5,
      `Ataque: ${weapon.name}`,
      character.name,
      weapon.critical?.includes("19") ? 19 : 20
    );
    if (onSendRollToChat) onSendRollToChat(hitRoll);

    // Roll damage formula
    setTimeout(() => {
      const dmgRoll = parseAndRollFormula(weapon.damage, `Dano: ${weapon.name} (${weapon.type})`, character.name, "ordem");
      if (onSendRollToChat) onSendRollToChat(dmgRoll);
    }, 400);
  };

  const handleCastRitual = (ritual: OrdemCharacter["rituals"][0]) => {
    rpgAudio.playMagicSpell();
    // Spend PE
    if (character.pe.current >= ritual.costPe) {
      onUpdate({
        ...character,
        pe: { ...character.pe, current: character.pe.current - ritual.costPe },
      });
    }

    const ocuAttr = character.attributes.int || 2;
    const rollRes = rollOrdemAttribute(
      ocuAttr,
      5,
      `Conjurou Ritual de ${ritual.element}: ${ritual.name} (${ritual.costPe} PE)`,
      character.name
    );
    if (onSendRollToChat) onSendRollToChat(rollRes);
  };

  // Standard Ordem Paranormal skills map
  const defaultSkills: Record<string, { attribute: "agi" | "for" | "int" | "pre" | "vig"; training: "none" | "treinado" | "veterano" | "expert"; bonus: number }> = {
    "Acrobacia": { attribute: "agi", training: "treinado", bonus: 5 },
    "Adestramento": { attribute: "pre", training: "none", bonus: 0 },
    "Artes": { attribute: "pre", training: "none", bonus: 0 },
    "Atletismo": { attribute: "for", training: "treinado", bonus: 5 },
    "Atualidades": { attribute: "int", training: "none", bonus: 0 },
    "Ciências": { attribute: "int", training: "none", bonus: 0 },
    "Crime": { attribute: "agi", training: "none", bonus: 0 },
    "Diplomacia": { attribute: "pre", training: "none", bonus: 0 },
    "Enganação": { attribute: "pre", training: "none", bonus: 0 },
    "Fortitude": { attribute: "vig", training: "treinado", bonus: 5 },
    "Furtividade": { attribute: "agi", training: "treinado", bonus: 5 },
    "Iniciativa": { attribute: "agi", training: "treinado", bonus: 5 },
    "Intimidação": { attribute: "pre", training: "none", bonus: 0 },
    "Intuição": { attribute: "pre", training: "none", bonus: 0 },
    "Investigação": { attribute: "int", training: "veterano", bonus: 10 },
    "Luta": { attribute: "for", training: "treinado", bonus: 5 },
    "Medicina": { attribute: "int", training: "none", bonus: 0 },
    "Ocultismo": { attribute: "int", training: "veterano", bonus: 10 },
    "Percepção": { attribute: "pre", training: "treinado", bonus: 5 },
    "Pilotagem": { attribute: "agi", training: "none", bonus: 0 },
    "Pontaria": { attribute: "agi", training: "treinado", bonus: 5 },
    "Profissão": { attribute: "int", training: "none", bonus: 0 },
    "Reflexos": { attribute: "agi", training: "treinado", bonus: 5 },
    "Religião": { attribute: "pre", training: "none", bonus: 0 },
    "Sobrevivência": { attribute: "int", training: "none", bonus: 0 },
    "Tática": { attribute: "int", training: "none", bonus: 0 },
    "Tecnologia": { attribute: "int", training: "treinado", bonus: 5 },
    "Vontade": { attribute: "pre", training: "treinado", bonus: 5 },
  };

  const skillsToRender = character.skills && Object.keys(character.skills).length > 0 ? character.skills : defaultSkills;

  // Calculate current inventory spaces
  const currentSpaces = character.inventory.reduce((acc, it) => acc + (it.spaces || 1), 0);
  const maxSpaces = 5 + (character.attributes.for || 1) * 2;

  return (
    <div className="w-full h-full bg-neutral-950 overflow-y-auto p-4 md:p-6 space-y-6 text-neutral-100 font-sans">
      {/* Ordem Paranormal Header Card */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Print Button for Physical Tabletop Gaming */}
        <div className="absolute top-4 right-4 z-20">
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 bg-neutral-950/80 hover:bg-neutral-800 border border-neutral-700/80 rounded-xl text-xs font-bold text-neutral-300 flex items-center gap-1.5 shadow transition-all"
            title="Imprimir ficha para jogar na mesa presencial"
          >
            <Printer className="w-3.5 h-3.5 text-purple-400" />
            <span>Imprimir Ficha A4</span>
          </button>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
          <div className="relative">
            <div className="w-28 h-28 rounded-2xl overflow-hidden border-2 border-purple-500/60 shadow-xl">
              <img
                src={character.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80"}
                alt={character.name}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="absolute -bottom-2 -right-2 px-2.5 py-0.5 bg-purple-900 border border-purple-500 rounded-full text-[10px] font-bold text-purple-200 shadow">
              {character.nex}% NEX
            </span>
          </div>

          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
            <div>
              <label className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">Agente / Nome</label>
              <input
                type="text"
                value={character.name}
                onChange={(e) => onUpdate({ ...character, name: e.target.value })}
                className="w-full bg-transparent font-serif font-bold text-lg text-amber-200 border-b border-neutral-800 focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">Classe & Trilha</label>
              <input
                type="text"
                value={`${character.classType} / ${character.track || "Lâmina Paranormal"}`}
                onChange={(e) => {
                  const parts = e.target.value.split("/");
                  onUpdate({ ...character, classType: (parts[0]?.trim() as any) || "Ocultista", track: parts[1]?.trim() || "" });
                }}
                className="w-full bg-transparent text-sm text-neutral-200 border-b border-neutral-800 focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">Patente & Origem</label>
              <input
                type="text"
                value={`${character.rank} / ${character.origin}`}
                onChange={(e) => {
                  const parts = e.target.value.split("/");
                  onUpdate({ ...character, rank: (parts[0]?.trim() as any) || "Operador", origin: parts[1]?.trim() || "" });
                }}
                className="w-full bg-transparent text-sm text-neutral-200 border-b border-neutral-800 focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">Afinidade Elemental</label>
              <select
                value={character.elementAffinity || "Nenhuma"}
                onChange={(e) => onUpdate({ ...character, elementAffinity: e.target.value as any })}
                className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-1 text-xs text-purple-300 font-semibold focus:outline-none focus:border-purple-500"
              >
                <option value="Nenhuma">Nenhuma</option>
                <option value="Sangue">Sangue (Sentimento/Corpo)</option>
                <option value="Morte">Morte (Tempo/Lodo)</option>
                <option value="Conhecimento">Conhecimento (Ordem/Razão)</option>
                <option value="Energia">Energia (Caos/Transformação)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Ordem Paranormal 3 Vitals Bars: PV, SAN, PE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* PV (Pontos de Vida) */}
        <div className="bg-neutral-900 border border-red-900/60 p-4 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-1.5 text-xs font-bold text-red-400 uppercase tracking-wider">
              <Heart className="w-4 h-4 text-red-500" />
              Pontos de Vida (PV)
            </span>
            <span className="text-xs font-mono text-red-300">
              {Math.round((character.pv.current / character.pv.max) * 100)}%
            </span>
          </div>

          <div className="w-full bg-neutral-950 rounded-full h-3 mb-3 overflow-hidden border border-red-900/40">
            <div
              className="h-full bg-gradient-to-r from-red-700 to-red-500 transition-all duration-300"
              style={{ width: `${Math.max(0, Math.min(100, (character.pv.current / character.pv.max) * 100))}%` }}
            />
          </div>

          <div className="flex items-center justify-center gap-2">
            <input
              type="number"
              value={character.pv.current}
              onChange={(e) =>
                onUpdate({
                  ...character,
                  pv: { ...character.pv, current: parseInt(e.target.value, 10) || 0 },
                })
              }
              className="w-16 bg-neutral-950 border border-neutral-700 rounded-lg text-center font-bold text-lg text-red-300 focus:outline-none"
            />
            <span className="text-neutral-500">/</span>
            <input
              type="number"
              value={character.pv.max}
              onChange={(e) =>
                onUpdate({
                  ...character,
                  pv: { ...character.pv, max: parseInt(e.target.value, 10) || 1 },
                })
              }
              className="w-16 bg-neutral-950 border border-neutral-700 rounded-lg text-center font-bold text-lg text-neutral-400 focus:outline-none"
            />
          </div>
        </div>

        {/* SAN (Sanidade) */}
        <div className="bg-neutral-900 border border-purple-900/60 p-4 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-1.5 text-xs font-bold text-purple-400 uppercase tracking-wider">
              <Eye className="w-4 h-4 text-purple-400" />
              Sanidade (PS)
            </span>
            <span className="text-xs font-mono text-purple-300">
              {Math.round((character.san.current / character.san.max) * 100)}%
            </span>
          </div>

          <div className="w-full bg-neutral-950 rounded-full h-3 mb-3 overflow-hidden border border-purple-900/40">
            <div
              className="h-full bg-gradient-to-r from-purple-800 to-purple-500 transition-all duration-300"
              style={{ width: `${Math.max(0, Math.min(100, (character.san.current / character.san.max) * 100))}%` }}
            />
          </div>

          <div className="flex items-center justify-center gap-2">
            <input
              type="number"
              value={character.san.current}
              onChange={(e) =>
                onUpdate({
                  ...character,
                  san: { ...character.san, current: parseInt(e.target.value, 10) || 0 },
                })
              }
              className="w-16 bg-neutral-950 border border-neutral-700 rounded-lg text-center font-bold text-lg text-purple-300 focus:outline-none"
            />
            <span className="text-neutral-500">/</span>
            <input
              type="number"
              value={character.san.max}
              onChange={(e) =>
                onUpdate({
                  ...character,
                  san: { ...character.san, max: parseInt(e.target.value, 10) || 1 },
                })
              }
              className="w-16 bg-neutral-950 border border-neutral-700 rounded-lg text-center font-bold text-lg text-neutral-400 focus:outline-none"
            />
          </div>
        </div>

        {/* PE (Pontos de Esforço) */}
        <div className="bg-neutral-900 border border-amber-900/60 p-4 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
              <Zap className="w-4 h-4 text-amber-400" />
              Pontos de Esforço (PE)
            </span>
            <span className="text-xs font-mono text-amber-300">
              {Math.round((character.pe.current / character.pe.max) * 100)}%
            </span>
          </div>

          <div className="w-full bg-neutral-950 rounded-full h-3 mb-3 overflow-hidden border border-amber-900/40">
            <div
              className="h-full bg-gradient-to-r from-amber-700 to-amber-500 transition-all duration-300"
              style={{ width: `${Math.max(0, Math.min(100, (character.pe.current / character.pe.max) * 100))}%` }}
            />
          </div>

          <div className="flex items-center justify-center gap-2">
            <input
              type="number"
              value={character.pe.current}
              onChange={(e) =>
                onUpdate({
                  ...character,
                  pe: { ...character.pe, current: parseInt(e.target.value, 10) || 0 },
                })
              }
              className="w-16 bg-neutral-950 border border-neutral-700 rounded-lg text-center font-bold text-lg text-amber-300 focus:outline-none"
            />
            <span className="text-neutral-500">/</span>
            <input
              type="number"
              value={character.pe.max}
              onChange={(e) =>
                onUpdate({
                  ...character,
                  pe: { ...character.pe, max: parseInt(e.target.value, 10) || 1 },
                })
              }
              className="w-16 bg-neutral-950 border border-neutral-700 rounded-lg text-center font-bold text-lg text-neutral-400 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Ordem Paranormal 5 Attributes (AGI, FOR, INT, PRE, VIG) */}
      <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-3xl shadow-xl">
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">
          Atributos de Ordem Paranormal (Clique para Rolar d20s)
        </h3>
        <div className="grid grid-cols-5 gap-3">
          {[
            { key: "agi", label: "Agilidade", sub: "AGI", color: "text-emerald-400" },
            { key: "for", label: "Força", sub: "FOR", color: "text-red-400" },
            { key: "int", label: "Intelecto", sub: "INT", color: "text-blue-400" },
            { key: "pre", label: "Presença", sub: "PRE", color: "text-amber-400" },
            { key: "vig", label: "Vigor", sub: "VIG", color: "text-orange-400" },
          ].map((attr) => {
            const val = character.attributes[attr.key as keyof OrdemCharacter["attributes"]];
            return (
              <div
                key={attr.key}
                className="bg-neutral-950 border border-neutral-800 p-3 rounded-2xl flex flex-col items-center justify-center hover:border-purple-500/60 transition-colors group"
              >
                <span className="text-[10px] uppercase font-bold text-neutral-400">{attr.sub}</span>
                <button
                  onClick={() => handleRollAttribute(attr.label, attr.key as any)}
                  className={`font-serif font-extrabold text-3xl ${attr.color} hover:scale-110 flex items-center gap-1 my-1 transition-transform`}
                  title={`Rolar ${val}d20 no atributo ${attr.label}`}
                >
                  {val}
                  <Dice5 className="w-4 h-4 opacity-50 group-hover:opacity-100" />
                </button>
                <span className="text-[10px] text-neutral-500 font-medium">{val}d20</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-800 gap-2">
        {[
          { id: "stats", label: "Perícias & Defesas", icon: Shield },
          { id: "attacks", label: "Armas & Ataques", icon: Sword },
          { id: "rituals", label: "Rituais Paranormais", icon: Sparkles },
          { id: "inventory", label: `Inventário (${currentSpaces}/${maxSpaces} Espaços)`, icon: Package },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 font-semibold text-xs md:text-sm border-b-2 transition-all ${
                activeTab === tab.id
                  ? "border-purple-500 text-purple-300 bg-purple-500/10 rounded-t-xl"
                  : "border-transparent text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: Skills & Defenses */}
      {activeTab === "stats" && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3 bg-neutral-900 border border-neutral-800 p-4 rounded-2xl">
            <div className="text-center">
              <div className="text-xs text-neutral-400 uppercase font-semibold">Defesa</div>
              <div className="text-2xl font-bold text-blue-300">{character.defense || 14}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-neutral-400 uppercase font-semibold">Esquiva</div>
              <div className="text-2xl font-bold text-emerald-300">{character.dodge || 19}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-neutral-400 uppercase font-semibold">Bloqueio</div>
              <div className="text-2xl font-bold text-amber-300">{character.block || 5} RD</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 bg-neutral-900 border border-neutral-800 p-4 rounded-2xl">
            {Object.entries(skillsToRender).map(([sName, sData]) => (
              <div
                key={sName}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-neutral-950 border border-transparent hover:border-neutral-800 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-neutral-200">{sName}</span>
                  <span className="text-[10px] text-neutral-500 uppercase">({sData.attribute})</span>
                </div>

                <button
                  onClick={() => handleRollSkill(sName, sData)}
                  className="px-2 py-1 bg-neutral-950 hover:bg-purple-600 hover:text-white border border-neutral-700 text-purple-300 rounded-lg text-xs font-mono font-bold transition-colors flex items-center gap-1"
                >
                  +{sData.bonus}
                  <Dice5 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Weapons */}
      {activeTab === "attacks" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Armas e Ataques</h3>
            <button
              onClick={() => {
                const newWeapon: OrdemCharacter["weapons"][0] = {
                  id: `wp-${Date.now()}`,
                  name: "Pistola Automática",
                  type: "Balístico",
                  damage: "2d6",
                  critical: "19/x3",
                  range: "Médio",
                  category: "I",
                  spaces: 1,
                };
                onUpdate({ ...character, weapons: [...character.weapons, newWeapon] });
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 rounded-xl text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              Adicionar Arma
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {character.weapons.map((w) => (
              <div
                key={w.id}
                className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl shadow space-y-2 group hover:border-neutral-700"
              >
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={w.name}
                    onChange={(e) =>
                      onUpdate({
                        ...character,
                        weapons: character.weapons.map((item) =>
                          item.id === w.id ? { ...item, name: e.target.value } : item
                        ),
                      })
                    }
                    className="bg-transparent font-bold text-sm text-neutral-100 focus:outline-none"
                  />
                  <span className="text-[10px] px-2 py-0.5 bg-neutral-950 border border-neutral-800 rounded-md text-neutral-400">
                    Cat. {w.category} ({w.spaces} esp)
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-neutral-400">
                  <span>Dano: <strong className="text-red-300">{w.damage}</strong></span>
                  <span>Crítico: <strong className="text-purple-300">{w.critical}</strong></span>
                  <span>Alcance: {w.range}</span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
                  <button
                    onClick={() => handleRollAttack(w)}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow"
                  >
                    <Sword className="w-3.5 h-3.5" />
                    Atacar
                  </button>
                  <button
                    onClick={() =>
                      onUpdate({
                        ...character,
                        weapons: character.weapons.filter((item) => item.id !== w.id),
                      })
                    }
                    className="p-1.5 text-neutral-500 hover:text-red-400 rounded-lg hover:bg-neutral-950"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Rituals */}
      {activeTab === "rituals" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Grimório de Rituais Paranormais</h3>
            <button
              onClick={() => {
                const newRit: OrdemCharacter["rituals"][0] = {
                  id: `rit-${Date.now()}`,
                  name: "Decadência",
                  element: "Morte",
                  circle: 1,
                  costPe: 1,
                  castTime: "Padrão",
                  range: "Toque",
                  target: "1 ser",
                  duration: "Instantânea",
                  resistence: "Fortitude reduz à metade",
                  description: "Você infunde o alvo com energia de Morte, acelerando seu envelhecimento celular. Causa 2d8+2 de dano de Morte.",
                };
                onUpdate({ ...character, rituals: [...character.rituals, newRit] });
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 rounded-xl text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              Novo Ritual
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {character.rituals.map((rit) => {
              const elemStyle = elementColors[rit.element] || elementColors.Morte;
              return (
                <div
                  key={rit.id}
                  className={`bg-neutral-900 border ${elemStyle.border} p-4 rounded-2xl space-y-2.5 shadow-xl`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${elemStyle.border} ${elemStyle.bg} ${elemStyle.text}`}>
                        {rit.element} • {rit.circle}º Círculo
                      </span>
                      <input
                        type="text"
                        value={rit.name}
                        onChange={(e) =>
                          onUpdate({
                            ...character,
                            rituals: character.rituals.map((r) =>
                              r.id === rit.id ? { ...r, name: e.target.value } : r
                            ),
                          })
                        }
                        className="bg-transparent font-bold text-sm text-neutral-100 focus:outline-none"
                      />
                    </div>

                    <span className="text-xs font-bold text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded-lg">
                      {rit.costPe} PE
                    </span>
                  </div>

                  <p className="text-xs text-neutral-300 leading-relaxed">{rit.description}</p>

                  <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
                    <span className="text-[10px] text-neutral-500">Alcance: {rit.range} • Execução: {rit.castTime}</span>
                    <button
                      onClick={() => handleCastRitual(rit)}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Conjurar ({rit.costPe} PE)
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: Inventory */}
      {activeTab === "inventory" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-neutral-900 border border-neutral-800 p-4 rounded-2xl">
            <div>
              <div className="text-xs font-bold text-neutral-400 uppercase">Capacidade de Carga</div>
              <div className="text-sm text-neutral-200 mt-0.5">
                <strong className={currentSpaces > maxSpaces ? "text-red-400" : "text-emerald-400"}>
                  {currentSpaces}
                </strong>{" "}
                / {maxSpaces} Espaços Utilizados
              </div>
            </div>
            <button
              onClick={() => {
                const newItem: OrdemCharacter["inventory"][0] = {
                  id: `item-${Date.now()}`,
                  name: "Novo Item / Acessório",
                  category: "I",
                  spaces: 1,
                  details: "Descrição e utilidade do item",
                };
                onUpdate({ ...character, inventory: [...character.inventory, newItem] });
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              Adicionar Item
            </button>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl divide-y divide-neutral-800">
            {character.inventory.map((it) => (
              <div key={it.id} className="p-3.5 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-neutral-100">{it.name}</div>
                  <div className="text-[10px] text-neutral-500">{it.details}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 bg-neutral-950 text-neutral-400 rounded border border-neutral-800 text-[10px]">
                    Cat. {it.category} ({it.spaces} esp)
                  </span>
                  <button
                    onClick={() =>
                      onUpdate({
                        ...character,
                        inventory: character.inventory.filter((item) => item.id !== it.id),
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
      )}
    </div>
  );
};
