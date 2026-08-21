import React, { useState, useEffect, useCallback } from "react";
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
  SessionHistoryEvent,
  RoomState,
  UndoStateSnapshot,
} from "./types";
import { BattleMap } from "./components/BattleMap";
import { BattleMap3D } from "./components/BattleMap3D";
import { CharacterSheetDnD } from "./components/CharacterSheetDnD";
import { CharacterSheetOrdem } from "./components/CharacterSheetOrdem";
import { CharacterSheetCustom } from "./components/CharacterSheetCustom";
import { CharacterCreatorModal } from "./components/CharacterCreatorModal";
import { AIMasterPanel } from "./components/AIMasterPanel";
import { DiceRollerDrawer } from "./components/DiceRollerDrawer";
import { InitiativeTracker } from "./components/InitiativeTracker";
import { ChatPanel } from "./components/ChatPanel";
import { SoundboardPanel } from "./components/SoundboardPanel";
import { PhysicalTabletopCompanion } from "./components/PhysicalTabletopCompanion";
import { PlayerDisplayModal } from "./components/PlayerDisplayModal";
import { SessionManagerModal } from "./components/SessionManagerModal";
import { MapManagerModal } from "./components/MapManagerModal";
import { SessionHistoryModal } from "./components/SessionHistoryModal";
import { CampaignBackupModal, CampaignBackupPayload } from "./components/CampaignBackupModal";
import { Dice3DAnimationOverlay } from "./components/Dice3DAnimationOverlay";
import { LoginScreen } from "./components/LoginScreen";
import { OnboardingModal } from "./components/OnboardingModal";
import { rpgAudio } from "./utils/audioSynth";
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
  ChevronDown,
  Key,
  Users,
  Clock,
  Layers,
  Share2,
  LogIn,
  Database,
  RotateCcw,
  RotateCw,
  Trash2
} from "lucide-react";

// Clean Initial Blank Data (Sem exemplos mock - Pronto para testar do zero)
const blankDnDChar: DnDCharacter = {
  id: "dnd-char-blank",
  name: "Novo Herói",
  race: "Humano",
  classAndLevel: "Aventureiro Nível 1",
  background: "Aventureiro",
  alignment: "Neutro",
  xp: 0,
  inspiration: false,
  proficiencyBonus: 2,
  ac: 10,
  initiative: 0,
  speed: 9,
  hp: { current: 10, max: 10, temp: 0 },
  hitDice: { total: 1, current: 1, die: "1d8" },
  stats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
  savingThrows: {
    str: { proficient: false, modifier: 0 },
    dex: { proficient: false, modifier: 0 },
    con: { proficient: false, modifier: 0 },
    int: { proficient: false, modifier: 0 },
    wis: { proficient: false, modifier: 0 },
    cha: { proficient: false, modifier: 0 },
  },
  proficiencies: {
    skills: {},
    armor: "Armaduras Simples",
    weapons: "Armas Simples",
    tools: "",
    languages: "Comum",
  },
  attacks: [],
  spellcasting: {
    ability: "int",
    saveDc: 10,
    attackBonus: 2,
    slots: {
      1: { max: 0, used: 0 },
      2: { max: 0, used: 0 },
    },
    spells: [],
  },
  equipment: [],
  currency: { cp: 0, sp: 0, ep: 0, gp: 10, pp: 0 },
  features: [],
};

const blankOrdemChar: OrdemCharacter = {
  id: "ordem-char-blank",
  name: "Agente Novo",
  classType: "Combatente",
  origin: "Acadêmico",
  rank: "Recruta",
  track: "Guerreiro",
  nex: 5,
  pePerRound: 1,
  pv: { current: 20, max: 20, temp: 0 },
  san: { current: 20, max: 20, temp: 0 },
  pe: { current: 5, max: 5, temp: 0 },
  attributes: { agi: 1, for: 1, int: 1, pre: 1, vig: 1 },
  defense: 10,
  dodge: 10,
  block: 0,
  skills: {},
  weapons: [],
  rituals: [],
  inventory: [],
  paranormalPowers: [],
};

const blankCustomChar: CustomCharacter = {
  id: "custom-char-blank",
  name: "Personagem Livre",
  systemName: "Sistema Personalizado",
  concept: "Novo Conceito",
  bars: [
    { id: "b1", name: "Pontos de Vida (PV)", current: 20, max: 20, color: "bg-red-500" },
    { id: "b2", name: "Energia / PM", current: 10, max: 10, color: "bg-blue-500" },
  ],
  attributes: [
    { id: "at1", name: "FOR", value: 10, modifier: "+0" },
    { id: "at2", name: "DES", value: 10, modifier: "+0" },
    { id: "at3", name: "INT", value: 10, modifier: "+0" },
  ],
  skills: [],
  items: [],
  notes: "",
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
  const [roomId, setRoomId] = useState("sala-ordem");
  const [roomCode, setRoomCode] = useState("ORDEM1");
  const [roomName, setRoomName] = useState("Sessão Principal de RPG");
  const [system, setSystem] = useState<RPGSystem>("ordem");
  const [userRole, setUserRole] = useState<UserRole>("gm");
  const [userName, setUserName] = useState<string>("Mestre");
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  // Read-only mode detection
  const [isReadOnly, setIsReadOnly] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("readonly") === "true") {
      setIsReadOnly(true);
    }
  }, []);

  // ... (inside the return statement, pass readOnly={isReadOnly} to BattleMap)
  const [showLoginScreen, setShowLoginScreen] = useState(false);
  const [activeRevealedHandout, setActiveRevealedHandout] = useState<any | undefined>(undefined);

  // Onboarding Modal
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("onboarding_shown")) {
      setShowOnboarding(true);
    }
  }, []);

  // Load saved session on mount or prompt login
  useEffect(() => {
    try {
      const saved = localStorage.getItem("rpg_user_session");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.system) setSystem(parsed.system);
        if (parsed.userRole) setUserRole(parsed.userRole);
        if (parsed.userName) setUserName(parsed.userName);
        if (parsed.roomCode) setRoomCode(parsed.roomCode);
        if (parsed.roomName) setRoomName(parsed.roomName);
      }
    } catch (e) {
      console.warn("Nao foi possivel carregar sessao", e);
    }
  }, []);

  // Modals State
  const [showSessionManager, setShowSessionManager] = useState(false);
  const [showMapManager, setShowMapManager] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);

  // Restore full campaign backup from JSON payload
  const handleImportBackup = (payload: CampaignBackupPayload) => {
    if (payload.room) {
      if (payload.room.code) setRoomCode(payload.room.code);
      if (payload.room.name) setRoomName(payload.room.name);
      if (payload.room.system) setSystem(payload.room.system as RPGSystem);
    }
    if (payload.mapData) setMapData(payload.mapData);
    if (payload.availableMaps && payload.availableMaps.length > 0) setAvailableMaps(payload.availableMaps);
    if (payload.tokens) setTokens(payload.tokens);
    if (payload.combatants) setCombatants(payload.combatants);
    if (payload.historyEvents) setHistoryEvents(payload.historyEvents);
    if (payload.messages) setMessages(payload.messages);
    if (payload.characters) {
      if (payload.characters.dndChar) setDndChar(payload.characters.dndChar);
      if (payload.characters.ordemChar) setOrdemChar(payload.characters.ordemChar);
      if (payload.characters.customChar) setCustomChar(payload.characters.customChar);
    }
  };

  // Active Main View Tab & Map View Modes
  const [activeMainView, setActiveMainView] = useState<"physical_companion" | "map" | "sheet" | "ai_master" | "soundboard">("physical_companion");
  const [mapViewMode, setMapViewMode] = useState<"2d" | "3d">("2d");
  const [showCharacterCreator, setShowCharacterCreator] = useState(false);

  const handleCreateCharacter = (charData: any, tokenData: Omit<MapToken, "id">) => {
    pushUndoSnapshot("Criar Personagem & Token 3D");

    const tokenId = `tok-${Date.now()}`;
    const newToken: MapToken = {
      id: tokenId,
      ...tokenData,
    };

    setTokens((prev) => [...prev, newToken]);

    const newCombatant: InitiativeCombatant = {
      id: tokenId,
      name: newToken.name,
      initiative: 10 + Math.floor(Math.random() * 10),
      hp: newToken.hp,
      maxHp: newToken.maxHp,
      type: newToken.type === "object" ? "enemy" : newToken.type,
      avatar: newToken.avatar,
      color: newToken.color,
    };
    setCombatants((prev) => [...prev, newCombatant]);

    if (system === "dnd5e") setDndChar(charData);
    if (system === "ordem") setOrdemChar(charData);
    if (system === "custom") setCustomChar(charData);

    handleAddHistoryEvent({
      type: "system",
      title: "Personagem Criado",
      description: `${charData.name} foi inserido no jogo com miniatura Token no mapa!`,
      author: userRole === "gm" ? "Mestre" : "Jogador",
    });

    setShowCharacterCreator(false);
    setActiveMainView("sheet");
    rpgAudio.playSpellCast();
  };

  // Floating Overlay Panels
  const [showDiceDrawer, setShowDiceDrawer] = useState(false);
  const [showInitiativeDrawer, setShowInitiativeDrawer] = useState(false);

  // Active 3D Rolling Dice Animation State
  const [activeRollingDice, setActiveRollingDice] = useState<DiceRollResult | null>(null);

  // Map Data State & Available Maps in this Session (Iniciado Limpo do Zero)
  const [mapData, setMapData] = useState<MapData>({
    id: "map-default",
    name: "Mapa Inicial",
    gridWidth: 10,
    gridHeight: 10,
    gridSize: 50,
    bgUrl: "",
    fogOfWar: false,
    revealedCells: [],
    lighting: "bright",
    pings: [],
  });

  const [availableMaps, setAvailableMaps] = useState<MapData[]>([]);

  // Session History Events (Iniciado Limpo do Zero)
  const [historyEvents, setHistoryEvents] = useState<SessionHistoryEvent[]>([]);

  // Tokens on Map (Iniciado Limpo do Zero)
  const [tokens, setTokens] = useState<MapToken[]>([]);

  // Initiative Combatants (Iniciado Limpo do Zero)
  const [combatants, setCombatants] = useState<InitiativeCombatant[]>([]);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [roundNumber, setRoundNumber] = useState(1);

  // Game Master Undo / Redo State Stack
  const [undoStack, setUndoStack] = useState<UndoStateSnapshot[]>([]);
  const [redoStack, setRedoStack] = useState<UndoStateSnapshot[]>([]);
  const [undoNotice, setUndoNotice] = useState<{ message: string; type: "undo" | "redo" } | null>(null);

  // Save current game state snapshot into history stack before a mutation
  const pushUndoSnapshot = useCallback(
    (description: string) => {
      setUndoStack((prev) => {
        const snapshot: UndoStateSnapshot = {
          timestamp: Date.now(),
          description,
          tokens: JSON.parse(JSON.stringify(tokens)),
          combatants: JSON.parse(JSON.stringify(combatants)),
          mapData: JSON.parse(JSON.stringify(mapData)),
          currentTurnIndex,
          roundNumber,
        };
        // Throttle rapid identical snapshot pushes
        if (prev.length > 0) {
          const top = prev[prev.length - 1];
          if (top.description === description && Date.now() - top.timestamp < 150) {
            return prev;
          }
        }
        return [...prev.slice(-29), snapshot];
      });
      setRedoStack([]);
    },
    [tokens, combatants, mapData, currentTurnIndex, roundNumber]
  );

  // Undo Handler
  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;

    const currentSnapshot: UndoStateSnapshot = {
      timestamp: Date.now(),
      description: "Estado Atual",
      tokens: JSON.parse(JSON.stringify(tokens)),
      combatants: JSON.parse(JSON.stringify(combatants)),
      mapData: JSON.parse(JSON.stringify(mapData)),
      currentTurnIndex,
      roundNumber,
    };

    const lastSnapshot = undoStack[undoStack.length - 1];
    const newUndoStack = undoStack.slice(0, undoStack.length - 1);

    setUndoStack(newUndoStack);
    setRedoStack((prev) => [...prev, currentSnapshot]);

    setTokens(lastSnapshot.tokens);
    setCombatants(lastSnapshot.combatants);
    setMapData(lastSnapshot.mapData);
    setCurrentTurnIndex(lastSnapshot.currentTurnIndex);
    setRoundNumber(lastSnapshot.roundNumber);

    rpgAudio.playTokenMove();
    setUndoNotice({
      message: `Ação desfeita: ${lastSnapshot.description}`,
      type: "undo",
    });
    setTimeout(() => setUndoNotice(null), 3000);
  }, [undoStack, tokens, combatants, mapData, currentTurnIndex, roundNumber]);

  // Redo Handler
  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;

    const currentSnapshot: UndoStateSnapshot = {
      timestamp: Date.now(),
      description: "Estado Atual",
      tokens: JSON.parse(JSON.stringify(tokens)),
      combatants: JSON.parse(JSON.stringify(combatants)),
      mapData: JSON.parse(JSON.stringify(mapData)),
      currentTurnIndex,
      roundNumber,
    };

    const nextSnapshot = redoStack[redoStack.length - 1];
    const newRedoStack = redoStack.slice(0, redoStack.length - 1);

    setRedoStack(newRedoStack);
    setUndoStack((prev) => [...prev, currentSnapshot]);

    setTokens(nextSnapshot.tokens);
    setCombatants(nextSnapshot.combatants);
    setMapData(nextSnapshot.mapData);
    setCurrentTurnIndex(nextSnapshot.currentTurnIndex);
    setRoundNumber(nextSnapshot.roundNumber);

    rpgAudio.playTokenMove();
    setUndoNotice({
      message: `Ação refeita: ${nextSnapshot.description}`,
      type: "redo",
    });
    setTimeout(() => setUndoNotice(null), 3000);
  }, [redoStack, tokens, combatants, mapData, currentTurnIndex, roundNumber]);

  // Keyboard Shortcuts (Ctrl+Z to Undo, Ctrl+Y or Ctrl+Shift+Z to Redo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (userRole !== "gm") return;
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [userRole, handleUndo, handleRedo]);

  // Characters Data (Iniciados Limpos do Zero)
  const [dndChar, setDndChar] = useState<DnDCharacter>(blankDnDChar);
  const [ordemChar, setOrdemChar] = useState<OrdemCharacter>(blankOrdemChar);
  const [customChar, setCustomChar] = useState<CustomCharacter>(blankCustomChar);

  // Chat Messages (Iniciado Limpo do Zero)
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const activeTurnCombatant = combatants[currentTurnIndex];

  // Add History Event to timeline & server
  const handleAddHistoryEvent = (eventData: Omit<SessionHistoryEvent, "id" | "timestamp">) => {
    const newEvent: SessionHistoryEvent = {
      id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      ...eventData,
    };
    setHistoryEvents((prev) => [newEvent, ...prev]);

    // Send to backend
    fetch(`/api/rooms/${roomId}/history`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newEvent),
    }).catch((err) => console.warn("Failed to persist history event to server:", err));
  };

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

    // If narration, auto-record significant events in history
    if (type === "narration" || role === "ai") {
      handleAddHistoryEvent({
        type: "narration",
        title: "Narração do Mestre",
        description: text.slice(0, 180) + (text.length > 180 ? "..." : ""),
        author: "Mestre IA",
      });
    }
  };

  // Send Roll Result to Chat & Timeline
  const handleSendRollToChat = (roll: DiceRollResult) => {
    // Trigger 3D Dice Animation Overlay
    setActiveRollingDice(roll);

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

    // Log roll to session history
    const isCrit = roll.isCrit || roll.isCritical || (roll.rolls && roll.rolls.includes(20));
    const isFumble = roll.isFumble || (roll.rolls && roll.rolls.includes(1));

    handleAddHistoryEvent({
      type: "roll",
      title: `${roll.reason || "Rolagem de Dados"}: ${roll.total}`,
      description: `${roll.rollerName || userName} rolou ${roll.formula} obtendo [${(roll.rolls || []).join(", ")}] = ${roll.total}`,
      author: roll.rollerName || userName,
      details: {
        diceFormula: roll.formula,
        total: roll.total,
        isCrit,
        isFumble,
      },
    });
  };

  // Reset Tabletop Clean from Scratch
  const handleResetToZero = () => {
    if (confirm("Tem certeza que deseja limpar tudo e começar a testar do zero?")) {
      setTokens([]);
      setCombatants([]);
      setMessages([]);
      setHistoryEvents([]);
      setDndChar(blankDnDChar);
      setOrdemChar(blankOrdemChar);
      setCustomChar(blankCustomChar);
      setMapData({
        id: "map-1",
        name: "Mapa Principal",
        gridWidth: 20,
        gridHeight: 16,
        gridSize: 50,
        bgUrl: "",
        fogOfWar: false,
        revealedCells: [],
        lighting: "bright",
        pings: [],
      });
      setAvailableMaps([
        {
          id: "map-1",
          name: "Mapa Principal",
          gridWidth: 20,
          gridHeight: 16,
          gridSize: 50,
          bgUrl: "",
          fogOfWar: false,
          revealedCells: [],
          lighting: "bright",
          pings: [],
        },
      ]);
      rpgAudio.playSpellCast();
    }
  };

  // Select / Switch Room
  const handleSelectRoom = async (newRoomId: string, newSystem?: RPGSystem, newRole?: UserRole, newUserName?: string) => {
    try {
      const res = await fetch(`/api/rooms/${newRoomId}`);
      if (res.ok) {
        const room: RoomState = await res.json();
        setRoomId(room.id);
        setRoomCode(room.code || room.id.toUpperCase());
        setRoomName(room.name);
        if (room.system) setSystem(room.system);
        if (room.map) setMapData(room.map);
        if (room.maps && room.maps.length > 0) setAvailableMaps(room.maps);
        if (room.tokens) setTokens(room.tokens);
        if (room.history && room.history.length > 0) setHistoryEvents(room.history);
      }
    } catch (err) {
      console.warn("Could not fetch remote room, setting locally", err);
      setRoomId(newRoomId);
      setRoomCode(newRoomId.toUpperCase());
    }

    if (newSystem) setSystem(newSystem);
    if (newRole) setUserRole(newRole);
    if (newUserName) setUserName(newUserName);
  };

  // Create Room Handler
  const handleCreateRoom = (params: { name: string; system: RPGSystem; gmName: string; code?: string; password?: string; description?: string }) => {
    setRoomName(params.name);
    setSystem(params.system);
    setUserRole("gm");
    setUserName(params.gmName);
    if (params.code) setRoomCode(params.code);

    handleAddHistoryEvent({
      type: "system",
      title: "Nova Campanha Criada",
      description: `Mesa "${params.name}" criada com código ${params.code || "NATAL"} no sistema ${params.system.toUpperCase()}`,
      author: params.gmName,
    });
  };

  // Map Management: Save & Select Map
  const handleSaveMap = (newMap: MapData) => {
    setMapData(newMap);
    setAvailableMaps((prev) => {
      const exists = prev.some((m) => m.id === newMap.id || m.name === newMap.name);
      if (exists) {
        return prev.map((m) => (m.id === newMap.id || m.name === newMap.name ? newMap : m));
      }
      return [...prev, newMap];
    });

    handleAddHistoryEvent({
      type: "note",
      title: `Mudança de Cenário: ${newMap.name}`,
      description: `O Mestre carregou o mapa "${newMap.name}" (${newMap.gridWidth}x${newMap.gridHeight} células) para a cena atual.`,
      author: userName,
    });

    // Sync with backend
    fetch(`/api/rooms/${roomId}/maps`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ map: newMap }),
    }).catch((err) => console.warn("Failed to persist map to server", err));
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
    pushUndoSnapshot("Avançar Turno de Combate");
    if (currentTurnIndex + 1 >= combatants.length) {
      setCurrentTurnIndex(0);
      setRoundNumber((r) => r + 1);
    } else {
      setCurrentTurnIndex((i) => i + 1);
    }
  };

  const handlePreviousTurn = () => {
    if (combatants.length === 0) return;
    pushUndoSnapshot("Voltar Turno de Combate");
    if (currentTurnIndex - 1 < 0) {
      setCurrentTurnIndex(combatants.length - 1);
      setRoundNumber((r) => Math.max(1, r - 1));
    } else {
      setCurrentTurnIndex((i) => i - 1);
    }
  };

  const handleResetEncounter = () => {
    pushUndoSnapshot("Reiniciar Combate");
    setCurrentTurnIndex(0);
    setRoundNumber(1);
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
        <nav className="hidden md:flex items-center bg-neutral-900/90 border border-neutral-800 rounded-2xl p-1 overflow-x-auto max-w-full gap-1">
          <button
            onClick={() => setActiveMainView("physical_companion")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeMainView === "physical_companion"
                ? "bg-gradient-to-r from-amber-600 to-amber-500 text-neutral-950 font-bold shadow"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Mesa Presencial</span>
          </button>

          {/* Map Tab with 2D / 3D Mode Selector */}
          <div className="flex items-center bg-neutral-950/80 rounded-xl p-0.5 border border-neutral-800/80">
            <button
              onClick={() => {
                setActiveMainView("map");
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeMainView === "map"
                  ? "bg-amber-500 text-neutral-950 font-bold shadow"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Mapa de Batalha</span>
            </button>

            {activeMainView === "map" && (
              <div className="flex items-center border-l border-neutral-800 pl-1 ml-0.5 gap-0.5">
                <button
                  onClick={() => setMapViewMode("2d")}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider transition-all ${
                    mapViewMode === "2d"
                      ? "bg-amber-400 text-neutral-950"
                      : "text-neutral-500 hover:text-neutral-300"
                  }`}
                  title="Modo Visão Tática 2D Grid"
                >
                  2D
                </button>
                <button
                  onClick={() => setMapViewMode("3d")}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider transition-all ${
                    mapViewMode === "3d"
                      ? "bg-gradient-to-r from-amber-400 to-amber-500 text-neutral-950 shadow"
                      : "text-amber-400 hover:text-amber-300 bg-amber-950/40"
                  }`}
                  title="Modo Visão 3D Relevo e 1ª Pessoa"
                >
                  3D 👁️
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => setActiveMainView("sheet")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeMainView === "sheet"
                ? "bg-gradient-to-r from-amber-600 to-amber-500 text-neutral-950 font-bold shadow"
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
                ? "bg-gradient-to-r from-amber-600 to-amber-500 text-neutral-950 font-bold shadow"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Som & Trilhas</span>
            <span className="lg:hidden">Som</span>
          </button>
        </nav>

        {/* Right Tools, Roles & Quick Launchers */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {/* Quick Character Creator Launcher Button */}
          <button
            onClick={() => setShowCharacterCreator(true)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 transition-all shadow-md shadow-amber-500/20 active:scale-95 whitespace-nowrap"
            title="Criar Novo Personagem & Token 3D"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">+ Criar Personagem</span>
            <span className="sm:hidden">+ Char</span>
          </button>
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

          {/* Session / Room Code Quick Launcher */}
          <button
            onClick={() => setShowSessionManager(true)}
            className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-bold bg-neutral-900 border border-neutral-800 hover:border-amber-500/60 text-neutral-200 transition-all shadow-sm group"
            title="Gerenciar Sessão, Criar Mesa ou Entrar por Código"
          >
            <Key className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform" />
            <span className="font-mono text-amber-400 hidden sm:inline tracking-wider font-bold">[{roomCode}]</span>
            <span className="hidden xl:inline text-neutral-400 font-normal truncate max-w-[90px]">{roomName}</span>
          </button>

          {/* Map Manager Launcher */}
          <button
            onClick={() => setShowMapManager(true)}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-bold bg-neutral-900 border border-neutral-800 hover:border-amber-500/60 text-neutral-300 transition-all"
            title="Criar, Gerenciar e Alternar Mapas de Batalha"
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Mapas</span>
            <span className="px-1.5 py-0.2 bg-neutral-800 rounded-md text-[10px] text-amber-300 hidden md:inline">
              {availableMaps.length}
            </span>
          </button>

          {/* Session History & Chronicle Launcher */}
          <button
            onClick={() => setShowHistoryModal(true)}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-bold bg-neutral-900 border border-neutral-800 hover:border-amber-500/60 text-neutral-300 transition-all"
            title="Diário de Bordo & Histórico da Campanha"
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Histórico</span>
            {historyEvents.length > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-md text-[10px] hidden lg:inline">
                {historyEvents.length}
              </span>
            )}
          </button>

          {/* Backup & Restauração JSON */}
          <button
            onClick={() => setShowBackupModal(true)}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-bold bg-neutral-900 border border-neutral-800 hover:border-amber-500/60 text-amber-300 transition-all"
            title="Exportar ou Restaurar Backup Completo (.JSON)"
          >
            <Database className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden xl:inline">Backup</span>
          </button>

          {/* Reset / Clean to Zero */}
          <button
            onClick={handleResetToZero}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-bold bg-neutral-900 border border-neutral-800 hover:border-red-500/60 text-red-400 hover:text-red-300 transition-all"
            title="Limpar todos os dados e começar a testar do zero"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
            <span className="hidden xl:inline">Limpar do Zero</span>
          </button>

          {/* GM Undo & Redo Quick Actions */}
          {userRole === "gm" && (
            <div className="flex items-center gap-1">
              <button
                onClick={handleUndo}
                disabled={undoStack.length === 0}
                className={`flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  undoStack.length > 0
                    ? "bg-amber-950/80 border-amber-500/80 text-amber-300 hover:bg-amber-900 shadow-sm"
                    : "bg-neutral-900/60 border-neutral-800 text-neutral-600 cursor-not-allowed opacity-50"
                }`}
                title={
                  undoStack.length > 0
                    ? `Desfazer última ação: ${undoStack[undoStack.length - 1].description} [Ctrl+Z]`
                    : "Nenhuma ação recente para desfazer"
                }
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden lg:inline">Desfazer</span>
                {undoStack.length > 0 && (
                  <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded-md text-[10px] font-mono font-bold">
                    {undoStack.length}
                  </span>
                )}
              </button>

              {redoStack.length > 0 && (
                <button
                  onClick={handleRedo}
                  className="flex items-center gap-1 px-2 py-1.5 bg-neutral-900 border border-neutral-800 hover:border-amber-500/60 text-neutral-300 hover:text-amber-300 rounded-xl text-xs font-bold transition-all shadow-sm"
                  title={`Refazer ação: ${redoStack[redoStack.length - 1].description} [Ctrl+Y]`}
                >
                  <RotateCw className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="hidden xl:inline">Refazer</span>
                </button>
              )}
            </div>
          )}

          {/* Open TV Display button */}
          <button
            onClick={() => setShowPlayerDisplayModal(true)}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 transition-all shadow-sm"
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

          {/* Login / Connect Button */}
          <button
            onClick={() => setShowLoginScreen(true)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 rounded-xl text-xs font-black shadow transition-all active:scale-95"
            title="Abrir Tela de Login / Selecionar Perfil"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Entrar</span>
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
              onUndo={handleUndo}
              canUndo={undoStack.length > 0}
              undoCount={undoStack.length}
              lastUndoDescription={undoStack.length > 0 ? undoStack[undoStack.length - 1].description : undefined}
              onSaveSnapshot={pushUndoSnapshot}
            />
          )}

          {activeMainView === "map" && (
            mapViewMode === "3d" ? (
              <BattleMap3D
                map={mapData}
                tokens={tokens}
                system={system}
                userRole={userRole}
                currentTurnTokenId={activeTurnCombatant?.id}
                onUpdateTokens={(newTokens) => setTokens(newTokens)}
                onUpdateMap={(newMap) => setMapData((prev) => ({ ...prev, ...newMap }))}
                onSelectTokenForRoll={() => setShowDiceDrawer(true)}
                onUndo={handleUndo}
                canUndo={undoStack.length > 0}
                onSaveSnapshot={pushUndoSnapshot}
                onFallbackTo2D={() => setMapViewMode("2d")}
              />
            ) : (
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
                onUndo={handleUndo}
                canUndo={undoStack.length > 0}
                undoCount={undoStack.length}
                lastUndoDescription={undoStack.length > 0 ? undoStack[undoStack.length - 1].description : undefined}
                onSaveSnapshot={pushUndoSnapshot}
              />
            )
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
              onRollClick={(roll) => setActiveRollingDice({ ...roll })}
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
                  onRollClick={(roll) => setActiveRollingDice({ ...roll })}
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
            onResetEncounter={handleResetEncounter}
            onUndo={handleUndo}
            canUndo={undoStack.length > 0}
            undoCount={undoStack.length}
            lastUndoDescription={undoStack.length > 0 ? undoStack[undoStack.length - 1].description : undefined}
            onSaveSnapshot={pushUndoSnapshot}
            onSendMessage={handleSendMessage}
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
          revealedHandout={activeRevealedHandout}
          onClose={() => setShowPlayerDisplayModal(false)}
        />
      )}

      {/* 4. Session & Room Code Access Modal */}
      {showSessionManager && (
        <SessionManagerModal
          currentRoomId={roomId}
          currentRoomCode={roomCode}
          currentRoomName={roomName}
          currentSystem={system}
          currentUserRole={userRole}
          currentUserName={userName}
          onSelectRoom={handleSelectRoom}
          onCreateRoom={handleCreateRoom}
          onClose={() => setShowSessionManager(false)}
        />
      )}

      {/* 5. Map Manager & Creator Modal */}
      {showMapManager && (
        <MapManagerModal
          currentMap={mapData}
          availableMaps={availableMaps}
          system={system}
          onSelectMap={(selectedMap) => {
            setMapData(selectedMap);
            handleSaveMap(selectedMap);
          }}
          onCreateMap={(newMap) => {
            handleSaveMap(newMap);
          }}
          onDeleteMap={(delId) => {
            if (availableMaps.length > 1) {
              setAvailableMaps((prev) => prev.filter((m) => m.id !== delId));
            }
          }}
          onClose={() => setShowMapManager(false)}
        />
      )}

      {/* 6. Session History & Campaign Diary Modal */}
      {showHistoryModal && (
        <SessionHistoryModal
          roomName={roomName}
          roomCode={roomCode}
          system={system}
          userRole={userRole}
          currentUserName={userName}
          historyEvents={historyEvents}
          onAddHistoryEvent={handleAddHistoryEvent}
          onClose={() => setShowHistoryModal(false)}
        />
      )}

      {/* 7. Campaign Full Backup & Restore (.JSON) Modal */}
      {showBackupModal && (
        <CampaignBackupModal
          roomCode={roomCode}
          roomName={roomName}
          system={system}
          userName={userName}
          mapData={mapData}
          availableMaps={availableMaps}
          tokens={tokens}
          combatants={combatants}
          historyEvents={historyEvents}
          messages={messages}
          dndChar={dndChar}
          ordemChar={ordemChar}
          customChar={customChar}
          onImportBackup={handleImportBackup}
          onClose={() => setShowBackupModal(false)}
        />
      )}

      {/* 8. Character Creator Wizard Modal */}
      {showCharacterCreator && (
        <CharacterCreatorModal
          system={system}
          onClose={() => setShowCharacterCreator(false)}
          onCreateCharacter={handleCreateCharacter}
        />
      )}

      {/* Floating Toast Notification for Undo / Redo */}
      {undoNotice && (
        <div className="fixed bottom-16 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-neutral-900/95 border border-amber-500/80 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-2.5 text-amber-200 text-xs font-bold animate-in fade-in slide-in-from-bottom-2 duration-200">
          <RotateCcw className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: "1s", animationIterationCount: 1 }} />
          <span>{undoNotice.message}</span>
        </div>
      )}

      {/* 3D Rolling Dice Visual Animation Overlay */}
      <Dice3DAnimationOverlay
        rollResult={activeRollingDice}
        onClose={() => setActiveRollingDice(null)}
        onReplayRoll={(roll) => setActiveRollingDice({ ...roll, timestamp: Date.now() })}
      />

      {/* Login Screen Modal */}
      {showLoginScreen && (
        <LoginScreen
          currentSystem={system}
          currentUserRole={userRole}
          currentUserName={userName}
          currentRoomCode={roomCode}
          currentRoomName={roomName}
          isAlreadyInSession={true}
          onCancel={() => setShowLoginScreen(false)}
          onLogin={({ system: newSys, userRole: newRole, userName: newName, roomCode: newCode, roomName: newRoomName }) => {
            setSystem(newSys);
            setUserRole(newRole);
            setUserName(newName);
            setRoomCode(newCode);
            setRoomName(newRoomName);
            setShowLoginScreen(false);
            rpgAudio.playSpellCast();
          }}
        />
      )}

      {/* Onboarding Modal */}
      {showOnboarding && <OnboardingModal onClose={() => setShowOnboarding(false)} />}
    </div>
  );
}

export default App;
