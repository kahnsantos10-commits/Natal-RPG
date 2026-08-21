import React, { useState, useRef, useEffect } from "react";
import { MapData, MapToken, RPGSystem, UserRole } from "../types";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Scan,
  Hand,
  Eye,
  EyeOff,
  Ruler,
  MapPin,
  Brush,
  Plus,
  Trash2,
  Sparkles,
  Shield,
  Heart,
  Image as ImageIcon,
  Compass,
  Move,
  Layers,
  Box
} from "lucide-react";
import { Token3DModal } from "./Token3DModal";
import { rpgAudio } from "../utils/audioSynth";

interface BattleMapProps {
  map: MapData;
  tokens: MapToken[];
  system: RPGSystem;
  userRole: UserRole;
  currentTurnTokenId?: string;
  onUpdateTokens: (tokens: MapToken[]) => void;
  onUpdateMap: (map: Partial<MapData>) => void;
  onSelectTokenForRoll?: (token: MapToken) => void;
}

export const BattleMap: React.FC<BattleMapProps> = ({
  map,
  tokens,
  system,
  userRole,
  currentTurnTokenId,
  onUpdateTokens,
  onUpdateMap,
  onSelectTokenForRoll,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const [activeTool, setActiveTool] = useState<"select" | "measure" | "fog_reveal" | "fog_hide" | "ping" | "draw">("select");
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [inspected3DToken, setInspected3DToken] = useState<MapToken | null>(null);

  // Dragging tokens
  const [draggingTokenId, setDraggingTokenId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Measurement tool state
  const [measureStart, setMeasureStart] = useState<{ x: number; y: number } | null>(null);
  const [measureCurrent, setMeasureCurrent] = useState<{ x: number; y: number } | null>(null);

  // Add Token Modal
  const [showAddTokenModal, setShowAddTokenModal] = useState(false);
  const [newTokenName, setNewTokenName] = useState("");
  const [newTokenType, setNewTokenType] = useState<"hero" | "enemy" | "npc" | "boss">("enemy");
  const [newTokenHp, setNewTokenHp] = useState(30);
  const [newTokenAc, setNewTokenAc] = useState(14);
  const [newTokenAvatar, setNewTokenAvatar] = useState("");

  const gridSize = map.gridSize || 50;

  // Selected Token helper
  const selectedToken = tokens.find((t) => t.id === selectedTokenId) || null;

  // Keyboard shortcut state for Spacebar panning
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const touchStartRef = useRef<{ dist: number; zoom: number; center: { x: number; y: number }; pan: { x: number; y: number } } | null>(null);

  // Zoom helpers
  const handleZoomIn = (delta = 0.15) => {
    if (!containerRef.current) {
      setZoom((z) => Math.min(3.5, Number((z + delta).toFixed(2))));
      return;
    }
    const container = containerRef.current.getBoundingClientRect();
    const centerX = container.width / 2;
    const centerY = container.height / 2;

    setZoom((prevZoom) => {
      const newZoom = Math.min(3.5, Number((prevZoom + delta).toFixed(2)));
      if (newZoom === prevZoom) return prevZoom;
      setPan((prevPan) => {
        const mapPointX = (centerX - prevPan.x) / prevZoom;
        const mapPointY = (centerY - prevPan.y) / prevZoom;
        return {
          x: centerX - mapPointX * newZoom,
          y: centerY - mapPointY * newZoom,
        };
      });
      return newZoom;
    });
  };

  const handleZoomOut = (delta = 0.15) => {
    if (!containerRef.current) {
      setZoom((z) => Math.max(0.3, Number((z - delta).toFixed(2))));
      return;
    }
    const container = containerRef.current.getBoundingClientRect();
    const centerX = container.width / 2;
    const centerY = container.height / 2;

    setZoom((prevZoom) => {
      const newZoom = Math.max(0.3, Number((prevZoom - delta).toFixed(2)));
      if (newZoom === prevZoom) return prevZoom;
      setPan((prevPan) => {
        const mapPointX = (centerX - prevPan.x) / prevZoom;
        const mapPointY = (centerY - prevPan.y) / prevZoom;
        return {
          x: centerX - mapPointX * newZoom,
          y: centerY - mapPointY * newZoom,
        };
      });
      return newZoom;
    });
  };

  const handleResetZoom = () => {
    setZoom(1);
    if (containerRef.current) {
      const container = containerRef.current.getBoundingClientRect();
      const mapWidth = map.gridWidth * gridSize;
      const mapHeight = map.gridHeight * gridSize;
      const centerX = (container.width - mapWidth) / 2;
      const centerY = (container.height - mapHeight) / 2;
      setPan({ x: centerX, y: centerY });
    } else {
      setPan({ x: 0, y: 0 });
    }
  };

  const handleFitToScreen = () => {
    if (!containerRef.current) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      return;
    }
    const container = containerRef.current.getBoundingClientRect();
    const mapWidth = map.gridWidth * gridSize;
    const mapHeight = map.gridHeight * gridSize;
    const padding = 60;
    const scaleX = (container.width - padding) / mapWidth;
    const scaleY = (container.height - padding) / mapHeight;
    const calculatedZoom = Math.min(Math.max(0.3, Math.min(scaleX, scaleY)), 2.5);
    const roundedZoom = Number(calculatedZoom.toFixed(2));
    setZoom(roundedZoom);
    const centerX = (container.width - mapWidth * roundedZoom) / 2;
    const centerY = (container.height - mapHeight * roundedZoom) / 2;
    setPan({ x: centerX, y: centerY });
  };

  // Attach non-passive native wheel listener for smooth cursor-centered zoom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Exponential smooth zooming factor
      const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;

      setZoom((prevZoom) => {
        const newZoom = Math.min(3.5, Math.max(0.3, Number((prevZoom * zoomFactor).toFixed(3))));
        if (newZoom === prevZoom) return prevZoom;

        setPan((prevPan) => {
          const mapPointX = (mouseX - prevPan.x) / prevZoom;
          const mapPointY = (mouseY - prevPan.y) / prevZoom;
          return {
            x: mouseX - mapPointX * newZoom,
            y: mouseY - mapPointY * newZoom,
          };
        });

        return newZoom;
      });
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, [map.gridWidth, map.gridHeight, gridSize]);

  // Keyboard navigation (+, -, 0, Space)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === "0") {
        e.preventDefault();
        handleResetZoom();
      } else if (e.code === "Space" && !isSpacePressed) {
        setIsSpacePressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isSpacePressed]);

  // Touch pinch-to-zoom & two-finger pan
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const center = {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2,
      };
      touchStartRef.current = { dist, zoom, center, pan };
    } else if (e.touches.length === 1 && (activeTool === "select" || isSpacePressed)) {
      const t = e.touches[0];
      setIsPanning(true);
      setPanStart({ x: t.clientX, y: t.clientY });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartRef.current && containerRef.current) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currentDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const currentCenter = {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2,
      };
      const scaleRatio = currentDist / Math.max(1, touchStartRef.current.dist);
      const newZoom = Math.min(3.5, Math.max(0.3, Number((touchStartRef.current.zoom * scaleRatio).toFixed(3))));

      const container = containerRef.current.getBoundingClientRect();
      const mouseX = currentCenter.x - container.left;
      const mouseY = currentCenter.y - container.top;

      const mapPointX = (mouseX - touchStartRef.current.pan.x) / touchStartRef.current.zoom;
      const mapPointY = (mouseY - touchStartRef.current.pan.y) / touchStartRef.current.zoom;

      setZoom(newZoom);
      setPan({
        x: mouseX - mapPointX * newZoom,
        y: mouseY - mapPointY * newZoom,
      });
    } else if (e.touches.length === 1 && isPanning) {
      const t = e.touches[0];
      setPan((prev) => ({
        x: prev.x + (t.clientX - panStart.x),
        y: prev.y + (t.clientY - panStart.y),
      }));
      setPanStart({ x: t.clientX, y: t.clientY });
    }
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
    setIsPanning(false);
  };

  // Background map presets
  const mapPresets = [
    {
      name: "Ruínas Ancestrais (D&D)",
      url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80",
      lighting: "dim"
    },
    {
      name: "Mansão Sinistra (Ordem)",
      url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&auto=format&fit=crop&q=80",
      lighting: "paranormal_fog"
    },
    {
      name: "Catacumbas Sombrias",
      url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80",
      lighting: "dark"
    },
    {
      name: "Floresta Mística",
      url: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200&auto=format&fit=crop&q=80",
      lighting: "bright"
    }
  ];

  // Handle Token Position Dragging
  const handleTokenMouseDown = (e: React.MouseEvent, token: MapToken) => {
    if (activeTool !== "select") return;
    e.stopPropagation();
    setSelectedTokenId(token.id);
    setDraggingTokenId(token.id);

    const container = containerRef.current?.getBoundingClientRect();
    if (!container) return;

    setDragOffset({
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // 1. Panning the Map
    if (isPanning) {
      setPan((prev) => ({
        x: prev.x + (e.clientX - panStart.x),
        y: prev.y + (e.clientY - panStart.y),
      }));
      setPanStart({ x: e.clientX, y: e.clientY });
      return;
    }

    // 2. Measuring
    if (activeTool === "measure" && measureStart) {
      const container = containerRef.current?.getBoundingClientRect();
      if (!container) return;
      const relativeX = (e.clientX - container.left - pan.x) / zoom;
      const relativeY = (e.clientY - container.top - pan.y) / zoom;
      setMeasureCurrent({
        x: Math.floor(relativeX / gridSize),
        y: Math.floor(relativeY / gridSize),
      });
      return;
    }

    // 3. Dragging Token
    if (draggingTokenId && containerRef.current) {
      const container = containerRef.current.getBoundingClientRect();
      const rawX = (e.clientX - container.left - pan.x) / zoom;
      const rawY = (e.clientY - container.top - pan.y) / zoom;

      const gridX = Math.max(0, Math.min(map.gridWidth - 1, Math.floor(rawX / gridSize)));
      const gridY = Math.max(0, Math.min(map.gridHeight - 1, Math.floor(rawY / gridSize)));

      onUpdateTokens(
        tokens.map((t) => (t.id === draggingTokenId ? { ...t, x: gridX, y: gridY } : t))
      );
    }
  };

  const handleMouseUp = () => {
    if (draggingTokenId) {
      rpgAudio.playSwordHit();
      setDraggingTokenId(null);
    }
    if (isPanning) setIsPanning(false);
    if (activeTool === "measure" && measureStart) {
      setMeasureStart(null);
      setMeasureCurrent(null);
    }
  };

  const handleCellClick = (x: number, y: number) => {
    if (activeTool === "fog_reveal") {
      const cellKey = `${x},${y}`;
      if (!map.revealedCells.includes(cellKey)) {
        onUpdateMap({ revealedCells: [...map.revealedCells, cellKey] });
      }
    } else if (activeTool === "fog_hide") {
      const cellKey = `${x},${y}`;
      onUpdateMap({
        revealedCells: map.revealedCells.filter((c) => c !== cellKey),
      });
    } else if (activeTool === "ping") {
      const newPing = {
        id: `ping-${Date.now()}`,
        x,
        y,
        color: system === "ordem" ? "#8b5cf6" : "#f59e0b",
        sender: userRole === "gm" ? "Mestre" : "Jogador",
        timestamp: Date.now(),
      };
      onUpdateMap({ pings: [...(map.pings || []), newPing] });
      rpgAudio.playMagicSpell();
    } else if (activeTool === "measure") {
      if (!measureStart) {
        setMeasureStart({ x, y });
        setMeasureCurrent({ x, y });
      } else {
        setMeasureStart(null);
        setMeasureCurrent(null);
      }
    }
  };

  const handleAddToken = () => {
    if (!newTokenName.trim()) return;

    const colors: Record<string, string> = {
      hero: "#3b82f6",
      enemy: "#ef4444",
      boss: "#dc2626",
      npc: "#10b981",
    };

    const createdToken: MapToken = {
      id: `tok-${Date.now()}`,
      name: newTokenName,
      type: newTokenType,
      system,
      x: Math.floor(map.gridWidth / 2),
      y: Math.floor(map.gridHeight / 2),
      size: newTokenType === "boss" ? 2 : 1,
      hp: newTokenHp,
      maxHp: newTokenHp,
      san: system === "ordem" ? 30 : undefined,
      maxSan: system === "ordem" ? 30 : undefined,
      pe: system === "ordem" ? 12 : undefined,
      maxPe: system === "ordem" ? 12 : undefined,
      ac: newTokenAc,
      conditions: [],
      color: colors[newTokenType] || "#eab308",
      avatar:
        newTokenAvatar ||
        (newTokenType === "hero"
          ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
          : newTokenType === "boss"
          ? "https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=150&auto=format&fit=crop&q=80"
          : "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=150&auto=format&fit=crop&q=80"),
    };

    onUpdateTokens([...tokens, createdToken]);
    setNewTokenName("");
    setShowAddTokenModal(false);
  };

  const handleDamageHeal = (tokenId: string, delta: number) => {
    onUpdateTokens(
      tokens.map((t) => {
        if (t.id === tokenId) {
          const nextHp = Math.max(0, Math.min(t.maxHp, t.hp + delta));
          return { ...t, hp: nextHp };
        }
        return t;
      })
    );
  };

  const handleToggleCondition = (tokenId: string, cond: string) => {
    onUpdateTokens(
      tokens.map((t) => {
        if (t.id === tokenId) {
          const has = t.conditions.includes(cond);
          return {
            ...t,
            conditions: has ? t.conditions.filter((c) => c !== cond) : [...t.conditions, cond],
          };
        }
        return t;
      })
    );
  };

  const handleDeleteToken = (tokenId: string) => {
    onUpdateTokens(tokens.filter((t) => t.id !== tokenId));
    if (selectedTokenId === tokenId) setSelectedTokenId(null);
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-neutral-950 overflow-hidden select-none">
      {/* Top Floating Map Toolbar */}
      <div className="absolute top-3 left-3 z-30 flex items-center gap-1.5 p-1 sm:p-1.5 bg-neutral-900/90 backdrop-blur-md border border-neutral-800/80 rounded-2xl shadow-xl max-w-[calc(100vw-145px)] sm:max-w-none overflow-x-auto">
        <button
          onClick={() => setActiveTool("select")}
          title="Mover e Selecionar"
          className={`p-1.5 sm:p-2 rounded-xl transition-all flex-shrink-0 ${
            activeTool === "select"
              ? "bg-amber-500 text-neutral-950 shadow-md font-bold"
              : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
          }`}
        >
          <Move className="w-4 h-4" />
        </button>

        <button
          onClick={() => setActiveTool("measure")}
          title="Régua de Distância"
          className={`p-1.5 sm:p-2 rounded-xl transition-all flex-shrink-0 ${
            activeTool === "measure"
              ? "bg-amber-500 text-neutral-950 shadow-md font-bold"
              : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
          }`}
        >
          <Ruler className="w-4 h-4" />
        </button>

        <button
          onClick={() => setActiveTool("ping")}
          title="Marcador de Ping no Mapa"
          className={`p-1.5 sm:p-2 rounded-xl transition-all flex-shrink-0 ${
            activeTool === "ping"
              ? "bg-amber-500 text-neutral-950 shadow-md font-bold"
              : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
          }`}
        >
          <MapPin className="w-4 h-4" />
        </button>

        {userRole === "gm" && (
          <>
            <div className="w-px h-5 bg-neutral-800 mx-0.5 sm:mx-1 flex-shrink-0" />

            <button
              onClick={() => onUpdateMap({ fogOfWar: !map.fogOfWar })}
              title={map.fogOfWar ? "Desativar Névoa de Guerra" : "Ativar Névoa de Guerra"}
              className={`p-1.5 sm:p-2 rounded-xl transition-all flex-shrink-0 ${
                map.fogOfWar ? "bg-purple-900/50 text-purple-300 border border-purple-700" : "text-neutral-400 hover:bg-neutral-800"
              }`}
            >
              {map.fogOfWar ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>

            {map.fogOfWar && (
              <>
                <button
                  onClick={() => setActiveTool("fog_reveal")}
                  title="Revelar Área na Névoa"
                  className={`px-2 sm:px-2.5 py-1 text-xs rounded-xl transition-all flex-shrink-0 ${
                    activeTool === "fog_reveal"
                      ? "bg-emerald-500 text-neutral-950 font-bold"
                      : "text-neutral-400 hover:bg-neutral-800"
                  }`}
                >
                  Revelar
                </button>
                <button
                  onClick={() => setActiveTool("fog_hide")}
                  title="Ocultar Área na Névoa"
                  className={`px-2 sm:px-2.5 py-1 text-xs rounded-xl transition-all flex-shrink-0 ${
                    activeTool === "fog_hide"
                      ? "bg-purple-600 text-white font-bold"
                      : "text-neutral-400 hover:bg-neutral-800"
                  }`}
                >
                  Cobrir
                </button>
              </>
            )}

            <div className="w-px h-5 bg-neutral-800 mx-0.5 sm:mx-1 flex-shrink-0" />

            <button
              onClick={() => setShowAddTokenModal(true)}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-neutral-950 font-semibold rounded-xl text-xs shadow transition-all whitespace-nowrap flex-shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Novo Token</span>
            </button>
          </>
        )}
      </div>

      {/* Map Preset & Zoom Controls */}
      <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5 sm:gap-2">
        {/* Preset Selector */}
        {userRole === "gm" && (
          <div className="relative group">
            <button className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-neutral-900/90 backdrop-blur border border-neutral-800 text-neutral-300 rounded-xl text-xs font-medium hover:border-neutral-700 transition-colors">
              <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Cenários</span>
            </button>
            <div className="absolute right-0 mt-1 w-56 bg-neutral-900 border border-neutral-800 rounded-xl p-2 shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all space-y-1">
              <div className="text-[10px] font-bold text-neutral-400 uppercase px-2 py-1">
                Trocar Fundo do Grid
              </div>
              {mapPresets.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => onUpdateMap({ bgUrl: p.url, lighting: p.lighting as any })}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-neutral-800 text-neutral-200 hover:text-amber-300 transition-colors flex items-center justify-between"
                >
                  <span>{p.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Zoom Controls */}
        <div className="flex items-center bg-neutral-900/90 backdrop-blur border border-neutral-800 rounded-xl p-0.5 sm:p-1 shadow-lg gap-0.5">
          <button
            onClick={() => handleZoomOut()}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
            title="Reduzir Zoom (- ou Scroll para Baixo)"
          >
            <ZoomOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          <button
            onClick={handleResetZoom}
            className="px-1.5 sm:px-2 py-1 text-[11px] sm:text-xs font-mono text-neutral-300 hover:text-amber-400 hover:bg-neutral-800/80 rounded-md transition-colors"
            title="Clique para Redefinir Zoom para 100%"
          >
            {Math.round(zoom * 100)}%
          </button>

          <button
            onClick={() => handleZoomIn()}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
            title="Aumentar Zoom (+ ou Scroll para Cima)"
          >
            <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          <div className="w-px h-4 bg-neutral-800 mx-0.5" />

          {/* Reset Zoom (100%) Button */}
          <button
            onClick={handleResetZoom}
            className="flex items-center gap-1 p-1.5 sm:px-2 sm:py-1 text-neutral-400 hover:text-amber-300 hover:bg-neutral-800 rounded-lg transition-colors"
            title="Redefinir Zoom para 100% (Tecla 0)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden lg:inline text-[10px] font-semibold">100%</span>
          </button>

          {/* Fit to Screen Button */}
          <button
            onClick={handleFitToScreen}
            className="p-1.5 text-neutral-400 hover:text-amber-300 hover:bg-neutral-800 rounded-lg transition-colors"
            title="Ajustar Mapa à Tela (Enquadrar Grid)"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Interactive Grid Stage */}
      <div
        ref={containerRef}
        onMouseDown={(e) => {
          if (
            e.button === 1 ||
            isSpacePressed ||
            e.target === containerRef.current ||
            (e.target as HTMLElement).classList.contains("grid-board")
          ) {
            setIsPanning(true);
            setPanStart({ x: e.clientX, y: e.clientY });
          }
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`flex-1 w-full h-full relative overflow-hidden bg-neutral-950 ${
          isPanning
            ? "cursor-grabbing"
            : isSpacePressed
            ? "cursor-grab"
            : activeTool === "select"
            ? "cursor-default"
            : "cursor-crosshair"
        }`}
      >
        <div
          className="grid-board absolute transition-transform duration-75"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
            width: map.gridWidth * gridSize,
            height: map.gridHeight * gridSize,
          }}
        >
          {/* Background Map Image */}
          {map.bgUrl && (
            <img
              src={map.bgUrl}
              alt="Cenário de Batalha"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none rounded-lg opacity-80"
            />
          )}

          {/* Grid Canvas Lines */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(255, 255, 255, 0.08) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(255, 255, 255, 0.08) 1px, transparent 1px)
              `,
              backgroundSize: `${gridSize}px ${gridSize}px`,
            }}
          />

          {/* Grid Cells (for clicking / fog of war / pinging) */}
          <div
            className="absolute inset-0 grid"
            style={{
              gridTemplateColumns: `repeat(${map.gridWidth}, ${gridSize}px)`,
              gridTemplateRows: `repeat(${map.gridHeight}, ${gridSize}px)`,
            }}
          >
            {Array.from({ length: map.gridHeight }).map((_, y) =>
              Array.from({ length: map.gridWidth }).map((_, x) => {
                const cellKey = `${x},${y}`;
                const isRevealed = !map.fogOfWar || map.revealedCells.includes(cellKey);

                return (
                  <div
                    key={cellKey}
                    onClick={() => handleCellClick(x, y)}
                    className={`relative border border-white/5 transition-colors ${
                      !isRevealed
                        ? "bg-black/95 backdrop-blur-sm z-10"
                        : "hover:bg-amber-500/10 cursor-pointer"
                    }`}
                  >
                    {/* Measurement Line Overlay */}
                    {measureStart && measureCurrent && (
                      <span className="sr-only">Régua ativa</span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Measurement Distance Line */}
          {measureStart && measureCurrent && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
              <line
                x1={measureStart.x * gridSize + gridSize / 2}
                y1={measureStart.y * gridSize + gridSize / 2}
                x2={measureCurrent.x * gridSize + gridSize / 2}
                y2={measureCurrent.y * gridSize + gridSize / 2}
                stroke="#eab308"
                strokeWidth="3"
                strokeDasharray="6 4"
              />
              {/* Distance badge */}
              <g
                transform={`translate(${
                  ((measureStart.x + measureCurrent.x) / 2) * gridSize + gridSize / 2
                }, ${((measureStart.y + measureCurrent.y) / 2) * gridSize})`}
              >
                <rect
                  x="-45"
                  y="-14"
                  width="90"
                  height="22"
                  rx="6"
                  fill="#000000"
                  fillOpacity="0.85"
                  stroke="#eab308"
                />
                <text
                  x="0"
                  y="2"
                  fill="#fbbf24"
                  fontSize="12"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {Math.round(
                    Math.hypot(measureCurrent.x - measureStart.x, measureCurrent.y - measureStart.y) * 1.5
                  )}
                  m (
                  {Math.round(
                    Math.hypot(measureCurrent.x - measureStart.x, measureCurrent.y - measureStart.y)
                  )}{" "}
                  quads)
                </text>
              </g>
            </svg>
          )}

          {/* Pings */}
          {map.pings &&
            map.pings.map((ping) => (
              <div
                key={ping.id}
                className="absolute pointer-events-none z-30 flex flex-col items-center justify-center -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: ping.x * gridSize + gridSize / 2,
                  top: ping.y * gridSize + gridSize / 2,
                }}
              >
                <div
                  className="w-12 h-12 rounded-full border-2 animate-ping"
                  style={{ borderColor: ping.color }}
                />
                <span className="text-[10px] font-bold bg-neutral-900 text-white px-2 py-0.5 rounded-full border border-neutral-700 shadow mt-1">
                  {ping.sender}
                </span>
              </div>
            ))}

          {/* Tokens Layer */}
          {tokens.map((token) => {
            const isSelected = token.id === selectedTokenId;
            const isTurnActive = token.id === currentTurnTokenId;
            const hpPercent = Math.max(0, Math.min(100, (token.hp / token.maxHp) * 100));

            return (
              <div
                key={token.id}
                onMouseDown={(e) => handleTokenMouseDown(e, token)}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedTokenId(token.id);
                }}
                className={`absolute z-20 cursor-grab active:cursor-grabbing transition-transform flex flex-col items-center justify-center group`}
                style={{
                  left: token.x * gridSize,
                  top: token.y * gridSize,
                  width: token.size * gridSize,
                  height: token.size * gridSize,
                }}
              >
                {/* Health Bar above token */}
                <div className="absolute -top-3 w-10/12 bg-neutral-950/90 rounded-full h-1.5 border border-neutral-800 overflow-hidden shadow">
                  <div
                    className={`h-full transition-all duration-200 ${
                      hpPercent > 50
                        ? "bg-emerald-500"
                        : hpPercent > 20
                        ? "bg-amber-500"
                        : "bg-red-600 animate-pulse"
                    }`}
                    style={{ width: `${hpPercent}%` }}
                  />
                </div>

                {/* Token Circular Avatar Disc */}
                <div
                  className={`relative w-10/12 h-10/12 rounded-full overflow-hidden border-2 shadow-2xl transition-all ${
                    isTurnActive
                      ? "ring-4 ring-amber-400 ring-offset-2 ring-offset-neutral-950 scale-105"
                      : isSelected
                      ? "ring-2 ring-blue-400 ring-offset-1 ring-offset-neutral-950"
                      : "hover:scale-105"
                  }`}
                  style={{ borderColor: token.color || "#eab308" }}
                >
                  <img
                    src={token.avatar || "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=150&auto=format&fit=crop&q=80"}
                    alt={token.name}
                    className="w-full h-full object-cover pointer-events-none"
                  />

                  {/* 3D Mini Badge */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setInspected3DToken(token);
                    }}
                    title="Ver em 3D"
                    className="absolute bottom-0 inset-x-0 bg-neutral-950/80 hover:bg-amber-600 text-neutral-300 hover:text-neutral-950 text-[8px] font-bold py-0.5 flex items-center justify-center gap-0.5 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Box className="w-2.5 h-2.5" />
                    3D
                  </button>
                </div>

                {/* Name Label */}
                <span className="absolute -bottom-4 bg-neutral-950/90 text-neutral-200 text-[10px] font-medium px-2 py-0.5 rounded-md border border-neutral-800 whitespace-nowrap shadow pointer-events-none max-w-[120px] truncate">
                  {token.name}
                </span>

                {/* Active Conditions Icons */}
                {token.conditions.length > 0 && (
                  <div className="absolute -right-2 top-0 flex flex-col gap-0.5">
                    {token.conditions.slice(0, 2).map((c, idx) => (
                      <span
                        key={idx}
                        className="w-3.5 h-3.5 bg-red-600 border border-white text-white rounded-full text-[8px] flex items-center justify-center font-bold"
                        title={c}
                      >
                        !
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Right Map Navigation Tips */}
      <div className="hidden md:flex absolute bottom-3 right-3 z-20 items-center gap-2 px-2.5 py-1 bg-neutral-900/80 backdrop-blur-sm border border-neutral-800/80 rounded-xl text-[10px] text-neutral-400 select-none pointer-events-none">
        <span className="flex items-center gap-1">
          <kbd className="px-1 py-0.5 bg-neutral-800 text-neutral-300 rounded font-mono font-bold">Scroll</kbd> Zoom
        </span>
        <span className="text-neutral-600">•</span>
        <span className="flex items-center gap-1">
          <kbd className="px-1 py-0.5 bg-neutral-800 text-neutral-300 rounded font-mono font-bold">Espaço</kbd> Mover
        </span>
        <span className="text-neutral-600">•</span>
        <span className="flex items-center gap-1">
          <kbd className="px-1 py-0.5 bg-neutral-800 text-neutral-300 rounded font-mono font-bold">0</kbd> Reset (100%)
        </span>
      </div>

      {/* Selected Token Quick Floating Action Panel */}
      {selectedToken && (
        <div className="absolute bottom-16 sm:bottom-4 left-3 right-3 sm:right-auto sm:left-4 z-30 bg-neutral-900/95 backdrop-blur-md border border-neutral-800 p-3 sm:p-4 rounded-2xl shadow-2xl flex flex-wrap sm:flex-nowrap items-center justify-between sm:justify-start gap-3 sm:gap-4 animate-in slide-in-from-bottom-2 max-w-full sm:max-w-xl">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 flex-shrink-0"
              style={{ borderColor: selectedToken.color || "#eab308" }}
            >
              <img
                src={selectedToken.avatar || "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=150&auto=format&fit=crop&q=80"}
                alt={selectedToken.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="text-xs font-bold font-serif text-amber-200 flex items-center gap-1.5 sm:gap-2">
                <span className="truncate max-w-[110px] sm:max-w-[160px]">{selectedToken.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 bg-neutral-800 text-neutral-400 rounded-md font-sans">
                  CA: {selectedToken.ac || 10}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-neutral-400 flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 text-red-400" />
                  <span className="font-bold text-red-200">
                    {selectedToken.hp} / {selectedToken.maxHp}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="hidden sm:block h-8 w-px bg-neutral-800" />

          {/* Quick HP adjust */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleDamageHeal(selectedToken.id, -5)}
              className="px-2 py-1 bg-red-950/80 hover:bg-red-900 border border-red-800/60 text-red-200 rounded-lg text-xs font-bold transition-colors"
            >
              -5
            </button>
            <button
              onClick={() => handleDamageHeal(selectedToken.id, -1)}
              className="px-2 py-1 bg-red-950/80 hover:bg-red-900 border border-red-800/60 text-red-200 rounded-lg text-xs font-bold transition-colors"
            >
              -1
            </button>
            <button
              onClick={() => handleDamageHeal(selectedToken.id, +1)}
              className="px-2 py-1 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800/60 text-emerald-200 rounded-lg text-xs font-bold transition-colors"
            >
              +1
            </button>
            <button
              onClick={() => handleDamageHeal(selectedToken.id, +5)}
              className="px-2 py-1 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800/60 text-emerald-200 rounded-lg text-xs font-bold transition-colors"
            >
              +5
            </button>
          </div>

          <div className="hidden sm:block h-8 w-px bg-neutral-800" />

          {/* 3D View and Delete */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setInspected3DToken(selectedToken)}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-semibold transition-all"
            >
              <Box className="w-3.5 h-3.5" />
              <span>3D</span>
            </button>

            {userRole === "gm" && (
              <button
                onClick={() => handleDeleteToken(selectedToken.id)}
                className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-red-950/40 rounded-xl transition-colors"
                title="Remover Token"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3D Miniature Modal */}
      {inspected3DToken && (
        <Token3DModal
          token={inspected3DToken}
          onClose={() => setInspected3DToken(null)}
          onUpdateToken={(updated) => {
            onUpdateTokens(
              tokens.map((t) => (t.id === inspected3DToken.id ? { ...t, ...updated } : t))
            );
          }}
        />
      )}

      {/* Add Token Modal */}
      {showAddTokenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold font-serif text-amber-100">Criar Novo Token de Batalha</h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-neutral-400 font-semibold uppercase">Nome do Token</label>
                <input
                  type="text"
                  value={newTokenName}
                  onChange={(e) => setNewTokenName(e.target.value)}
                  placeholder="Ex: Guerreiro Espectral / Cultista / Zumbi"
                  className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-neutral-400 font-semibold uppercase">Tipo</label>
                  <select
                    value={newTokenType}
                    onChange={(e) => setNewTokenType(e.target.value as any)}
                    className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="enemy">Inimigo</option>
                    <option value="boss">Chefe (Tamanho 2x2)</option>
                    <option value="hero">Herói / Jogador</option>
                    <option value="npc">NPC Aliado</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-neutral-400 font-semibold uppercase">Pontos de Vida (HP)</label>
                  <input
                    type="number"
                    value={newTokenHp}
                    onChange={(e) => setNewTokenHp(parseInt(e.target.value, 10) || 10)}
                    className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-neutral-400 font-semibold uppercase">URL do Avatar / Imagem (Opcional)</label>
                <input
                  type="text"
                  value={newTokenAvatar}
                  onChange={(e) => setNewTokenAvatar(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
              <button
                onClick={() => setShowAddTokenModal(false)}
                className="px-4 py-2 text-neutral-400 hover:text-white text-xs font-semibold rounded-xl hover:bg-neutral-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddToken}
                className="px-5 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-neutral-950 text-xs font-bold rounded-xl shadow"
              >
                Adicionar ao Mapa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
