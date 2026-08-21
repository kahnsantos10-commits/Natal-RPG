import React, { useState, useEffect } from "react";
import {
  RPGSystem,
  UserRole,
  MapData,
  MapToken,
  ChatMessage,
  DiceRollResult,
  InitiativeCombatant,
  DnDCharacter,
  OrdemCharacter,
  CustomCharacter,
} from "./types";
import { BattleMap } from "./components/BattleMap";
import { CharacterSheetDnD } from "./components/CharacterSheetDnD";
import { CharacterSheetOrdem } from "./components/CharacterSheetOrdem";
import { CharacterSheetCustom } from "./components/CharacterSheetCustom";
import { AIMasterPanel } from "./components/AIMasterPanel";
import { DiceRollerDrawer } from "./components/DiceRollerDrawer";
import { InitiativeTracker } from "./components/InitiativeTracker";
import { ChatPanel } from "./components/ChatPanel";
import { SoundboardPanel } from "./components/SoundboardPanel";
import { PhysicalTabletopCompanion } from "./components/PhysicalTabletopCompanion";
import { PlayerDisplayModal } from "./components/PlayerDisplayModal";
import {
  Compass,
  FileText,
  Sparkles,
  Dice5,
  Zap,
  Volume2,
  Copy,
  Check,
  Shield,
  Crown,
  Tv,
  Home,
  Monitor,
  Printer,
  MessageSquare,
  X,
  Menu,
  ChevronDown
} from "lucide-react";

// Default Initial Mock Data
const defaultDnDChar: DnDCharacter = {
  id: "dnd-char-1",
  name: "Valerius Ashwood",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
  race: "Humano (Variante)",
  classAndLevel: "Paladino 4 (Juramento da Devoção)",
  background: "Nobre",
  alignment: "Leal e Bom",
  xp: 3800,
  inspiration: true,
  proficiencyBonus: 2,
  ac: 18,
  initiative: 1,
  speed: 9,
  hp: { current: 36, max: 36, temp: 0 },
  hitDice: { total: 4, current: 4, die: "1d10" },
  stats: { str: 16, dex: 12, con: 14, int: 10, wis: 12, cha: 16 },
  savingThrows: {
    str: { proficient: false, modifier: 3 },
    dex: { proficient: false, modifier: 1 },
    con: { proficient: false, modifier: 2 },
    int: { proficient: false, modifier: 0 },
    wis: { proficient: true, modifier: 3 },
    cha: { proficient: true, modifier: 5 },
  },
  proficiencies: {
    skills: {
      "Atletismo": "proficient",
      "Persuasão": "proficient",
      "Religião": "proficient",
      "Intuição": "proficient",
    },
    armor: "Todas as armaduras, Escudos",
    weapons: "Armas simples e marciais",
    tools: "Alaúde",
    languages: "Comum, Celestial",
  },
  attacks: [
    { id: "a1", name: "Espada Longa Sagrada", bonus: "+5", damage: "1d8+3", type: "Cortante/Radiante" },
    { id: "a2", name: "Lança Montada", bonus: "+5", damage: "1d12+3", type: "Perfurante" },
  ],
  spellcasting: {
    ability: "cha",
    saveDc: 13,
    attackBonus: 5,
    slots: {
      1: { max: 3, used: 1 },
      2: { max: 0, used: 0 },
    },
    spells: [
      {
        id: "sp1",
        name: "Destruição Cólera (Smite)",
        level: 1,
        school: "Evocação",
        castingTime: "1 ação bônus",
        range: "Pessoal",
        duration: "Concentração, até 1 min",
        prepared: true,
        description: "Seu ataque corpo a corpo causa 1d6 de dano de fogo adicional e força o alvo a cair de bruços se falhar em teste de Força.",
      },
      {
        id: "sp2",
        name: "Curar Ferimentos",
        level: 1,
        school: "Evocação",
        castingTime: "1 ação",
        range: "Toque",
        duration: "Instantânea",
        prepared: true,
        description: "Uma criatura que você tocar recupera 1d8 + modificador de conjuração em pontos de vida.",
      },
    ],
  },
  equipment: [
    { id: "eq1", name: "Cota de Malha Completa", qty: 1, weight: 25, notes: "Armadura Pesada" },
    { id: "eq2", name: "Escudo com Brasão Solar", qty: 1, weight: 3, notes: "+2 AC" },
    { id: "eq3", name: "Símbolo Sagrado de Platina", qty: 1, weight: 0.5, notes: "Foco de Conjuração" },
  ],
  currency: { cp: 15, sp: 20, ep: 0, gp: 85, pp: 2 },
  features: [
    { id: "f1", name: "Sentido Divino", source: "Paladino", description: "Detecta a presença de celestiais, ínferos e mortos-vivos." },
    { id: "f2", name: "Cura pelas Mãos", source: "Paladino", description: "Reserva de 20 PVs por dia para curar toques." },
  ],
};

const defaultOrdemChar: OrdemCharacter = {
  id: "ordem-char-1",
  name: "Arthur Cervero",
  avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
  classType: "Ocultista",
  origin: "Acadêmico",
  rank: "Operador",
  track: "Lâmina Paranormal",
  nex: 35,
  pePerRound: 4,
  elementAffinity: "Morte",
  pv: { current: 48, max: 48, temp: 0 },
  san: { current: 42, max: 55, temp: 0 },
  pe: { current: 28, max: 32, temp: 0 },
  attributes: { agi: 2, for: 1, int: 4, pre: 3, vig: 2 },
  defense: 15,
  dodge: 20,
  block: 5,
  skills: {
    "Ocultismo": { attribute: "int", training: "veterano", bonus: 10 },
    "Investigação": { attribute: "int", training: "veterano", bonus: 10 },
    "Vontade": { attribute: "pre", training: "treinado", bonus: 5 },
    "Iniciativa": { attribute: "agi", training: "treinado", bonus: 5 },
    "Pontaria": { attribute: "agi", training: "treinado", bonus: 5 },
    "Percepção": { attribute: "pre", training: "treinado", bonus: 5 },
    "Fortitude": { attribute: "vig", training: "treinado", bonus: 5 },
    "Ciências": { attribute: "int", training: "treinado", bonus: 5 },
  },
  weapons: [
    {
      id: "w1",
      name: "Revólver .38 Tático",
      type: "Balístico",
      damage: "2d6",
      critical: "19/x3",
      range: "Médio",
      category: "I",
      spaces: 1,
    },
    {
      id: "w2",
      name: "Adaga Ritualística de Morte",
      type: "Perfuração/Morte",
      damage: "1d6+2d8",
      critical: "18/x2",
      range: "Corpo a corpo",
      category: "II",
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
      castTime: "Padrão",
      range: "Toque",
      target: "1 ser",
      duration: "Instantânea",
      resistence: "Fortitude reduz à metade",
      description: "Você infunde o alvo com lodo da Morte acelerando o tempo ao seu redor. Causa 2d8+2 de dano de Morte.",
    },
    {
      id: "r2",
      name: "Cicatrização Espiral",
      element: "Sangue",
      circle: 1,
      costPe: 1,
      castTime: "Padrão",
      range: "Toque",
      target: "1 ser",
      duration: "Instantânea",
      resistence: "Nenhuma",
      description: "O fluxo sanguíneo acelera violentamente, cicatrizando cortes abertos. Cura 3d8+3 de PV (alvo sofre 1 de dano de SAN).",
    },
    {
      id: "r3",
      name: "Paradoxo Temporal",
      element: "Morte",
      circle: 2,
      costPe: 3,
      castTime: "Reação",
      range: "Pessoal",
      target: "Você",
      duration: "1 rodada",
      resistence: "Nenhuma",
      description: "Manipula as linhas temporais locais, concedendo +5 na Defesa e permitindo uma ação de esquiva imediata.",
    },
  ],
  inventory: [
    { id: "i1", name: "Colete Leve à Prova de Balas", category: "I", spaces: 2, details: "+2 de Defesa passiva" },
    { id: "i2", name: "Componentes Rituais de Morte (Lodo)", category: "0", spaces: 1, details: "Cinzas e lodo preservado em frasco" },
    { id: "i3", name: "Kit de Primeiros Socorros Tático", category: "I", spaces: 1, details: "Permite testes de Medicina para estabilização" },
  ],
  paranormalPowers: [
    { id: "p1", name: "Escolhido pela Morte", element: "Morte", description: "Você recebe +1 PE por rodada para conjuração de rituais de Morte." },
  ],
};

const defaultCustomChar: CustomCharacter = {
  id: "custom-char-1",
  name: "Kaelen Vane",
  systemName: "Tormenta 20 / Fantasia Livre",
  concept: "Guerreiro Arcano Artoniano",
  avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
  bars: [
    { id: "b1", name: "Pontos de Vida (PV)", current: 40, max: 40, color: "bg-red-500" },
    { id: "b2", name: "Pontos de Mana (PM)", current: 24, max: 24, color: "bg-blue-500" },
    { id: "b3", name: "Estamina / Fôlego", current: 15, max: 15, color: "bg-amber-500" },
  ],
  attributes: [
    { id: "at1", name: "FOR", value: 16, modifier: "+3" },
    { id: "at2", name: "DES", value: 14, modifier: "+2" },
    { id: "at3", name: "CON", value: 14, modifier: "+2" },
    { id: "at4", name: "INT", value: 12, modifier: "+1" },
    { id: "at5", name: "SAB", value: 10, modifier: "+0" },
    { id: "at6", name: "CAR", value: 14, modifier: "+2" },
  ],
  skills: [
    { id: "sk1", name: "Ataque com Katana Élfica", value: 8, formula: "1d20+8" },
    { id: "sk2", name: "Lançar Bola de Fogo Arcana", value: 10, formula: "6d6+4" },
    { id: "sk3", name: "Reflexos Rápidos", value: 6, formula: "1d20+6" },
  ],
  items: [
    { id: "it1", name: "Katana Élfica de Mitral", qty: 1, notes: "Causa dano cortante aumentado" },
  ],
  notes: "Treinado nos templos de Valkaria.",
};

export function App() {
  // Play Mode: Physical Tabletop (Feito Fora) vs Virtual Tabletop (Feito Dentro)
  const [playMode, setPlayMode] = useState<"physical" | "virtual">("physical");
  const [showPlayerDisplayModal, setShowPlayerDisplayModal] = useState(false);

  // Responsive Chat Drawer state (opens as sidebar on desktop, overlay on mobile/tablet)
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // Automatically open chat on large screens on initial load
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth >= 1280) {
      setIsChatOpen(true);
    }
  }, []);

  // Session / Room State
  const [system, setSystem] = useState<RPGSystem>("ordem");
  const [userRole, setUserRole] = useState<UserRole>("gm");
  const [userName, setUserName] = useState("Mestre");
  const [copiedLink, setCopiedLink] = useState(false);

  // Active Main View Tab
  const [activeMainView, setActiveMainView] = useState<"physical_companion" | "map" | "sheet" | "ai_master" | "soundboard">("physical_companion");

  // Floating Overlay Panels
  const [showDiceDrawer, setShowDiceDrawer] = useState(false);
  const [showInitiativeDrawer, setShowInitiativeDrawer] = useState(false);

  // Map Data State
  const [mapData, setMapData] = useState<MapData>({
    id: "map-1",
    name: "Mansão dos Espelhos",
    gridWidth: 20,
    gridHeight: 16,
    gridSize: 50,
    bgUrl: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&auto=format&fit=crop&q=80",
    fogOfWar: false,
    revealedCells: ["5,5", "5,6", "6,5", "6,6"],
    lighting: "paranormal_fog",
    pings: [],
  });

  // Tokens on Map
  const [tokens, setTokens] = useState<MapToken[]>([
    {
      id: "tok-arthur",
      name: "Arthur Cervero",
      type: "hero",
      system: "ordem",
      x: 5,
      y: 6,
      size: 1,
      hp: 48,
      maxHp: 48,
      san: 42,
      maxSan: 55,
      pe: 28,
      maxPe: 32,
      ac: 15,
      conditions: [],
      color: "#8b5cf6",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    },
    {
      id: "tok-valerius",
      name: "Valerius Ashwood",
      type: "hero",
      system: "dnd5e",
      x: 6,
      y: 6,
      size: 1,
      hp: 36,
      maxHp: 36,
      ac: 18,
      conditions: [],
      color: "#3b82f6",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
    {
      id: "tok-aberracao",
      name: "Zumbi de Sangue",
      type: "enemy",
      system: "ordem",
      x: 10,
      y: 7,
      size: 1,
      hp: 25,
      maxHp: 25,
      ac: 13,
      conditions: [],
      color: "#ef4444",
      avatar: "https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=150&auto=format&fit=crop&q=80",
    },
    {
      id: "tok-boss",
      name: "Degolificada (Boss)",
      type: "boss",
      system: "ordem",
      x: 13,
      y: 8,
      size: 2,
      hp: 140,
      maxHp: 140,
      ac: 22,
      conditions: [],
      color: "#dc2626",
      avatar: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=150&auto=format&fit=crop&q=80",
    },
  ]);

  // Initiative Combatants
  const [combatants, setCombatants] = useState<InitiativeCombatant[]>([
    {
      id: "tok-arthur",
      name: "Arthur Cervero",
      initiative: 22,
      hp: 48,
      maxHp: 48,
      type: "hero",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      color: "#8b5cf6",
    },
    {
      id: "tok-valerius",
      name: "Valerius Ashwood",
      initiative: 17,
      hp: 36,
      maxHp: 36,
      type: "hero",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      color: "#3b82f6",
    },
    {
      id: "tok-boss",
      name: "Degolificada (Boss)",
      initiative: 15,
      hp: 140,
      maxHp: 140,
      type: "boss",
      avatar: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=150&auto=format&fit=crop&q=80",
      color: "#dc2626",
    },
    {
      id: "tok-aberracao",
      name: "Zumbi de Sangue",
      initiative: 9,
      hp: 25,
      maxHp: 25,
      type: "enemy",
      avatar: "https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=150&auto=format&fit=crop&q=80",
      color: "#ef4444",
    },
  ]);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [roundNumber, setRoundNumber] = useState(1);

  // Characters Data
  const [dndChar, setDndChar] = useState<DnDCharacter>(defaultDnDChar);
  const [ordemChar, setOrdemChar] = useState<OrdemCharacter>(defaultOrdemChar);
  const [customChar, setCustomChar] = useState<CustomCharacter>(defaultCustomChar);

  // Chat Messages
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "m-1",
      sender: "Mestre IA",
      role: "ai",
      type: "narration",
      content:
        "As portas de carvalho maciço da Mansão se fecham com um estrondo atrás de vocês. O ar fica subitamente gélido, e o cheiro pungente de cinzas e enxofre preenche o salão de espelhos trincados...",
      timestamp: Date.now() - 60000,
    },
    {
      id: "m-2",
      sender: "Arthur Cervero",
      role: "player",
      type: "in_character",
      content: "Mantenham a calma e fiquem em guarda. Há uma manifestação de Morte muito forte concentrada no centro da sala.",
      timestamp: Date.now() - 30000,
    },
  ]);

  const activeTurnCombatant = combatants[currentTurnIndex];

  // Send Message to Chat
  const handleSendMessage = (text: string, type: ChatMessage["type"] = "in_character", role: ChatMessage["role"] = "player") => {
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: userRole === "gm" ? "Mestre" : system === "ordem" ? ordemChar.name : dndChar.name,
      role: role || (userRole === "gm" ? "gm" : "player"),
      type,
      content: text,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, newMsg]);
    if (!isChatOpen) {
      setUnreadChatCount((prev) => prev + 1);
    }
  };

  // Send Roll Result to Chat
  const handleSendRollToChat = (roll: DiceRollResult) => {
    const newMsg: ChatMessage = {
      id: `roll-msg-${Date.now()}`,
      sender: roll.rollerName || userName,
      role: userRole === "gm" ? "gm" : "player",
      type: "roll",
      content: "",
      rollData: roll,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, newMsg]);
    if (!isChatOpen) {
      setUnreadChatCount((prev) => prev + 1);
    }
  };

  // Copy Room Link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Turn Navigation
  const handleNextTurn = () => {
    if (combatants.length === 0) return;
    if (currentTurnIndex + 1 >= combatants.length) {
      setCurrentTurnIndex(0);
      setRoundNumber((r) => r + 1);
    } else {
      setCurrentTurnIndex((i) => i + 1);
    }
  };

  const handlePreviousTurn = () => {
    if (combatants.length === 0) return;
    if (currentTurnIndex - 1 < 0) {
      setCurrentTurnIndex(combatants.length - 1);
      setRoundNumber((r) => Math.max(1, r - 1));
    } else {
      setCurrentTurnIndex((i) => i - 1);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-neutral-950 text-neutral-100 overflow-hidden font-sans select-none">
      {/* Primary Top Header Navigation Bar */}
      <header className="h-14 bg-neutral-950/95 border-b border-neutral-800/80 px-2 sm:px-4 flex items-center justify-between z-40 backdrop-blur-md gap-1.5 sm:gap-3">
        {/* Left Brand & Dual Play Mode Selector */}
        <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-neutral-950 font-bold shadow-md shadow-amber-500/20 flex-shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold font-serif tracking-wide text-amber-200 leading-tight">
                Natal RPG
              </h1>
              <span className="text-[9px] uppercase tracking-wider text-neutral-400 font-semibold block">
                {playMode === "physical" ? "Mesa Presencial" : "Mesa Virtual"}
              </span>
            </div>
          </div>

          <div className="h-5 w-px bg-neutral-800 hidden md:block" />

          {/* DUAL MODE SELECTOR: FEITO FORA VS FEITO DENTRO */}
          <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-xl p-0.5 sm:p-1 text-xs">
            <button
              onClick={() => {
                setPlayMode("physical");
                setActiveMainView("physical_companion");
              }}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-lg font-bold transition-all ${
                playMode === "physical"
                  ? "bg-gradient-to-r from-amber-600 to-amber-500 text-neutral-950 shadow-md"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
              title="Mesa Presencial (Para jogar ao vivo com amigos, TV/Projetor, pistas impressas e dados reais)"
            >
              <Home className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="hidden sm:inline">Mesa Presencial (Fora)</span>
              <span className="sm:hidden text-[11px]">Presencial</span>
            </button>

            <button
              onClick={() => {
                setPlayMode("virtual");
                setActiveMainView("map");
              }}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-lg font-bold transition-all ${
                playMode === "virtual"
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
              title="Mesa Virtual (Para jogar 100% online com Battlemap e miniaturas digitais)"
            >
              <Monitor className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="hidden sm:inline">Mesa Virtual (Dentro)</span>
              <span className="sm:hidden text-[11px]">Virtual</span>
            </button>
          </div>

          <div className="h-5 w-px bg-neutral-800 hidden xl:block" />

          {/* System Badge / Selector */}
          <div className="hidden xl:flex items-center bg-neutral-900 border border-neutral-800 rounded-xl p-1 text-xs">
            <button
              onClick={() => setSystem("ordem")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                system === "ordem"
                  ? "bg-purple-900/80 text-purple-200 border border-purple-600/60 shadow"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              Ordem
            </button>
            <button
              onClick={() => setSystem("dnd5e")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                system === "dnd5e"
                  ? "bg-amber-600/80 text-neutral-950 font-bold border border-amber-400/60 shadow"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              D&D 5e
            </button>
            <button
              onClick={() => setSystem("custom")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                system === "custom"
                  ? "bg-emerald-800/80 text-emerald-200 border border-emerald-600/60 shadow"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              Livre
            </button>
          </div>
        </div>

        {/* Center Main Stage View Tabs (Desktop / Tablet Header) */}
        <nav className="hidden md:flex items-center bg-neutral-900/90 border border-neutral-800 rounded-2xl p-1 overflow-x-auto max-w-full">
          {playMode === "physical" ? (
            <>
              <button
                onClick={() => setActiveMainView("physical_companion")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  activeMainView === "physical_companion"
                    ? "bg-gradient-to-r from-amber-600 to-amber-500 text-neutral-950 font-bold shadow"
                    : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
                }`}
              >
                <Tv className="w-3.5 h-3.5" />
                <span>Central Presencial & Pistas</span>
              </button>

              <button
                onClick={() => setActiveMainView("sheet")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  activeMainView === "sheet"
                    ? "bg-gradient-to-r from-amber-600 to-amber-500 text-neutral-950 font-bold shadow"
                    : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Ficha & Impressão</span>
              </button>

              <button
                onClick={() => setActiveMainView("soundboard")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  activeMainView === "soundboard"
                    ? "bg-gradient-to-r from-amber-600 to-amber-500 text-neutral-950 font-bold shadow"
                    : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
                }`}
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Som na Caixa</span>
              </button>

              <button
                onClick={() => setActiveMainView("ai_master")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  activeMainView === "ai_master"
                    ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold shadow"
                    : "text-purple-400 hover:text-purple-200 hover:bg-purple-950/40"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Gerador IA</span>
              </button>

              <button
                onClick={() => setActiveMainView("map")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  activeMainView === "map"
                    ? "bg-gradient-to-r from-amber-600 to-amber-500 text-neutral-950 font-bold shadow"
                    : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Mapa da Cena</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setActiveMainView("map")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  activeMainView === "map"
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow"
                    : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Grid de Batalha</span>
              </button>

              <button
                onClick={() => setActiveMainView("sheet")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  activeMainView === "sheet"
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow"
                    : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Ficha Digital</span>
              </button>

              <button
                onClick={() => setActiveMainView("ai_master")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  activeMainView === "ai_master"
                    ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold shadow"
                    : "text-purple-400 hover:text-purple-200 hover:bg-purple-950/40"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Mestre IA</span>
              </button>

              <button
                onClick={() => setActiveMainView("soundboard")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  activeMainView === "soundboard"
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow"
                    : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
                }`}
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Trilhas & Notas</span>
                <span className="lg:hidden">Som</span>
              </button>
            </>
          )}
        </nav>

        {/* Right Tools, Roles & Quick Launchers */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {/* System Dropdown for Small Screens (< xl) */}
          <div className="xl:hidden">
            <select
              value={system}
              onChange={(e) => setSystem(e.target.value as any)}
              className="bg-neutral-900 border border-neutral-800 rounded-xl px-2 py-1.5 text-xs text-neutral-300 font-semibold focus:outline-none focus:border-amber-500"
            >
              <option value="ordem">Ordem Paranormal</option>
              <option value="dnd5e">D&D 5e</option>
              <option value="custom">Sistema Livre</option>
            </select>
          </div>

          {/* Open TV Display button */}
          <button
            onClick={() => setShowPlayerDisplayModal(true)}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 transition-all shadow-sm"
            title="Abrir janela de exibição limpa sem segredos para a TV da sala ou projetor"
          >
            <Tv className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Telão TV</span>
          </button>

          {/* Quick Dice Drawer Launcher */}
          <button
            onClick={() => setShowDiceDrawer(!showDiceDrawer)}
            className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              showDiceDrawer
                ? "bg-amber-500 text-neutral-950 shadow-md"
                : "bg-neutral-900 border border-neutral-800 text-amber-300 hover:border-amber-500/50"
            }`}
            title="Abrir Torre de Dados"
          >
            <Dice5 className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Dados</span>
          </button>

          {/* Quick Initiative Drawer Launcher */}
          <button
            onClick={() => setShowInitiativeDrawer(!showInitiativeDrawer)}
            className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              showInitiativeDrawer
                ? "bg-amber-500 text-neutral-950 shadow-md"
                : "bg-neutral-900 border border-neutral-800 text-amber-300 hover:border-amber-500/50"
            }`}
            title="Ordem de Iniciativa do Combate"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden lg:inline">Iniciativa</span>
          </button>

          {/* Role Toggle (Mestre / Jogador) */}
          <button
            onClick={() => {
              const nextRole = userRole === "gm" ? "player" : "gm";
              setUserRole(nextRole);
              setUserName(nextRole === "gm" ? "Mestre" : system === "ordem" ? ordemChar.name : dndChar.name);
            }}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              userRole === "gm"
                ? "bg-amber-950/60 border-amber-600/70 text-amber-300"
                : "bg-neutral-900 border-neutral-800 text-neutral-300"
            }`}
            title="Alternar visão entre Mestre e Jogador"
          >
            {userRole === "gm" ? <Crown className="w-3.5 h-3.5 text-amber-400" /> : <Shield className="w-3.5 h-3.5 text-blue-400" />}
            <span className="hidden sm:inline">{userRole === "gm" ? "Mestre" : "Jogador"}</span>
          </button>

          {/* Chat Toggle Button (Universal for desktop collapsing & mobile opening) */}
          <button
            onClick={() => {
              setIsChatOpen(!isChatOpen);
              if (!isChatOpen) setUnreadChatCount(0);
            }}
            className={`relative p-2 rounded-xl text-xs font-bold border transition-all ${
              isChatOpen
                ? "bg-amber-500 text-neutral-950 border-amber-400 shadow-md"
                : "bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700"
            }`}
            title={isChatOpen ? "Ocultar Painel de Chat" : "Abrir Painel de Chat"}
          >
            <MessageSquare className="w-4 h-4" />
            {unreadChatCount > 0 && !isChatOpen && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-neutral-950 text-[10px] font-black rounded-full flex items-center justify-center shadow">
                {unreadChatCount}
              </span>
            )}
          </button>

          {/* Share Room Link */}
          <button
            onClick={handleCopyLink}
            className="p-2 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-300 hover:text-white hover:border-neutral-700 transition-colors hidden sm:block"
            title="Copiar Link da Mesa"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </header>

      {/* Main Workspace Area (Stage + Collapsible Chat Sidebar) */}
      <div className="flex-1 flex overflow-hidden relative pb-14 md:pb-0">
        {/* Main Stage View */}
        <main className="flex-1 h-full overflow-hidden relative">
          {activeMainView === "physical_companion" && (
            <PhysicalTabletopCompanion
              system={system}
              userRole={userRole}
              tokens={tokens}
              mapData={mapData}
              combatants={combatants}
              onUpdateTokens={(newTokens) => setTokens(newTokens)}
              onSendChatMessage={handleSendMessage}
              onOpenPlayerDisplay={() => setShowPlayerDisplayModal(true)}
            />
          )}

          {activeMainView === "map" && (
            <BattleMap
              map={mapData}
              tokens={tokens}
              system={system}
              userRole={userRole}
              currentTurnTokenId={activeTurnCombatant?.id}
              onUpdateTokens={(newTokens) => setTokens(newTokens)}
              onUpdateMap={(newMap) => setMapData((prev) => ({ ...prev, ...newMap }))}
              onSelectTokenForRoll={() => {
                setShowDiceDrawer(true);
              }}
            />
          )}

          {activeMainView === "sheet" && (
            <div className="h-full w-full overflow-y-auto">
              {system === "ordem" && (
                <CharacterSheetOrdem
                  character={ordemChar}
                  onUpdate={(c) => setOrdemChar(c)}
                  onSendRollToChat={handleSendRollToChat}
                />
              )}
              {system === "dnd5e" && (
                <CharacterSheetDnD
                  character={dndChar}
                  onUpdate={(c) => setDndChar(c)}
                  onSendRollToChat={handleSendRollToChat}
                />
              )}
              {system === "custom" && (
                <CharacterSheetCustom
                  character={customChar}
                  onUpdate={(c) => setCustomChar(c)}
                  onSendRollToChat={handleSendRollToChat}
                />
              )}
            </div>
          )}

          {activeMainView === "ai_master" && (
            <AIMasterPanel
              system={system}
              onSendToChat={(msg, role) => handleSendMessage(msg, "narration", role || "ai")}
              onAddTokenToMap={(tok) => setTokens((prev) => [...prev, tok])}
              activeCharacterName={system === "ordem" ? ordemChar.name : dndChar.name}
            />
          )}

          {activeMainView === "soundboard" && <SoundboardPanel />}
        </main>

        {/* Desktop Chat Sidebar (Collapsible with smooth animation) */}
        {isChatOpen && (
          <aside className="hidden lg:block w-80 xl:w-96 h-full flex-shrink-0 border-l border-neutral-800 z-30 transition-all">
            <ChatPanel
              messages={messages}
              currentUserName={userRole === "gm" ? "Mestre" : system === "ordem" ? ordemChar.name : dndChar.name}
              userRole={userRole}
              system={system}
              onSendMessage={handleSendMessage}
              onClearChat={() => setMessages([])}
            />
          </aside>
        )}

        {/* Mobile / Tablet Chat Slide-Over Drawer with Backdrop */}
        {isChatOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex justify-end">
            <div
              onClick={() => setIsChatOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
            />
            <div className="relative w-full max-w-sm sm:max-w-md h-full bg-neutral-950 border-l border-neutral-800 shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
              <div className="p-3 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/90">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-amber-400" />
                  <span className="font-serif font-bold text-xs text-amber-100">Chat & Rolagens</span>
                </div>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <ChatPanel
                  messages={messages}
                  currentUserName={userRole === "gm" ? "Mestre" : system === "ordem" ? ordemChar.name : dndChar.name}
                  userRole={userRole}
                  system={system}
                  onSendMessage={handleSendMessage}
                  onClearChat={() => setMessages([])}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation Bar (< md) for effortless thumb reach */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-neutral-950/95 border-t border-neutral-800/90 backdrop-blur-lg z-40 flex items-center justify-around px-1 select-none">
        {playMode === "physical" ? (
          <button
            onClick={() => setActiveMainView("physical_companion")}
            className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2 rounded-xl transition-all ${
              activeMainView === "physical_companion" ? "text-amber-400 font-bold" : "text-neutral-400"
            }`}
          >
            <Tv className="w-4 h-4" />
            <span className="text-[10px] tracking-tight">Presencial</span>
          </button>
        ) : (
          <button
            onClick={() => setActiveMainView("map")}
            className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2 rounded-xl transition-all ${
              activeMainView === "map" ? "text-purple-400 font-bold" : "text-neutral-400"
            }`}
          >
            <Compass className="w-4 h-4" />
            <span className="text-[10px] tracking-tight">Mapa</span>
          </button>
        )}

        <button
          onClick={() => setActiveMainView("sheet")}
          className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2 rounded-xl transition-all ${
            activeMainView === "sheet" ? "text-amber-400 font-bold" : "text-neutral-400"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span className="text-[10px] tracking-tight">Ficha</span>
        </button>

        <button
          onClick={() => setActiveMainView("ai_master")}
          className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2 rounded-xl transition-all ${
            activeMainView === "ai_master" ? "text-purple-400 font-bold" : "text-neutral-400"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-[10px] tracking-tight">Mestre IA</span>
        </button>

        <button
          onClick={() => setActiveMainView("soundboard")}
          className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2 rounded-xl transition-all ${
            activeMainView === "soundboard" ? "text-amber-400 font-bold" : "text-neutral-400"
          }`}
        >
          <Volume2 className="w-4 h-4" />
          <span className="text-[10px] tracking-tight">Som</span>
        </button>

        <button
          onClick={() => {
            setIsChatOpen(true);
            setUnreadChatCount(0);
          }}
          className="relative flex flex-col items-center justify-center gap-0.5 py-1 px-2 rounded-xl text-neutral-400 hover:text-white"
        >
          <MessageSquare className="w-4 h-4" />
          <span className="text-[10px] tracking-tight">Chat</span>
          {unreadChatCount > 0 && (
            <span className="absolute top-1 right-2 w-2 h-2 bg-amber-500 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setShowDiceDrawer(!showDiceDrawer)}
          className="flex flex-col items-center justify-center gap-0.5 py-1 px-2 rounded-xl text-amber-400"
        >
          <Dice5 className="w-4 h-4" />
          <span className="text-[10px] tracking-tight font-bold">Dados</span>
        </button>
      </nav>

      {/* Floating Popups & Modals */}
      {/* 1. Floating Dice Roller Drawer */}
      {showDiceDrawer && (
        <div
          className={`fixed bottom-16 md:bottom-4 z-50 w-[94vw] max-w-sm sm:max-w-md left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 ${
            isChatOpen ? "lg:right-[390px] xl:right-[400px] md:right-4" : "md:right-6"
          } animate-in slide-in-from-bottom-3 duration-150`}
        >
          <DiceRollerDrawer
            system={system}
            characterName={userRole === "gm" ? "Mestre" : system === "ordem" ? ordemChar.name : dndChar.name}
            onSendRoll={(roll) => {
              handleSendRollToChat(roll);
              setShowDiceDrawer(false);
            }}
            onClose={() => setShowDiceDrawer(false)}
          />
        </div>
      )}

      {/* 2. Floating Initiative Tracker Drawer */}
      {showInitiativeDrawer && (
        <div
          className={`fixed top-16 z-50 w-[94vw] max-w-sm sm:max-w-md left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 ${
            isChatOpen ? "lg:right-[390px] xl:right-[400px] md:right-4" : "md:right-6"
          } animate-in slide-in-from-top-3 duration-150`}
        >
          <InitiativeTracker
            combatants={combatants}
            currentTurnIndex={currentTurnIndex}
            round={roundNumber}
            userRole={userRole}
            system={system}
            onNextTurn={handleNextTurn}
            onPreviousTurn={handlePreviousTurn}
            onUpdateCombatants={(newComb) => setCombatants(newComb)}
            onResetEncounter={() => {
              setCurrentTurnIndex(0);
              setRoundNumber(1);
            }}
          />
        </div>
      )}

      {/* 3. Player Display Modal (TV / Projector for in-person gaming) */}
      {showPlayerDisplayModal && (
        <PlayerDisplayModal
          system={system}
          mapData={mapData}
          tokens={tokens}
          combatants={combatants}
          currentTurnIndex={currentTurnIndex}
          revealedHandout={{
            title: "Bilhete Rasgado com Resíduos de Lodo",
            content:
              "O tempo aqui dentro não corre como lá fora. Cada tique-taque do relógio do corredor central consome memórias. Se você estiver lendo isso, NÃO olhe nos espelhos com moldura dourada. O Lodo da Morte se alimenta de quem busca seu próprio reflexo...",
            author: "Dr. Alistair Vance (Desaparecido)",
            dateOrEra: "14 de Outubro, 2024",
            imageUrl:
              "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80",
          }}
          onClose={() => setShowPlayerDisplayModal(false)}
        />
      )}
    </div>
  );
}

export default App;
