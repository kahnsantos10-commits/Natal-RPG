import React, { useState, useRef } from "react";
import { Download, Upload, Shield, FileJson, Check, AlertTriangle, X, RefreshCw, Database } from "lucide-react";
import { RoomState, MapData, MapToken, SessionHistoryEvent, ChatMessage, DnDCharacter, OrdemCharacter, CustomCharacter } from "../types";

export interface CampaignBackupPayload {
  version: string;
  exportedAt: string;
  app: string;
  room: {
    id: string;
    code: string;
    name: string;
    system: string;
    gmName: string;
  };
  mapData: MapData;
  availableMaps: MapData[];
  tokens: MapToken[];
  combatants: any[];
  historyEvents: SessionHistoryEvent[];
  messages: ChatMessage[];
  characters: {
    dndChar?: DnDCharacter;
    ordemChar?: OrdemCharacter;
    customChar?: CustomCharacter;
  };
}

interface CampaignBackupModalProps {
  roomCode: string;
  roomName: string;
  system: string;
  userName: string;
  mapData: MapData;
  availableMaps: MapData[];
  tokens: MapToken[];
  combatants: any[];
  historyEvents: SessionHistoryEvent[];
  messages: ChatMessage[];
  dndChar: DnDCharacter;
  ordemChar: OrdemCharacter;
  customChar: CustomCharacter;
  onImportBackup: (payload: CampaignBackupPayload) => void;
  onClose: () => void;
}

export const CampaignBackupModal: React.FC<CampaignBackupModalProps> = ({
  roomCode,
  roomName,
  system,
  userName,
  mapData,
  availableMaps,
  tokens,
  combatants,
  historyEvents,
  messages,
  dndChar,
  ordemChar,
  customChar,
  onImportBackup,
  onClose,
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate and Download Full Campaign Backup JSON
  const handleExportJSON = () => {
    const payload: CampaignBackupPayload = {
      version: "2.5.0",
      exportedAt: new Date().toISOString(),
      app: "Natal-RPG Tabletop Engine",
      room: {
        id: roomCode.toLowerCase(),
        code: roomCode,
        name: roomName,
        system,
        gmName: userName,
      },
      mapData,
      availableMaps,
      tokens,
      combatants,
      historyEvents,
      messages,
      characters: {
        dndChar,
        ordemChar,
        customChar,
      },
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute(
      "download",
      `backup-campanha-${roomCode.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  // Handle file input for restore
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    setImportSuccess(false);

    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const parsed = JSON.parse(text) as CampaignBackupPayload;

        if (!parsed.room || !parsed.mapData) {
          throw new Error("Arquivo de backup inválido ou incompatível com esta versão.");
        }

        onImportBackup(parsed);
        setImportSuccess(true);
        setTimeout(() => {
          onClose();
        }, 1500);
      } catch (err: any) {
        setImportError(err.message || "Erro ao processar o arquivo de backup.");
      }
    };
    reader.onerror = () => setImportError("Erro ao ler o arquivo selecionado.");
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-serif text-neutral-100 flex items-center gap-2">
                Backup & Restauração da Campanha
              </h2>
              <p className="text-xs text-neutral-400">
                Salve ou restaure mapas, fichas, tokens, diário e histórico em arquivo JSON.
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

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Summary Box */}
          <div className="bg-neutral-950/70 border border-neutral-800 rounded-2xl p-4 space-y-2">
            <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block">
              Dados Atuais da Mesa Prontos para Arquivar:
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs text-neutral-300">
              <div className="flex items-center gap-1.5">
                <span className="text-neutral-500">Mesa:</span>
                <strong>{roomName} ({roomCode})</strong>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-neutral-500">Sistema:</span>
                <strong className="uppercase text-amber-400">{system}</strong>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-neutral-500">Mapas:</span>
                <strong>{availableMaps.length} cenários</strong>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-neutral-500">Tokens/Minis:</span>
                <strong>{tokens.length} combatentes</strong>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-neutral-500">Diário/Histórico:</span>
                <strong>{historyEvents.length} eventos</strong>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-neutral-500">Mensagens:</span>
                <strong>{messages.length} registros</strong>
              </div>
            </div>
          </div>

          {/* Export Action */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-neutral-400 block">
              1. Fazer Download do Backup Completo (.JSON)
            </label>
            <button
              onClick={handleExportJSON}
              className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-neutral-950 font-bold rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98"
            >
              {downloadSuccess ? <Check className="w-4 h-4 text-emerald-950" /> : <Download className="w-4 h-4" />}
              <span>{downloadSuccess ? "Backup Baixado com Sucesso!" : "Exportar Arquivo de Backup (.JSON)"}</span>
            </button>
            <p className="text-[11px] text-neutral-500 text-center">
              Gera um arquivo compacto que você pode guardar no Google Drive ou passar para outro mestre.
            </p>
          </div>

          {/* Import Action */}
          <div className="space-y-2 pt-2 border-t border-neutral-800">
            <label className="text-xs font-bold uppercase text-neutral-400 block">
              2. Restaurar Campanha a partir de um Arquivo (.JSON)
            </label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json,application/json"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 bg-neutral-950 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 font-bold rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              <Upload className="w-4 h-4 text-purple-400" />
              <span>Selecionar Arquivo de Backup (.JSON)</span>
            </button>

            {importSuccess && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-500/80 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Campanha restaurada com sucesso! Atualizando mesa...</span>
              </div>
            )}

            {importError && (
              <div className="p-3 bg-red-950/60 border border-red-500/80 rounded-xl text-xs text-red-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>{importError}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
