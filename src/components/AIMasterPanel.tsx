import React, { useState } from "react";
import { RPGSystem, MapToken } from "../types";
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
  Volume2
} from "lucide-react";
import { rpgAudio } from "../utils/audioSynth";

interface AIMasterPanelProps {
  system: RPGSystem;
  onSendToChat: (message: string, role?: "ai" | "gm" | "system") => void;
  onAddTokenToMap?: (token: MapToken) => void;
  activeCharacterName?: string;
}

export const AIMasterPanel: React.FC<AIMasterPanelProps> = ({
  system,
  onSendToChat,
  onAddTokenToMap,
  activeCharacterName,
}) => {
  const [activeTab, setActiveTab] = useState<"narrative" | "npc" | "encounter" | "riddle">("narrative");

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
      <div className="flex border-b border-neutral-800 gap-2">
        {[
          { id: "narrative", label: "Narração de Cena", icon: Sparkles },
          { id: "npc", label: "Gerador de Inimigos / NPCs", icon: Skull },
          { id: "encounter", label: "Gerador de Encontros", icon: Compass },
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
    </div>
  );
};
