import React, { useState } from "react";
import { Volume2, Play, Square, Music, Sparkles, Sword, Dice5, Zap, Shield, FileText, Sliders, VolumeX } from "lucide-react";
import { rpgAudio } from "../utils/audioSynth";

export const SoundboardPanel: React.FC = () => {
  const [activeAmbience, setActiveAmbience] = useState<string | null>(null);
  const [masterVol, setMasterVol] = useState(rpgAudio.masterVolume);
  const [ambientVol, setAmbientVol] = useState(rpgAudio.ambientVolume);
  const [sfxVol, setSfxVol] = useState(rpgAudio.sfxVolume);
  const [ttsVol, setTtsVol] = useState(rpgAudio.ttsVolume);
  const [isMuted, setIsMuted] = useState(rpgAudio.isMuted);

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

  const handleToggleMute = () => {
    const nextMuted = rpgAudio.toggleMute();
    setIsMuted(nextMuted);
  };

  const handleMasterVol = (val: number) => {
    setMasterVol(val);
    rpgAudio.setMasterVolume(val);
  };

  const handleAmbientVol = (val: number) => {
    setAmbientVol(val);
    rpgAudio.setAmbientVolume(val);
  };

  const handleSfxVol = (val: number) => {
    setSfxVol(val);
    rpgAudio.setSfxVolume(val);
  };

  const handleTtsVol = (val: number) => {
    setTtsVol(val);
    rpgAudio.setTtsVolume(val);
  };

  const handleSaveNotes = (val: string) => {
    setNotes(val);
    localStorage.setItem("rpg_master_notes", val);
  };

  return (
    <div className="w-full h-full bg-neutral-950 overflow-y-auto p-4 md:p-6 space-y-6 text-neutral-100">
      {/* Soundboard Audio FX */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-amber-400" />
            <h3 className="font-serif font-bold text-sm text-amber-100">Mesa de Áudio & Efeitos Sonoros</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleMute}
              className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                isMuted
                  ? "bg-red-950/80 border-red-700 text-red-300"
                  : "bg-neutral-950 border-neutral-800 text-neutral-300 hover:bg-neutral-800"
              }`}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{isMuted ? "Mutado" : "Áudio Ativo"}</span>
            </button>
            {activeAmbience && (
              <button
                onClick={() => {
                  rpgAudio.stopAmbience();
                  setActiveAmbience(null);
                }}
                className="px-3 py-1 bg-red-950 border border-red-800 text-red-300 rounded-xl text-xs font-bold flex items-center gap-1"
              >
                <Square className="w-3 h-3" />
                Parar Trilha
              </button>
            )}
          </div>
        </div>

        {/* Audio Mixer (Master, Ambient, SFX Channels) */}
        <div className="bg-neutral-950/70 border border-neutral-800/90 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
            <Sliders className="w-3.5 h-3.5" />
            <span>Mixer de Volume por Canais Separados</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-neutral-400 font-semibold">
                <span>Volume Geral (Master)</span>
                <span className="font-mono text-amber-400">{Math.round(masterVol * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={masterVol}
                onChange={(e) => handleMasterVol(parseFloat(e.target.value))}
                className="w-full accent-amber-500 bg-neutral-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-neutral-400 font-semibold">
                <span>Trilha de Fundo / Ambiente</span>
                <span className="font-mono text-purple-400">{Math.round(ambientVol * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={ambientVol}
                onChange={(e) => handleAmbientVol(parseFloat(e.target.value))}
                className="w-full accent-purple-500 bg-neutral-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-neutral-400 font-semibold">
                <span>Efeitos Sonoros (SFX / Dados)</span>
                <span className="font-mono text-emerald-400">{Math.round(sfxVol * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={sfxVol}
                onChange={(e) => handleSfxVol(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 bg-neutral-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-neutral-400 font-semibold">
                <span>Voz da IA (TTS)</span>
                <span className="font-mono text-blue-400">{Math.round(ttsVol * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={ttsVol}
                onChange={(e) => handleTtsVol(parseFloat(e.target.value))}
                className="w-full accent-blue-500 bg-neutral-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
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
