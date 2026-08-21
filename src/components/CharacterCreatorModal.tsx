import React, { useState } from "react";
import { RPGSystem, MapToken, DnDCharacter, OrdemCharacter, CustomCharacter } from "../types";
import {
  X,
  Sparkles,
  User,
  Shield,
  Heart,
  Dices,
  Zap,
  Flame,
  Check,
  ChevronRight,
  ChevronLeft,
  Wand2,
  Swords,
  Eye,
  Crown,
  BookOpen,
  Palette,
  Crosshair,
  Award
} from "lucide-react";
import { rpgAudio } from "../utils/audioSynth";

interface CharacterCreatorModalProps {
  system: RPGSystem;
  onClose: () => void;
  onCreateCharacter: (
    charData: any,
    tokenData: Omit<MapToken, "id">
  ) => void;
}

// Preset Avatars for quick selection
const PRESET_AVATARS = [
  {
    name: "Paladino Dourado",
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    color: "#eab308",
    type: "hero",
  },
  {
    name: "Mago Arcano",
    url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    color: "#3b82f6",
    type: "hero",
  },
  {
    name: "Guerrera Sombra",
    url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
    color: "#a855f7",
    type: "hero",
  },
  {
    name: "Ocultista Paranormal",
    url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80",
    color: "#ec4899",
    type: "hero",
  },
  {
    name: "Caçador Selvagem",
    url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    color: "#22c55e",
    type: "hero",
  },
  {
    name: "Cavaleiro Negro",
    url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
    color: "#ef4444",
    type: "hero",
  },
];

export const CharacterCreatorModal: React.FC<CharacterCreatorModalProps> = ({
  system,
  onClose,
  onCreateCharacter,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Identity State
  const [name, setName] = useState("Kaelen Sunstorm");
  const [raceOrOrigin, setRaceOrOrigin] = useState(
    system === "ordem" ? "Acadêmico" : "Humano"
  );
  const [classType, setClassType] = useState(
    system === "ordem" ? "Ocultista" : system === "tormenta20" ? "Arcanista" : "Paladino"
  );
  const [levelOrNex, setLevelOrNex] = useState(system === "ordem" ? 15 : 1);
  const [alignmentOrAffinity, setAlignmentOrAffinity] = useState(
    system === "ordem" ? "Conhecimento" : "Leal e Bom"
  );

  // Attributes State
  const [attributes, setAttributes] = useState<{ [key: string]: number }>({
    str: 14,
    dex: 12,
    con: 14,
    int: 10,
    wis: 12,
    cha: 16,
    // Ordem attributes
    for: 1,
    agi: 2,
    vig: 2,
    pre: 3,
  });

  // Token & Visual Customization State
  const [avatarUrl, setAvatarUrl] = useState(PRESET_AVATARS[0].url);
  const [tokenColor, setTokenColor] = useState(PRESET_AVATARS[0].color);
  const [tokenSize, setTokenSize] = useState<1 | 2>(1);

  // AI Avatar State
  const [aiAvatarPrompt, setAiAvatarPrompt] = useState("");
  const [isGeneratingAiAvatar, setIsGeneratingAiAvatar] = useState(false);

  const handleGenerateAiAvatar = async () => {
    const promptToUse = aiAvatarPrompt.trim() || `${name}, ${classType} ${raceOrOrigin}, ${alignmentOrAffinity}, retrato de personagem épico com iluminação dramática`;
    setIsGeneratingAiAvatar(true);
    try {
      const res = await fetch("/api/ai/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptToUse,
          type: "character",
          system,
        }),
      });

      if (!res.ok) throw new Error("Falha na geração de avatar");
      const data = await res.json();
      if (data.imageUrl) {
        setAvatarUrl(data.imageUrl);
      }
    } catch (err) {
      console.error("Erro ao gerar avatar com IA:", err);
      const seed = Math.floor(Math.random() * 1000000);
      const encoded = encodeURIComponent(`RPG character portrait ${promptToUse}`);
      const fallbackUrl = `https://image.pollinations.ai/prompt/${encoded}?width=512&height=512&seed=${seed}&nologo=true`;
      setAvatarUrl(fallbackUrl);
    } finally {
      setIsGeneratingAiAvatar(false);
    }
  };

  // Computed HP & Defense defaults
  const computedHp =
    system === "ordem"
      ? 20 + attributes.vig * 5 + Math.floor(levelOrNex / 5) * 4
      : 10 + Math.floor((attributes.str - 10) / 2) + Math.floor((attributes.con - 10) / 2);
  const computedAc =
    system === "ordem"
      ? 10 + attributes.agi + 2
      : 10 + Math.floor((attributes.dex - 10) / 2) + 6;

  // Dice Rolling for Attributes
  const [rollingDice, setRollingDice] = useState(false);

  const handleRollAttributes = () => {
    setRollingDice(true);
    rpgAudio.playDiceRoll();

    setTimeout(() => {
      if (system === "ordem") {
        setAttributes({
          for: Math.floor(Math.random() * 3) + 1,
          agi: Math.floor(Math.random() * 3) + 1,
          vig: Math.floor(Math.random() * 3) + 1,
          int: Math.floor(Math.random() * 3) + 1,
          pre: Math.floor(Math.random() * 3) + 1,
          str: 10,
          dex: 10,
          con: 10,
          wis: 10,
          cha: 10,
        });
      } else {
        const roll4d6 = () => {
          const rolls = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
          rolls.sort((a, b) => a - b);
          return rolls[1] + rolls[2] + rolls[3];
        };
        setAttributes({
          str: roll4d6(),
          dex: roll4d6(),
          con: roll4d6(),
          int: roll4d6(),
          wis: roll4d6(),
          cha: roll4d6(),
          for: 1,
          agi: 2,
          vig: 2,
          pre: 2,
        });
      }
      setRollingDice(false);
    }, 600);
  };

  const handleFinish = () => {
    rpgAudio.playSpellCast();

    const charId = `char-${Date.now()}`;

    // Token Object
    const newToken: Omit<MapToken, "id"> = {
      name,
      system,
      x: 5,
      y: 5,
      hp: computedHp,
      maxHp: computedHp,
      ac: computedAc,
      color: tokenColor,
      avatar: avatarUrl,
      type: "hero",
      size: tokenSize,
      conditions: [],
    };

    let newChar: any;

    if (system === "dnd5e") {
      const dndData: DnDCharacter = {
        id: charId,
        name,
        race: raceOrOrigin,
        classAndLevel: `${classType} ${levelOrNex}`,
        background: "Aventureiro",
        alignment: alignmentOrAffinity,
        xp: 0,
        inspiration: true,
        proficiencyBonus: 2,
        ac: computedAc,
        initiative: Math.floor((attributes.dex - 10) / 2),
        speed: 9,
        hp: { current: computedHp, max: computedHp, temp: 0 },
        hitDice: { total: levelOrNex, current: levelOrNex, die: "1d10" },
        stats: {
          str: attributes.str,
          dex: attributes.dex,
          con: attributes.con,
          int: attributes.int,
          wis: attributes.wis,
          cha: attributes.cha,
        },
        savingThrows: {
          str: { proficient: true, modifier: Math.floor((attributes.str - 10) / 2) + 2 },
          dex: { proficient: false, modifier: Math.floor((attributes.dex - 10) / 2) },
          con: { proficient: true, modifier: Math.floor((attributes.con - 10) / 2) + 2 },
          int: { proficient: false, modifier: Math.floor((attributes.int - 10) / 2) },
          wis: { proficient: false, modifier: Math.floor((attributes.wis - 10) / 2) },
          cha: { proficient: false, modifier: Math.floor((attributes.cha - 10) / 2) },
        },
        proficiencies: {
          skills: {
            Atletismo: "proficient",
            Percepção: "proficient",
            Intimidação: "proficient",
          },
          armor: "Armaduras leves e médias",
          weapons: "Armas simples e marciais",
          tools: "Ferramentas de Navegação",
          languages: "Comum, Élfico",
        },
        attacks: [
          { id: "a1", name: "Ataque Principal", bonus: "+5", damage: "1d8+3", type: "Cortante" },
        ],
        spellcasting: {
          ability: "cha",
          saveDc: 13,
          attackBonus: 5,
          slots: { 1: { max: 2, used: 0 } },
          spells: [
            {
              id: "s1",
              name: "Bênção da Coragem",
              level: 1,
              school: "Encantamento",
              castingTime: "1 ação",
              range: "9 metros",
              duration: "Concentração",
              prepared: true,
              description: "Concede +1d4 em testes de ataque e salvaguardas para aliados.",
            },
          ],
        },
        equipment: [
          { id: "e1", name: "Cota de Malha", qty: 1, weight: 20, notes: "+6 AC" },
          { id: "e2", name: "Espada Longa", qty: 1, weight: 3, notes: "Versátil (1d10)" },
        ],
        currency: { cp: 0, sp: 10, ep: 0, gp: 50, pp: 0 },
        features: [
          { id: "f1", name: "Aura do Campeão", source: "Classe", description: "Inspira aliados próximos." },
        ],
        avatar: avatarUrl,
      };
      newChar = dndData;
    } else if (system === "ordem") {
      const validClass = (["Combatente", "Especialista", "Ocultista", "Mundano"].includes(classType)
        ? classType
        : "Combatente") as "Combatente" | "Especialista" | "Ocultista" | "Mundano";

      const validAffinity = (["Conhecimento", "Energia", "Morte", "Sangue", "Nenhuma"].includes(alignmentOrAffinity)
        ? alignmentOrAffinity
        : "Nenhuma") as "Conhecimento" | "Energia" | "Morte" | "Sangue" | "Nenhuma";

      const ordemData: OrdemCharacter = {
        id: charId,
        name,
        avatar: avatarUrl,
        classType: validClass,
        origin: raceOrOrigin,
        rank: "Recruta",
        track: "Primeira Linha",
        nex: levelOrNex,
        pePerRound: 2,
        elementAffinity: validAffinity,
        pv: { current: computedHp, max: computedHp, temp: 0 },
        san: { current: 30 + attributes.int * 5, max: 30 + attributes.int * 5, temp: 0 },
        pe: { current: 15 + attributes.pre * 3, max: 15 + attributes.pre * 3, temp: 0 },
        attributes: {
          agi: attributes.agi,
          for: attributes.for,
          int: attributes.int,
          pre: attributes.pre,
          vig: attributes.vig,
        },
        defense: computedAc,
        dodge: 10 + attributes.agi * 2,
        block: 5 + attributes.for,
        skills: {
          Ocultismo: { attribute: "int", training: "treinado", bonus: 5 },
          Pontaria: { attribute: "agi", training: "treinado", bonus: 5 },
          Percepção: { attribute: "pre", training: "treinado", bonus: 5 },
          Vontade: { attribute: "pre", training: "treinado", bonus: 5 },
        },
        weapons: [
          {
            id: "w1",
            name: "Pistola Tática .40",
            type: "Fogo",
            damage: "1d12",
            critical: "19/x3",
            range: "Curto",
            category: "I",
            spaces: 1,
          },
        ],
        rituals: [
          {
            id: "r1",
            name: "Decadência",
            element: "Morte",
            circle: 1,
            costPe: 1,
            castTime: "1 Ação",
            range: "Toque",
            target: "1 criatura",
            duration: "Instantânea",
            resistence: "Fortitude reduz à metade",
            description: "Causa 2d8+2 de dano de Morte e envelhece matéria orgânica.",
          },
        ],
        inventory: [
          { id: "i1", name: "Vestimenta Reforçada", category: "I", spaces: 2, details: "+2 Defesa" },
        ],
      };
      newChar = ordemData;
    } else {
      const customData: CustomCharacter = {
        id: charId,
        name,
        systemName: "Sistema Livre",
        concept: `${raceOrOrigin} ${classType}`,
        avatar: avatarUrl,
        bars: [
          { id: "b1", name: "Vida", current: computedHp, max: computedHp, color: "#ef4444" },
          { id: "b2", name: "Energia", current: 20, max: 20, color: "#3b82f6" },
        ],
        attributes: [
          { id: "att1", name: "Poder", value: attributes.str || 12 },
          { id: "att2", name: "Agilidade", value: attributes.dex || 12 },
          { id: "att3", name: "Mente", value: attributes.int || 12 },
          { id: "att4", name: "Presença", value: attributes.cha || 12 },
        ],
        skills: [
          { id: "sk1", name: "Combate", value: "+4" },
          { id: "sk2", name: "Percepção", value: "+3" },
        ],
        items: [
          { id: "it1", name: "Armadura de Batalha", qty: 1, notes: "+2 Defesa" },
        ],
        notes: "Personagem criado pelo Criador Rápido.",
      };
      newChar = customData;
    }

    onCreateCharacter(newChar, newToken);
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-amber-500/40 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-neutral-950 via-neutral-900 to-amber-950/60 border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20 text-neutral-950 font-bold">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-neutral-100 flex items-center gap-2">
                Criador de Personagem & Token 3D
                <span className="px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {system === "ordem" ? "Ordem Paranormal" : system === "dnd5e" ? "D&D 5ª Edição" : "Sistema Livre"}
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Passo {step} de 4 — Crie sua ficha completa e coloque seu Miniatura Token no Mapa
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-100 bg-neutral-800/80 hover:bg-neutral-800 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Progress Steps */}
        <div className="px-6 py-3 bg-neutral-950/80 border-b border-neutral-800/80 flex items-center justify-between">
          {[
            { id: 1, label: "Identidade & Classe", icon: User },
            { id: 2, label: "Atributos & Dados", icon: Dices },
            { id: 3, label: "Aparência & Token 3D", icon: Palette },
            { id: 4, label: "Resumo & Confirmação", icon: Check },
          ].map((s) => {
            const Icon = s.icon;
            const isActive = step === s.id;
            const isCompleted = step > s.id;
            return (
              <button
                key={s.id}
                onClick={() => setStep(s.id as any)}
                className={`flex items-center gap-2 text-xs font-bold transition-all px-3 py-1.5 rounded-xl ${
                  isActive
                    ? "bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20"
                    : isCompleted
                    ? "text-amber-400 hover:text-amber-300 bg-amber-950/30"
                    : "text-neutral-500 hover:text-neutral-300"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{s.label}</span>
              </button>
            );
          })}
        </div>

        {/* Wizard Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                    Nome do Personagem
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-2.5 text-sm text-neutral-100 font-semibold focus:outline-none focus:border-amber-500"
                    placeholder="Ex: Arthur Cervero / Valerius"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                    {system === "ordem" ? "Origem" : "Raça"}
                  </label>
                  <input
                    type="text"
                    value={raceOrOrigin}
                    onChange={(e) => setRaceOrOrigin(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-2.5 text-sm text-neutral-100 font-semibold focus:outline-none focus:border-amber-500"
                    placeholder={system === "ordem" ? "Ex: Acadêmico, TTI, Atleta" : "Ex: Humano, Elfo, Anão"}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                    Classe
                  </label>
                  <select
                    value={classType}
                    onChange={(e) => setClassType(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-2.5 text-sm text-neutral-100 font-semibold focus:outline-none focus:border-amber-500"
                  >
                    {system === "ordem" ? (
                      <>
                        <option value="Combatente">Combatente</option>
                        <option value="Especialista">Especialista</option>
                        <option value="Ocultista">Ocultista</option>
                      </>
                    ) : (
                      <>
                        <option value="Paladino">Paladino</option>
                        <option value="Mago">Mago</option>
                        <option value="Guerreiro">Guerreiro</option>
                        <option value="Ladino">Ladino</option>
                        <option value="Clérigo">Clérigo</option>
                        <option value="Bárbaro">Bárbaro</option>
                        <option value="Arcanista">Arcanista</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                    {system === "ordem" ? "NEX (%)" : "Nível do Personagem"}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={levelOrNex}
                    onChange={(e) => setLevelOrNex(Number(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-2.5 text-sm text-neutral-100 font-semibold focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                  {system === "ordem" ? "Elemento / Afinidade Paranormal" : "Tendência / Alinhamento"}
                </label>
                <input
                  type="text"
                  value={alignmentOrAffinity}
                  onChange={(e) => setAlignmentOrAffinity(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-2.5 text-sm text-neutral-100 font-semibold focus:outline-none focus:border-amber-500"
                  placeholder={system === "ordem" ? "Ex: Morte, Sangue, Conhecimento, Energia" : "Ex: Leal e Bom, Neutro"}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between bg-neutral-950 p-4 rounded-2xl border border-neutral-800">
                <div>
                  <h3 className="text-sm font-bold text-neutral-200">
                    Distribuição de Atributos
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Ajuste manualmente ou role dados no modo clássico de RPG.
                  </p>
                </div>

                <button
                  onClick={handleRollAttributes}
                  disabled={rollingDice}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                >
                  <Dices className={`w-4 h-4 ${rollingDice ? "animate-spin" : ""}`} />
                  <span>Rolar com Dados</span>
                </button>
              </div>

              {system === "ordem" ? (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {[
                    { key: "agi", label: "AGI", full: "Agilidade", color: "text-green-400" },
                    { key: "for", label: "FOR", full: "Força", color: "text-red-400" },
                    { key: "int", label: "INT", full: "Intelecto", color: "text-blue-400" },
                    { key: "pre", label: "PRE", full: "Presença", color: "text-purple-400" },
                    { key: "vig", label: "VIG", full: "Vigor", color: "text-amber-400" },
                  ].map((attr) => (
                    <div
                      key={attr.key}
                      className="bg-neutral-950 border border-neutral-800 p-3 rounded-2xl text-center space-y-2"
                    >
                      <div className={`text-xs font-bold ${attr.color}`}>{attr.full}</div>
                      <input
                        type="number"
                        min={0}
                        max={5}
                        value={attributes[attr.key] || 0}
                        onChange={(e) =>
                          setAttributes({ ...attributes, [attr.key]: Number(e.target.value) })
                        }
                        className="w-16 mx-auto text-center bg-neutral-900 border border-neutral-700 rounded-xl py-1 text-lg font-mono font-bold text-neutral-100"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { key: "str", label: "FOR", full: "Força" },
                    { key: "dex", label: "DES", full: "Destreza" },
                    { key: "con", label: "CON", full: "Constituição" },
                    { key: "int", label: "INT", full: "Inteligência" },
                    { key: "wis", label: "SAB", full: "Sabedoria" },
                    { key: "cha", label: "CAR", full: "Carisma" },
                  ].map((attr) => (
                    <div
                      key={attr.key}
                      className="bg-neutral-950 border border-neutral-800 p-3.5 rounded-2xl space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-neutral-300">
                        <span>{attr.full}</span>
                        <span className="text-amber-400 font-mono">
                          Mod: {Math.floor(((attributes[attr.key] || 10) - 10) / 2) >= 0 ? "+" : ""}
                          {Math.floor(((attributes[attr.key] || 10) - 10) / 2)}
                        </span>
                      </div>
                      <input
                        type="number"
                        min={3}
                        max={20}
                        value={attributes[attr.key] || 10}
                        onChange={(e) =>
                          setAttributes({ ...attributes, [attr.key]: Number(e.target.value) })
                        }
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-xl py-1 px-3 text-center text-base font-mono font-bold text-neutral-100"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* AI Avatar Generator Block */}
              <div className="bg-gradient-to-r from-amber-950/40 via-purple-950/30 to-neutral-950 p-4 rounded-2xl border border-amber-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                    <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                    <span>Gerar Avatar de Personagem com Inteligência Artificial</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                    IA Studio
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  Descreva a aparência e estilo do personagem (ex: "Ocultista investigativo com sobretudo preto e marcas arcanas no rosto", "Paladino em armadura dourada reluzente com capa vermelha").
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aiAvatarPrompt}
                    onChange={(e) => setAiAvatarPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleGenerateAiAvatar();
                      }
                    }}
                    placeholder={`Descreva a aparência de ${name || "seu personagem"}...`}
                    className="flex-1 bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-neutral-100 placeholder:text-neutral-600 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateAiAvatar}
                    disabled={isGeneratingAiAvatar}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all flex-shrink-0 disabled:opacity-50"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isGeneratingAiAvatar ? "animate-spin" : ""}`} />
                    <span>{isGeneratingAiAvatar ? "Gerando..." : "Gerar Avatar IA"}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-300 block mb-2">
                  Ou escolha um Avatar Pré-definido ou Insira URL
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-3">
                  {PRESET_AVATARS.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setAvatarUrl(p.url);
                        setTokenColor(p.color);
                      }}
                      className={`relative rounded-2xl overflow-hidden aspect-square border-2 transition-all ${
                        avatarUrl === p.url
                          ? "border-amber-400 ring-4 ring-amber-500/20 scale-105"
                          : "border-neutral-800 opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                      <div
                        className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full border border-white"
                        style={{ backgroundColor: p.color }}
                      />
                    </button>
                  ))}
                </div>

                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-2.5 text-xs font-mono text-neutral-200 focus:outline-none focus:border-amber-500"
                  placeholder="Ou cole a URL de imagem personalizada..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                    Cor da Aura e Base do Token 3D
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={tokenColor}
                      onChange={(e) => setTokenColor(e.target.value)}
                      className="w-12 h-10 rounded-xl cursor-pointer bg-neutral-950 border border-neutral-800 p-1"
                    />
                    <span className="text-xs font-mono text-neutral-300 uppercase">{tokenColor}</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                    Tamanho do Token no Mapa
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setTokenSize(1)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                        tokenSize === 1
                          ? "bg-amber-500 text-neutral-950 border-amber-400"
                          : "bg-neutral-950 text-neutral-400 border-neutral-800"
                      }`}
                    >
                      Médio (1x1)
                    </button>
                    <button
                      onClick={() => setTokenSize(2)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                        tokenSize === 2
                          ? "bg-amber-500 text-neutral-950 border-amber-400"
                          : "bg-neutral-950 text-neutral-400 border-neutral-800"
                      }`}
                    >
                      Grande (2x2)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-neutral-950 border border-amber-500/30 p-5 rounded-3xl flex items-center gap-4">
                <img
                  src={avatarUrl}
                  alt={name}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-amber-500 shadow-xl"
                />

                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-neutral-100">{name}</h3>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                      {classType} ({system === "ordem" ? `NEX ${levelOrNex}%` : `Nível ${levelOrNex}`})
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-neutral-800 text-neutral-300 font-semibold">
                      {raceOrOrigin}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400">
                    Pontos de Vida (HP): <strong className="text-emerald-400">{computedHp}</strong> | Defesa (CA): <strong className="text-sky-400">{computedAc}</strong>
                  </p>
                </div>
              </div>

              <div className="bg-amber-950/30 border border-amber-500/20 p-4 rounded-2xl text-xs text-amber-200/90 leading-relaxed">
                ✨ <strong>Pronto para a Aventura!</strong> Ao confirmar, a ficha de personagem será criada no sistema e a miniatura em Token 3D será colocada no mapa de batalha na posição inicial.
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between">
          <button
            onClick={() => setStep((s) => Math.max(1, s - 1) as any)}
            disabled={step === 1}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              step === 1
                ? "opacity-40 text-neutral-600 cursor-not-allowed"
                : "bg-neutral-800 hover:bg-neutral-700 text-neutral-200"
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Anterior</span>
          </button>

          {step < 4 ? (
            <button
              onClick={() => setStep((s) => Math.min(4, s + 1) as any)}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
            >
              <span>Próximo Passo</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-neutral-950 font-extrabold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Criar Personagem & Inserir no Mapa</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
