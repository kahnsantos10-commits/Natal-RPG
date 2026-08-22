import React, { useState } from "react";
import { RPGSystem, MapToken, MapData } from "../types";
import {
  Sparkles,
  Send,
  Wand2,
  Skull,
  Compass,
  BookOpen,
  Plus,
  Loader2,
  Shield,
  Heart,
  Zap,
  Eye,
  Dice5,
  Volume2,
  Map,
  Copy,
  Check,
  Layers,
  Sparkle,
  Image as ImageIcon
} from "lucide-react";
import { rpgAudio } from "../utils/audioSynth";

interface AIMasterPanelProps {
  system: RPGSystem;
  onSendToChat: (message: string, role?: "ai" | "gm" | "system") => void;
  onAddTokenToMap?: (token: MapToken) => void;
  onAddMap?: (map: MapData) => void;
  onSelectMap?: (map: MapData) => void;
  activeCharacterName?: string;
}

export const AIMasterPanel: React.FC<AIMasterPanelProps> = ({
  system,
  onSendToChat,
  onAddTokenToMap,
  onAddMap,
  onSelectMap,
  activeCharacterName,
}) => {
  const [activeTab, setActiveTab] = useState<"narrative" | "npc" | "encounter" | "map_prompt">("narrative");

  // Narrative generator state
  const [playerAction, setPlayerAction] = useState("");
  const [sceneSetting, setSceneSetting] = useState("");
  const [narrativeResult, setNarrativeResult] = useState<string | null>(null);
  const [isLoadingNarrative, setIsLoadingNarrative] = useState(false);

  // NPC generator state
  const [npcRole, setNpcRole] = useState("boss");
  const [npcTheme, setNpcTheme] = useState("");
  const [npcCr, setNpcCr] = useState("3");
  const [generatedNpc, setGeneratedNpc] = useState<any | null>(null);
  const [isLoadingNpc, setIsLoadingNpc] = useState(false);

  // Encounter generator state
  const [encounterEnv, setEncounterEnv] = useState("");
  const [encounterDiff, setEncounterDiff] = useState("médio");
  const [generatedEncounter, setGeneratedEncounter] = useState<any | null>(null);
  const [isLoadingEncounter, setIsLoadingEncounter] = useState(false);

  // Map Prompt generator state
  const [mapTheme, setMapTheme] = useState(
    system === "ordem" ? "Mansão Abandonada com Símbolos Paranormais" : "Masmorra Ancestral de Pedra"
  );
  const [mapLighting, setMapLighting] = useState(
    system === "ordem" ? "Luzes de emergência vermelhas e névoa roxa" : "Tochas bruxuleantes e sombras dramáticas"
  );
  const [mapCustom, setMapCustom] = useState("");
  const [generatedMapPrompt, setGeneratedMapPrompt] = useState<any | null>(null);
  const [isLoadingMapPrompt, setIsLoadingMapPrompt] = useState(false);
  const [isGeneratingMapImage, setIsGeneratingMapImage] = useState(false);
  const [mapGenerationLog, setMapGenerationLog] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Handle Narrative Request
  const handleGenerateNarrative = async () => {
    if (!playerAction.trim() && !sceneSetting.trim()) return;
    setIsLoadingNarrative(true);
    rpgAudio.playMagicSpell();

    try {
      const res = await fetch("/api/ai/narrative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system,
          playerAction,
          characterName: activeCharacterName || "Jogador",
          sceneSetting,
        }),
      });
      const data = await res.json();
      setNarrativeResult(data.text);
    } catch (err) {
      console.error(err);
      setNarrativeResult("O eco dos seus passos ressoa na câmara silenciosa enquanto as sombras se alongam...");
    } finally {
      setIsLoadingNarrative(false);
    }
  };

  // Handle NPC Generation
  const handleGenerateNpc = async () => {
    setIsLoadingNpc(true);
    rpgAudio.playMagicSpell();

    try {
      const res = await fetch("/api/ai/npc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system,
          role: npcRole,
          theme: npcTheme,
          cr: npcCr,
        }),
      });
      const data = await res.json();
      setGeneratedNpc(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingNpc(false);
    }
  };

  // Handle Encounter Generation
  const handleGenerateEncounter = async () => {
    setIsLoadingEncounter(true);
    rpgAudio.playMagicSpell();

    try {
      const res = await fetch("/api/ai/encounter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system,
          environment: encounterEnv,
          difficulty: encounterDiff,
        }),
      });
      const data = await res.json();
      setGeneratedEncounter(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingEncounter(false);
    }
  };

  // Handle Map Prompt Generation
  const handleGenerateMapPrompt = async () => {
    setIsLoadingMapPrompt(true);
    rpgAudio.playMagicSpell();

    try {
      const res = await fetch("/api/ai/map-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system,
          theme: mapTheme,
          lighting: mapLighting,
          customDetails: mapCustom,
        }),
      });
      const data = await res.json();
      setGeneratedMapPrompt(data);
    } catch (err) {
      console.error("Map prompt generation error:", err);
    } finally {
      setIsLoadingMapPrompt(false);
    }
  };

  const handleCreateAndAddMap = async () => {
    if (!generatedMapPrompt) return;
    setIsGeneratingMapImage(true);
    setMapGenerationLog("🎨 Iniciando canal de síntese com a IA artística...");
    rpgAudio.playMagicSpell();

    try {
      const finalPromptToGen = generatedMapPrompt.englishPrompt || `RPG battlemap top-down view, ${mapTheme}`;
      
      const res = await fetch("/api/ai/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: finalPromptToGen,
          type: "map",
          system,
        }),
      });

      let finalBgUrl = "";
      if (res.ok) {
        const data = await res.json();
        if (data.imageUrl) {
          finalBgUrl = data.imageUrl;
          setMapGenerationLog("✨ Imagem gerada com perfeição técnica!");
        }
      }

      // Fallback if key missing/error
      if (!finalBgUrl) {
        setMapGenerationLog("🔄 Canal principal instável. Ativando síntese alternativa de redundância...");
        const seed = Math.floor(Math.random() * 1000000);
        const encoded = encodeURIComponent(`RPG battlemap top-down view ${finalPromptToGen}`);
        finalBgUrl = `https://image.pollinations.ai/prompt/${encoded}?width=1280&height=720&seed=${seed}&nologo=true`;
      }

      // Process grid size
      let width = 20;
      let height = 16;
      if (generatedMapPrompt.suggestedGridSize) {
        const parts = generatedMapPrompt.suggestedGridSize.match(/\d+/g);
        if (parts && parts.length >= 2) {
          const cols = parseInt(parts[0], 10);
          const rows = parseInt(parts[1], 10);
          if (!isNaN(cols) && cols > 0) {
            width = cols;
            height = rows || cols;
          }
        }
      }

      // Create MapData
      const newMap: MapData = {
        id: `map-ai-${Date.now()}`,
        name: generatedMapPrompt.title || "Mapa Gerado por IA",
        gridWidth: width,
        gridHeight: height,
        gridSize: 50,
        gridType: "square",
        bgUrl: finalBgUrl,
        lighting: generatedMapPrompt.recommendedLighting || "Estática",
        fogOfWar: false,
        revealedCells: [],
        drawings: [],
        pings: [],
      };

      if (onAddMap) {
        onAddMap(newMap);
      }
      if (onSelectMap) {
        onSelectMap(newMap);
      }

      setMapGenerationLog("✅ Mapa adicionado com sucesso à mesa de batalha em 2D e 3D!");
      onSendToChat(`[Mestre IA]: Gerou e ativou um novo Mapa de Batalha 2D/3D: **${newMap.name}**! Prontinho para colocar os tokens e começar o combate!`, "system");
      rpgAudio.playMagicSpell();
    } catch (err) {
      console.error(err);
      setMapGenerationLog("❌ Falha crítica ao gerar o mapa.");
    } finally {
      setIsGeneratingMapImage(false);
      setTimeout(() => setMapGenerationLog(null), 5000);
    }
  };

  const handleCopyText = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    rpgAudio.playDiceRoll();
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleAddNpcToGrid = () => {
    if (!generatedNpc || !onAddTokenToMap) return;
    const token: MapToken = {
      id: `npc-tok-${Date.now()}`,
      name: generatedNpc.name,
      type: generatedNpc.type === "boss" ? "boss" : "enemy",
      system,
      x: 6,
      y: 5,
      size: generatedNpc.type === "boss" ? 2 : 1,
      hp: generatedNpc.hp || 50,
      maxHp: generatedNpc.maxHp || 50,
      ac: generatedNpc.ac || 14,
      conditions: [],
      color: system === "ordem" ? "#dc2626" : "#e11d48",
      avatar:
        system === "ordem"
          ? "https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=150&auto=format&fit=crop&q=80"
          : "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=150&auto=format&fit=crop&q=80",
    };
    onAddTokenToMap(token);
    rpgAudio.playSwordHit();
    onSendToChat(`[Mestre IA]: Adicionou o monstro **${generatedNpc.name}** ao Grid de Batalha!`, "system");
  };

  return (
    <div className="w-full h-full bg-neutral-950 overflow-y-auto p-4 md:p-6 space-y-6 text-neutral-100">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-neutral-900 via-purple-950/40 to-neutral-900 border border-purple-900/50 rounded-3xl p-6 shadow-2xl flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-inner">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-serif text-amber-100 flex items-center gap-2">
              Mestre de Jogo IA (Dungeon Master)
            </h2>
            <p className="text-xs text-neutral-400">
              Sistema Ativo: <strong className="text-purple-300 uppercase">{system === "ordem" ? "Ordem Paranormal" : system === "dnd5e" ? "D&D 5ª Edição" : "Custom"}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-purple-950/80 border border-purple-800/80 text-purple-300 text-xs font-semibold rounded-full flex items-center gap-1.5 shadow">
            <Wand2 className="w-3.5 h-3.5" />
            Gemini 3.7 Flash Engine
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-800 gap-2 overflow-x-auto pb-1">
        {[
          { id: "narrative", label: "Narração de Cena", icon: Sparkles },
          { id: "npc", label: "Gerador de Inimigos / NPCs", icon: Skull },
          { id: "encounter", label: "Gerador de Encontros", icon: Compass },
          { id: "map_prompt", label: "Prompts de Mapa Top-Down 🗺️", icon: Map },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 font-semibold text-xs md:text-sm border-b-2 transition-all ${
                activeTab === t.id
                  ? "border-purple-500 text-purple-300 bg-purple-500/10 rounded-t-xl"
                  : "border-transparent text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: Narrative Generator */}
      {activeTab === "narrative" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Controls */}
          <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-3xl space-y-4 shadow-xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Descrever Ação ou Cenário para a IA Narrar
            </h3>

            <div>
              <label className="text-xs text-neutral-400 font-medium">Local / Cenário Atual</label>
              <input
                type="text"
                value={sceneSetting}
                onChange={(e) => setSceneSetting(e.target.value)}
                placeholder={
                  system === "ordem"
                    ? "Ex: Mansão abandonada, sala com espelhos rachados e cheiro de cinzas"
                    : "Ex: Cripta do Rei Esquecido, tochas azuis e sarcófago aberto"
                }
                className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="text-xs text-neutral-400 font-medium">Ação do Jogador / Acontecimento</label>
              <textarea
                value={playerAction}
                onChange={(e) => setPlayerAction(e.target.value)}
                rows={3}
                placeholder={
                  system === "ordem"
                    ? "Ex: Arthur saca seu revólver e tenta decifrar os símbolos de Sangue na parede após passar no teste de Ocultismo..."
                    : "Ex: Valerius empunha sua espada sagrada e avança contra o líder goblin enquanto o mago prepara Bola de Fogo..."
                }
                className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-100 focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={handleGenerateNarrative}
                disabled={isLoadingNarrative || (!playerAction.trim() && !sceneSetting.trim())}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg transition-all active:scale-95"
              >
                {isLoadingNarrative ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    O Mestre está pensando...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    Gerar Narração do Mestre
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Narrative Output */}
          <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-3xl flex flex-col justify-between shadow-xl min-h-[260px]">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Resposta do Mestre IA
                </span>
              </div>

              {narrativeResult ? (
                <div className="text-xs md:text-sm text-neutral-200 leading-relaxed font-serif whitespace-pre-line bg-neutral-950/80 p-4 rounded-2xl border border-neutral-800">
                  {narrativeResult}
                </div>
              ) : (
                <div className="text-center py-12 text-xs text-neutral-500">
                  Envie uma ação ou descrição de cena ao lado para que a IA gere a narração sensorial e dramática.
                </div>
              )}
            </div>

            {narrativeResult && (
              <div className="pt-4 border-t border-neutral-800 flex items-center justify-end gap-2">
                <button
                  onClick={() => {
                    onSendToChat(narrativeResult, "ai");
                    rpgAudio.playMagicSpell();
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-neutral-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow"
                >
                  <Send className="w-3.5 h-3.5" />
                  Transmitir para o Chat da Sessão
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: NPC / Monster Generator */}
      {activeTab === "npc" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* NPC Config */}
          <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-3xl space-y-4 shadow-xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Gerar Ficha de Monstro ou NPC Balanceado
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-neutral-400 font-medium">Função</label>
                <select
                  value={npcRole}
                  onChange={(e) => setNpcRole(e.target.value)}
                  className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-purple-500"
                >
                  <option value="boss">Chefe / Monstro Épico</option>
                  <option value="enemy">Inimigo Comum / Lacaio</option>
                  <option value="ally">Aliado / Especialista</option>
                  <option value="merchant">Mercador / Informante</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-neutral-400 font-medium">Nível / Desafio (VD ou ND)</label>
                <input
                  type="text"
                  value={npcCr}
                  onChange={(e) => setNpcCr(e.target.value)}
                  placeholder="Ex: 3 ou VD 60"
                  className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-neutral-400 font-medium">Tema ou Estilo</label>
              <input
                type="text"
                value={npcTheme}
                onChange={(e) => setNpcTheme(e.target.value)}
                placeholder={
                  system === "ordem"
                    ? "Ex: Aberração de Sangue com tentáculos e dentes afiados"
                    : "Ex: Necromante espectral que comanda guerreiros esqueléticos"
                }
                className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={handleGenerateNpc}
                disabled={isLoadingNpc}
                className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg transition-all"
              >
                {isLoadingNpc ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Gerando Estatísticas...
                  </>
                ) : (
                  <>
                    <Skull className="w-4 h-4" />
                    Gerar Monstro / NPC
                  </>
                )}
              </button>
            </div>
          </div>

          {/* NPC Card Result */}
          <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-3xl shadow-xl flex flex-col justify-between min-h-[300px]">
            {generatedNpc ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                  <div>
                    <h4 className="text-base font-bold font-serif text-red-300">{generatedNpc.name}</h4>
                    <p className="text-xs text-neutral-400">{generatedNpc.title}</p>
                  </div>
                  <span className="px-2.5 py-1 bg-red-950/80 border border-red-800/80 text-red-300 text-xs font-bold rounded-xl">
                    HP: {generatedNpc.hp} | CA: {generatedNpc.ac}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-bold uppercase text-neutral-400">Ataques Principais:</div>
                  <div className="space-y-1">
                    {generatedNpc.attacks?.map((atk: any, idx: number) => (
                      <div key={idx} className="text-xs bg-neutral-950 p-2 rounded-xl border border-neutral-800 flex items-center justify-between">
                        <span className="font-semibold text-neutral-200">{atk.name} ({atk.bonus})</span>
                        <span className="text-red-300 font-mono">{atk.damage}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {generatedNpc.specialAbilities?.length > 0 && (
                  <div className="space-y-1 text-xs">
                    <div className="font-bold uppercase text-neutral-400">Habilidades Especiais:</div>
                    {generatedNpc.specialAbilities.map((ab: any, idx: number) => (
                      <p key={idx} className="text-neutral-300 bg-neutral-950 p-2 rounded-xl border border-neutral-800">
                        <strong className="text-amber-300">{ab.name}:</strong> {ab.description}
                      </p>
                    ))}
                  </div>
                )}

                <div className="pt-2 border-t border-neutral-800 flex items-center justify-end gap-2">
                  <button
                    onClick={handleAddNpcToGrid}
                    className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Adicionar Token ao Mapa de Batalha
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-xs text-neutral-500">
                Configure os parâmetros ao lado e clique em "Gerar Monstro" para criar uma criatura pronta para o combate.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Encounter Generator */}
      {activeTab === "encounter" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-3xl space-y-4 shadow-xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Gerar Encontro e Perigos Ambientais
            </h3>

            <div>
              <label className="text-xs text-neutral-400 font-medium">Ambiente / Local</label>
              <input
                type="text"
                value={encounterEnv}
                onChange={(e) => setEncounterEnv(e.target.value)}
                placeholder="Ex: Laboratório subterrâneo abandonado / Ponte suspensa sobre lava"
                className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="text-xs text-neutral-400 font-medium">Dificuldade</label>
              <select
                value={encounterDiff}
                onChange={(e) => setEncounterDiff(e.target.value)}
                className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-purple-500"
              >
                <option value="fácil">Fácil (Aquecimento)</option>
                <option value="médio">Médio (Desafiador)</option>
                <option value="difícil">Difícil (Alto risco de baixas)</option>
                <option value="mortal">Mortal / Clímax (Boss Fight)</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={handleGenerateEncounter}
                disabled={isLoadingEncounter}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg"
              >
                {isLoadingEncounter ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Montando Encontro...
                  </>
                ) : (
                  <>
                    <Compass className="w-4 h-4" />
                    Gerar Encontro Tático
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-3xl shadow-xl flex flex-col justify-between min-h-[300px]">
            {generatedEncounter ? (
              <div className="space-y-3 text-xs">
                <h4 className="text-base font-bold font-serif text-amber-200 border-b border-neutral-800 pb-2">
                  {generatedEncounter.title}
                </h4>
                <p className="text-neutral-300 leading-relaxed">{generatedEncounter.summary}</p>

                <div className="space-y-1">
                  <span className="font-bold text-neutral-400 uppercase">Perigos do Cenário:</span>
                  {generatedEncounter.environmentalHazards?.map((h: string, idx: number) => (
                    <div key={idx} className="bg-neutral-950 p-2 rounded-xl text-amber-300 border border-neutral-800">
                      ⚠️ {h}
                    </div>
                  ))}
                </div>

                <div className="bg-purple-950/40 border border-purple-800/60 p-3 rounded-2xl text-purple-200">
                  <strong>Reviravolta (Twist):</strong> {generatedEncounter.twist}
                </div>

                <div className="pt-3 border-t border-neutral-800 flex justify-end">
                  <button
                    onClick={() => {
                      onSendToChat(`[Encontro IA]: **${generatedEncounter.title}**\n${generatedEncounter.summary}`, "ai");
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 text-neutral-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Enviar para Chat
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-xs text-neutral-500">
                Gere encontros táticos com armadilhas, perigos do terreno e reviravoltas no combate.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: Map Prompt Generator */}
      {activeTab === "map_prompt" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Map Config Inputs */}
          <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-3xl space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Map className="w-4 h-4" />
                Gerador de Prompts para Mapas de Batalha (Top-Down)
              </h3>
              <span className="text-[10px] bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold px-2 py-0.5 rounded-full">
                Vista de Cima (Overhead)
              </span>
            </div>

            {/* Presets */}
            <div>
              <label className="text-xs text-neutral-400 font-medium">Presets Rápidos de Cenário</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1.5">
                {[
                  { label: "Mansão Oculta", theme: "Mansão antiga com símbolos de Sangue e espelhos rachados", light: "Luzes de emergência vermelhas e névoa roxa" },
                  { label: "Masmorra Ancestral", theme: "Masmorra de pedra subterrânea com sarcófago e colunas", light: "Tochas bruxuleantes e iluminação azulada" },
                  { label: "Taverna do Povoado", theme: "Taverna de madeira aconchegante com mesas, lareira e bar", light: "Luz quente de velas e fogueira" },
                  { label: "Floresta / Clareira", theme: "Clareira em floresta mística com cogumelos luminescentes", light: "Luz do luar e brilho azul esverdeado" },
                  { label: "Laboratório Clandestino", theme: "Laboratório científico com tubos de ensaio e computadores", light: "Tubo neon verde fluorescente e monitores" },
                  { label: "Templo Rúnico", theme: "Altar cerimonial de obsidiana com inscrições douradas", light: "Raios solares filtrados por vitrais" },
                ].map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setMapTheme(p.theme);
                      setMapLighting(p.light);
                      rpgAudio.playDiceRoll();
                    }}
                    className="px-2.5 py-1.5 bg-neutral-950 hover:bg-purple-950/40 border border-neutral-800 hover:border-purple-500/40 text-neutral-300 hover:text-purple-200 text-[11px] font-semibold rounded-xl text-left transition-all truncate"
                  >
                    ✨ {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-neutral-400 font-medium">Tema ou Local do Mapa</label>
              <input
                type="text"
                value={mapTheme}
                onChange={(e) => setMapTheme(e.target.value)}
                placeholder="Ex: Laboratório abandonado, Cripta do Rei, Ponte de Pedra sobre lava..."
                className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-xs text-neutral-400 font-medium">Estilo de Iluminação & Atmosfera</label>
              <input
                type="text"
                value={mapLighting}
                onChange={(e) => setMapLighting(e.target.value)}
                placeholder="Ex: Tochas, névoa roxa, luz da lua, neon cyberpunk, sol da tarde..."
                className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-xs text-neutral-400 font-medium">Detalhes Específicos do Cenário (Opcional)</label>
              <textarea
                value={mapCustom}
                onChange={(e) => setMapCustom(e.target.value)}
                rows={2}
                placeholder="Ex: Incluir mesa de necropsia no centro, sangue seco no chão, estantes com livros antigos e porta trancada..."
                className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-100 focus:outline-none focus:border-amber-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={handleGenerateMapPrompt}
                disabled={isLoadingMapPrompt}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 disabled:opacity-50 text-neutral-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg transition-all active:scale-95"
              >
                {isLoadingMapPrompt ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Gerando Prompts Perfeitos...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    Gerar Prompts de Mapa
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Generated Prompts Output Card */}
          <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-3xl shadow-xl flex flex-col justify-between min-h-[360px]">
            {generatedMapPrompt ? (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                  <h4 className="text-sm font-bold font-serif text-amber-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    {generatedMapPrompt.title}
                  </h4>
                  <span className="text-[10px] bg-neutral-950 border border-neutral-800 px-2 py-0.5 rounded-lg text-neutral-400 font-mono">
                    {generatedMapPrompt.suggestedGridSize || "16:9 (VTT Ready)"}
                  </span>
                </div>

                {/* Prompt em Inglês (Midjourney / DALL-E / Stable Diffusion / Gemini) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-extrabold text-amber-400 flex items-center gap-1">
                      🇬🇧 Prompt em Inglês (Midjourney v6 / DALL-E 3 / Imagen 3)
                    </span>
                    <button
                      onClick={() => handleCopyText(generatedMapPrompt.englishPrompt, "eng")}
                      className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg font-bold flex items-center gap-1 transition-all"
                    >
                      {copiedField === "eng" ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copiar
                        </>
                      )}
                    </button>
                  </div>
                  <div className="bg-neutral-950 p-3 rounded-2xl border border-neutral-800 text-neutral-200 font-mono text-[11px] leading-relaxed select-all">
                    {generatedMapPrompt.englishPrompt}
                  </div>
                </div>

                {/* Prompt em Português */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-extrabold text-purple-400 flex items-center gap-1">
                      🇧🇷 Prompt em Português
                    </span>
                    <button
                      onClick={() => handleCopyText(generatedMapPrompt.portuguesePrompt, "pt")}
                      className="px-2.5 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 rounded-lg font-bold flex items-center gap-1 transition-all"
                    >
                      {copiedField === "pt" ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copiar
                        </>
                      )}
                    </button>
                  </div>
                  <div className="bg-neutral-950 p-2.5 rounded-2xl border border-neutral-800 text-neutral-300 text-[11px] leading-relaxed">
                    {generatedMapPrompt.portuguesePrompt}
                  </div>
                </div>

                {/* Negative Prompt */}
                {generatedMapPrompt.negativePrompt && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-neutral-400 font-bold uppercase">
                      <span>Negative Prompt (O que evitar)</span>
                      <button
                        onClick={() => handleCopyText(generatedMapPrompt.negativePrompt, "neg")}
                        className="text-neutral-400 hover:text-neutral-200 flex items-center gap-0.5"
                      >
                        {copiedField === "neg" ? "Copiado!" : "Copiar"}
                      </button>
                    </div>
                    <div className="bg-neutral-950/60 p-2 rounded-xl border border-neutral-800 text-red-300/80 font-mono text-[10px]">
                      {generatedMapPrompt.negativePrompt}
                    </div>
                  </div>
                )}

                {/* 2D & 3D MAP SYNTHESIS CTA */}
                <div className="bg-gradient-to-r from-amber-500/10 to-purple-500/10 border border-amber-500/25 p-3 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-amber-400 block">Síntese de Arena 2D/3D Integrada</span>
                      <span className="text-[9px] text-neutral-400 block leading-tight">Gere a imagem real do mapa e ative o tabuleiro imediatamente</span>
                    </div>
                    <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                  </div>
                  
                  {mapGenerationLog && (
                    <div className="bg-neutral-950 px-2 py-1.5 rounded-lg border border-neutral-850 text-[9px] text-amber-300 font-mono animate-pulse">
                      {mapGenerationLog}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleCreateAndAddMap}
                    disabled={isGeneratingMapImage}
                    className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow shadow-amber-500/20 active:scale-[0.98] disabled:opacity-50"
                  >
                    {isGeneratingMapImage ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Sintetizando Cenário...</span>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>Gerar Cenário & Ativar Tabuleiro 2D/3D</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Action Footer */}
                <div className="pt-2 border-t border-neutral-800 flex items-center justify-between">
                  <span className="text-[10px] text-neutral-400">
                    💡 Cole este prompt no Midjourney, DALL-E, Bing Image Creator ou Leonardo.ai!
                  </span>
                  <button
                    onClick={() => {
                      onSendToChat(
                        `[Prompt de Mapa Top-Down para IA]:\n**${generatedMapPrompt.title}**\n\n\`${generatedMapPrompt.englishPrompt}\``,
                        "ai"
                      );
                      rpgAudio.playMagicSpell();
                    }}
                    className="px-3.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Enviar para o Chat
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-xs text-neutral-500 space-y-2">
                <Map className="w-8 h-8 text-neutral-700 mx-auto" />
                <p className="font-semibold text-neutral-400">Gerador de Prompts de Mapa de Batalha (Top-Down)</p>
                <p className="max-w-xs mx-auto text-neutral-500 text-[11px]">
                  Escolha um preset ao lado ou digite seu tema para gerar prompts profissionais otimizados para Midjourney, DALL-E e Stable Diffusion.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
