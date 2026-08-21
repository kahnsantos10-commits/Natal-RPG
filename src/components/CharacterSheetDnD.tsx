import React, { useState } from "react";
import { DnDCharacter } from "../types";
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
  Coins,
  Activity,
  Flame,
  Award,
  Printer
} from "lucide-react";
import { rollDnDCheck, parseAndRollFormula } from "../utils/diceEngine";
import { rpgAudio } from "../utils/audioSynth";

interface CharacterSheetDnDProps {
  character: DnDCharacter;
  onUpdate: (char: DnDCharacter) => void;
  onSendRollToChat?: (rollResult: any) => void;
}

export const CharacterSheetDnD: React.FC<CharacterSheetDnDProps> = ({
  character,
  onUpdate,
  onSendRollToChat,
}) => {
  const [activeTab, setActiveTab] = useState<"stats" | "attacks" | "spells" | "inventory" | "features">("stats");

  // Helper for D&D ability modifier: (stat - 10) / 2 rounded down
  const getMod = (val: number) => {
    const mod = Math.floor((val - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  const getModNum = (val: number) => Math.floor((val - 10) / 2);

  const handleRollStat = (statName: string, statVal: number) => {
    const modNum = getModNum(statVal);
    const result = rollDnDCheck(modNum, "none", `Teste de ${statName.toUpperCase()}`, character.name);
    if (onSendRollToChat) onSendRollToChat(result);
  };

  const handleRollSkill = (skillName: string, abilityKey: keyof DnDCharacter["stats"]) => {
    const baseMod = getModNum(character.stats[abilityKey]);
    const profType = character.proficiencies.skills[skillName] || "none";
    let totalMod = baseMod;
    if (profType === "proficient") totalMod += character.proficiencyBonus;
    if (profType === "expertise") totalMod += character.proficiencyBonus * 2;

    const result = rollDnDCheck(totalMod, "none", `Perícia: ${skillName}`, character.name);
    if (onSendRollToChat) onSendRollToChat(result);
  };

  const handleRollAttack = (atk: DnDCharacter["attacks"][0]) => {
    rpgAudio.playSwordHit();
    const hitBonus = parseInt(atk.bonus.replace("+", ""), 10) || 0;
    const hitRoll = rollDnDCheck(hitBonus, "none", `Ataque: ${atk.name}`, character.name);
    if (onSendRollToChat) onSendRollToChat(hitRoll);

    // Prompt damage roll
    setTimeout(() => {
      const dmgRoll = parseAndRollFormula(atk.damage, `Dano: ${atk.name} (${atk.type})`, character.name, "dnd5e");
      if (onSendRollToChat) onSendRollToChat(dmgRoll);
    }, 400);
  };

  // Skill list with associated ability
  const skillList: { name: string; attr: keyof DnDCharacter["stats"] }[] = [
    { name: "Acrobacia", attr: "dex" },
    { name: "Arcanismo", attr: "int" },
    { name: "Atletismo", attr: "str" },
    { name: "Atuação", attr: "cha" },
    { name: "Enganação", attr: "cha" },
    { name: "Furtividade", attr: "dex" },
    { name: "História", attr: "int" },
    { name: "Intimidação", attr: "cha" },
    { name: "Intuição", attr: "wis" },
    { name: "Investigação", attr: "int" },
    { name: "Lidar com Animais", attr: "wis" },
    { name: "Medicina", attr: "wis" },
    { name: "Natureza", attr: "int" },
    { name: "Percepção", attr: "wis" },
    { name: "Persuasão", attr: "cha" },
    { name: "Prestidigitação", attr: "dex" },
    { name: "Religião", attr: "int" },
    { name: "Sobrevivência", attr: "wis" },
  ];

  return (
    <div className="w-full h-full bg-neutral-900 overflow-y-auto p-4 md:p-6 space-y-6 text-neutral-100 relative">
      {/* Print Button for Physical Tabletop Gaming */}
      <div className="flex justify-end">
        <button
          onClick={() => window.print()}
          className="px-3.5 py-1.5 bg-neutral-950 hover:bg-neutral-800 border border-neutral-700/80 rounded-xl text-xs font-bold text-neutral-300 flex items-center gap-1.5 shadow transition-all"
          title="Imprimir ficha A4 para jogar na mesa presencial"
        >
          <Printer className="w-3.5 h-3.5 text-amber-400" />
          <span>Imprimir Ficha D&D 5e</span>
        </button>
      </div>

      {/* Header Info Block */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-center gap-6">
        <div className="relative group">
          <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-amber-500/50 shadow-lg">
            <img
              src={character.avatar || "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=300&auto=format&fit=crop&q=80"}
              alt={character.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
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
            <label className="text-[10px] text-neutral-400 font-semibold uppercase">Classe & Nível</label>
            <input
              type="text"
              value={character.classAndLevel}
              onChange={(e) => onUpdate({ ...character, classAndLevel: e.target.value })}
              className="w-full bg-transparent text-sm text-neutral-200 border-b border-neutral-800 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] text-neutral-400 font-semibold uppercase">Raça & Antecedente</label>
            <input
              type="text"
              value={`${character.race} / ${character.background}`}
              onChange={(e) => {
                const parts = e.target.value.split("/");
                onUpdate({ ...character, race: parts[0]?.trim() || "", background: parts[1]?.trim() || "" });
              }}
              className="w-full bg-transparent text-sm text-neutral-200 border-b border-neutral-800 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] text-neutral-400 font-semibold uppercase">Tendência & Inspiração</label>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="text"
                value={character.alignment}
                onChange={(e) => onUpdate({ ...character, alignment: e.target.value })}
                className="w-full bg-transparent text-sm text-neutral-200 border-b border-neutral-800 focus:border-amber-500 focus:outline-none"
              />
              <button
                onClick={() => onUpdate({ ...character, inspiration: !character.inspiration })}
                className={`p-1.5 rounded-lg border text-xs font-bold transition-all ${
                  character.inspiration ? "bg-amber-500 text-neutral-950 border-amber-400 shadow" : "bg-neutral-900 border-neutral-700 text-neutral-500"
                }`}
                title="Inspiração do Mestre"
              >
                <Award className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Combat Vital Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
        <div className="bg-neutral-950 border border-neutral-800 p-3.5 rounded-2xl flex flex-col items-center justify-center text-center shadow">
          <div className="flex items-center gap-1 text-xs text-neutral-400 uppercase font-semibold">
            <Shield className="w-3.5 h-3.5 text-blue-400" />
            Classe de Armadura
          </div>
          <input
            type="number"
            value={character.ac}
            onChange={(e) => onUpdate({ ...character, ac: parseInt(e.target.value, 10) || 10 })}
            className="w-16 text-center font-bold text-2xl text-blue-200 bg-transparent focus:outline-none"
          />
        </div>

        <div className="bg-neutral-950 border border-neutral-800 p-3.5 rounded-2xl flex flex-col items-center justify-center text-center shadow">
          <div className="flex items-center gap-1 text-xs text-neutral-400 uppercase font-semibold">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Iniciativa
          </div>
          <button
            onClick={() => {
              const res = rollDnDCheck(character.initiative, "none", "Rolagem de Iniciativa", character.name);
              if (onSendRollToChat) onSendRollToChat(res);
            }}
            className="font-bold text-2xl text-amber-300 hover:text-amber-100 hover:scale-105 transition-all flex items-center gap-1"
          >
            {character.initiative >= 0 ? `+${character.initiative}` : character.initiative}
            <Dice5 className="w-4 h-4 text-amber-500" />
          </button>
        </div>

        <div className="bg-neutral-950 border border-neutral-800 p-3.5 rounded-2xl flex flex-col items-center justify-center text-center shadow">
          <div className="flex items-center gap-1 text-xs text-neutral-400 uppercase font-semibold">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            Deslocamento
          </div>
          <div className="font-bold text-2xl text-emerald-300">{character.speed}m</div>
        </div>

        <div className="bg-neutral-950 border border-neutral-800 p-3.5 rounded-2xl flex flex-col items-center justify-center text-center shadow col-span-2 sm:col-span-3 md:col-span-3">
          <div className="flex items-center justify-between w-full text-xs text-neutral-400 uppercase font-semibold mb-1">
            <span className="flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 text-red-400" />
              Pontos de Vida
            </span>
            <span>Bônus Profic: +{character.proficiencyBonus}</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={character.hp.current}
              onChange={(e) =>
                onUpdate({
                  ...character,
                  hp: { ...character.hp, current: parseInt(e.target.value, 10) || 0 },
                })
              }
              className="w-16 bg-neutral-900 border border-neutral-700 rounded-lg text-center font-bold text-xl text-red-200 focus:outline-none focus:border-red-500"
            />
            <span className="text-neutral-500 text-lg">/</span>
            <input
              type="number"
              value={character.hp.max}
              onChange={(e) =>
                onUpdate({
                  ...character,
                  hp: { ...character.hp, max: parseInt(e.target.value, 10) || 1 },
                })
              }
              className="w-16 bg-neutral-900 border border-neutral-700 rounded-lg text-center font-bold text-xl text-neutral-400 focus:outline-none focus:border-neutral-500"
            />
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-neutral-800 gap-2">
        {[
          { id: "stats", label: "Atributos & Perícias", icon: Sparkles },
          { id: "attacks", label: "Ataques & Armas", icon: Sword },
          { id: "spells", label: "Grimório de Magias", icon: BookOpen },
          { id: "inventory", label: "Inventário & Ouro", icon: Coins },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 font-semibold text-xs md:text-sm border-b-2 transition-all ${
                activeTab === tab.id
                  ? "border-amber-500 text-amber-300 bg-amber-500/10 rounded-t-xl"
                  : "border-transparent text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: Attributes & Skills */}
      {activeTab === "stats" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Attributes List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Atributos Principais</h3>
            <div className="grid grid-cols-2 gap-2.5">
              {(Object.keys(character.stats) as Array<keyof DnDCharacter["stats"]>).map((key) => {
                const val = character.stats[key];
                const labels: Record<string, string> = {
                  str: "Força",
                  dex: "Destreza",
                  con: "Constituição",
                  int: "Inteligência",
                  wis: "Sabedoria",
                  cha: "Carisma",
                };

                return (
                  <div
                    key={key}
                    className="bg-neutral-950 border border-neutral-800 p-3 rounded-2xl flex flex-col items-center justify-center relative group hover:border-amber-500/50 transition-colors"
                  >
                    <span className="text-[10px] uppercase font-bold text-neutral-400">{labels[key]}</span>
                    <button
                      onClick={() => handleRollStat(labels[key], val)}
                      className="font-serif font-extrabold text-2xl text-amber-200 hover:text-amber-400 flex items-center gap-1 my-0.5"
                      title="Rolar Teste de Atributo"
                    >
                      {getMod(val)}
                      <Dice5 className="w-3.5 h-3.5 text-amber-500/70" />
                    </button>
                    <input
                      type="number"
                      value={val}
                      onChange={(e) =>
                        onUpdate({
                          ...character,
                          stats: { ...character.stats, [key]: parseInt(e.target.value, 10) || 10 },
                        })
                      }
                      className="w-12 text-center text-xs font-mono bg-neutral-900 border border-neutral-700 rounded-md text-neutral-400 focus:outline-none"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Skills List */}
          <div className="md:col-span-2 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Perícias (Clique para Rolar)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-neutral-950 border border-neutral-800 p-4 rounded-2xl">
              {skillList.map((skill) => {
                const baseMod = getModNum(character.stats[skill.attr]);
                const prof = character.proficiencies.skills[skill.name] || "none";
                let bonus = baseMod;
                if (prof === "proficient") bonus += character.proficiencyBonus;
                if (prof === "expertise") bonus += character.proficiencyBonus * 2;

                return (
                  <div
                    key={skill.name}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-neutral-900 border border-transparent hover:border-neutral-800 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const nextProf = prof === "none" ? "proficient" : prof === "proficient" ? "expertise" : "none";
                          onUpdate({
                            ...character,
                            proficiencies: {
                              ...character.proficiencies,
                              skills: { ...character.proficiencies.skills, [skill.name]: nextProf },
                            },
                          });
                        }}
                        className={`w-4 h-4 rounded-full border flex items-center justify-center text-[9px] font-bold ${
                          prof === "expertise"
                            ? "bg-amber-500 border-amber-300 text-neutral-950"
                            : prof === "proficient"
                            ? "bg-blue-600 border-blue-400 text-white"
                            : "border-neutral-700 hover:border-neutral-500"
                        }`}
                        title="Alternar Proficiência / Especialização"
                      >
                        {prof === "expertise" ? "E" : prof === "proficient" ? "P" : ""}
                      </button>
                      <span className="text-xs font-medium text-neutral-200">{skill.name}</span>
                      <span className="text-[10px] text-neutral-500 uppercase">({skill.attr})</span>
                    </div>

                    <button
                      onClick={() => handleRollSkill(skill.name, skill.attr)}
                      className="px-2.5 py-1 bg-neutral-900 hover:bg-amber-500 hover:text-neutral-950 border border-neutral-700 text-amber-300 rounded-lg text-xs font-mono font-bold transition-colors flex items-center gap-1"
                    >
                      {bonus >= 0 ? `+${bonus}` : bonus}
                      <Dice5 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Attacks & Weapons */}
      {activeTab === "attacks" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Armas e Ataques</h3>
            <button
              onClick={() => {
                const newAtk = {
                  id: `atk-${Date.now()}`,
                  name: "Nova Arma / Golpe",
                  bonus: "+5",
                  damage: "1d8+3",
                  type: "Cortante",
                };
                onUpdate({ ...character, attacks: [...character.attacks, newAtk] });
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-semibold transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Adicionar Arma
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {character.attacks.map((atk) => (
              <div
                key={atk.id}
                className="bg-neutral-950 border border-neutral-800 p-4 rounded-2xl shadow flex items-center justify-between group hover:border-neutral-700"
              >
                <div className="space-y-1">
                  <input
                    type="text"
                    value={atk.name}
                    onChange={(e) =>
                      onUpdate({
                        ...character,
                        attacks: character.attacks.map((a) => (a.id === atk.id ? { ...a, name: e.target.value } : a)),
                      })
                    }
                    className="bg-transparent font-bold text-sm text-neutral-100 focus:outline-none"
                  />
                  <div className="flex items-center gap-3 text-xs text-neutral-400">
                    <span>Acerto: <strong className="text-amber-300">{atk.bonus}</strong></span>
                    <span>Dano: <strong className="text-red-300">{atk.damage}</strong> ({atk.type})</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRollAttack(atk)}
                    className="px-3.5 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-neutral-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow transition-all active:scale-95"
                  >
                    <Sword className="w-3.5 h-3.5" />
                    Atacar
                  </button>
                  <button
                    onClick={() =>
                      onUpdate({
                        ...character,
                        attacks: character.attacks.filter((a) => a.id !== atk.id),
                      })
                    }
                    className="p-1.5 text-neutral-500 hover:text-red-400 rounded-lg hover:bg-neutral-900"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Spellbook */}
      {activeTab === "spells" && (
        <div className="space-y-6">
          {/* Spellcasting Header */}
          <div className="grid grid-cols-3 gap-3 bg-neutral-950 border border-neutral-800 p-4 rounded-2xl">
            <div>
              <div className="text-[10px] text-neutral-400 uppercase font-semibold">Atributo Conjurador</div>
              <div className="text-sm font-bold text-amber-200 uppercase">{character.spellcasting.ability}</div>
            </div>
            <div>
              <div className="text-[10px] text-neutral-400 uppercase font-semibold">CD do Teste de Resistência</div>
              <div className="text-lg font-bold text-blue-200">{character.spellcasting.saveDc}</div>
            </div>
            <div>
              <div className="text-[10px] text-neutral-400 uppercase font-semibold">Bônus de Ataque Mágico</div>
              <div className="text-lg font-bold text-emerald-200">+{character.spellcasting.attackBonus}</div>
            </div>
          </div>

          {/* Spell Slots */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase text-neutral-400">Espaços de Magia (Slots)</h4>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((lvl) => {
                const slot = character.spellcasting.slots[lvl] || { max: 0, used: 0 };
                if (slot.max === 0 && lvl > 3) return null;

                return (
                  <div
                    key={lvl}
                    className="bg-neutral-950 border border-neutral-800 px-3 py-2 rounded-xl flex items-center gap-2"
                  >
                    <span className="text-xs font-bold text-neutral-300">{lvl}º Círculo:</span>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.max(1, slot.max) }).map((_, idx) => {
                        const isUsed = idx < slot.used;
                        return (
                          <button
                            key={idx}
                            onClick={() => {
                              const newUsed = isUsed ? slot.used - 1 : slot.used + 1;
                              onUpdate({
                                ...character,
                                spellcasting: {
                                  ...character.spellcasting,
                                  slots: {
                                    ...character.spellcasting.slots,
                                    [lvl]: { ...slot, used: Math.max(0, Math.min(slot.max, newUsed)) },
                                  },
                                },
                              });
                            }}
                            className={`w-3.5 h-3.5 rounded-md border transition-all ${
                              isUsed ? "bg-neutral-800 border-neutral-700" : "bg-purple-600 border-purple-400 shadow-sm"
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Spells List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase text-neutral-400">Magias Conhecidas</h4>
              <button
                onClick={() => {
                  const newSpell = {
                    id: `spell-${Date.now()}`,
                    name: "Nova Magia",
                    level: 1,
                    school: "Evocação",
                    castingTime: "1 ação",
                    range: "18m",
                    duration: "Instantânea",
                    prepared: true,
                    description: "Causa 3d8 de dano mágico em área.",
                  };
                  onUpdate({
                    ...character,
                    spellcasting: {
                      ...character.spellcasting,
                      spells: [...character.spellcasting.spells, newSpell],
                    },
                  });
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 rounded-xl text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar Magia
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {character.spellcasting.spells.map((spell) => (
                <div
                  key={spell.id}
                  className="bg-neutral-950 border border-neutral-800 p-4 rounded-2xl space-y-2 group hover:border-purple-800/60 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          onUpdate({
                            ...character,
                            spellcasting: {
                              ...character.spellcasting,
                              spells: character.spellcasting.spells.map((s) =>
                                s.id === spell.id ? { ...s, prepared: !s.prepared } : s
                              ),
                            },
                          });
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          spell.prepared ? "bg-purple-600 text-white" : "bg-neutral-800 text-neutral-500"
                        }`}
                      >
                        {spell.prepared ? "Preparada" : "Não prep."}
                      </button>
                      <input
                        type="text"
                        value={spell.name}
                        onChange={(e) =>
                          onUpdate({
                            ...character,
                            spellcasting: {
                              ...character.spellcasting,
                              spells: character.spellcasting.spells.map((s) =>
                                s.id === spell.id ? { ...s, name: e.target.value } : s
                              ),
                            },
                          })
                        }
                        className="bg-transparent font-bold text-sm text-neutral-100 focus:outline-none"
                      />
                    </div>

                    <button
                      onClick={() => {
                        rpgAudio.playMagicSpell();
                        if (onSendRollToChat) {
                          onSendRollToChat({
                            id: `cast-${Date.now()}`,
                            formula: `${spell.level}º Círculo`,
                            diceType: "spell",
                            rolls: [],
                            modifier: 0,
                            total: 0,
                            timestamp: Date.now(),
                            rollerName: character.name,
                            reason: `Conjurou Magia: ${spell.name}`,
                            system: "dnd5e",
                          });
                        }
                      }}
                      className="px-2.5 py-1 bg-purple-950 hover:bg-purple-900 border border-purple-700 text-purple-200 rounded-lg text-xs font-semibold flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      Conjurar
                    </button>
                  </div>

                  <p className="text-xs text-neutral-400 line-clamp-2">{spell.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Inventory & Wealth */}
      {activeTab === "inventory" && (
        <div className="space-y-4">
          <div className="grid grid-cols-5 gap-2 bg-neutral-950 border border-neutral-800 p-4 rounded-2xl">
            {["cp", "sp", "ep", "gp", "pp"].map((coin) => (
              <div key={coin} className="text-center">
                <label className="text-[10px] text-neutral-400 font-bold uppercase">{coin.toUpperCase()}</label>
                <input
                  type="number"
                  value={(character.currency as any)[coin] || 0}
                  onChange={(e) =>
                    onUpdate({
                      ...character,
                      currency: {
                        ...character.currency,
                        [coin]: parseInt(e.target.value, 10) || 0,
                      },
                    })
                  }
                  className="w-full bg-transparent text-center font-mono font-bold text-amber-300 focus:outline-none"
                />
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase text-neutral-400">Itens e Equipamentos</h4>
            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl divide-y divide-neutral-800">
              {character.equipment.map((item) => (
                <div key={item.id} className="p-3 flex items-center justify-between text-xs">
                  <span className="text-neutral-200 font-medium">{item.name} (x{item.qty})</span>
                  <span className="text-neutral-500">{item.weight} kg</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
