import React, { useState } from "react";
import {
  RPGSystem,
  DnDCharacter,
  OrdemCharacter,
  CustomCharacter,
  DiceRollResult,
} from "../types";
import { rpgAudio } from "../utils/audioSynth";
import {
  Sparkles,
  Dice5,
  Compass,
  MessageSquare,
  HelpCircle,
  Play,
  RotateCcw,
  Heart,
  Brain,
  Shield,
  Search,
  BookOpen,
  Maximize2,
  Skull,
  AlertTriangle,
  Zap,
  CheckCircle,
  Send,
  Eye,
  User,
  Activity,
  UserPlus
} from "lucide-react";

interface SoloModeDashboardProps {
  system: RPGSystem;
  onSetSystem: (sys: RPGSystem) => void;
  dndChar: DnDCharacter;
  ordemChar: OrdemCharacter;
  customChar: CustomCharacter;
  onUpdateDndChar: (char: DnDCharacter) => void;
  onUpdateOrdemChar: (char: OrdemCharacter) => void;
  onUpdateCustomChar: (char: CustomCharacter) => void;
  onRollDiceAnimation: (roll: DiceRollResult) => void;
  isSimplifiedMenu: boolean;
}

interface NarrativeLogEntry {
  id: string;
  timestamp: number;
  type: "player" | "master" | "oracle" | "dice";
  title?: string;
  text: string;
  diceDetail?: string;
}

export const SoloModeDashboard: React.FC<SoloModeDashboardProps> = ({
  system,
  onSetSystem,
  dndChar,
  ordemChar,
  customChar,
  onUpdateDndChar,
  onUpdateOrdemChar,
  onUpdateCustomChar,
  onRollDiceAnimation,
  isSimplifiedMenu,
}) => {
  const [playerAction, setPlayerAction] = useState("");
  const [sceneSetting, setSceneSetting] = useState("Masmorra abandonada repleta de símbolos antigos nas paredes");
  const [logs, setLogs] = useState<NarrativeLogEntry[]>([
    {
      id: "init-1",
      timestamp: Date.now() - 30000,
      type: "master",
      title: "Início da Aventura Solo",
      text: "O silêncio fúnebre é quebrado apenas pelo eco constante dos seus passos. À sua frente, o corredor se divide em dois. O caminho da esquerda cheira a mofo e umidade, enquanto a passagem da direita apresenta um vento frio constante com um murmúrio distante e inquietante. O que você decide fazer?",
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"narrative" | "oracle">("narrative");

  // Oracle states
  const [oracleAnswer, setOracleAnswer] = useState<{ answer: string; detail: string; roll: number } | null>(null);
  const [unexpectedEvent, setUnexpectedEvent] = useState<string | null>(null);

  // Quick Stats helper based on selected system
  const getActiveStats = () => {
    if (system === "dnd5e") {
      return {
        name: dndChar.name || "Herói",
        classOrRank: dndChar.classAndLevel || "Guerreiro Nível 1",
        hp: dndChar.hp.current,
        maxHp: dndChar.hp.max,
        setHp: (val: number) => {
          onUpdateDndChar({
            ...dndChar,
            hp: { ...dndChar.hp, current: Math.max(0, Math.min(dndChar.hp.max, val)) }
          });
        },
        resourceName: "Incentivo",
        resourceVal: dndChar.inspiration ? 1 : 0,
        setResource: (val: number) => {
          onUpdateDndChar({
            ...dndChar,
            inspiration: val > 0
          });
        },
        attributes: [
          { name: "FOR", val: dndChar.stats.str, mod: Math.floor((dndChar.stats.str - 10) / 2) },
          { name: "DES", val: dndChar.stats.dex, mod: Math.floor((dndChar.stats.dex - 10) / 2) },
          { name: "CON", val: dndChar.stats.con, mod: Math.floor((dndChar.stats.con - 10) / 2) },
          { name: "INT", val: dndChar.stats.int, mod: Math.floor((dndChar.stats.int - 10) / 2) },
          { name: "SAB", val: dndChar.stats.wis, mod: Math.floor((dndChar.stats.wis - 10) / 2) },
          { name: "CAR", val: dndChar.stats.cha, mod: Math.floor((dndChar.stats.cha - 10) / 2) },
        ]
      };
    } else if (system === "ordem") {
      return {
        name: ordemChar.name || "Agente",
        classOrRank: `${ordemChar.classType} (${ordemChar.rank})`,
        hp: ordemChar.pv.current,
        maxHp: ordemChar.pv.max,
        setHp: (val: number) => {
          onUpdateOrdemChar({
            ...ordemChar,
            pv: { ...ordemChar.pv, current: Math.max(0, Math.min(ordemChar.pv.max, val)) }
          });
        },
        resourceName: "Sanidade",
        resourceVal: ordemChar.san.current,
        maxResource: ordemChar.san.max,
        setResource: (val: number) => {
          onUpdateOrdemChar({
            ...ordemChar,
            san: { ...ordemChar.san, current: Math.max(0, Math.min(ordemChar.san.max, val)) }
          });
        },
        pe: ordemChar.pe.current,
        maxPe: ordemChar.pe.max,
        setPe: (val: number) => {
          onUpdateOrdemChar({
            ...ordemChar,
            pe: { ...ordemChar.pe, current: Math.max(0, Math.min(ordemChar.pe.max, val)) }
          });
        },
        attributes: [
          { name: "AGI", val: ordemChar.attributes.agi, mod: ordemChar.attributes.agi },
          { name: "FOR", val: ordemChar.attributes.for, mod: ordemChar.attributes.for },
          { name: "INT", val: ordemChar.attributes.int, mod: ordemChar.attributes.int },
          { name: "PRE", val: ordemChar.attributes.pre, mod: ordemChar.attributes.pre },
          { name: "VIG", val: ordemChar.attributes.vig, mod: ordemChar.attributes.vig },
        ]
      };
    } else {
      return {
        name: customChar.name || "Aventureiro Livre",
        classOrRank: customChar.concept || "Conceito Livre",
        hp: customChar.bars[0]?.current ?? 20,
        maxHp: customChar.bars[0]?.max ?? 20,
        setHp: (val: number) => {
          const updatedBars = [...customChar.bars];
          if (updatedBars[0]) {
            updatedBars[0] = { ...updatedBars[0], current: Math.max(0, Math.min(updatedBars[0].max, val)) };
            onUpdateCustomChar({ ...customChar, bars: updatedBars });
          }
        },
        resourceName: customChar.bars[1]?.name || "Mana / Energia",
        resourceVal: customChar.bars[1]?.current ?? 10,
        maxResource: customChar.bars[1]?.max ?? 10,
        setResource: (val: number) => {
          const updatedBars = [...customChar.bars];
          if (updatedBars[1]) {
            updatedBars[1] = { ...updatedBars[1], current: Math.max(0, Math.min(updatedBars[1].max, val)) };
            onUpdateCustomChar({ ...customChar, bars: updatedBars });
          }
        },
        attributes: customChar.attributes.map(a => ({
          name: a.name,
          val: a.value,
          mod: parseInt((a.modifier || "").replace("+", "")) || 0
        }))
      };
    }
  };

  const activeStats = getActiveStats();

  // Pre-made narrative options
  const handleQuickAction = (actionText: string) => {
    setPlayerAction(actionText);
    rpgAudio.playClick();
  };

  // Roll Attribute check into solo mode log & trigger AI narrative
  const handleRollAttribute = (attrName: string, modifier: number) => {
    const d20Roll = Math.floor(Math.random() * 20) + 1;
    const total = d20Roll + modifier;
    const desc = `Rolagem de ${attrName}: d20 (${d20Roll}) + Modificador (${modifier > 0 ? "+" + modifier : modifier}) = **${total}**`;
    
    rpgAudio.playDiceRoll();
    onRollDiceAnimation({
      id: `roll-${Date.now()}`,
      diceType: "d20",
      formula: `1d20${modifier >= 0 ? "+" : ""}${modifier}`,
      rolls: [d20Roll],
      modifier: modifier,
      total: total,
      rollerName: "Você",
      timestamp: Date.now(),
      reason: `Teste de ${attrName} Solo`,
      system: system
    });

    const diceLog: NarrativeLogEntry = {
      id: `dice-${Date.now()}`,
      timestamp: Date.now(),
      type: "dice",
      text: `Você rolou um teste de **${attrName}**!`,
      diceDetail: desc
    };

    setLogs((prev) => [...prev, diceLog]);
    setPlayerAction((prev) => {
      const trimmed = prev.trim();
      return trimmed 
        ? `${trimmed} (Eu realizo um teste de ${attrName} e obtenho total ${total})`
        : `Tento realizar uma ação que exige ${attrName} (Rolagem: d20 total ${total})`;
    });
  };

  // Trigger Gemini or Fallback Narrator
  const handleTriggerNarrative = async () => {
    const actionText = playerAction.trim();
    if (!actionText && !isLoading) return;

    setIsLoading(true);
    rpgAudio.playBookFlip();

    // Log user action
    const playerLog: NarrativeLogEntry = {
      id: `player-${Date.now()}`,
      timestamp: Date.now(),
      type: "player",
      text: actionText,
    };
    setLogs((prev) => [...prev, playerLog]);
    setPlayerAction("");

    try {
      // Gather latest context from history
      const contextText = logs
        .filter(l => l.type === "master" || l.type === "player")
        .slice(-3)
        .map(l => `${l.type === "player" ? "Ação do Jogador: " : "Mestre: "}${l.text}`)
        .join("\n");

      const response = await fetch("/api/ai/narrative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system,
          playerAction: actionText,
          characterName: activeStats.name,
          context: contextText,
          sceneSetting: sceneSetting,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const gmLog: NarrativeLogEntry = {
          id: `master-${Date.now()}`,
          timestamp: Date.now(),
          type: "master",
          title: `Mestre Solo (${data.source === "procedural-natal" ? "Procedural" : "IA"})`,
          text: data.text,
        };
        setLogs((prev) => [...prev, gmLog]);
        rpgAudio.playMagicSpell();
      } else {
        throw new Error("API response error");
      }
    } catch (e) {
      console.error(e);
      // Fallback
      const gmLog: NarrativeLogEntry = {
        id: `master-${Date.now()}`,
        timestamp: Date.now(),
        type: "master",
        title: "Mestre Solo (Mesa)",
        text: `Seus esforços ecoam silenciosamente. Você se depara com um desafio à sua frente e as sombras parecem se mover na direção de ${activeStats.name}. O que você faz a seguir?`,
      };
      setLogs((prev) => [...prev, gmLog]);
    } finally {
      setIsLoading(false);
    }
  };

  // Solo Oracle Logic
  const handleAskOracle = (likelihood: "likely" | "even" | "unlikely") => {
    rpgAudio.playDiceRoll();
    const roll = Math.floor(Math.random() * 100) + 1;
    
    let threshold = 50; // default for 50/50
    if (likelihood === "likely") threshold = 30; // easier to get Yes
    if (likelihood === "unlikely") threshold = 70; // harder to get Yes

    const isYes = roll >= threshold;
    const extremeModifier = roll <= 10 || roll >= 90;

    let answer = "";
    let detail = "";

    if (isYes) {
      if (extremeModifier) {
        answer = "SIM, E ALÉM DISSO...";
        detail = "Acontece exatamente o que você esperava, e uma surpresa incrivelmente benéfica ou detalhe extra positivo se revela!";
      } else {
        answer = "SIM!";
        detail = "A resposta é positiva. Suas suposições ou desejos se concretizam normalmente no cenário.";
      }
    } else {
      if (extremeModifier) {
        answer = "NÃO, E PARA PIORAR...";
        detail = "Não apenas falha, mas um perigo extra surge ou as circunstâncias mudam drasticamente contra você!";
      } else {
        answer = "NÃO.";
        detail = "A resposta é negativa. O obstáculo persiste ou a hipótese que você imaginou não é real.";
      }
    }

    setOracleAnswer({ answer, detail, roll });

    // Auto-log into narrative history
    const oracleLog: NarrativeLogEntry = {
      id: `oracle-${Date.now()}`,
      timestamp: Date.now(),
      type: "oracle",
      text: `🔮 Pergunta ao Oráculo (Probabilidade: ${likelihood === "likely" ? "Provável" : likelihood === "unlikely" ? "Improvável" : "50/50"}): **${answer}**`,
      diceDetail: `Detalhe: ${detail} (Dado rolado: d100 de resultado ${roll})`
    };
    setLogs((prev) => [...prev, oracleLog]);
  };

  const handleGenerateUnexpectedEvent = () => {
    rpgAudio.playMagicSpell();
    const actionList = ["Alterar", "Aumentar", "Bloquear", "Revelar", "Destruir", "Separar", "Avisar", "Esconder", "Enfraquecer", "Mudar"];
    const subjectList = ["Caminho", "Monstro", "Segredo", "Equipamento", "Clima local", "Luz ambiente", "Gravidade", "Sanidade", "Armadilha", "Tempo"];

    const act = actionList[Math.floor(Math.random() * actionList.length)];
    const sub = subjectList[Math.floor(Math.random() * subjectList.length)];
    const eventText = `💥 Evento Inesperado: **${act} o(a) ${sub}**! Algo fora do planejado muda o curso imediato do cenário. Use isso na sua próxima narração com a IA.`;
    
    setUnexpectedEvent(eventText);

    const eventLog: NarrativeLogEntry = {
      id: `oracle-evt-${Date.now()}`,
      timestamp: Date.now(),
      type: "oracle",
      text: eventText
    };
    setLogs((prev) => [...prev, eventLog]);
  };

  const clearHistory = () => {
    rpgAudio.playClick();
    if (confirm("Deseja mesmo limpar todo o histórico de narração da sua aventura solo?")) {
      setLogs([
        {
          id: "init-1",
          timestamp: Date.now(),
          type: "master",
          title: "Início da Aventura Solo",
          text: "Você respira fundo e começa uma nova jornada. O cenário está à sua disposição. Escreva sua primeira ação abaixo ou use o oráculo para iniciar!",
        }
      ]);
      setOracleAnswer(null);
      setUnexpectedEvent(null);
    }
  };

  return (
    <div className="w-full h-full flex flex-col lg:flex-row bg-neutral-950 text-neutral-100 overflow-hidden select-none">
      
      {/* LEFT COLUMN: Narrative Console & Action Controls */}
      <div className="flex-1 flex flex-col p-3 sm:p-5 overflow-hidden border-b lg:border-b-0 lg:border-r border-neutral-800/80">
        
        {/* Header Title Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-800/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/25 text-purple-300 border border-purple-500/40 animate-pulse">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="font-serif font-bold text-sm sm:text-base text-purple-200">
                  Modo Solo com Mestre IA
                </h2>
                <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-purple-900/40 text-purple-300 border border-purple-600/30 uppercase font-bold tracking-wider">
                  Solo RPG
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-neutral-400">
                Jogue sozinho! Escreva suas ações, role os atributos da sua ficha e coopere com o Mestre IA.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* System select inside Solo Mode */}
            <select
              value={system}
              onChange={(e) => onSetSystem(e.target.value as RPGSystem)}
              className="bg-neutral-900 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-xs text-neutral-300 font-semibold focus:outline-none focus:border-purple-500/80 transition-all cursor-pointer"
            >
              <option value="ordem">Ordem Paranormal</option>
              <option value="dnd5e">D&D 5e</option>
              <option value="custom">Sistema Livre</option>
            </select>

            <button
              onClick={clearHistory}
              title="Reiniciar aventura solo do zero"
              className="p-1.5 sm:p-2 bg-neutral-900 border border-neutral-800 hover:border-red-500/50 hover:text-red-400 rounded-xl text-neutral-400 transition-all active:scale-95 text-xs flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reiniciar</span>
            </button>
          </div>
        </div>

        {/* Solo Guide Alert for lay users (Very friendly) */}
        {!isSimplifiedMenu && (
          <div className="bg-gradient-to-r from-purple-950/20 via-neutral-900 to-purple-950/20 border border-purple-500/20 rounded-2xl p-3 mt-3 flex items-start gap-3">
            <HelpCircle className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed text-neutral-300">
              <span className="text-purple-300 font-bold">Dica de Como Jogar Solo:</span> Você descreve o que quer fazer no campo inferior e clica em <span className="font-bold text-white">"NARRAR AÇÃO"</span>. Se for algo desafiador, clique em um dos <span className="font-bold text-amber-300">atributos da sua Ficha ao lado</span> para rolar o dado automático antes de enviar a ação!
            </div>
          </div>
        )}

        {/* Narrative Scroll Window */}
        <div className="flex-1 overflow-y-auto space-y-4 my-4 pr-1.5 min-h-[220px]">
          {logs.map((log) => (
            <div
              key={log.id}
              className={`p-4 rounded-2xl border transition-all ${
                log.type === "player"
                  ? "bg-neutral-900/60 border-neutral-800 ml-8 text-neutral-200"
                  : log.type === "master"
                  ? "bg-purple-950/15 border-purple-500/20 mr-8 text-purple-100/95 shadow-sm shadow-purple-500/5"
                  : log.type === "oracle"
                  ? "bg-amber-950/15 border-amber-500/25 text-amber-200 mr-4 font-mono text-[11px]"
                  : "bg-neutral-950 border-neutral-900 text-neutral-400 text-xs font-mono py-2.5 px-3.5"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-[10px] font-extrabold uppercase tracking-widest ${
                  log.type === "player"
                    ? "text-neutral-400"
                    : log.type === "master"
                    ? "text-purple-400"
                    : log.type === "oracle"
                    ? "text-amber-400"
                    : "text-neutral-500"
                }`}>
                  {log.type === "player" ? `Você (${activeStats.name})` : log.title || "Mestre Solo IA"}
                </span>
                <span className="text-[9px] text-neutral-600 font-mono">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
              <p className="text-xs sm:text-[13px] leading-relaxed whitespace-pre-line">
                {log.text}
              </p>

              {log.diceDetail && (
                <div className="mt-2 pt-2 border-t border-neutral-800/60 text-[11px] text-amber-400 font-mono flex items-center gap-1.5">
                  <Dice5 className="w-3.5 h-3.5" />
                  <span>{log.diceDetail}</span>
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="p-4 bg-purple-950/10 border border-purple-500/10 rounded-2xl mr-8 text-purple-400 flex items-center gap-3 animate-pulse">
              <Sparkles className="w-4 h-4 text-purple-400 animate-spin" />
              <div className="text-xs font-semibold">
                {system === "ordem" 
                  ? "Invocando o Paranormal para tecer a realidade..." 
                  : "Mestre Solo IA está desenhando as consequências das suas escolhas..."}
              </div>
            </div>
          )}
        </div>

        {/* Input Bar & Preset Quick Actions */}
        <div className="space-y-3 pt-2">
          {/* Quick suggestions row */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 select-none scrollbar-thin">
            <span className="text-[9px] font-extrabold text-neutral-500 uppercase tracking-wider whitespace-nowrap flex-shrink-0 px-1">Atalhos:</span>
            {[
              { text: "🔍 Eu examino minuciosamente os arredores procurando pistas.", label: "Examinar Local" },
              { text: "🛡️ Fico em guarda total, escudo erguido contra ataques surpresa.", label: "Ficar em Alerta" },
              { text: "🚪 Eu tento forçar e arrombar a passagem bloqueada com força bruta.", label: "Forçar Passagem" },
              { text: "⚔️ Desembainho minha arma e me preparo para o ataque!", label: "Atacar!" },
              { text: "💬 Eu chamo em voz alta e pergunto se há alguém ali.", label: "Chamar Alguém" }
            ].map((shortcut, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickAction(shortcut.text)}
                className="px-2 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800/80 text-[10px] text-neutral-300 font-medium whitespace-nowrap transition-all active:scale-95"
              >
                {shortcut.label}
              </button>
            ))}
          </div>

          {/* Current Setting Info Bar */}
          <div className="flex items-center gap-2 bg-neutral-900/40 border border-neutral-800/80 rounded-xl px-2.5 py-1.5 text-xs text-neutral-400">
            <span className="text-[9px] font-extrabold text-purple-400 uppercase tracking-widest flex-shrink-0">Cenário:</span>
            <input
              type="text"
              value={sceneSetting}
              onChange={(e) => setSceneSetting(e.target.value)}
              title="Escreva o local ou atmosfera para guiar as narrações da IA"
              placeholder="Ex: Masmorra de pedra escura, som de pingos de água..."
              className="bg-transparent border-none text-neutral-300 text-[11px] font-medium placeholder:text-neutral-600 focus:outline-none flex-1"
            />
          </div>

          {/* Main prompt input box */}
          <div className="flex gap-2">
            <textarea
              value={playerAction}
              onChange={(e) => setPlayerAction(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleTriggerNarrative();
                }
              }}
              placeholder={`Escreva a ação de seu herói (${activeStats.name}) aqui... Ex: 'Eu acendo uma tocha e sigo devagar...'`}
              className="flex-1 min-h-[46px] max-h-[120px] bg-neutral-900 border border-neutral-800 hover:border-purple-500/40 focus:border-purple-500 rounded-2xl px-4 py-2.5 text-xs sm:text-[13px] text-neutral-200 placeholder:text-neutral-500 focus:outline-none transition-all resize-none"
            />
            <button
              onClick={handleTriggerNarrative}
              disabled={isLoading || !playerAction.trim()}
              className="px-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:hover:bg-purple-600 text-white font-bold rounded-2xl flex flex-col items-center justify-center gap-1 shadow-lg shadow-purple-500/20 active:scale-95 transition-all text-xs flex-shrink-0"
              title="Enviar ação para o Mestre IA responder"
            >
              <Send className="w-4 h-4" />
              <span className="text-[9px] font-black uppercase tracking-wider">Narrar</span>
            </button>
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: Fate Oracle & Protagonist Live Hub */}
      <div className="w-full lg:w-[350px] p-3 sm:p-5 flex flex-col gap-4 overflow-y-auto select-none bg-neutral-900/30">
        
        {/* PROTAGONIST LIVE HUB (Interactive Character Connection) */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-amber-400" />
              <span className="font-serif font-bold text-xs sm:text-sm text-neutral-200">
                Protagonista Ativo
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold text-amber-400 uppercase">
              {system === "ordem" ? "Ficha Ordem" : system === "dnd5e" ? "Ficha D&D 5e" : "Ficha Livre"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-500 flex items-center justify-center text-neutral-950 font-black shadow-md text-sm">
              {activeStats.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-xs sm:text-sm text-neutral-100 truncate">
                {activeStats.name}
              </h3>
              <p className="text-[10px] text-neutral-400 truncate">
                {activeStats.classOrRank}
              </p>
            </div>
          </div>

          {/* Life bar controller */}
          <div className="space-y-2 pt-1.5">
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-red-400 font-bold flex items-center gap-1">
                  <Heart className="w-3 h-3" /> Pontos de Vida (PV)
                </span>
                <span className="font-mono text-neutral-300 font-bold">
                  {activeStats.hp} / {activeStats.maxHp}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => activeStats.setHp(activeStats.hp - 1)}
                  className="w-6 h-6 rounded bg-neutral-800 hover:bg-red-950/40 text-neutral-300 text-xs font-bold transition-all flex items-center justify-center active:scale-90 border border-neutral-700/60"
                >
                  -
                </button>
                <div className="flex-1 h-2 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                  <div
                    className="h-full bg-red-600 transition-all duration-350"
                    style={{ width: `${(activeStats.hp / activeStats.maxHp) * 100}%` }}
                  />
                </div>
                <button
                  onClick={() => activeStats.setHp(activeStats.hp + 1)}
                  className="w-6 h-6 rounded bg-neutral-800 hover:bg-emerald-950/40 text-neutral-300 text-xs font-bold transition-all flex items-center justify-center active:scale-90 border border-neutral-700/60"
                >
                  +
                </button>
              </div>
            </div>

            {/* Resources (PE / Sanity / Inspiration depending on system) */}
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-purple-400 font-bold flex items-center gap-1">
                  <Brain className="w-3 h-3" /> {activeStats.resourceName}
                </span>
                <span className="font-mono text-neutral-300 font-bold">
                  {system === "dnd5e" 
                    ? (activeStats.resourceVal > 0 ? "INSPIRADO ✨" : "Gasto") 
                    : `${activeStats.resourceVal} / ${activeStats.maxResource || 10}`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => activeStats.setResource(activeStats.resourceVal - 1)}
                  className="w-6 h-6 rounded bg-neutral-800 hover:bg-purple-950/40 text-neutral-300 text-xs font-bold transition-all flex items-center justify-center active:scale-90 border border-neutral-700/60"
                >
                  -
                </button>
                <div className="flex-1 h-2 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                  <div
                    className="h-full bg-purple-600 transition-all duration-350"
                    style={{ 
                      width: system === "dnd5e" 
                        ? (activeStats.resourceVal > 0 ? 100 : 0) 
                        : `${(activeStats.resourceVal / (activeStats.maxResource || 10)) * 100}%` 
                    }}
                  />
                </div>
                <button
                  onClick={() => activeStats.setResource(activeStats.resourceVal + 1)}
                  className="w-6 h-6 rounded bg-neutral-800 hover:bg-purple-950/40 text-neutral-300 text-xs font-bold transition-all flex items-center justify-center active:scale-90 border border-neutral-700/60"
                >
                  +
                </button>
              </div>
            </div>

            {system === "ordem" && activeStats.pe !== undefined && activeStats.maxPe !== undefined && (
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-amber-400 font-bold flex items-center gap-1">
                    <Zap className="w-3 h-3" /> Pontos de Esforço (PE)
                  </span>
                  <span className="font-mono text-neutral-300 font-bold">
                    {activeStats.pe} / {activeStats.maxPe}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => activeStats.setPe!(activeStats.pe! - 1)}
                    className="w-6 h-6 rounded bg-neutral-800 text-neutral-300 text-xs font-bold transition-all flex items-center justify-center active:scale-90 border border-neutral-700/60"
                  >
                    -
                  </button>
                  <div className="flex-1 h-2 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                    <div
                      className="h-full bg-amber-500 transition-all duration-350"
                      style={{ width: `${(activeStats.pe! / activeStats.maxPe!) * 100}%` }}
                    />
                  </div>
                  <button
                    onClick={() => activeStats.setPe!(activeStats.pe! + 1)}
                    className="w-6 h-6 rounded bg-neutral-800 text-neutral-300 text-xs font-bold transition-all flex items-center justify-center active:scale-90 border border-neutral-700/60"
                  >
                    +
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick attribute/modifier dice clickers */}
          <div className="pt-2">
            <span className="text-[10px] text-neutral-400 font-bold block mb-1.5 uppercase tracking-wide">
              Atributos (Clique para rolar d20):
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {activeStats.attributes.map((attr, idx) => (
                <button
                  key={idx}
                  onClick={() => handleRollAttribute(attr.name, attr.mod)}
                  className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-amber-500/50 hover:bg-amber-950/10 transition-all active:scale-95 group"
                >
                  <span className="text-[10px] font-bold text-neutral-400 group-hover:text-amber-300 transition-colors">
                    {attr.name}
                  </span>
                  <span className="text-xs font-extrabold text-neutral-200 mt-0.5">
                    {attr.mod >= 0 ? `+${attr.mod}` : attr.mod}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* SOLO RPG FATE ORACLE (Oráculo do Destino) */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-4 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-neutral-800">
            <Compass className="w-4 h-4 text-amber-500" />
            <span className="font-serif font-bold text-xs sm:text-sm text-neutral-200">
              Oráculo do Destino
            </span>
          </div>

          <div className="space-y-3">
            <span className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wide">
              Fazer Pergunta Sim/Não:
            </span>
            
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => handleAskOracle("likely")}
                className="px-2.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-[10px] font-bold text-emerald-400 hover:bg-emerald-950/10 hover:border-emerald-500/40 transition-all active:scale-95"
              >
                👍 Provável
              </button>
              <button
                onClick={() => handleAskOracle("even")}
                className="px-2.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-[10px] font-bold text-amber-400 hover:bg-amber-950/10 hover:border-amber-500/40 transition-all active:scale-95"
              >
                ⚖️ 50 / 50
              </button>
              <button
                onClick={() => handleAskOracle("unlikely")}
                className="px-2.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-[10px] font-bold text-red-400 hover:bg-red-950/10 hover:border-red-500/40 transition-all active:scale-95"
              >
                👎 Improvável
              </button>
            </div>

            {/* Oracle result display */}
            {oracleAnswer && (
              <div className="p-3 bg-amber-950/10 border border-amber-500/25 rounded-2xl space-y-1 font-mono text-[11px] animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-amber-400 font-black uppercase tracking-wider">
                    {oracleAnswer.answer}
                  </span>
                  <span className="text-[9px] text-neutral-500">
                    Rolagem: {oracleAnswer.roll}
                  </span>
                </div>
                <p className="text-neutral-300 leading-normal text-[10px]">
                  {oracleAnswer.detail}
                </p>
              </div>
            )}

            {/* Quick Unexpected Event Button */}
            <div className="pt-2 border-t border-neutral-800/80">
              <button
                onClick={handleGenerateUnexpectedEvent}
                className="w-full py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-neutral-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-500/10 active:scale-95"
              >
                💥 Gerar Evento Inesperado
              </button>
            </div>

            {unexpectedEvent && (
              <div className="p-3 bg-purple-950/10 border border-purple-500/20 rounded-2xl text-[10px] text-purple-200 leading-normal font-medium">
                {unexpectedEvent}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
