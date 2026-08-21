import React, { useState, useEffect } from "react";
import { RPGSystem, UserRole, UserProfile, RoomState } from "../types";
import {
  Users,
  Plus,
  LogIn,
  Key,
  Shield,
  Crown,
  Sparkles,
  Copy,
  Check,
  Trash2,
  ExternalLink,
  Compass,
  FileText,
  Clock,
  ArrowRight,
  User,
  Settings,
  Lock,
  X,
  Share2,
  RefreshCw
} from "lucide-react";

interface SessionManagerModalProps {
  currentRoomId: string;
  currentRoomCode: string;
  currentRoomName: string;
  currentSystem: RPGSystem;
  currentUserRole: UserRole;
  currentUserName: string;
  onSelectRoom: (roomId: string, system?: RPGSystem, userRole?: UserRole, userName?: string) => void;
  onCreateRoom: (params: { name: string; system: RPGSystem; gmName: string; code?: string; password?: string; description?: string }) => void;
  onClose: () => void;
}

export function SessionManagerModal({
  currentRoomId,
  currentRoomCode,
  currentRoomName,
  currentSystem,
  currentUserRole,
  currentUserName,
  onSelectRoom,
  onCreateRoom,
  onClose,
}: SessionManagerModalProps) {
  const [activeTab, setActiveTab] = useState<"join" | "create" | "recent" | "profile">("join");
  
  // Join by code form
  const [inputCode, setInputCode] = useState("");
  const [joinRole, setJoinRole] = useState<UserRole>(currentUserRole);
  const [joinName, setJoinName] = useState(currentUserName);
  const [joinPassword, setJoinPassword] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  // Create room form
  const [createName, setCreateName] = useState("");
  const [createSystem, setCreateSystem] = useState<RPGSystem>(currentSystem);
  const [createGmName, setCreateGmName] = useState(currentUserRole === "gm" ? currentUserName : "Mestre " + currentUserName);
  const [createCode, setCreateCode] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Profile
  const [profileName, setProfileName] = useState(currentUserName);
  const [profileRole, setProfileRole] = useState<UserRole>(currentUserRole);
  const [profileAvatar, setProfileAvatar] = useState("https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80");
  const [profileSaved, setProfileSaved] = useState(false);

  // Saved / Recent Rooms
  const [recentRooms, setRecentRooms] = useState<Array<{
    id: string;
    code: string;
    name: string;
    system: RPGSystem;
    gmName: string;
    tokenCount?: number;
    lastUpdated?: number;
  }>>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Fetch active rooms from server
  const fetchRooms = async () => {
    setIsLoadingRooms(true);
    try {
      const res = await fetch("/api/rooms");
      if (res.ok) {
        const data = await res.json();
        setRecentRooms(data);
      }
    } catch (err) {
      console.warn("Could not fetch remote rooms, fallback to local memory", err);
    } finally {
      setIsLoadingRooms(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  // Generate random 6-character Code for Creation
  const generateRandomCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let res = "";
    for (let i = 0; i < 6; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCreateCode(res);
  };

  useEffect(() => {
    if (!createCode) {
      generateRandomCode();
    }
  }, []);

  // Handle Joining
  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) {
      setJoinError("Por favor, digite o código da sessão.");
      return;
    }

    setIsJoining(true);
    setJoinError(null);

    try {
      const res = await fetch("/api/rooms/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codeOrId: inputCode.trim(),
          password: joinPassword || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Não foi possível conectar à sala.");
      }

      const roomData: RoomState = await res.json();
      onSelectRoom(roomData.id, roomData.system, joinRole, joinName || currentUserName);
      onClose();
    } catch (err: any) {
      setJoinError(err.message || "Erro ao conectar à sessão.");
    } finally {
      setIsJoining(false);
    }
  };

  // Handle Creation
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) {
      alert("Por favor, dê um nome para a sessão/campanha.");
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch("/api/rooms/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createName.trim(),
          system: createSystem,
          gmName: createGmName.trim() || "Mestre",
          code: createCode.trim() || undefined,
          password: createPassword.trim() || undefined,
          description: createDescription.trim() || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error("Erro ao criar sessão.");
      }

      const createdRoom: RoomState = await res.json();
      onCreateRoom({
        name: createdRoom.name,
        system: createdRoom.system,
        gmName: createdRoom.gmName,
        code: createdRoom.code,
        password: createPassword.trim() || undefined,
        description: createDescription.trim() || undefined,
      });
      onSelectRoom(createdRoom.id, createdRoom.system, "gm", createGmName.trim() || "Mestre");
      onClose();
    } catch (err: any) {
      alert(err.message || "Falha ao criar sala.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-serif text-neutral-100 flex items-center gap-2">
                Sessões & Código de Acesso
              </h2>
              <p className="text-xs text-neutral-400">
                Mesa Atual: <span className="text-amber-300 font-semibold">{currentRoomName}</span> ({currentRoomCode})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Nav Tabs */}
        <div className="flex border-b border-neutral-800 bg-neutral-950/40 px-4 sm:px-6 gap-2 pt-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("join")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 ${
              activeTab === "join"
                ? "border-amber-500 text-amber-400 bg-neutral-900"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Entrar por Código</span>
          </button>

          <button
            onClick={() => setActiveTab("create")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 ${
              activeTab === "create"
                ? "border-amber-500 text-amber-400 bg-neutral-900"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Criar Nova Sessão</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("recent");
              fetchRooms();
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 ${
              activeTab === "recent"
                ? "border-amber-500 text-amber-400 bg-neutral-900"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Mesas Ativas ({recentRooms.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 ${
              activeTab === "profile"
                ? "border-amber-500 text-amber-400 bg-neutral-900"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <User className="w-4 h-4" />
            <span>Meu Perfil</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {/* TAB 1: JOIN BY CODE */}
          {activeTab === "join" && (
            <form onSubmit={handleJoin} className="space-y-4 max-w-lg mx-auto">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-400 mb-2">
                  <Key className="w-6 h-6" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-neutral-100">Digite o Código da Sessão</h3>
                <p className="text-xs text-neutral-400">
                  Insira o código de 6 dígitos compartilhado pelo seu Mestre para entrar instantaneamente na mesa.
                </p>
              </div>

              {joinError && (
                <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-xs text-red-200 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span>{joinError}</span>
                </div>
              )}

              {/* Big Code Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300">Código da Sala (Room Code)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                    placeholder="EX: NATAL1 ou ORDEM7"
                    maxLength={10}
                    className="w-full bg-neutral-950 border-2 border-neutral-700 focus:border-amber-500 rounded-2xl px-4 py-3 text-center text-lg sm:text-xl font-mono font-bold tracking-widest text-amber-400 placeholder:text-neutral-600 focus:outline-none uppercase"
                    autoFocus
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] text-neutral-500">
                    <Key className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              {/* Player Name and Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-300">Seu Nome / Personagem</label>
                  <input
                    type="text"
                    value={joinName}
                    onChange={(e) => setJoinName(e.target.value)}
                    placeholder="Nome do seu personagem"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-neutral-100 placeholder:text-neutral-600 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-300">Entrar Como</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setJoinRole("player")}
                      className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                        joinRole === "player"
                          ? "bg-blue-600/20 border-blue-500 text-blue-300"
                          : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200"
                      }`}
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>Jogador</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setJoinRole("gm")}
                      className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                        joinRole === "gm"
                          ? "bg-amber-600/20 border-amber-500 text-amber-300"
                          : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200"
                      }`}
                    >
                      <Crown className="w-3.5 h-3.5" />
                      <span>Mestre</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Optional Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
                  <span>Senha / PIN da Sala (Se houver)</span>
                  <span className="text-[10px] text-neutral-500 font-normal">Opcional</span>
                </label>
                <input
                  type="password"
                  value={joinPassword}
                  onChange={(e) => setJoinPassword(e.target.value)}
                  placeholder="Deixe em branco se a sala for pública"
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-neutral-100 placeholder:text-neutral-600 focus:outline-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isJoining}
                className="w-full mt-4 py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-neutral-950 font-bold rounded-2xl shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2 text-sm transition-all disabled:opacity-50"
              >
                {isJoining ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Conectar à Mesa</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: CREATE ROOM */}
          {activeTab === "create" && (
            <form onSubmit={handleCreate} className="space-y-4 max-w-lg mx-auto">
              <div className="text-center mb-4">
                <h3 className="text-sm sm:text-base font-bold text-neutral-100">Criar Nova Campanha ou Sessão</h3>
                <p className="text-xs text-neutral-400">
                  Configure o nome, sistema e gere um código exclusivo para seus jogadores entrarem.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300">Nome da Mesa / Aventura</label>
                <input
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="Ex: Operação Noite Sombria, Maldição de Strahd"
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl px-3 py-2.5 text-xs text-neutral-100 placeholder:text-neutral-600 focus:outline-none"
                  required
                />
              </div>

              {/* System Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300">Sistema de RPG</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setCreateSystem("ordem")}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      createSystem === "ordem"
                        ? "bg-purple-900/60 border-purple-500 text-purple-200 shadow"
                        : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200"
                    }`}
                  >
                    Ordem Paranormal
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateSystem("dnd5e")}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      createSystem === "dnd5e"
                        ? "bg-amber-600/30 border-amber-500 text-amber-300 shadow"
                        : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200"
                    }`}
                  >
                    D&D 5ª Edição
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateSystem("custom")}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      createSystem === "custom"
                        ? "bg-emerald-900/60 border-emerald-500 text-emerald-200 shadow"
                        : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200"
                    }`}
                  >
                    Sistema Livre
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-300">Nome do Mestre (GM)</label>
                  <input
                    type="text"
                    value={createGmName}
                    onChange={(e) => setCreateGmName(e.target.value)}
                    placeholder="Mestre Supremo"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-neutral-100 placeholder:text-neutral-600 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-neutral-300">Código de Convite</label>
                    <button
                      type="button"
                      onClick={generateRandomCode}
                      className="text-[10px] text-amber-400 hover:underline flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" /> Gerar Novo
                    </button>
                  </div>
                  <input
                    type="text"
                    value={createCode}
                    onChange={(e) => setCreateCode(e.target.value.toUpperCase())}
                    placeholder="EX: MESA01"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs font-mono font-bold tracking-widest text-amber-400 placeholder:text-neutral-600 focus:outline-none uppercase"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
                  <span>Senha de Acesso (Opcional)</span>
                  <span className="text-[10px] text-neutral-500">Deixe vazio para sala aberta</span>
                </label>
                <input
                  type="password"
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  placeholder="Senha secreta para proteger a mesa"
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-neutral-100 placeholder:text-neutral-600 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300">Resumo / Premissa da Aventura</label>
                <textarea
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  placeholder="Descreva brevemente o início da trama ou regras da mesa..."
                  rows={2}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-neutral-100 placeholder:text-neutral-600 focus:outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isCreating}
                className="w-full mt-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2 text-sm transition-all disabled:opacity-50"
              >
                {isCreating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Criar e Iniciar Mesa</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 3: RECENT & ACTIVE ROOMS */}
          {activeTab === "recent" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-neutral-400">
                  Mesas Disponíveis no Servidor ({recentRooms.length})
                </span>
                <button
                  onClick={fetchRooms}
                  disabled={isLoadingRooms}
                  className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRooms ? "animate-spin" : ""}`} />
                  <span>Atualizar</span>
                </button>
              </div>

              {recentRooms.length === 0 ? (
                <div className="text-center py-8 bg-neutral-950/40 rounded-2xl border border-neutral-800/80 p-6">
                  <Compass className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                  <p className="text-xs text-neutral-400">Nenhuma mesa ativa no momento.</p>
                  <button
                    onClick={() => setActiveTab("create")}
                    className="mt-3 px-3 py-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold hover:bg-amber-500/30"
                  >
                    Criar a primeira mesa
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5">
                  {recentRooms.map((room) => {
                    const isCurrent = room.id === currentRoomId || room.code === currentRoomCode;
                    return (
                      <div
                        key={room.id}
                        className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                          isCurrent
                            ? "bg-amber-950/30 border-amber-500/60 shadow-md"
                            : "bg-neutral-950/60 border-neutral-800 hover:border-neutral-700"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs sm:text-sm text-neutral-100">{room.name}</span>
                            {isCurrent && (
                              <span className="px-2 py-0.5 bg-amber-500 text-neutral-950 text-[10px] font-black rounded-full">
                                Atual
                              </span>
                            )}
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-lg ${
                              room.system === "ordem"
                                ? "bg-purple-950 text-purple-300 border border-purple-800"
                                : room.system === "dnd5e"
                                ? "bg-amber-950 text-amber-300 border border-amber-800"
                                : "bg-emerald-950 text-emerald-300 border border-emerald-800"
                            }`}>
                              {room.system === "ordem" ? "Ordem Paranormal" : room.system === "dnd5e" ? "D&D 5e" : "Livre"}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-neutral-400">
                            <span>Mestre: <strong className="text-neutral-300">{room.gmName}</strong></span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              Código: <strong className="font-mono text-amber-400">{room.code || room.id}</strong>
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                          <button
                            onClick={() => handleCopyCode(room.code || room.id)}
                            className="p-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-neutral-300 text-xs flex items-center gap-1"
                            title="Copiar Código de Convite"
                          >
                            {copiedCode === (room.code || room.id) ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                            <span className="hidden sm:inline">Copiar Código</span>
                          </button>

                          {!isCurrent ? (
                            <button
                              onClick={() => {
                                onSelectRoom(room.id, room.system);
                                onClose();
                              }}
                              className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm"
                            >
                              <span>Entrar</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span className="text-xs text-amber-400 font-semibold px-2 py-1 bg-amber-500/10 rounded-lg">
                              Conectado
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PROFILE */}
          {activeTab === "profile" && (
            <div className="space-y-4 max-w-md mx-auto py-2">
              <div className="text-center mb-4">
                <div className="w-16 h-16 rounded-full overflow-hidden mx-auto border-2 border-amber-500/60 shadow-lg mb-2">
                  <img src={profileAvatar} alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <h3 className="text-sm font-bold text-neutral-100">{profileName || "Jogador"}</h3>
                <span className="text-[11px] text-neutral-400 capitalize">Função Atual: {profileRole === "gm" ? "Mestre" : "Jogador"}</span>
              </div>

              {profileSaved && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-800/80 rounded-xl text-xs text-emerald-200 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Perfil atualizado com sucesso!</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300">Nome de Exibição / Personagem</label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300">URL do Avatar</label>
                <input
                  type="text"
                  value={profileAvatar}
                  onChange={(e) => setProfileAvatar(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300">Função Preferencial</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setProfileRole("player")}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      profileRole === "player"
                        ? "bg-blue-600/20 border-blue-500 text-blue-300"
                        : "bg-neutral-950 border-neutral-800 text-neutral-400"
                    }`}
                  >
                    Jogador (Player)
                  </button>
                  <button
                    type="button"
                    onClick={() => setProfileRole("gm")}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      profileRole === "gm"
                        ? "bg-amber-600/20 border-amber-500 text-amber-300"
                        : "bg-neutral-950 border-neutral-800 text-neutral-400"
                    }`}
                  >
                    Mestre (GM)
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onSelectRoom(currentRoomId, currentSystem, profileRole, profileName);
                  setProfileSaved(true);
                  setTimeout(() => setProfileSaved(false), 2500);
                }}
                className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all mt-2"
              >
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Salvar Alterações de Perfil</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer with quick code copy */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-neutral-400">
            <span>Código da Mesa Atual:</span>
            <span className="font-mono font-bold text-amber-400 px-2 py-0.5 bg-neutral-900 border border-neutral-800 rounded-lg">
              {currentRoomCode}
            </span>
          </div>

          <button
            onClick={() => handleCopyCode(currentRoomCode)}
            className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
          >
            {copiedCode === currentRoomCode ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copiado!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Compartilhar Código</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
