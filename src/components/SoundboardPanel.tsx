import React, { useState } from "react";
import { Volume2, Play, Square, Music, Sparkles, Sword, Dice5, Zap, Shield, FileText } from "lucide-react";
import { rpgAudio } from "../utils/audioSynth";

export const SoundboardPanel: React.FC = () => {
  const [activeAmbience, setActiveAmbience] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>(() => {
    return localStorage.getItem("rpg_master_notes") || "• Pistas do Mistério:\n- Símbolo de Morte encontrado no porão.\n- O cultista fugiu em direção ao bosque.\n- Próximo desafio: Enigma das 4 Estátuas.";
  });

  const handleToggleAmbience = (type: "tavern" | "dungeon" | "haunted") => {
    if (activeAmbience === type) {
      rpgAudio.stopAmbience();
      setActiveAmbience(null);
    } else {
      rpgAudio.startAmbience(type);
      setActiveAmbience(type);
    }
  };

  const handleSaveNotes = (val: string) => {
    setNotes(val);
    localStorage.setItem("rpg_master_notes", val);
  };

  return (
    <div className="w-full h-full bg-neutral-950 overflow-y-auto p-4 md:p-6 space-y-6 text-neutral-100">
      {/* Soundboard Audio FX */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-amber-400" />
            <h3 className="font-serif font-bold text-sm text-amber-100">Mesa de Efeitos Sonoros (Procedural Web Audio)</h3>
          </div>
          {activeAmbience && (
            <button
              onClick={() => {
                rpgAudio.stopAmbience();
                setActiveAmbience(null);
              }}
              className="px-3 py-1 bg-red-950 border border-red-800 text-red-300 rounded-xl text-xs font-bold flex items-center gap-1"
            >
              <Square className="w-3 h-3" />
              Parar Áudio
            </button>
          )}
        </div>

        {/* Ambience tracks */}
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase text-neutral-400">Trilhas de Fundo Contínuas</span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: "dungeon", label: "Masmorra Tensa", desc: "Drone grave & ecos distantes" },
              { id: "haunted", label: "Mansão Sinistra (Ordem)", desc: "Frequências paranormais" },
              { id: "tavern", label: "Taverna & Acampamento", desc: "Calor e harmônicos calmos" },
            ].map((track) => (
              <button
                key={track.id}
                onClick={() => handleToggleAmbience(track.id as any)}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  activeAmbience === track.id
                    ? "bg-purple-950/60 border-purple-500 ring-2 ring-purple-500/50 shadow-lg"
                    : "bg-neutral-950 border-neutral-800 hover:border-neutral-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-neutral-200">{track.label}</span>
                  {activeAmbience === track.id ? (
                    <Square className="w-3.5 h-3.5 text-purple-400 fill-purple-400" />
                  ) : (
                    <Play className="w-3.5 h-3.5 text-neutral-400" />
                  )}
                </div>
                <p className="text-[10px] text-neutral-400 mt-1">{track.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Instant SFX buttons */}
        <div className="space-y-2 pt-2">
          <span className="text-xs font-bold uppercase text-neutral-400">Efeitos Sonoros Rápidos</span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              onClick={() => rpgAudio.playDiceRoll()}
              className="p-3 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-amber-500/50 rounded-2xl text-xs font-bold text-amber-300 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Dice5 className="w-4 h-4 text-amber-500" />
              Rolar Dados
            </button>
            <button
              onClick={() => rpgAudio.playSwordHit()}
              className="p-3 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-red-500/50 rounded-2xl text-xs font-bold text-red-300 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Sword className="w-4 h-4 text-red-500" />
              Golpe / Ataque
            </button>
            <button
              onClick={() => rpgAudio.playMagicSpell()}
              className="p-3 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-purple-500/50 rounded-2xl text-xs font-bold text-purple-300 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              Magia / Ritual
            </button>
            <button
              onClick={() => rpgAudio.playGunshot()}
              className="p-3 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-blue-500/50 rounded-2xl text-xs font-bold text-blue-300 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Zap className="w-4 h-4 text-blue-400" />
              Tiro Balístico
            </button>
          </div>
        </div>
      </div>

      {/* Master Notes & Scratchpad */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400" />
            <h3 className="font-serif font-bold text-sm text-amber-100">Bloco de Notas do Mestre (Salvo Automaticamente)</h3>
          </div>
          <span className="text-[10px] text-neutral-500 font-mono">Privado para o Mestre</span>
        </div>

        <textarea
          value={notes}
          onChange={(e) => handleSaveNotes(e.target.value)}
          rows={10}
          className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-xs font-mono text-neutral-200 focus:outline-none focus:border-amber-500 resize-none leading-relaxed"
          placeholder="Anote ganchos de aventura, itens secretos dos baús, nomes de NPCs improvisados..."
        />
      </div>
    </div>
  );
};
