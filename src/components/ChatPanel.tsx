import React, { useState, useRef, useEffect } from "react";
import { ChatMessage, RPGSystem, UserRole } from "../types";
import {
  Send,
  Sparkles,
  Dice5,
  Crown,
  Shield,
  Trash2,
  Volume2,
  MessageSquare,
  Zap,
  Eye,
  Heart
} from "lucide-react";
import { rpgAudio } from "../utils/audioSynth";

interface ChatPanelProps {
  messages: ChatMessage[];
  currentUserName: string;
  userRole: UserRole;
  system: RPGSystem;
  onSendMessage: (text: string, type?: ChatMessage["type"]) => void;
  onClearChat?: () => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  currentUserName,
  userRole,
  system,
  onSendMessage,
  onClearChat,
}) => {
  const [inputText, setInputText] = useState("");
  const [messageType, setMessageType] = useState<ChatMessage["type"]>("in_character");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    onSendMessage(inputText.trim(), messageType);
    setInputText("");
  };

  return (
    <div className="flex flex-col h-full bg-neutral-950 border-l border-neutral-800 text-neutral-100 select-text">
      {/* Header */}
      <div className="p-3.5 border-b border-neutral-800 bg-neutral-900/60 backdrop-blur flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-amber-400" />
          <span className="font-serif font-bold text-xs text-amber-100">Registro & Chat da Sessão</span>
        </div>
        {userRole === "gm" && onClearChat && (
          <button
            onClick={onClearChat}
            className="p-1 text-neutral-500 hover:text-red-400 rounded-lg hover:bg-neutral-800 transition-colors"
            title="Limpar Registro"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => {
          // Dice Roll message
          if (msg.type === "roll" && msg.rollData) {
            const roll = msg.rollData;
            const isCrit = roll.isCritical || (roll.rolls.some((r) => r === 20));
            const isFumble = roll.isFumble || (roll.rolls.length === 1 && roll.rolls[0] === 1);

            return (
              <div
                key={msg.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  isCrit
                    ? "bg-amber-950/40 border-amber-500/80 shadow-lg ring-1 ring-amber-500/40"
                    : isFumble
                    ? "bg-red-950/40 border-red-800 shadow"
                    : roll.system === "ordem"
                    ? "bg-purple-950/30 border-purple-900/50"
                    : "bg-neutral-900 border-neutral-800"
                }`}
              >
                <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1.5">
                  <span className="font-bold text-amber-300 flex items-center gap-1">
                    <Dice5 className="w-3.5 h-3.5 text-amber-500" />
                    {msg.sender}
                  </span>
                  <span className="font-mono text-[10px] text-neutral-500">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>

                <div className="text-xs font-semibold text-neutral-200 mb-2">{roll.reason}</div>

                <div className="flex items-center justify-between bg-neutral-950/80 p-2.5 rounded-xl border border-neutral-800">
                  <div className="space-y-0.5">
                    <div className="text-[10px] text-neutral-400 font-mono">
                      Fórmula: <strong className="text-neutral-200">{roll.formula}</strong>
                    </div>
                    {roll.rolls.length > 0 && (
                      <div className="text-[10px] text-neutral-400 font-mono flex items-center gap-1">
                        Dados: [
                        {roll.rolls.map((r, i) => (
                          <span
                            key={i}
                            className={`font-bold ${
                              r === 20 ? "text-emerald-400" : r === 1 ? "text-red-400" : "text-amber-300"
                            }`}
                          >
                            {r}
                            {i < roll.rolls.length - 1 ? ", " : ""}
                          </span>
                        ))}
                        ]
                        {roll.modifier !== 0 && (
                          <span>
                            {roll.modifier >= 0 ? ` + ${roll.modifier}` : ` - ${Math.abs(roll.modifier)}`}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <div
                      className={`text-xl font-mono font-extrabold ${
                        isCrit ? "text-emerald-400 animate-pulse" : isFumble ? "text-red-400" : "text-amber-300"
                      }`}
                    >
                      {roll.total}
                    </div>
                    {isCrit && (
                      <span className="text-[9px] uppercase font-bold text-emerald-400 tracking-wider">
                        ★ ACERTO CRÍTICO!
                      </span>
                    )}
                    {isFumble && (
                      <span className="text-[9px] uppercase font-bold text-red-400 tracking-wider">
                        DESASTRE / ERRO CRÍTICO
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          }

          // AI Master Narration Message
          if (msg.role === "ai") {
            return (
              <div
                key={msg.id}
                className="p-4 rounded-2xl bg-purple-950/30 border border-purple-800/60 shadow-xl space-y-1.5"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold font-serif text-purple-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    Mestre de Jogo IA
                  </span>
                  <span className="font-mono text-[10px] text-purple-400/60">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p className="text-xs text-neutral-200 font-serif leading-relaxed whitespace-pre-line italic">
                  {msg.content}
                </p>
              </div>
            );
          }

          // GM Narration
          if (msg.role === "gm" || msg.type === "narration") {
            return (
              <div
                key={msg.id}
                className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-800/50 shadow-md space-y-1"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold font-serif text-amber-300 flex items-center gap-1">
                    <Crown className="w-3.5 h-3.5 text-amber-500" />
                    [Mestre] {msg.sender}
                  </span>
                </div>
                <p className="text-xs text-amber-100 font-serif leading-relaxed">{msg.content}</p>
              </div>
            );
          }

          // Standard In-Character / Out-of-Character player message
          return (
            <div
              key={msg.id}
              className={`p-3 rounded-2xl border text-xs space-y-1 ${
                msg.sender === currentUserName
                  ? "bg-neutral-900 border-neutral-700 ml-4"
                  : "bg-neutral-950 border-neutral-800 mr-4"
              }`}
            >
              <div className="flex items-center justify-between text-[10px] text-neutral-400">
                <span className="font-bold text-neutral-300">
                  {msg.sender}
                  {msg.type === "out_of_character" && (
                    <span className="text-neutral-500 ml-1 font-normal">(Off-Game)</span>
                  )}
                </span>
                <span className="font-mono text-neutral-500">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <p
                className={`text-neutral-200 leading-normal ${
                  msg.type === "in_character" ? "font-serif text-amber-100/90" : "font-sans text-neutral-300"
                }`}
              >
                {msg.content}
              </p>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Controls */}
      <form onSubmit={handleSend} className="p-3 border-t border-neutral-800 bg-neutral-900/60 space-y-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setMessageType("in_character")}
            className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
              messageType === "in_character"
                ? "bg-amber-500 text-neutral-950 font-bold"
                : "text-neutral-400 hover:text-white bg-neutral-950"
            }`}
          >
            Em Personagem
          </button>
          <button
            type="button"
            onClick={() => setMessageType("out_of_character")}
            className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
              messageType === "out_of_character"
                ? "bg-neutral-700 text-white font-bold"
                : "text-neutral-400 hover:text-white bg-neutral-950"
            }`}
          >
            Fora do Jogo (OOC)
          </button>
          {userRole === "gm" && (
            <button
              type="button"
              onClick={() => setMessageType("narration")}
              className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                messageType === "narration"
                  ? "bg-amber-600 text-white font-bold"
                  : "text-neutral-400 hover:text-white bg-neutral-950"
              }`}
            >
              Narração
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              messageType === "in_character"
                ? "Falar como seu personagem..."
                : messageType === "narration"
                ? "Narrar acontecimento da mesa..."
                : "Mensagem fora de personagem..."
            }
            className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-amber-500"
          />
          <button
            type="submit"
            className="p-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-neutral-950 rounded-xl transition-all shadow active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
