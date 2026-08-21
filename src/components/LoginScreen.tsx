import React, { useState } from "react";
import { RPGSystem, UserRole } from "../types";
import {
  Shield,
  Crown,
  Key,
  LogIn,
  Sparkles,
  Users,
  Dices,
  BookOpen,
  Check,
  Tv,
  Radio,
  Eye,
  Lock,
  Compass,
  ArrowRight
} from "lucide-react";
import { rpgAudio } from "../utils/audioSynth";

interface LoginScreenProps {
  currentSystem: RPGSystem;
  currentUserRole: UserRole;
  currentUserName: string;
  currentRoomCode: string;
  currentRoomName: string;
  onLogin: (params: {
    system: RPGSystem;
    userRole: UserRole;
    userName: string;
    roomCode: string;
    roomName: string;
    avatarUrl?: string;
  }) => void;
  onCancel?: () => void;
  isAlreadyInSession?: boolean;
}

const AVATAR_PRESETS = [
  { name: "Ocultista / Mestre", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80", tag: "ordem" },
  { name: "Agente de Campo", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80", tag: "ordem" },
  { name: "Mago Arcano", url: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=300&auto=format&fit=crop&q=80", tag: "dnd5e" },
  { name: "Guerreira Paladina", url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80", tag: "dnd5e" },
  { name: "Lorde / Mestre Sombrio", url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80", tag: "custom" },
];

export const LoginScreen: React.FC<LoginScreenProps> = ({
  currentSystem,
  currentUserRole,
  currentUserName,
  currentRoomCode,
  currentRoomName,
  onLogin,
  onCancel,
  isAlreadyInSession = false,
}) => {
  const [system, setSystem] = useState<RPGSystem>(currentSystem || "ordem");
  const [userRole, setUserRole] = useState<UserRole>(currentUserRole || "gm");
  const [userName, setUserName] = useState(
    currentUserName && currentUserName !== "Mestre" && currentUserName !== "Jogador"
      ? currentUserName
      : currentUserRole === "gm"
      ? "Mestre de Jogo"
      : "Agente Investigador"
  );
  const [roomCode, setRoomCode] = useState(currentRoomCode || "SALA01");
  const [roomName, setRoomName] = useState(currentRoomName || "Campanha Principal");
  const [password, setPassword] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(AVATAR_PRESETS[0].url);
  const [aiAvatarPrompt, setAiAvatarPrompt] = useState("");
  const [isGeneratingAiAvatar, setIsGeneratingAiAvatar] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleRoleChange = (role: UserRole) => {
    setUserRole(role);
    if (!userName || userName === "Mestre de Jogo" || userName === "Agente Investigador" || userName === "Mestre") {
      setUserName(role === "gm" ? "Mestre de Jogo" : "Agente Investigador");
    }
  };

  const handleGenerateAiAvatar = async () => {
    const promptToUse = aiAvatarPrompt.trim() || `${userName}, retrato de personagem RPG ${system}, iluminação dramática`;
    setIsGeneratingAiAvatar(true);
    try {
      const res = await fetch("/api/ai/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptToUse,
          type: "character",
          system,
        }),
      });
      if (!res.ok) throw new Error("Falha na geração");
      const data = await res.json();
      if (data.imageUrl) {
        setAvatarUrl(data.imageUrl);
      }
    } catch (err) {
      console.error("Erro ao gerar avatar com IA:", err);
      const seed = Math.floor(Math.random() * 1000000);
      const encoded = encodeURIComponent(`RPG avatar portrait ${promptToUse}`);
      const fallbackUrl = `https://image.pollinations.ai/prompt/${encoded}?width=512&height=512&seed=${seed}&nologo=true`;
      setAvatarUrl(fallbackUrl);
    } finally {
      setIsGeneratingAiAvatar(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) {
      alert("Por favor, digite seu nome ou nickname de jogador.");
      return;
    }
    if (!roomCode.trim()) {
      alert("Por favor, informe o código da sala.");
      return;
    }

    rpgAudio.playSpellCast();

    if (rememberMe) {
      try {
        localStorage.setItem(
          "rpg_user_session",
          JSON.stringify({
            system,
            userRole,
            userName,
            roomCode,
            roomName,
            avatarUrl,
            timestamp: Date.now(),
          })
        );
      } catch (e) {
        console.warn("Nao foi possivel salvar sessao no localStorage", e);
      }
    }

    onLogin({
      system,
      userRole,
      userName: userName.trim(),
      roomCode: roomCode.trim().toUpperCase(),
      roomName: roomName.trim() || "Mesa de RPG",
      avatarUrl,
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-950 flex items-center justify-center p-4 sm:p-6 md:p-10 font-sans text-neutral-100">
      {/* Background Glows & Ambient Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-900/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-amber-900/20 blur-[120px]" />
        <div className="absolute top-[40%] right-[30%] w-[30vw] h-[30vw] rounded-full bg-indigo-900/15 blur-[100px]" />
      </div>

      <div className="relative w-full max-w-2xl bg-neutral-900/90 backdrop-blur-xl border border-neutral-800/90 rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl space-y-8 animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 via-amber-500 to-amber-600 p-0.5 shadow-xl shadow-amber-500/10 mb-2">
            <div className="w-full h-full bg-neutral-950 rounded-[14px] flex items-center justify-center">
              <Dices className="w-8 h-8 text-amber-400" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-purple-300">
            Studio Mestre RPG
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-md mx-auto">
            Acesse a Mesa Virtual e Painel de Apoio Presencial. Faça login como Mestre ou Jogador.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. System Selection Switcher */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-amber-300 uppercase tracking-wider block flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>1. Escolha o Sistema de RPG</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setSystem("ordem")}
                className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-1 ${
                  system === "ordem"
                    ? "bg-purple-950/60 border-purple-500 text-purple-200 ring-2 ring-purple-500/50 shadow-lg"
                    : "bg-neutral-950 border-neutral-800/80 text-neutral-400 hover:border-neutral-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-purple-300">Ordem Paranormal</span>
                  {system === "ordem" && <Check className="w-4 h-4 text-purple-400" />}
                </div>
                <span className="text-[10px] text-neutral-400">Horror Investigativo, Rituais e Sangue</span>
              </button>

              <button
                type="button"
                onClick={() => setSystem("dnd5e")}
                className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-1 ${
                  system === "dnd5e"
                    ? "bg-amber-950/60 border-amber-500 text-amber-200 ring-2 ring-amber-500/50 shadow-lg"
                    : "bg-neutral-950 border-neutral-800/80 text-neutral-400 hover:border-neutral-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-amber-300">D&D 5ª Edição</span>
                  {system === "dnd5e" && <Check className="w-4 h-4 text-amber-400" />}
                </div>
                <span className="text-[10px] text-neutral-400">Alta Fantasia, Magias, Perícias e D20</span>
              </button>

              <button
                type="button"
                onClick={() => setSystem("custom")}
                className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-1 ${
                  system === "custom"
                    ? "bg-indigo-950/60 border-indigo-500 text-indigo-200 ring-2 ring-indigo-500/50 shadow-lg"
                    : "bg-neutral-950 border-neutral-800/80 text-neutral-400 hover:border-neutral-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-indigo-300">Sistema Livre</span>
                  {system === "custom" && <Check className="w-4 h-4 text-indigo-400" />}
                </div>
                <span className="text-[10px] text-neutral-400">Atributos Customizáveis e Ficha Aberta</span>
              </button>
            </div>
          </div>

          {/* 2. Role Selector (GM vs Player) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-amber-300 uppercase tracking-wider block flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-amber-400" />
              <span>2. Função na Mesa</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleRoleChange("gm")}
                className={`p-4 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                  userRole === "gm"
                    ? "bg-amber-500/15 border-amber-500 text-amber-200 ring-2 ring-amber-500/40 shadow-lg"
                    : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                }`}
              >
                <div className={`p-2.5 rounded-xl ${userRole === "gm" ? "bg-amber-500 text-neutral-950" : "bg-neutral-900 text-neutral-400"}`}>
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-neutral-100">Mestre de Jogo (GM)</h4>
                  <p className="text-[10px] text-neutral-400">Controle total da mesa, mapas, IA e áudio</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange("player")}
                className={`p-4 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                  userRole === "player"
                    ? "bg-purple-500/15 border-purple-500 text-purple-200 ring-2 ring-purple-500/40 shadow-lg"
                    : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                }`}
              >
                <div className={`p-2.5 rounded-xl ${userRole === "player" ? "bg-purple-600 text-white" : "bg-neutral-900 text-neutral-400"}`}>
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-neutral-100">Jogador / Agente</h4>
                  <p className="text-[10px] text-neutral-400">Ficha de personagem, rolagens e telão</p>
                </div>
              </button>
            </div>
          </div>

          {/* 3. User Details Form */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-300 block">
                Nome do Usuário / Nickname:
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Ex: Mestre Gabriel, Agente Veríssimo..."
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-300 block">
                Código da Sala / Mesa:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="Ex: ORDEM1, SALA01..."
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-amber-300 font-mono font-bold tracking-wider placeholder:text-neutral-600 focus:outline-none uppercase"
                  required
                />
                <Key className="w-4 h-4 text-neutral-500 absolute right-3.5 top-3" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-300 block">
                Nome da Campanha / Mesa:
              </label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Ex: Operação Segredo de Sangue..."
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-300 block">
                Senha da Sala (Opcional):
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Deixe em branco se for pública"
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none"
                />
                <Lock className="w-4 h-4 text-neutral-500 absolute right-3.5 top-3" />
              </div>
            </div>
          </div>

          {/* 4. Avatar Picker & IA Generator */}
          <div className="space-y-3 bg-neutral-950/60 p-4 rounded-2xl border border-neutral-800/80">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-neutral-300 block">
                Avatar do Perfil:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={aiAvatarPrompt}
                  onChange={(e) => setAiAvatarPrompt(e.target.value)}
                  placeholder="Prompt para avatar IA..."
                  className="bg-neutral-900 border border-neutral-800 text-[11px] px-2.5 py-1 rounded-xl text-neutral-200 placeholder:text-neutral-600 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleGenerateAiAvatar}
                  disabled={isGeneratingAiAvatar}
                  className="px-3 py-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 text-[11px] font-bold rounded-xl flex items-center gap-1 shadow transition-all disabled:opacity-50"
                >
                  <Sparkles className={`w-3 h-3 ${isGeneratingAiAvatar ? "animate-spin" : ""}`} />
                  <span>{isGeneratingAiAvatar ? "Gerando..." : "Gerar IA"}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-amber-500/60 flex-shrink-0 shadow-md">
                <img src={avatarUrl} alt="Avatar Selected" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 flex gap-2 overflow-x-auto pb-1">
                {AVATAR_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatarUrl(p.url)}
                    className={`w-10 h-10 rounded-xl overflow-hidden border transition-all flex-shrink-0 ${
                      avatarUrl === p.url ? "border-amber-400 ring-2 ring-amber-500/50 scale-105" : "border-neutral-800 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Remember Login Checkbox */}
          <div className="flex items-center justify-between text-xs text-neutral-400 pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded bg-neutral-950 border-neutral-800 text-amber-500 focus:ring-0"
              />
              <span>Manter sessão salva neste navegador</span>
            </label>

            {isAlreadyInSession && onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="text-neutral-400 hover:text-neutral-100 underline"
              >
                Voltar à Mesa
              </button>
            )}
          </div>

          {/* Submit Login Button */}
          <button
            type="submit"
            className="w-full py-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-black text-sm sm:text-base rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 active:scale-[0.99] transition-all"
          >
            <LogIn className="w-5 h-5" />
            <span>Entrar na Mesa Virtual ({userRole === "gm" ? "Como Mestre" : "Como Jogador"})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
