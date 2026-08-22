import React, { useState, useEffect } from "react";
import {
  Tv,
  Wifi,
  WifiOff,
  Settings,
  ChevronRight,
  HelpCircle,
  Sparkles,
  RefreshCw,
  Home,
  CornerDownLeft,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ArrowLeft,
  Play,
  Pause,
  X,
  Map,
  FileText,
  Video
} from "lucide-react";
import { RPGSystem, MapData } from "../types";

interface RokuCastPanelProps {
  system: RPGSystem;
  mapBgUrl: string;
  mapName: string;
  handoutImageUrl?: string | null;
  handoutTitle?: string | null;
  availableMaps?: MapData[];
  onSelectMap?: (map: MapData) => void;
  onClose?: () => void;
}

export const RokuCastPanel: React.FC<RokuCastPanelProps> = ({
  system,
  mapBgUrl,
  mapName,
  handoutImageUrl,
  handoutTitle,
  availableMaps = [],
  onSelectMap,
  onClose,
}) => {
  const [rokuIp, setRokuIp] = useState<string>(() => {
    return localStorage.getItem("roku_device_ip") || "192.168.1.50";
  });
  const [autoSync, setAutoSync] = useState<boolean>(() => {
    return localStorage.getItem("roku_auto_sync") === "true";
  });
  const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "checking" | "connected" | "warning">("disconnected");
  const [lastCastUrl, setLastCastUrl] = useState<string>("");
  const [logs, setLogs] = useState<string[]>([]);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showSettings, setShowSettings] = useState<boolean>(() => {
    // If no custom IP is stored, show settings by default
    return !localStorage.getItem("roku_device_ip");
  });
  const [showMapLibrary, setShowMapLibrary] = useState(true);

  const testPatternUrl = "https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=1200";

  const [targetAppId, setTargetAppId] = useState<string>(() => {
    return localStorage.getItem("roku_target_app_id") || "15985";
  });

  // Load and save preferences
  useEffect(() => {
    localStorage.setItem("roku_device_ip", rokuIp);
  }, [rokuIp]);

  useEffect(() => {
    localStorage.setItem("roku_auto_sync", String(autoSync));
  }, [autoSync]);

  useEffect(() => {
    localStorage.setItem("roku_target_app_id", targetAppId);
  }, [targetAppId]);

  // Add log helper
  const addLog = (msg: string) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 15)]);
  };

  // ECP Control Commands
  const sendRokuCommand = async (endpoint: string, method = "POST") => {
    if (!rokuIp.trim()) {
      addLog("⚠️ Insira o IP do seu dispositivo Roku primeiro.");
      return false;
    }

    const cleanIp = rokuIp.trim();
    // Use proxy assist or direct fetch with no-cors to prevent SSL/mixed-content blocks
    const url = `http://${cleanIp}:8060/${endpoint}`;
    
    try {
      addLog(`📡 Enviando comando para Roku: /${endpoint}...`);
      await fetch(url, {
        method,
        mode: "no-cors", // Crucial for mixed content HTTPS -> HTTP local network IP
        headers: {
          "Content-Type": "application/json"
        }
      });
      addLog(`✅ Comando /${endpoint} despachado.`);
      return true;
    } catch (err) {
      console.error("Erro ECP Roku:", err);
      addLog(`❌ Erro de conexão com o IP ${cleanIp}. Verifique a rede.`);
      return false;
    }
  };

  // Test connection
  const checkRokuConnection = async () => {
    setConnectionStatus("checking");
    addLog(`🔍 Pingando dispositivo em http://${rokuIp}:8060/...`);
    
    // We send a non-blocking no-cors request to ECP query/apps
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    try {
      await fetch(`http://${rokuIp}:8060/query/apps`, {
        mode: "no-cors",
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      setConnectionStatus("connected");
      addLog("🟢 Aparelho Roku detectado na rede local!");
    } catch (err) {
      clearTimeout(timeoutId);
      // In many secure browser environments, even a successful local network call inside no-cors 
      // resolves as type: opaque/empty or triggers an abort, but if it doesn't fail immediately, it might be there.
      // We set status to warning to remind the user about mixed-content permissions.
      setConnectionStatus("warning");
      addLog("⚠️ Verificação silenciosa concluída. Se a TV não responder, certifique-se de habilitar conteúdo misto no navegador.");
    }
  };

  // Launch Play On Roku (or configured app) with image/video parameter
  const castMediaToRoku = async (mediaUrl: string, type: "photo" | "video") => {
    if (!mediaUrl) {
      addLog("⚠️ Nenhuma imagem/mídia disponível para transmitir.");
      return;
    }

    const tParam = type === "photo" ? "p" : "v";
    // Encode image url
    const encodedMedia = encodeURIComponent(mediaUrl);
    // ECP Play on Roku Launch URL
    const launchEndpoint = `launch/${targetAppId}?u=${encodedMedia}&t=${tParam}&tr=crossfade`;
    
    addLog(`🎬 Solicitando transmissão: ${type === "photo" ? "Imagem" : "Vídeo"}...`);
    const success = await sendRokuCommand(launchEndpoint);
    
    if (success) {
      setLastCastUrl(mediaUrl);
      addLog(`📺 Transmitido com sucesso! O aplicativo selecionado (${targetAppId}) deve carregar na sua TV em instantes.`);
    }
  };

  // Auto-sync when mapBgUrl changes
  useEffect(() => {
    if (autoSync && mapBgUrl && mapBgUrl !== lastCastUrl) {
      addLog(`🔄 Auto-Sincronização: Detectada alteração de mapa.`);
      castMediaToRoku(mapBgUrl, "photo");
    }
  }, [mapBgUrl, autoSync]);

  // Handle manual navigation buttons
  const pressKey = (key: string) => {
    sendRokuCommand(`keypress/${key}`);
  };

  return (
    <div className={`p-4 md:p-5 rounded-3xl border text-neutral-100 max-w-md w-full relative select-text animate-in fade-in duration-150 ${
      system === "ordem"
        ? "bg-[#08070d] border-purple-500/30 shadow-lg shadow-purple-950/20"
        : "bg-[#0b0906] border-amber-600/30 shadow-lg shadow-amber-950/20"
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
            system === "ordem" ? "bg-purple-500/20 text-purple-300" : "bg-amber-500/20 text-amber-300"
          }`}>
            <Tv className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-xs text-amber-200">CENTRAL DE TRANSMISSÃO ROKU</h3>
            <p className="text-[9px] text-neutral-400">Projete seus mapas e pistas na TV da sala via rede local</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1.5 border rounded-lg transition-all flex items-center gap-1 text-xs font-bold ${
              showSettings
                ? "bg-amber-500 border-amber-400 text-neutral-950 shadow shadow-amber-500/20"
                : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700"
            }`}
            title="Configurações de Transmissão"
          >
            <Settings className={`w-3.5 h-3.5 ${showSettings ? "animate-spin" : ""}`} />
            <span className="hidden md:inline">Configurar</span>
          </button>
          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="p-1.5 bg-neutral-900 border border-neutral-800 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
            title="Instruções e ajuda"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 bg-neutral-900 border border-neutral-800 rounded-lg hover:bg-red-950 hover:border-red-800 text-neutral-400 hover:text-red-300 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Connection / Settings Panel */}
      {showSettings ? (
        <div className="bg-neutral-950/70 border border-neutral-800 rounded-2xl p-4.5 space-y-3.5 mb-4 animate-in slide-in-from-top-3 duration-200">
          <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
            <label className="text-[10px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5 animate-pulse" /> Painel de Configurações
            </label>
            <div className="flex items-center gap-1.5">
              {connectionStatus === "connected" && (
                <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                  <Wifi className="w-3 h-3" /> Online
                </span>
              )}
              {connectionStatus === "warning" && (
                <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                  <Wifi className="w-3 h-3" /> Configurado
                </span>
              )}
              {connectionStatus === "disconnected" && (
                <span className="text-[9px] font-bold text-neutral-500 bg-neutral-900 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                  <WifiOff className="w-3 h-3" /> Desconectado
                </span>
              )}
              {connectionStatus === "checking" && (
                <span className="text-[9px] font-bold text-amber-400 bg-amber-500/15 px-1.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                  <RefreshCw className="w-3 h-3 animate-spin" /> Testando...
                </span>
              )}
            </div>
          </div>

          {/* IP Input */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-neutral-300">Endereço IP do Roku</span>
              <span className="text-[8px] text-neutral-500 font-mono">Porta 8060</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={rokuIp}
                onChange={(e) => setRokuIp(e.target.value)}
                placeholder="Ex: 192.168.1.50"
                className="flex-1 bg-neutral-900/95 border border-neutral-800 focus:border-amber-500 rounded-xl px-3 py-1.5 text-xs text-neutral-100 placeholder:text-neutral-600 focus:outline-none font-mono"
              />
              <button
                onClick={checkRokuConnection}
                disabled={connectionStatus === "checking"}
                className="px-3 py-1.5 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 hover:border-neutral-700 text-neutral-300 disabled:opacity-50 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
              >
                {connectionStatus === "checking" ? (
                  <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
                ) : (
                  <Wifi className="w-3 h-3 text-amber-400" />
                )}
                <span>Testar IP</span>
              </button>
            </div>
          </div>

          {/* Quick IP Presets */}
          <div className="space-y-1">
            <label className="text-[8px] font-extrabold text-neutral-500 uppercase tracking-wider block">Sugestões de Redes Comuns</label>
            <div className="flex flex-wrap gap-1.5">
              {["192.168.1.50", "192.168.0.50", "192.168.15.50", "10.0.0.50"].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setRokuIp(preset);
                    addLog(`✏️ IP alterado para o preset comum: ${preset}`);
                  }}
                  className={`px-2 py-0.5 border text-[9px] font-mono rounded-lg transition-all ${
                    rokuIp === preset
                      ? "bg-amber-500/15 border-amber-500/40 text-amber-300 font-extrabold"
                      : "bg-neutral-900/50 border-neutral-850 hover:bg-neutral-800 text-neutral-400 hover:border-neutral-700"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Target App ID dropdown selection */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-neutral-300 block">Canal/App Alvo para Fotos</label>
            <select
              value={targetAppId}
              onChange={(e) => {
                setTargetAppId(e.target.value);
                addLog(`🎯 Aplicativo alvo alterado para o ID: ${e.target.value}`);
              }}
              className="w-full bg-neutral-900 border border-neutral-800 focus:border-amber-500 rounded-xl px-3 py-1.5 text-xs text-neutral-200 focus:outline-none"
            >
              <option value="15985">Play on Roku (Casting Oficial de Mídias)</option>
              <option value="2213">Roku Media Player (Fotos Locais)</option>
              <option value="837">YouTube DeepLink</option>
            </select>
          </div>

          {/* Test & Verification Calibration Tools */}
          <div className="pt-2.5 border-t border-neutral-900 space-y-2">
            <label className="text-[9px] font-extrabold text-neutral-500 uppercase tracking-wider block">Calibração & Teste Rápido</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => castMediaToRoku(testPatternUrl, "photo")}
                className="py-1.5 px-2 bg-gradient-to-r from-neutral-900 to-neutral-850 hover:from-neutral-850 hover:to-neutral-800 border border-neutral-800 rounded-xl text-[10px] font-bold text-neutral-300 transition-all flex items-center justify-center gap-1.5"
                title="Projeta uma tela de teste de cores (padrão de calibração) para certificar a conexão visual"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                <span>Testar Imagem TV</span>
              </button>
              <button
                type="button"
                onClick={() => pressKey("Info")}
                className="py-1.5 px-2 bg-gradient-to-r from-neutral-900 to-neutral-850 hover:from-neutral-850 hover:to-neutral-800 border border-neutral-800 rounded-xl text-[10px] font-bold text-neutral-300 transition-all flex items-center justify-center gap-1.5"
                title="Abre a tela de informações do sistema na TV Roku"
              >
                <Tv className="w-3.5 h-3.5 text-blue-400" />
                <span>Ver Info TV</span>
              </button>
            </div>
          </div>

          {/* Real-time sync toggle inside settings */}
          <div className="flex items-center justify-between pt-2 border-t border-neutral-900">
            <div className="space-y-0.5">
              <span className="text-xs font-bold block">Sincronização em Tempo Real</span>
              <span className="text-[9px] text-neutral-400 block">Transmitir mapas automaticamente</span>
            </div>
            <button
              type="button"
              onClick={() => setAutoSync(!autoSync)}
              className={`w-10 h-5.5 rounded-full p-0.5 transition-colors focus:outline-none ${
                autoSync ? "bg-amber-500" : "bg-neutral-800"
              }`}
            >
              <div className={`w-4.5 h-4.5 rounded-full bg-neutral-950 transition-transform ${
                autoSync ? "translate-x-4.5" : "translate-x-0"
              }`} />
            </button>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={() => setShowSettings(false)}
              className="text-[10px] font-bold text-amber-400/90 hover:text-amber-300 underline"
            >
              Ocultar painel de configurações
            </button>
          </div>
        </div>
      ) : (
        /* Minimized status card with toggle */
        <div className="bg-neutral-950/40 border border-neutral-800/65 rounded-2xl p-2.5 mb-4 flex items-center justify-between gap-3 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === "connected"
                ? "bg-emerald-500 animate-pulse"
                : connectionStatus === "warning"
                ? "bg-amber-500"
                : connectionStatus === "checking"
                ? "bg-amber-400 animate-spin"
                : "bg-neutral-500"
            }`} />
            <div>
              <span className="text-[9px] text-neutral-400 block font-bold uppercase tracking-wider">Dispositivo Roku</span>
              <span className="text-[10px] text-neutral-200 font-mono block leading-none">{rokuIp || "IP Não Definido"}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowSettings(true)}
            className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-750 text-[10px] text-amber-300 rounded-lg transition-all font-bold"
          >
            Configurar IP
          </button>
        </div>
      )}

      {/* Main Casting Actions */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Conteúdos Disponíveis</label>
          
          {/* Main Panel Auto-Sync Switch */}
          <div className="flex items-center gap-1.5 bg-neutral-900/60 border border-neutral-850 px-2 py-0.5 rounded-full">
            <span className="text-[9px] font-extrabold text-neutral-400 uppercase tracking-wider leading-none">Auto-Sync</span>
            <button
              type="button"
              onClick={() => {
                const newVal = !autoSync;
                setAutoSync(newVal);
                addLog(`🔄 Transmissão automática ${newVal ? "HABILITADA" : "DESABILITADA"}.`);
              }}
              className={`w-7 h-4 rounded-full p-0.5 transition-colors focus:outline-none ${
                autoSync ? "bg-amber-500" : "bg-neutral-800"
              }`}
              title="Transmitir automaticamente para a TV quando o Mestre alterar o mapa ativo"
            >
              <div className={`w-3 h-3 rounded-full bg-neutral-950 transition-transform ${
                autoSync ? "translate-x-3.0" : "translate-x-0"
              }`} />
            </button>
          </div>
        </div>
        
        {/* Active Map Card */}
        <div className={`border rounded-2xl p-2.5 flex items-center justify-between gap-3 transition-all ${
          autoSync 
            ? "bg-amber-500/5 border-amber-500/30 shadow shadow-amber-500/5" 
            : "bg-neutral-900 border-neutral-800/80"
        }`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800 flex-shrink-0 relative">
              {mapBgUrl ? (
                <img src={mapBgUrl} alt="Mapa" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-700">
                  <Map className="w-4 h-4" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-extrabold text-amber-500 uppercase tracking-wider">Cena / Mapa Ativo</span>
                {autoSync && (
                  <span className="text-[8px] font-bold text-emerald-400 bg-emerald-500/15 px-1 py-0.2 rounded-full flex items-center gap-0.5 animate-pulse">
                    <span className="w-1 h-1 rounded-full bg-emerald-400" /> Auto
                  </span>
                )}
              </div>
              <span className="text-xs font-bold text-neutral-200 truncate block mt-0.5">{mapName || "Nenhum Mapa"}</span>
            </div>
          </div>

          <button
            onClick={() => castMediaToRoku(mapBgUrl, "photo")}
            disabled={!mapBgUrl}
            className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 rounded-xl text-xs font-bold shadow-md shadow-amber-500/10 active:scale-95 transition-all flex items-center gap-1 flex-shrink-0 disabled:opacity-40"
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Transmitir Mapa</span>
          </button>
        </div>

        {/* Revealed Handout Card */}
        {handoutImageUrl && (
          <div className="bg-purple-950/10 border border-purple-500/20 rounded-2xl p-2.5 flex items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-neutral-950 border border-purple-900/30 flex-shrink-0 relative">
                <img src={handoutImageUrl} alt="Pista" className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-extrabold text-purple-400 uppercase block">Pista / Documento Ativo</span>
                <span className="text-xs font-bold text-purple-200 truncate block mt-0.5">{handoutTitle || "Sem título"}</span>
              </div>
            </div>

            <button
              onClick={() => castMediaToRoku(handoutImageUrl, "photo")}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-500/10 active:scale-95 transition-all flex items-center gap-1 flex-shrink-0"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Revelar na TV</span>
            </button>
          </div>
        )}

        {/* Menu de Mapas / Biblioteca */}
        <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-2.5 mt-3 space-y-2">
          <button
            type="button"
            onClick={() => setShowMapLibrary(!showMapLibrary)}
            className="w-full flex items-center justify-between text-[10px] font-bold text-neutral-400 uppercase tracking-wider focus:outline-none"
          >
            <span className="flex items-center gap-1.5 text-amber-400">
              <Map className="w-3.5 h-3.5 animate-pulse" /> Biblioteca de Mapas ({availableMaps.length})
            </span>
            <span className="text-neutral-500 font-mono text-xs">
              {showMapLibrary ? "▲ Recolher" : "▼ Expandir"}
            </span>
          </button>

          {showMapLibrary && (
            <div className="space-y-1.5 pt-1.5 border-t border-neutral-950 max-h-48 overflow-y-auto pr-1">
              {availableMaps.length === 0 ? (
                <div className="space-y-2 py-2">
                  <p className="text-[10px] text-neutral-500 italic text-center">Nenhum mapa salvo na biblioteca do VTT.</p>
                  <div className="bg-neutral-950/60 rounded-xl p-2 space-y-1.5 border border-neutral-850">
                    <span className="text-[9px] font-bold text-amber-500 uppercase block">Mapas Clássicos Rápidos (Presets)</span>
                    <div className="grid grid-cols-1 gap-1">
                      {[
                        { name: "Taberna Medieval", bgUrl: "https://images.unsplash.com/photo-1599420186946-7b6fb4e297f0?q=80&w=1200" },
                        { name: "Floresta Misteriosa", bgUrl: "https://images.unsplash.com/photo-1511497584788-876760111969?q=80&w=1200" },
                        { name: "Masmorra Sombria", bgUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1200" },
                        { name: "Templo Arcano", bgUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200" }
                      ].map((preset) => (
                        <div key={preset.name} className="flex justify-between items-center bg-neutral-900/80 p-1.5 rounded-lg border border-neutral-800">
                          <span className="text-[11px] font-medium text-neutral-300 truncate max-w-[130px]">{preset.name}</span>
                          <button
                            type="button"
                            onClick={() => castMediaToRoku(preset.bgUrl, "photo")}
                            className="p-1 px-2 bg-amber-500/10 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 hover:text-amber-300 rounded-md text-[9px] font-bold transition-all flex items-center gap-1"
                          >
                            <Tv className="w-3 h-3" /> Transmitir
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  {availableMaps.map((m, idx) => {
                    const isActive = m.bgUrl === mapBgUrl;
                    return (
                      <div
                        key={m.id || idx}
                        className={`p-1.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                          isActive
                            ? "bg-amber-500/5 border-amber-500/30 shadow-inner"
                            : "bg-neutral-950/40 border-neutral-850 hover:bg-neutral-900/60"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-lg overflow-hidden bg-neutral-900 border border-neutral-850 flex-shrink-0">
                            {m.bgUrl ? (
                              <img src={m.bgUrl} alt={m.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-neutral-700">
                                <Map className="w-3 h-3" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-[11px] font-bold text-neutral-200 truncate block">{m.name}</span>
                            {isActive && (
                              <span className="text-[8px] font-extrabold text-amber-500 uppercase block tracking-wider leading-none">Exibindo no VTT</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          {/* Transmit to Roku TV button */}
                          <button
                            type="button"
                            onClick={() => castMediaToRoku(m.bgUrl || "", "photo")}
                            disabled={!m.bgUrl}
                            className="p-1 px-1.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-[10px] text-neutral-300 rounded-lg hover:text-amber-400 hover:border-neutral-700 transition-all flex items-center gap-1 disabled:opacity-30"
                            title="Transmitir apenas na TV"
                          >
                            <Tv className="w-3 h-3" />
                            <span className="hidden sm:inline">TV</span>
                          </button>

                          {/* Activate on VTT button */}
                          {onSelectMap && !isActive && (
                            <button
                              type="button"
                              onClick={() => {
                                onSelectMap(m);
                                addLog(`🗺️ Mapa "${m.name}" ativado no VTT.`);
                                if (autoSync && m.bgUrl) {
                                  castMediaToRoku(m.bgUrl, "photo");
                                }
                              }}
                              className="p-1 px-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-[10px] text-amber-300 rounded-lg transition-all font-bold"
                              title="Tornar este o mapa ativo do VTT"
                            >
                              Ativar VTT
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Remote Controls Dashboard */}
      <div className="mt-4 pt-4 border-t border-neutral-800">
        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-3">Console Remoto Roku</label>
        
        <div className="bg-neutral-950/50 rounded-2xl p-3 border border-neutral-900 flex flex-col items-center">
          {/* Navigation D-Pad & Control Grid */}
          <div className="grid grid-cols-3 gap-2 w-48 mb-3">
            <div />
            <button
              onClick={() => pressKey("Up")}
              className="h-9 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 flex items-center justify-center text-neutral-300 transition-colors"
              title="Cima"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <div />

            <button
              onClick={() => pressKey("Left")}
              className="h-9 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 flex items-center justify-center text-neutral-300 transition-colors"
              title="Esquerda"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => pressKey("Select")}
              className="h-9 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-amber-300 font-bold text-xs transition-colors"
              title="Selecionar / OK"
            >
              OK
            </button>
            <button
              onClick={() => pressKey("Right")}
              className="h-9 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 flex items-center justify-center text-neutral-300 transition-colors"
              title="Direita"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <div />
            <button
              onClick={() => pressKey("Down")}
              className="h-9 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 flex items-center justify-center text-neutral-300 transition-colors"
              title="Baixo"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            <div />
          </div>

          {/* Core System Buttons */}
          <div className="flex gap-2 w-full justify-center">
            <button
              onClick={() => pressKey("Back")}
              className="flex-1 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-850 text-[10px] font-bold text-neutral-300 transition-colors flex items-center justify-center gap-1"
              title="Voltar"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Voltar
            </button>
            <button
              onClick={() => pressKey("Home")}
              className="flex-1 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-850 text-[10px] font-bold text-neutral-300 transition-colors flex items-center justify-center gap-1"
              title="Página Inicial"
            >
              <Home className="w-3.5 h-3.5 text-red-400" /> Home
            </button>
            <button
              onClick={() => pressKey("Play")}
              className="flex-1 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-850 text-[10px] font-bold text-neutral-300 transition-colors flex items-center justify-center gap-1"
              title="Play / Pause"
            >
              <Play className="w-3 h-3 text-amber-400" /> / <Pause className="w-3 h-3 text-amber-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Step-by-Step Help Drawer */}
      {showInstructions && (
        <div className="absolute inset-0 bg-neutral-950/98 rounded-3xl p-4 md:p-5 overflow-y-auto space-y-3.5 z-25 text-xs text-neutral-200 select-text leading-relaxed border border-neutral-800 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2 mb-2">
            <h4 className="font-bold text-amber-300 flex items-center gap-1">
              <HelpCircle className="w-4 h-4" /> Como usar a Transmissão Roku
            </h4>
            <button
              onClick={() => setShowInstructions(false)}
              className="p-1 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 font-sans">
            <p>
              O sistema utiliza o protocolo oficial da Roku (<strong>ECP</strong>) para projetar os mapas de forma instantânea na sua TV.
            </p>
            
            <ol className="list-decimal list-inside space-y-2.5 ml-1">
              <li>
                <strong>Verifique o mesmo Wi-Fi:</strong> Sua TV Roku e o computador/celular que está usando este VTT precisam estar conectados na <strong>mesma rede de Wi-Fi</strong>.
              </li>
              <li>
                <strong>Descubra o IP do seu Roku:</strong> Vá no menu da sua TV Roku: 
                <span className="text-amber-400 block mt-1 bg-black/45 p-1 rounded font-mono text-[10px]">
                  Configurações › Rede › Sobre
                </span>
                Copie o endereço IP (ex: <code>192.168.1.45</code>) e insira no campo IP acima.
              </li>
              <li>
                <strong>Habilitar Permissões (HTTPS para HTTP):</strong> 
                Como nosso VTT roda de forma segura em <code>https://</code> e os dispositivos de rede local se comunicam via <code>http://</code>, seu navegador pode bloquear a requisição automática de segurança.
                <div className="bg-amber-950/20 border border-amber-600/35 rounded-xl p-2.5 text-[10px] text-amber-200/90 mt-2">
                  <span className="font-bold text-amber-300">Como liberar no Google Chrome / Edge:</span>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Clique no ícone de cadeado ou configuração à esquerda da URL na barra de endereços.</li>
                    <li>Vá em <strong>Configurações do site</strong>.</li>
                    <li>Encontre <strong>Insecure Content</strong> ou <strong>Conteúdo não seguro</strong> e marque como <strong>Permitir / Allow</strong>.</li>
                  </ul>
                </div>
              </li>
              <li>
                <strong>Dica de Mestre:</strong> Mantenha a <em>Sincronização em Tempo Real</em> ativada. Sempre que você selecionar um mapa no VTT, a TV atualizará o plano de fundo dos jogadores automaticamente!
              </li>
            </ol>
          </div>
        </div>
      )}

      {/* Terminal Live Activity Console */}
      <div className="mt-3.5 bg-black/90 rounded-xl p-2.5 border border-neutral-900 font-mono text-[9px] text-zinc-400 space-y-1 max-h-24 overflow-y-auto select-text">
        <div className="text-[8px] font-bold text-neutral-500 uppercase tracking-wider mb-1 border-b border-neutral-900 pb-1">Log de Transmissão</div>
        {logs.length === 0 ? (
          <div className="text-neutral-600 text-center py-1">Nenhuma atividade registrada ainda.</div>
        ) : (
          logs.map((log, i) => (
            <div key={i} className="truncate">
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
