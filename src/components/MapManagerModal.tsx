import React, { useState } from "react";
import { MapData, RPGSystem } from "../types";
import {
  Compass,
  Plus,
  Image as ImageIcon,
  Grid,
  Sun,
  Moon,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  Check,
  X,
  Upload,
  Layers,
  Sparkles,
  ArrowRight
} from "lucide-react";

interface MapManagerModalProps {
  currentMap: MapData;
  availableMaps: MapData[];
  system: RPGSystem;
  onSelectMap: (map: MapData) => void;
  onCreateMap: (map: MapData) => void;
  onDeleteMap?: (mapId: string) => void;
  onClose: () => void;
}

// Curated atmospheric presets for RPG games
const mapPresets: Array<{
  id: string;
  name: string;
  category: "ordem" | "dnd5e" | "all";
  gridWidth: number;
  gridHeight: number;
  gridSize: number;
  bgUrl: string;
  lighting: "bright" | "dim" | "dark" | "paranormal_fog";
  description: string;
}> = [
  {
    id: "preset-mansao",
    name: "Mansão Antiga dos Espelhos",
    category: "ordem",
    gridWidth: 20,
    gridHeight: 16,
    gridSize: 48,
    bgUrl: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&auto=format&fit=crop&q=80",
    lighting: "paranormal_fog",
    description: "Salão de baile gélido com espelhos estilhaçados e marcas de sangue seco nas paredes.",
  },
  {
    id: "preset-lab",
    name: "Laboratório Químico Subterrâneo",
    category: "ordem",
    gridWidth: 18,
    gridHeight: 14,
    gridSize: 48,
    bgUrl: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&auto=format&fit=crop&q=80",
    lighting: "dim",
    description: "Bancadas de vidro quebradas, tubulações com vazamento de gás e computadores anos 90 piscando.",
  },
  {
    id: "preset-hospital",
    name: "Sanatório Abandonado",
    category: "ordem",
    gridWidth: 22,
    gridHeight: 16,
    gridSize: 48,
    bgUrl: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&auto=format&fit=crop&q=80",
    lighting: "dark",
    description: "Corredor escuro com macas enferrujadas e manchas escuras rastejando pelo teto.",
  },
  {
    id: "preset-taverna",
    name: "Taverna do Javali Saltitante",
    category: "dnd5e",
    gridWidth: 16,
    gridHeight: 14,
    gridSize: 50,
    bgUrl: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1200&auto=format&fit=crop&q=80",
    lighting: "bright",
    description: "Ambiente acolhedor com lareira crepitante, barris de hidromel, mesas de madeira e palco de bardo.",
  },
  {
    id: "preset-cripta",
    name: "Catacumbas dos Reis Esquecidos",
    category: "dnd5e",
    gridWidth: 24,
    gridHeight: 18,
    gridSize: 48,
    bgUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80",
    lighting: "dim",
    description: "Sarcófagos de pedra ancestral, tochas bruxuleantes e círculos rúnicos gravados no basalto.",
  },
  {
    id: "preset-caverna",
    name: "Caverna do Dragão de Obsidiana",
    category: "dnd5e",
    gridWidth: 26,
    gridHeight: 20,
    gridSize: 48,
    bgUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80",
    lighting: "dark",
    description: "Rios de magma incandescente, pilares de pedra pontiagudos e tesouros espalhados pelo chão.",
  },
];

export function MapManagerModal({
  currentMap,
  availableMaps,
  system,
  onSelectMap,
  onCreateMap,
  onDeleteMap,
  onClose,
}: MapManagerModalProps) {
  const [activeTab, setActiveTab] = useState<"library" | "create" | "presets">("library");

  // Create Form State
  const [mapName, setMapName] = useState("");
  const [gridWidth, setGridWidth] = useState(20);
  const [gridHeight, setGridHeight] = useState(16);
  const [gridSize, setGridSize] = useState(50);
  const [gridType, setGridType] = useState<"square" | "hex">("square");
  const [bgUrl, setBgUrl] = useState("");
  const [lighting, setLighting] = useState<"bright" | "dim" | "dark" | "paranormal_fog">(
    system === "ordem" ? "paranormal_fog" : "bright"
  );
  const [fogOfWar, setFogOfWar] = useState(false);

  // AI Map Generation State
  const [aiMapPrompt, setAiMapPrompt] = useState("");
  const [isGeneratingAiMap, setIsGeneratingAiMap] = useState(false);

  const handleGenerateAiMap = async () => {
    if (!aiMapPrompt.trim()) {
      alert("Por favor, digite uma descrição para o ambiente do mapa.");
      return;
    }

    setIsGeneratingAiMap(true);
    try {
      const res = await fetch("/api/ai/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiMapPrompt,
          type: "map",
          system,
        }),
      });

      if (!res.ok) throw new Error("Falha na geração de imagem de mapa.");
      const data = await res.json();
      if (data.imageUrl) {
        setBgUrl(data.imageUrl);
        if (!mapName) {
          const shortTitle = aiMapPrompt.length > 30 ? aiMapPrompt.slice(0, 30) + "..." : aiMapPrompt;
          setMapName(shortTitle);
        }
      }
    } catch (err) {
      console.error("Erro ao gerar mapa com IA:", err);
      const seed = Math.floor(Math.random() * 1000000);
      const encoded = encodeURIComponent(`RPG battlemap top-down view ${aiMapPrompt}`);
      const fallbackUrl = `https://image.pollinations.ai/prompt/${encoded}?width=1280&height=720&seed=${seed}&nologo=true`;
      setBgUrl(fallbackUrl);
      if (!mapName) setMapName(aiMapPrompt.slice(0, 30));
    } finally {
      setIsGeneratingAiMap(false);
    }
  };

  // File Upload Handler (Data URL)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setBgUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapName.trim()) {
      alert("Por favor, informe o nome do mapa.");
      return;
    }

    const newMap: MapData = {
      id: `map-${Date.now()}`,
      name: mapName.trim(),
      gridWidth: Number(gridWidth) || 20,
      gridHeight: Number(gridHeight) || 16,
      gridSize: Number(gridSize) || 50,
      gridType,
      bgUrl: bgUrl.trim() || undefined,
      lighting,
      fogOfWar,
      revealedCells: [],
      drawings: [],
      pings: [],
    };

    onCreateMap(newMap);
    onSelectMap(newMap);
    onClose();
  };

  const handleApplyPreset = (preset: typeof mapPresets[0]) => {
    const presetMap: MapData = {
      id: `map-preset-${Date.now()}`,
      name: preset.name,
      gridWidth: preset.gridWidth,
      gridHeight: preset.gridHeight,
      gridSize: preset.gridSize,
      gridType: "square",
      bgUrl: preset.bgUrl,
      lighting: preset.lighting,
      fogOfWar: false,
      revealedCells: [],
      drawings: [],
      pings: [],
    };

    onCreateMap(presetMap);
    onSelectMap(presetMap);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-serif text-neutral-100 flex items-center gap-2">
                Gerenciador & Criador de Mapas
              </h2>
              <p className="text-xs text-neutral-400">
                Mapa Ativo: <span className="text-amber-300 font-semibold">{currentMap.name}</span> ({currentMap.gridWidth}x{currentMap.gridHeight} células)
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

        {/* Tabs */}
        <div className="flex border-b border-neutral-800 bg-neutral-950/40 px-4 sm:px-6 gap-2 pt-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("library")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 ${
              activeTab === "library"
                ? "border-amber-500 text-amber-400 bg-neutral-900"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Mapas da Sessão ({availableMaps.length})</span>
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
            <span>Criar Novo Mapa</span>
          </button>

          <button
            onClick={() => setActiveTab("presets")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 ${
              activeTab === "presets"
                ? "border-amber-500 text-amber-400 bg-neutral-900"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Galeria de Cenários Prontos</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {/* TAB 1: MAPS LIBRARY */}
          {activeTab === "library" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-400">
                  Selecione um mapa para carregar instantaneamente na batalha:
                </span>
                <button
                  onClick={() => setActiveTab("create")}
                  className="flex items-center gap-1 text-xs font-bold text-amber-400 hover:text-amber-300"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Novo Mapa</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {availableMaps.map((mapItem) => {
                  const isSelected = mapItem.id === currentMap.id || mapItem.name === currentMap.name;
                  return (
                    <div
                      key={mapItem.id || mapItem.name}
                      className={`rounded-2xl border p-3 flex flex-col justify-between gap-3 transition-all relative overflow-hidden ${
                        isSelected
                          ? "bg-amber-950/30 border-amber-500/80 shadow-lg ring-1 ring-amber-500/50"
                          : "bg-neutral-950/60 border-neutral-800 hover:border-neutral-700"
                      }`}
                    >
                      {/* Map Thumbnail / Background Preview */}
                      <div className="h-28 rounded-xl bg-neutral-900 border border-neutral-800 relative overflow-hidden flex items-center justify-center">
                        {mapItem.bgUrl ? (
                          <img
                            src={mapItem.bgUrl}
                            alt={mapItem.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-1 text-neutral-600">
                            <Grid className="w-8 h-8" />
                            <span className="text-[10px]">Grid Liso</span>
                          </div>
                        )}

                        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 bg-neutral-950/80 backdrop-blur-sm rounded-lg text-[10px] text-neutral-300 border border-neutral-800">
                          <Grid className="w-3 h-3 text-amber-400" />
                          <span>{mapItem.gridWidth}x{mapItem.gridHeight}</span>
                        </div>

                        {isSelected && (
                          <div className="absolute top-2 left-2 px-2 py-0.5 bg-amber-500 text-neutral-950 font-black text-[10px] rounded-lg shadow">
                            Ativo na Mesa
                          </div>
                        )}
                      </div>

                      {/* Map Details */}
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-neutral-100 truncate">
                          {mapItem.name}
                        </h4>
                        <div className="flex items-center gap-2 text-[10px] text-neutral-400 mt-1">
                          <span className="capitalize">
                            Iluminação: {mapItem.lighting === "paranormal_fog" ? "Névoa Paranormal" : mapItem.lighting || "Normal"}
                          </span>
                          <span>•</span>
                          <span>{mapItem.gridType === "hex" ? "Hexagonal" : "Quadrado"}</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-between pt-1 border-t border-neutral-800/80">
                        {isSelected ? (
                          <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                            <Check className="w-4 h-4" /> Em Exibição
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              onSelectMap(mapItem);
                              onClose();
                            }}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
                          >
                            <span>Ativar no Tabuleiro</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {onDeleteMap && availableMaps.length > 1 && !isSelected && (
                          <button
                            onClick={() => onDeleteMap(mapItem.id || "")}
                            className="p-1.5 text-neutral-500 hover:text-red-400 rounded-lg hover:bg-red-950/30 transition-colors"
                            title="Remover mapa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: CREATE MAP */}
          {activeTab === "create" && (
            <form onSubmit={handleCreateSubmit} className="space-y-4 max-w-xl mx-auto">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300">Nome do Mapa / Local</label>
                <input
                  type="text"
                  value={mapName}
                  onChange={(e) => setMapName(e.target.value)}
                  placeholder="Ex: Cripta do Cultista, Taverna do Porto, Floresta Sombria"
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-neutral-100 placeholder:text-neutral-600 focus:outline-none"
                  required
                />
              </div>

              {/* Grid Dimensions */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-300">Largura (Colunas)</label>
                  <input
                    type="number"
                    min={6}
                    max={60}
                    value={gridWidth}
                    onChange={(e) => setGridWidth(Number(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-300">Altura (Linhas)</label>
                  <input
                    type="number"
                    min={6}
                    max={60}
                    value={gridHeight}
                    onChange={(e) => setGridHeight(Number(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-300">Tamanho Célula (px)</label>
                  <input
                    type="number"
                    min={24}
                    max={120}
                    value={gridSize}
                    onChange={(e) => setGridSize(Number(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none"
                  />
                </div>
              </div>

              {/* AI Map Generator Block */}
              <div className="bg-gradient-to-r from-amber-950/40 via-purple-950/30 to-neutral-950 p-4 rounded-2xl border border-amber-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                    <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                    <span>Gerar Fundo de Mapa com Inteligência Artificial</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                    IA Mestre Studio
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  Descreva o ambiente e o cenário desejado (ex: "Masmorra antiga de pedra com tochas e rio de lava no centro", "Laboratório ocultista com computadores velhos e luzes roxas").
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aiMapPrompt}
                    onChange={(e) => setAiMapPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleGenerateAiMap();
                      }
                    }}
                    placeholder="Descreva o ambiente do novo mapa em detalhes..."
                    className="flex-1 bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-neutral-100 placeholder:text-neutral-600 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateAiMap}
                    disabled={isGeneratingAiMap}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all flex-shrink-0 disabled:opacity-50"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isGeneratingAiMap ? "animate-spin" : ""}`} />
                    <span>{isGeneratingAiMap ? "Gerando..." : "Gerar Mapa IA"}</span>
                  </button>
                </div>
              </div>

              {/* Background Image Upload or URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300">Imagem de Fundo (Upload ou Link)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={bgUrl}
                    onChange={(e) => setBgUrl(e.target.value)}
                    placeholder="https://... (URL da imagem)"
                    className="flex-1 bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-neutral-100 placeholder:text-neutral-600 focus:outline-none"
                  />
                  <label className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 flex-shrink-0 transition-colors">
                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                {bgUrl && (
                  <div className="mt-2 h-24 rounded-xl border border-neutral-800 overflow-hidden relative">
                    <img src={bgUrl} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setBgUrl("")}
                      className="absolute top-1 right-1 p-1 bg-black/70 text-neutral-300 hover:text-white rounded-lg"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Atmospheric Lighting */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300">Iluminação & Atmosfera</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setLighting("bright")}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                      lighting === "bright"
                        ? "bg-amber-500/20 border-amber-500 text-amber-300"
                        : "bg-neutral-950 border-neutral-800 text-neutral-400"
                    }`}
                  >
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span>Claro</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLighting("dim")}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                      lighting === "dim"
                        ? "bg-amber-900/30 border-amber-600 text-amber-200"
                        : "bg-neutral-950 border-neutral-800 text-neutral-400"
                    }`}
                  >
                    <Moon className="w-4 h-4 text-amber-300" />
                    <span>Penumbra</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLighting("dark")}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                      lighting === "dark"
                        ? "bg-neutral-800 border-neutral-600 text-neutral-200"
                        : "bg-neutral-950 border-neutral-800 text-neutral-400"
                    }`}
                  >
                    <EyeOff className="w-4 h-4 text-neutral-400" />
                    <span>Escuridão</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLighting("paranormal_fog")}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                      lighting === "paranormal_fog"
                        ? "bg-purple-900/40 border-purple-500 text-purple-300 shadow"
                        : "bg-neutral-950 border-neutral-800 text-neutral-400"
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>Névoa Paranormal</span>
                  </button>
                </div>
              </div>

              {/* Fog of War Switch */}
              <div className="flex items-center justify-between p-3 bg-neutral-950 rounded-xl border border-neutral-800">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-amber-400" />
                  <div>
                    <span className="text-xs font-bold text-neutral-200 block">Névoa de Guerra (Fog of War)</span>
                    <span className="text-[10px] text-neutral-500">Ocultar o mapa para que o Mestre revele aos poucos</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={fogOfWar}
                  onChange={(e) => setFogOfWar(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-4 py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-neutral-950 font-bold rounded-2xl shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2 text-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Salvar e Carregar Mapa no Tabuleiro</span>
              </button>
            </form>
          )}

          {/* TAB 3: THEMATIC PRESETS */}
          {activeTab === "presets" && (
            <div className="space-y-4">
              <p className="text-xs text-neutral-400">
                Escolha um cenário profissional já configurado com iluminação e dimensões ideais para sua sessão:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {mapPresets.map((preset) => (
                  <div
                    key={preset.id}
                    className="p-3.5 rounded-2xl bg-neutral-950/70 border border-neutral-800 hover:border-amber-500/50 transition-all flex flex-col justify-between gap-3 group"
                  >
                    <div className="h-32 rounded-xl overflow-hidden relative border border-neutral-800">
                      <img
                        src={preset.bgUrl}
                        alt={preset.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 left-2 px-2 py-0.5 bg-neutral-950/80 backdrop-blur-sm rounded-lg text-[10px] font-bold text-amber-300 border border-neutral-800">
                        {preset.category === "ordem" ? "Ordem Paranormal" : "D&D 5e / Fantasia"}
                      </div>
                      <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-neutral-950/80 backdrop-blur-sm rounded-lg text-[10px] text-neutral-300 border border-neutral-800">
                        {preset.gridWidth}x{preset.gridHeight} células
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-neutral-100">{preset.name}</h4>
                      <p className="text-[11px] text-neutral-400 mt-1 line-clamp-2">{preset.description}</p>
                    </div>

                    <button
                      onClick={() => handleApplyPreset(preset)}
                      className="w-full py-2 bg-neutral-900 group-hover:bg-amber-500 group-hover:text-neutral-950 text-neutral-200 border border-neutral-800 group-hover:border-amber-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Usar este Cenário</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
