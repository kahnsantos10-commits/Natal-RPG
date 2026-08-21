import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "15mb" }));

// Initialize Gemini SDK with User-Agent header as required
let aiClient: GoogleGenAI | null = null;
function getGeminiAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// In-Memory Multi-player Room Store
interface RoomMessage {
  id: string;
  sender: string;
  avatar?: string;
  role: "gm" | "player" | "ai" | "system";
  text: string;
  type?: "speech" | "action" | "ooc" | "whisper" | "dice";
  diceResult?: {
    formula: string;
    total: number;
    rolls: number[];
    isCrit?: boolean;
    isFumble?: boolean;
    attribute?: string;
  };
  timestamp: number;
}

interface MapToken {
  id: string;
  name: string;
  type: "hero" | "enemy" | "npc" | "boss" | "object";
  system: "dnd5e" | "ordem" | "custom" | "tormenta20";
  x: number;
  y: number;
  size: number;
  hp: number;
  maxHp: number;
  san?: number;
  maxSan?: number;
  pe?: number;
  maxPe?: number;
  ac?: number;
  conditions: string[];
  color: string;
  avatar?: string;
  model3D?: string;
  initiative?: number;
  hasActed?: boolean;
}

interface RoomData {
  id: string;
  name: string;
  system: "dnd5e" | "ordem" | "custom" | "tormenta20";
  password?: string;
  gmName: string;
  map: {
    name: string;
    gridWidth: number;
    gridHeight: number;
    gridSize: number;
    gridType: "square" | "hex";
    bgUrl?: string;
    fogOfWar: boolean;
    revealedCells: string[]; // "x,y"
    drawings: any[];
    lighting: "bright" | "dim" | "dark" | "paranormal_fog";
  };
  tokens: MapToken[];
  initiativeOrder: string[]; // Token IDs
  currentTurnIndex: number;
  roundNumber: number;
  inCombat: boolean;
  messages: RoomMessage[];
  lastUpdated: number;
}

const rooms = new Map<string, RoomData>();

// Helper seed room
function createInitialRoom(id: string, name: string, system: "dnd5e" | "ordem" | "custom" | "tormenta20" = "dnd5e"): RoomData {
  const initialTokens: MapToken[] = system === "ordem" ? [
    {
      id: "tok-1",
      name: "Arthur Cervero (Ocultista)",
      type: "hero",
      system: "ordem",
      x: 3,
      y: 4,
      size: 1,
      hp: 24,
      maxHp: 24,
      san: 35,
      maxSan: 40,
      pe: 18,
      maxPe: 20,
      ac: 14,
      conditions: [],
      color: "#8b5cf6",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      model3D: "occultist",
      initiative: 16
    },
    {
      id: "tok-2",
      name: "Jouki (Combatente)",
      type: "hero",
      system: "ordem",
      x: 4,
      y: 4,
      size: 1,
      hp: 38,
      maxHp: 38,
      san: 22,
      maxSan: 30,
      pe: 8,
      maxPe: 12,
      ac: 18,
      conditions: [],
      color: "#ef4444",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      model3D: "warrior",
      initiative: 12
    },
    {
      id: "tok-3",
      name: "Zumbi de Sangue",
      type: "enemy",
      system: "ordem",
      x: 8,
      y: 5,
      size: 1,
      hp: 45,
      maxHp: 45,
      ac: 13,
      conditions: ["Ameaça Paranormal"],
      color: "#dc2626",
      avatar: "https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=150&auto=format&fit=crop&q=80",
      model3D: "monster",
      initiative: 8
    }
  ] : [
    {
      id: "tok-1",
      name: "Valerius (Paladino)",
      type: "hero",
      system: "dnd5e",
      x: 3,
      y: 3,
      size: 1,
      hp: 32,
      maxHp: 32,
      ac: 18,
      conditions: [],
      color: "#f59e0b",
      avatar: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=150&auto=format&fit=crop&q=80",
      model3D: "paladin",
      initiative: 15
    },
    {
      id: "tok-2",
      name: "Lyra Moonshadow (Maga)",
      type: "hero",
      system: "dnd5e",
      x: 2,
      y: 4,
      size: 1,
      hp: 20,
      maxHp: 20,
      ac: 13,
      conditions: [],
      color: "#3b82f6",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
      model3D: "wizard",
      initiative: 18
    },
    {
      id: "tok-3",
      name: "Gorguk (Líder Goblin)",
      type: "boss",
      system: "dnd5e",
      x: 9,
      y: 4,
      size: 1,
      hp: 48,
      maxHp: 48,
      ac: 15,
      conditions: [],
      color: "#10b981",
      avatar: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=150&auto=format&fit=crop&q=80",
      model3D: "goblin",
      initiative: 11
    }
  ];

  const revealed = new Set<string>();
  for (let x = 0; x < 16; x++) {
    for (let y = 0; y < 12; y++) {
      if (x < 12 && y < 10) revealed.add(`${x},${y}`);
    }
  }

  return {
    id,
    name,
    system,
    gmName: "Mestre Supremo",
    map: {
      name: system === "ordem" ? "Mansão Endiabrada - Sala Principal" : "Ruínas Esquecidas de Kar-Drak",
      gridWidth: 16,
      gridHeight: 12,
      gridSize: 48,
      gridType: "square",
      bgUrl: system === "ordem"
        ? "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80"
        : "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80",
      fogOfWar: false,
      revealedCells: Array.from(revealed),
      drawings: [],
      lighting: system === "ordem" ? "paranormal_fog" : "dim",
    },
    tokens: initialTokens,
    initiativeOrder: ["tok-2", "tok-1", "tok-3"],
    currentTurnIndex: 0,
    roundNumber: 1,
    inCombat: false,
    messages: [
      {
        id: "msg-1",
        sender: "Sistema",
        role: "system",
        text: `Sessão Natal-RPG iniciada no sistema ${system === "ordem" ? "Ordem Paranormal RPG" : system === "dnd5e" ? "D&D 5ª Edição" : "Ficha Livre / Custom"}. A IA Mestre está pronta para narrar e responder a comandos!`,
        timestamp: Date.now() - 60000,
      },
      {
        id: "msg-2",
        sender: "Mestre IA",
        role: "ai",
        text: system === "ordem"
          ? "As luzes do corredor oscilam bruscamente. O cheiro de cinzas e ozônio preenche o ar. Uma presença gélida rasteja pelas paredes... O que vocês fazem, agentes?"
          : "Vocês adentram a câmara ancestral de pedra esculpida. Tochas bruxuleantes lançam sombras dançantes sobre relevos rúnicos milenares. Ao longe, um rosnado ecoa na escuridão...",
        timestamp: Date.now() - 30000,
      },
    ],
    lastUpdated: Date.now(),
  };
}

// Seed default rooms
rooms.set("sala-demo", createInitialRoom("sala-demo", "Mesa Oficial Natal-RPG (D&D 5e)", "dnd5e"));
rooms.set("sala-ordem", createInitialRoom("sala-ordem", "Operação Calafrio (Ordem Paranormal)", "ordem"));

// API Health
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", version: "1.0.0", activeRooms: rooms.size });
});

// Rooms Management
app.get("/api/rooms", (_req: Request, res: Response) => {
  const roomList = Array.from(rooms.values()).map(r => ({
    id: r.id,
    name: r.name,
    system: r.system,
    gmName: r.gmName,
    tokenCount: r.tokens.length,
    inCombat: r.inCombat,
    lastUpdated: r.lastUpdated
  }));
  res.json(roomList);
});

app.get("/api/rooms/:id", (req: Request, res: Response) => {
  let room = rooms.get(req.params.id);
  if (!room) {
    // Auto-create room for quick play if requested
    room = createInitialRoom(req.params.id, `Mesa ${req.params.id.toUpperCase()}`, "dnd5e");
    rooms.set(req.params.id, room);
  }
  res.json(room);
});

app.post("/api/rooms/create", (req: Request, res: Response) => {
  const { id, name, system, gmName } = req.body;
  const roomId = (id || `room-${Date.now().toString(36)}`).toLowerCase().trim();
  const room = createInitialRoom(roomId, name || `Mesa ${roomId}`, system || "dnd5e");
  if (gmName) room.gmName = gmName;
  rooms.set(roomId, room);
  res.json(room);
});

app.post("/api/rooms/:id/update", (req: Request, res: Response) => {
  const room = rooms.get(req.params.id);
  if (!room) {
    return res.status(404).json({ error: "Sala não encontrada" });
  }

  const { tokens, map, initiativeOrder, currentTurnIndex, roundNumber, inCombat } = req.body;
  if (tokens !== undefined) room.tokens = tokens;
  if (map !== undefined) room.map = { ...room.map, ...map };
  if (initiativeOrder !== undefined) room.initiativeOrder = initiativeOrder;
  if (currentTurnIndex !== undefined) room.currentTurnIndex = currentTurnIndex;
  if (roundNumber !== undefined) room.roundNumber = roundNumber;
  if (inCombat !== undefined) room.inCombat = inCombat;

  room.lastUpdated = Date.now();
  res.json(room);
});

app.post("/api/rooms/:id/chat", (req: Request, res: Response) => {
  const room = rooms.get(req.params.id);
  if (!room) {
    return res.status(404).json({ error: "Sala não encontrada" });
  }

  const { sender, role, text, type, avatar, diceResult } = req.body;
  const newMsg: RoomMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    sender: sender || "Jogador",
    role: role || "player",
    text: text || "",
    type: type || "speech",
    avatar,
    diceResult,
    timestamp: Date.now(),
  };

  room.messages.push(newMsg);
  // Keep last 150 messages
  if (room.messages.length > 150) {
    room.messages = room.messages.slice(-150);
  }
  room.lastUpdated = Date.now();
  res.json({ message: newMsg, room });
});

// --- AI GAME MASTER & GEMINI POWERED ENDPOINTS ---

// 1. Narrative GM Generation (Dynamic Scene, reaction to dice, skill checks)
app.post("/api/ai/narrative", async (req: Request, res: Response) => {
  const { system = "dnd5e", playerAction, characterName, diceResult, context, sceneSetting, style = "cinematic" } = req.body;

  const systemInstructionsMap: Record<string, string> = {
    dnd5e: "Você é o Mestre Supremo de D&D 5ª Edição (Dungeon Master) para o sistema Natal-RPG. Descreva o ambiente com riqueza sensorial (visão, sons, odores, tensão épica), respeite as regras de D&D 5e (testes de CD, salvaguardas, magias, combate por turnos), dê consequências imediatas e impactantes baseadas no teste e na ação do jogador, e sempre encerre provocando 'O que vocês fazem a seguir?'. Escreva em Português do Brasil com tom imersivo.",
    ordem: "Você é o Mestre de Jogo de Ordem Paranormal RPG (inspirado no universo de Cellbit) para o sistema Natal-RPG. Crie uma atmosfera de suspense investigativo, horror cósmico e tensão psicológica. Destaque o Paranormal, manifestações dos 4 Elementos (Conhecimento, Energia, Morte, Sangue, Medo), perda de Sanidade (PS), rituais e perigo iminente. Consequências viscerais para falhas. Escreva em Português do Brasil de forma cinematográfica e envolvente.",
    tormenta20: "Você é o Mestre de Tormenta 20 (Arton). Traga o clima de alta fantasia heróica, deuses do Panteão, monstros épicos e magia vibrante de Arton. Escreva em Português do Brasil.",
    custom: "Você é um Mestre de RPG versátil e altamente criativo no sistema Natal-RPG. Crie narrativas dinâmicas, desafiadoras e imersivas conforme as escolhas do grupo.",
  };

  const systemPrompt = systemInstructionsMap[system] || systemInstructionsMap.dnd5e;

  const userPrompt = `
Contexto Atual da Sessão:
- Sistema: ${system.toUpperCase()}
- Cenário/Local: ${sceneSetting || "Masmorra / Local misterioso"}
- Histórico Recente: ${context || "O grupo acabou de entrar na área."}
- Personagem Agindo: ${characterName || "Jogador"}
- Ação do Personagem: "${playerAction}"
${diceResult ? `- Teste / Rolagem de Dados: ${JSON.stringify(diceResult)}` : "- Nenhuma rolagem especificada (ou rolagem padrão)"}
- Estilo: ${style}

Forneça uma narração emocionante (cerca de 2 a 3 parágrafos curtos e dinâmicos):
1. Descreva o resultado sensorial imediato da ação e do dado.
2. Atualize o perigo/ambiente (mudança de estado, ataque do monstro ou pista revelada).
3. Apresente um dilema ou escolha imediata para o grupo.
`;

  try {
    const ai = getGeminiAI();
    if (ai) {
      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.85,
        },
      });

      const narrativeText = response.text || "O mestre observa em silêncio antes de descrever o eco sinistro das suas ações...";
      return res.json({ text: narrativeText, source: "gemini-3.7-flash" });
    }
  } catch (err) {
    console.error("Gemini AI error, fallback to procedural narrative:", err);
  }

  // High-Quality Procedural RPG Fallback
  const fallbackNarratives: Record<string, string[]> = {
    ordem: [
      `A respiração de ${characterName || "você"} congela no ar. O ponteiro do relógio no cômodo parece girar ao contrário quando o eco dos seus passos reverbera pelas paredes descascadas. Símbolos gravados na madeira começam a emitir um brilho tênue de Sangue e Energia. O ar fica pesado, sufocante. Vocês ouvem o som estridente de metal se arrastando logo atrás da porta entreaberta. O que vocês fazem?`,
      `Uma estática ensurdecedora preenche a mente de ${characterName || "vocês"}. Por um segundo, a realidade parece piscar como uma fita VHS corrompida. Uma poça escura no chão começa a se mover contra a gravidade, formando a silhueta de uma aberração paranormal faminta. Seus batimentos cardíacos disparam e sua Sanidade é posta à prova. Qual é a sua reação imediata?`,
      `O impacto da sua ação quebra o silêncio fúnebre. Um cheiro pungente de enxofre e cinzas invade as narinas do grupo. Diante de vocês, as sombras nas paredes se desprendem e tomam forma tridimensional, bloqueando a única rota de fuga. Vocês sentem a Presença Perturbadora do Outro Lado pressionando suas mentes!`
    ],
    dnd5e: [
      `As tochas tremulam intensamente enquanto a voz de ${characterName || "seu herói"} corta o silêncio da cripta ancestral. O som de engrenagens arcanas se movendo ressoa pelas paredes de pedra cinzenta. Uma rajada de poeira mágica se dissipa, revelando runas incandescentes no chão e os olhos faiscantes de gárgulas esculpidas no teto que parecem seguir cada movimento seu. O que o grupo decide fazer?`,
      `Com precisão e reflexos afiados, sua manobra causa um eco retumbante por toda a câmara! A criatura diante de vocês recua com um urro estarrecedor, cravando as garras no piso de basalto. Pedras começam a cair do arco da abóbada, abrindo uma fresta para uma sala secreta logo adiante, enquanto reforços inimigos se aproximam pelo corredor sul. Como vocês reagem?`,
      `A energia mística converge na ponta dos seus dedos, iluminando os relevos dourados da tumba perdida. Uma brisa sobrenatural sopra das profundezas, trazendo o cântico esquecido dos guardiões celestiais. O caminho está aberto, mas uma armadilha rúnica pulsa com eletricidade instável logo à frente!`
    ],
    custom: [
      `Sua ação desencadeia uma reação em cadeia pelo ambiente! As engrenagens do destino giram e o perigo se intensifica. Diante de vocês, um novo obstáculo surge, exigindo raciocínio rápido e cooperação de todo o grupo. Qual será seu próximo movimento?`
    ]
  };

  const pool = fallbackNarratives[system] || fallbackNarratives.dnd5e;
  const picked = pool[Math.floor(Math.random() * pool.length)];
  return res.json({ text: picked, source: "procedural-natal" });
});

// 2. AI NPC / Monster / Statblock Generator
app.post("/api/ai/npc", async (req: Request, res: Response) => {
  const { system = "dnd5e", role = "enemy", theme, cr = "3" } = req.body;

  const prompt = `Gere um NPC ou Monstro balanceado para o RPG '${system}'.
Função: ${role} (ex: Vilão, Aliado, Mercador misterioso, Monstro paranormal, Guardião).
Tema: ${theme || "sombrio e perigoso"}.
Nível/VD/ND aproximado: ${cr}.

Retorne em formato JSON válido contendo:
{
  "name": "Nome Marcante",
  "title": "Título ou Arquétipo",
  "system": "${system}",
  "type": "${role}",
  "hp": 45,
  "maxHp": 45,
  "ac": 15,
  "san": 20,
  "pe": 10,
  "attributes": { "FOR": 16, "DES": 14, "CON": 15, "INT": 10, "SAB": 12, "CAR": 8 },
  "attacks": [
    { "name": "Golpe Cortante", "bonus": "+6", "damage": "2d8+3", "type": "Físico" }
  ],
  "specialAbilities": [
    { "name": "Presença Aterrorizante", "description": "Criaturas em 9m devem passar em teste de Vontade ou ficam Abaladas." }
  ],
  "personality": "Traços marcantes de personalidade",
  "lore": "Breve histórico de 2 frases",
  "loot": ["Item 1", "Item 2"]
}`;

  try {
    const ai = getGeminiAI();
    if (ai) {
      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.7,
        },
      });

      const text = response.text?.trim();
      if (text) {
        const parsed = JSON.parse(text);
        return res.json(parsed);
      }
    }
  } catch (err) {
    console.error("NPC gen error:", err);
  }

  // Fallback NPC
  const fallbackNPC = system === "ordem" ? {
    name: "Enpap-X de Morte",
    title: "Aberração Crono-Paranormal",
    system: "ordem",
    type: "boss",
    hp: 85,
    maxHp: 85,
    ac: 16,
    san: 0,
    pe: 25,
    attributes: { AGI: 3, FOR: 4, INT: 1, PRE: 3, VIG: 4 },
    attacks: [
      { name: "Tentáculos de Lodo Temporal", bonus: "+8", damage: "3d10+4 de Morte", type: "Morte" },
      { name: "Distorção Espaço-Tempo", bonus: "CD 18", damage: "Perda de 2d6 PS e Lentidão", type: "Mental" }
    ],
    specialAbilities: [
      { name: "Presença Perturbadora", description: "VD 60. Ao ver a criatura, teste de Vontade CD 16 ou perde 3d6 de Sanidade." },
      { name: "Regeneração por Lodo", description: "Recupera 10 PV no início de seu turno se estiver em sombra." }
    ],
    personality: "Implacável, emite sussurros de vozes de pessoas que já faleceram.",
    lore: "Manifestação gerada após um ritual de Morte que deu errado em uma antiga mansão no centro de São Paulo.",
    loot: ["Relógio de Bolso Ancestral (Acessório de Morte)", "Cinzas Paranormais"]
  } : {
    name: "Ignis o Cavaleiro Rubro",
    title: "Comandante Espectral da Legião Cinzenta",
    system: "dnd5e",
    type: "boss",
    hp: 68,
    maxHp: 68,
    ac: 18,
    attributes: { FOR: 18, DES: 12, CON: 16, INT: 11, SAB: 13, CAR: 14 },
    attacks: [
      { name: "Espada Larga Incandescente", bonus: "+7 para acertar", damage: "2d6+4 cortante + 1d8 fogo", type: "Marcial / Fogo" },
      { name: "Investida Pesada", bonus: "+7", damage: "1d10+4 e derruba o alvo (CD 15 Força)", type: "Contusão" }
    ],
    specialAbilities: [
      { name: "Aura de Brasas", description: "Inimigos a 1,5m sofrem 3 de dano de fogo no início de seus turnos." },
      { name: "Comando Tático", description: "Aliados têm Vantagem na próxima jogada de ataque." }
    ],
    personality: "Honrado porém implacável. Busca um oponente digno para quebrar sua maldição eterna.",
    lore: "Um nobre paladino caído que prometeu proteger o sarcófago de seu rei mesmo após a morte.",
    loot: ["Manopla Forjada em Cinzas (+1 CA)", "50 Poças de Ouro Imperial", "Chave Rúnica de Rubi"]
  };

  res.json(fallbackNPC);
});

// 3. AI Encounter & Quest Hook Generator
app.post("/api/ai/encounter", async (req: Request, res: Response) => {
  const { system = "dnd5e", environment, difficulty = "médio", partySize = 4 } = req.body;

  const prompt = `Crie um Encontro de RPG completo e eletrizante.
Sistema: ${system}
Ambiente: ${environment || "Masmorra abandonada / Prédio isolado"}
Dificuldade: ${difficulty}
Tamanho do Grupo: ${partySize} jogadores

Retorne um JSON com:
{
  "title": "Título do Encontro",
  "summary": "Resumo da premissa dramática",
  "threats": [
    { "name": "Nome da ameaça/inimigo", "count": 2, "role": "Vanguarda/Atirador/Líder", "hp": 30 }
  ],
  "environmentalHazards": ["Perigo do cenário 1", "Mecânica interativa do mapa (ex: pilares que podem cair, gás inflamável)"],
  "rewards": ["Recompensa 1", "Pista importante ou item misterioso"],
  "twist": "Reviravolta durante a batalha (ex: no 3º round o chão cede ou uma segunda criatura acorda)"
}`;

  try {
    const ai = getGeminiAI();
    if (ai) {
      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.8,
        },
      });

      const text = response.text?.trim();
      if (text) {
        return res.json(JSON.parse(text));
      }
    }
  } catch (err) {
    console.error("Encounter gen error:", err);
  }

  // Fallback Encounter
  const fallback = {
    title: system === "ordem" ? "Emboscada no Laboratório Oculto" : "O Ritual no Círculo de Sangue Dracônico",
    summary: system === "ordem"
      ? "Os agentes descobrem recipientes químicos violados enquanto as luzes de emergência tingem a sala de vermelho escarlate."
      : "Um grupo de cultistas fanáticos está no meio de um cântico profano ao redor de um obelisco flutuante.",
    threats: system === "ordem" ? [
      { name: "Cão de Sangue", count: 2, role: "Batedor Ágil", hp: 28 },
      { name: "Cultista Apóstolo", count: 1, role: "Conjurador de Energia", hp: 35 }
    ] : [
      { name: "Fanático Dracônico", count: 3, role: "Vanguarda", hp: 22 },
      { name: "Xamã das Cinzas", count: 1, role: "Suporte Mágico", hp: 40 }
    ],
    environmentalHazards: [
      "Vapor escaldante vazando de canos (2d4 dano a quem terminar turno adjacente)",
      "Piso escorregadio coberto de lodo arcano (teste de Destreza CD 12 para correr)"
    ],
    rewards: [
      "Amuleto Talhado em Obsidiana",
      "Pergaminho de Ritual com anotações criptografadas",
      "Kit Médico Avançado / Poção de Cura Maior"
    ],
    twist: "No Round 3, o obelisco central entra em sobrecarga, liberando uma onda de choque que empurra todos a 3 metros e apaga as tochas da sala!"
  };

  res.json(fallback);
});

// 4. Character Token / Visual Concept Generator (Text Prompts for 3D/2D representation)
app.post("/api/ai/avatar-prompt", async (req: Request, res: Response) => {
  const { name, characterClass, raceOrElement, system = "dnd5e", description } = req.body;

  const prompt = `Gere uma descrição visual cinematográfica e paleta de cores para um token de personagem de RPG.
Personagem: ${name || "Aventureiro"}
Classe / Trilha: ${characterClass || "Guerreiro / Combatente"}
Raça ou Afinidade Elemental: ${raceOrElement || "Humano / Sangue"}
Sistema: ${system}
Detalhes adicionais: ${description || "Olhar determinado, armadura com marcas de batalha."}

Retorne um JSON com:
{
  "visualDescription": "Descrição detalhada para a arte do token e miniatura 3D",
  "dominantColor": "#hexColor",
  "accentColor": "#hexColor",
  "iconSymbol": "sword / shield / flame / skull / skull-crossbones / wand / eye / crosshair / sparkle",
  "suggested3DModel": "warrior / wizard / occultist / rogue / monster / paladin / goblin",
  "flavorQuote": "Frase de impacto do personagem"
}`;

  try {
    const ai = getGeminiAI();
    if (ai) {
      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const text = response.text?.trim();
      if (text) {
        return res.json(JSON.parse(text));
      }
    }
  } catch (err) {
    console.error("Avatar prompt error:", err);
  }

  // Fallback
  res.json({
    visualDescription: `Retrato épico de ${name || "Herói"}, ostentando detalhes intrincados de ${characterClass || "Guerreiro"} com iluminação dramática contra um fundo místico.`,
    dominantColor: system === "ordem" ? "#9333ea" : "#d97706",
    accentColor: system === "ordem" ? "#dc2626" : "#2563eb",
    iconSymbol: system === "ordem" ? "eye" : "shield",
    suggested3DModel: "warrior",
    flavorQuote: "Que os dados decidam nosso destino... mas a minha lâmina dita o final."
  });
});

// 5. AI Handout, Clue & Physical Prop Generator
app.post("/api/generate-handout", async (req: Request, res: Response) => {
  const { system = "ordem", prompt = "Carta secreta encontrada no sótão" } = req.body;

  const aiPrompt = `Gere um Handout/Pista/Documento de RPG realista e imersivo para ser impresso ou exibido no telão dos jogadores.
Sistema: ${system} (ex: Ordem Paranormal com atmosfera de investigação e terror, ou D&D 5e com fantasia medieval).
Ideia / Pedido: ${prompt}

Retorne estritamente um JSON no formato:
{
  "title": "Título chamativo do documento",
  "type": "document" | "photo" | "letter" | "symbol" | "riddle",
  "author": "Nome do autor ou entidade",
  "dateOrEra": "Data ou Era fictícia (ex: 23 de Novembro de 1998 ou 3ª Era de Cormyr)",
  "content": "Texto integral do documento, carta, laudo pericial ou enigma com detalhes sensoriais e pistas sutis",
  "secretNotes": "Dica ou informação secreta apenas para o Mestre (ex: CD do teste para decifrar, ou o que isso revela)",
  "imageUrl": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80"
}`;

  try {
    const ai = getGeminiAI();
    if (ai) {
      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: aiPrompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.85,
        },
      });

      const text = response.text?.trim();
      if (text) {
        return res.json(JSON.parse(text));
      }
    }
  } catch (err) {
    console.error("Handout gen error:", err);
  }

  // Fallback Handout
  res.json({
    title: system === "ordem" ? "Transcrição de Fita Cassete Encontrada" : "Pergaminho com Selo de Cera Escarlate",
    type: "letter",
    author: system === "ordem" ? "Agente Desaparecido Miller" : "Arquimago Valdorian",
    dateOrEra: system === "ordem" ? "12 de Outubro de 2003" : "Ano 1372 da Ascensão",
    content: system === "ordem"
      ? "Eles não estão nos caçando pela força... eles estão nos esperando nos cantos escuros onde a luz não toca. Se você encontrou este gravador, não tente ligar para a base. As frequências de rádio foram consumidas pelo Outro Lado."
      : "Se este pergaminho caiu em tuas mãos, a Torre do Sol já sucumbiu. Apenas a chama eterna mantida no altar das catacumbas poderá conter a legião sombria. Que os deuses guiem teus passos.",
    secretNotes: "Permite um teste de Percepção / Investigação DT 14 para notar que o papel foi manchado intencionalmente para esconder uma assinatura.",
    imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80"
  });
});

// Setup Vite middleware for development or static serving for production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Natal-RPG Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
