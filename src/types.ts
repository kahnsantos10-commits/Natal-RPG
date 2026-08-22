export interface UndoStateSnapshot {
  timestamp: number;
  description: string;
  tokens: MapToken[];
  combatants: InitiativeCombatant[];
  mapData: MapData;
  currentTurnIndex: number;
  roundNumber: number;
}

export type RPGSystem = "dnd5e" | "ordem" | "custom" | "tormenta20";

export type UserRole = "gm" | "player";

export interface DiceRollResult {
  id: string;
  formula: string;
  diceType: string;
  rolls: number[];
  modifier: number;
  total: number;
  isCrit?: boolean;
  isFumble?: boolean;
  isCritical?: boolean;
  timestamp: number;
  rollerName: string;
  reason?: string;
  system?: RPGSystem;
  secretToGm?: boolean;
}

export type RollResult = DiceRollResult;

export interface InitiativeCombatant {
  id: string;
  name: string;
  initiative: number;
  hp: number;
  maxHp: number;
  type: "hero" | "enemy" | "npc" | "boss";
  avatar?: string;
  color?: string;
  conditions?: string[];
  reactionHeld?: boolean;
  reactionTrigger?: string;
}

export interface MapToken {
  id: string;
  name: string;
  type: "hero" | "enemy" | "npc" | "boss" | "object";
  system: RPGSystem;
  x: number;
  y: number;
  size: number; // in grid units
  hp: number;
  maxHp: number;
  tempHp?: number;
  san?: number;
  maxSan?: number;
  pe?: number;
  maxPe?: number;
  ac?: number;
  speed?: number;
  conditions: string[];
  color: string;
  avatar?: string;
  model3D?: string;
  z?: number; // vertical Z-axis height / altitude offset
  initiative?: number;
  hasActed?: boolean;
  notes?: string;
  owner?: string;
}

export interface AoETemplate {
  id: string;
  type: "circle" | "cone" | "cube" | "line";
  originX: number;
  originY: number;
  radius: number; // in grid cells
  color: string;
  label?: string;
  systemElement?: "fire" | "blood" | "death" | "energy" | "knowledge" | "generic";
}

export interface MapData {
  id?: string;
  name: string;
  gridWidth: number;
  gridHeight: number;
  gridSize: number; // pixels per square
  gridType?: "square" | "hex";
  bgUrl?: string;
  fogOfWar: boolean;
  revealedCells: string[]; // "x,y"
  aoeTemplates?: AoETemplate[];
  gmPrivateNotes?: { id: string; x: number; y: number; text: string; title: string }[];
  drawings?: {
    id: string;
    type: "pen" | "line" | "rect" | "circle";
    points: number[];
    color: string;
    width: number;
  }[];
  lighting?: "bright" | "dim" | "dark" | "paranormal_fog";
  pings?: { id: string; x: number; y: number; color: string; sender: string; timestamp: number }[];
}

export interface ChatMessage {
  id: string;
  sender: string;
  avatar?: string;
  role: "gm" | "player" | "ai" | "system";
  text?: string;
  content?: string;
  type?: "speech" | "action" | "ooc" | "whisper" | "dice" | "in_character" | "out_of_character" | "narration" | "roll";
  rollData?: DiceRollResult;
  diceResult?: {
    formula: string;
    total: number;
    rolls: number[];
    isCrit?: boolean;
    isFumble?: boolean;
    attribute?: string;
  };
  timestamp: number;
  target?: string;
}

// D&D 5e Character Sheet Types
export interface DnDCharacter {
  id: string;
  name: string;
  race: string;
  classAndLevel: string;
  background: string;
  alignment: string;
  xp?: number;
  experiencePoints?: number;
  stats: {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  };
  savingThrows?: Record<string, { proficient: boolean; modifier: number }>;
  proficiencies: {
    savingThrows?: string[];
    skills: Record<string, "none" | "proficient" | "expertise">;
    armor: string | string[];
    weapons: string | string[];
    tools: string | string[];
    languages: string | string[];
  };
  hp: {
    current: number;
    max: number;
    temp?: number;
  };
  hitDice: {
    total: number | string;
    current: number;
    die?: string;
  };
  deathSaves?: {
    successes: number;
    failures: number;
  };
  ac: number;
  initiative: number;
  speed: number;
  proficiencyBonus: number;
  inspiration: boolean;
  passivePerception?: number;
  attacks: {
    id: string;
    name: string;
    bonus: string;
    damage: string;
    type: string;
  }[];
  spellcasting: {
    ability: "str" | "dex" | "con" | "int" | "wis" | "cha";
    saveDc: number;
    attackBonus: number;
    slots: Record<number, { max: number; used: number }>;
    spells: {
      id: string;
      name: string;
      level: number;
      school: string;
      castingTime: string;
      range: string;
      duration: string;
      prepared: boolean;
      description: string;
    }[];
  };
  equipment: {
    id: string;
    name: string;
    qty: number;
    weight: number;
    notes?: string;
  }[];
  currency: {
    cp: number;
    sp: number;
    ep: number;
    gp: number;
    pp: number;
  };
  features?: {
    id: string;
    name: string;
    source: string;
    description: string;
  }[];
  featuresAndTraits?: {
    id: string;
    name: string;
    source: string;
    description: string;
  }[];
  avatar?: string;
}

// Ordem Paranormal Sheet Types
export interface OrdemCharacter {
  id: string;
  name: string;
  player?: string;
  origin: string;
  classType: "Combatente" | "Especialista" | "Ocultista" | "Mundano";
  track: string; // Trilha
  rank: "Recruta" | "Operador" | "Agente Especial" | "Oficial de Operações" | "Agente de Elite";
  nex: number; // Nível de Exposição Paranormal %
  pePerRound?: number;
  attributes: {
    agi: number;
    for: number;
    int: number;
    pre: number;
    vig: number;
  };
  pv: { current: number; max: number; temp?: number }; // Pontos de Vida
  san: { current: number; max: number; temp?: number }; // Sanidade
  pe: { current: number; max: number; temp?: number }; // Pontos de Esforço
  defense: number;
  dodge: number;
  block: number;
  movement?: number;
  skills: Record<string, { attribute: "agi" | "for" | "int" | "pre" | "vig"; training: "none" | "treinado" | "veterano" | "expert"; bonus: number }>;
  weapons: {
    id: string;
    name: string;
    type: string;
    damage: string;
    critical: string;
    range: string;
    category: "I" | "II" | "III" | "IV" | "0";
    spaces: number;
  }[];
  rituals: {
    id: string;
    name: string;
    element: "Conhecimento" | "Energia" | "Morte" | "Sangue" | "Medo";
    circle: 1 | 2 | 3 | 4;
    costPe: number;
    castTime: string;
    range: string;
    target: string;
    duration: string;
    resistence: string;
    description: string;
  }[];
  inventory: {
    id: string;
    name: string;
    category: "0" | "I" | "II" | "III" | "IV";
    spaces: number;
    details: string;
  }[];
  maxSpaces?: number;
  abilities?: {
    id: string;
    name: string;
    costPe?: number;
    description: string;
  }[];
  paranormalPowers?: {
    id: string;
    name: string;
    element: string;
    description: string;
  }[];
  elementAffinity?: "Conhecimento" | "Energia" | "Morte" | "Sangue" | "Nenhuma";
  avatar?: string;
}

// Custom / Ficha Livre Character
export interface CustomCharacter {
  id: string;
  name: string;
  systemName: string;
  concept: string;
  avatar?: string;
  bars: {
    id: string;
    name: string;
    current: number;
    max: number;
    color: string;
  }[];
  attributes: {
    id: string;
    name: string;
    value: number | string;
    modifier?: string;
  }[];
  skills: {
    id: string;
    name: string;
    value: number | string;
    formula?: string;
  }[];
  items?: {
    id: string;
    name: string;
    qty: number;
    notes: string;
  }[];
  notes: string;
}

// Session History Timeline Event
export interface SessionHistoryEvent {
  id: string;
  type: "narration" | "roll" | "combat" | "note" | "clue" | "system";
  title: string;
  description: string;
  timestamp: number;
  author?: string;
  details?: {
    diceFormula?: string;
    total?: number;
    isCrit?: boolean;
    isFumble?: boolean;
    characterName?: string;
    defeatedEnemies?: string[];
    clueTitle?: string;
  };
}

// User Profile / Auth State
export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  role: UserRole;
  preferredSystem: RPGSystem;
  savedSessionIds: string[];
}

// Session & Room full payload
export interface RoomState {
  id: string;
  code: string;
  name: string;
  system: RPGSystem;
  gmName: string;
  password?: string;
  description?: string;
  map: MapData;
  maps: MapData[];
  tokens: MapToken[];
  initiativeOrder: string[];
  currentTurnIndex: number;
  roundNumber: number;
  inCombat: boolean;
  messages: ChatMessage[];
  history: SessionHistoryEvent[];
  createdAt: number;
  lastUpdated: number;
  version?: number;
}

export type RoomData = RoomState;

