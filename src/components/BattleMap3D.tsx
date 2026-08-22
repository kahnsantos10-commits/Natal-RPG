import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { MapData, MapToken, RPGSystem, UserRole } from "../types";
import {
  Compass,
  Eye,
  Plus,
  Minus,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Footprints,
  Layers,
  RotateCcw,
  Sparkles,
  UserCheck,
  Mountain,
  Waves,
  Maximize2,
  Minimize2,
  Crosshair,
  Volume2
} from "lucide-react";
import { rpgAudio } from "../utils/audioSynth";
import { BattleMap } from "./BattleMap";

interface BattleMap3DProps {
  map: MapData;
  tokens: MapToken[];
  system: RPGSystem;
  userRole: UserRole;
  currentTurnTokenId?: string;
  onUpdateTokens: (tokens: MapToken[]) => void;
  onUpdateMap: (map: Partial<MapData>) => void;
  onSelectTokenForRoll?: (token: MapToken) => void;
  onUndo?: () => void;
  canUndo?: boolean;
  onSaveSnapshot?: (description: string) => void;
  onFallbackTo2D?: () => void;
}

export const BattleMap3D: React.FC<BattleMap3DProps> = ({
  map,
  tokens,
  system,
  userRole,
  currentTurnTokenId,
  onUpdateTokens,
  onUpdateMap,
  onSelectTokenForRoll,
  onUndo,
  canUndo,
  onSaveSnapshot,
  onFallbackTo2D,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // 2D Fallback State
  const [fallbackTriggered, setFallbackTriggered] = useState(false);
  const [fallbackReason, setFallbackReason] = useState("");

  // FPV Mode State
  const [isFirstPerson, setIsFirstPerson] = useState(false);
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(
    currentTurnTokenId || tokens[0]?.id || null
  );

  // Elevation Reliefs State (cell key "x,y" => height level -2..4)
  const [cellElevations, setCellElevations] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    const w = map.gridWidth || 20;
    const h = map.gridHeight || 20;

    for (let x = 0; x < w; x++) {
      for (let y = 0; y < h; y++) {
        if (x === 0 || y === 0 || x === w - 1 || y === h - 1) {
          initial[`${x},${y}`] = 2; // Perimeter stone wall
        } else if (x >= 8 && x <= 11 && y >= 8 && y <= 11) {
          initial[`${x},${y}`] = 1; // Center raised altar
        } else if ((x === 4 || x === 15) && y === 10) {
          initial[`${x},${y}`] = 3; // Pillars
        } else if (x === 5 && y === 5) {
          initial[`${x},${y}`] = -1; // Pit / Water
        } else {
          initial[`${x},${y}`] = 0;
        }
      }
    }
    return initial;
  });

  // Selected cell for elevation adjustment
  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number } | null>(null);
  const [reliefMode, setReliefMode] = useState<"elevate" | "lower" | "water" | "wall" | "reset">("elevate");

  // First person view position & rotation state
  const [fpGridPos, setFpGridPos] = useState<{ x: number; y: number }>({
    x: tokens[0]?.x || 5,
    y: tokens[0]?.y || 5,
  });
  const [fpYaw, setFpYaw] = useState(0); // Horizontal Yaw angle
  const [fpPitch, setFpPitch] = useState(0); // Pitch angle

  // Three.js Scene Refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const worldGroupRef = useRef<THREE.Group | null>(null);
  const torchLightsRef = useRef<THREE.PointLight[]>([]);
  const tilesMeshMapRef = useRef<Map<string, THREE.Mesh>>(new Map());

  // Camera Orbit Controls State
  const [orbitAngle, setOrbitAngle] = useState(Math.PI / 4);
  const [orbitPitch, setOrbitPitch] = useState(Math.PI / 3);
  const [orbitDistance, setOrbitDistance] = useState(24);
  const isDraggingOrbit = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });

  const selectedToken = tokens.find((t) => t.id === selectedTokenId) || tokens[0];

  // Synchronize FPV Camera position whenever selected Token changes
  useEffect(() => {
    if (selectedToken) {
      setFpGridPos({ x: selectedToken.x, y: selectedToken.y });
    }
  }, [selectedTokenId, selectedToken?.x, selectedToken?.y]);

  // Keyboard navigation for WASD / Arrow keys in FPV
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isFirstPerson) return;
      if (["ArrowUp", "KeyW"].includes(e.code)) handleFpStep("forward");
      if (["ArrowDown", "KeyS"].includes(e.code)) handleFpStep("backward");
      if (["ArrowLeft", "KeyA"].includes(e.code)) handleFpStep("left");
      if (["ArrowRight", "KeyD"].includes(e.code)) handleFpStep("right");
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFirstPerson, selectedTokenId, tokens]);

  // 1. Check WebGL support on mount
  useEffect(() => {
    const checkWebGL = () => {
      try {
        const canvas = document.createElement("canvas");
        return !!(
          window.WebGLRenderingContext &&
          (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
        );
      } catch (e) {
        return false;
      }
    };

    if (!checkWebGL()) {
      setFallbackReason("Seu dispositivo ou navegador não suporta aceleração gráfica 3D (WebGL).");
      setFallbackTriggered(true);
      if (onFallbackTo2D) {
        onFallbackTo2D();
      }
    }
  }, [onFallbackTo2D]);

  // Three.js Render Loop
  useEffect(() => {
    if (fallbackTriggered) return;
    if (!mountRef.current) return;

    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene setup based on map lighting/atmosphere
    let ambientColor = 0xffffff;
    let ambientIntensity = 0.65;
    let dirColor = 0xfef08a;
    let dirIntensity = 1.3;
    let fogColor = 0x0a0b10;
    let fogDensity = isFirstPerson ? 0.03 : 0.012;

    if (map.lighting === "dim") {
      ambientColor = 0xcc8855; // warm candlelight tint
      ambientIntensity = 0.45;
      dirColor = 0xffaa66;
      dirIntensity = 0.75;
      fogColor = 0x140e0b;
    } else if (map.lighting === "dark") {
      ambientColor = 0x222255; // deep midnight blue
      ambientIntensity = 0.25;
      dirColor = 0x3b82f6; // cool moonlight
      dirIntensity = 0.35;
      fogColor = 0x030308;
    } else if (map.lighting === "paranormal_fog") {
      ambientColor = 0x114422; // ghostly green glow
      ambientIntensity = 0.4;
      dirColor = 0x10b981; // emerald dir light
      dirIntensity = 0.65;
      fogColor = 0x041008;
      fogDensity = isFirstPerson ? 0.05 : 0.025; // denser fog
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(fogColor);
    scene.fog = new THREE.FogExp2(fogColor, fogDensity);
    sceneRef.current = scene;

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);
    cameraRef.current = camera;

    // 3. Renderer setup
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch (err) {
      console.error("WebGL Renderer creation failed:", err);
      setFallbackReason("Falha ao inicializar o renderizador 3D do mapa. Seu dispositivo pode estar sem memória de vídeo.");
      setFallbackTriggered(true);
      if (onFallbackTo2D) {
        onFallbackTo2D();
      }
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(ambientColor, ambientIntensity);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(dirColor, dirIntensity);
    dirLight.position.set(18, 32, 22);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    // World Group
    const worldGroup = new THREE.Group();
    scene.add(worldGroup);
    worldGroupRef.current = worldGroup;

    // Grid Dimensions
    const gridW = map.gridWidth || 20;
    const gridH = map.gridHeight || 20;

    // Render Ground Plane with Map Texture or fallback Grid
    const groundGeo = new THREE.PlaneGeometry(gridW, gridH);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x999999,
      roughness: 0.8,
      metalness: 0.1,
      side: THREE.DoubleSide
    });

    if (map.bgUrl) {
      const loader = new THREE.TextureLoader();
      loader.setCrossOrigin("anonymous");
      loader.load(
        map.bgUrl,
        (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          groundMat.map = texture;
          groundMat.color.setHex(0xffffff); // Clear base color tint
          groundMat.needsUpdate = true;
        },
        undefined,
        (err) => {
          console.warn("Failed to load map texture in 3D, using default terrain:", err);
        }
      );
    } else {
      // Fallback elegant deep indigo space grid background
      groundMat.color.setHex(0x111827);
    }

    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.set(0, -0.01, 0); // slightly below 0 so tokens/pillars sit nicely on top
    groundMesh.receiveShadow = true;
    worldGroup.add(groundMesh);

    // Tactical Grid Helper Overlay on top of map texture
    const gridHelper = new THREE.GridHelper(gridW, gridW, 0xffffff, 0x444444);
    gridHelper.position.set(0, 0.01, 0);
    if (gridHelper.material) {
      const gMat = gridHelper.material as THREE.Material;
      gMat.transparent = true;
      gMat.opacity = 0.35;
    }
    worldGroup.add(gridHelper);

    // Render Tiles & Relief Heights
    tilesMeshMapRef.current.clear();
    torchLightsRef.current = [];

    for (let x = 0; x < gridW; x++) {
      for (let y = 0; y < gridH; y++) {
        const cellKey = `${x},${y}`;
        const hLevel = cellElevations[cellKey] || 0;
        const cellY = hLevel * 0.8;

        // Skip rendering charcoal boxes for flat ground (hLevel === 0)
        // so that the beautiful map image is completely visible!
        if (hLevel === 0) {
          continue;
        }

        const tileHeight = Math.max(0.2, hLevel > 0 ? hLevel * 0.8 + 0.2 : 0.2);
        const boxGeo = new THREE.BoxGeometry(0.96, tileHeight, 0.96);

        let tileColor = 0x262626;
        if (hLevel === 1) tileColor = 0x3f3f46;
        if (hLevel === 2) tileColor = 0x52525b;
        if (hLevel >= 3) tileColor = 0x71717a;
        if (hLevel < 0) tileColor = 0x1d4ed8; // Pit / Water

        const tileMat = new THREE.MeshStandardMaterial({
          color: tileColor,
          roughness: hLevel < 0 ? 0.1 : 0.6,
          metalness: hLevel < 0 ? 0.8 : 0.2,
          transparent: hLevel < 0,
          opacity: hLevel < 0 ? 0.75 : 1.0,
        });

        const tileMesh = new THREE.Mesh(boxGeo, tileMat);
        const posY = hLevel < 0 ? -0.2 : (tileHeight / 2) - 0.1;
        tileMesh.position.set(x - gridW / 2 + 0.5, posY, y - gridH / 2 + 0.5);
        tileMesh.castShadow = true;
        tileMesh.receiveShadow = true;
        tileMesh.userData = { gridX: x, gridY: y, elevation: hLevel };

        worldGroup.add(tileMesh);
        tilesMeshMapRef.current.set(cellKey, tileMesh);

        // Torch Light Props on High Pillars / Walls (Nível >= 2)
        if (hLevel >= 2) {
          const torchGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.7, 8);
          const torchMat = new THREE.MeshStandardMaterial({ color: 0x78350f });
          const torchMesh = new THREE.Mesh(torchGeo, torchMat);
          torchMesh.position.set(x - gridW / 2 + 0.5, cellY + 0.35, y - gridH / 2 + 0.5);
          worldGroup.add(torchMesh);

          const flameGeo = new THREE.SphereGeometry(0.12, 8, 8);
          const flameMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
          const flameMesh = new THREE.Mesh(flameGeo, flameMat);
          flameMesh.position.set(x - gridW / 2 + 0.5, cellY + 0.75, y - gridH / 2 + 0.5);
          worldGroup.add(flameMesh);

          const pLight = new THREE.PointLight(0xf59e0b, 1.4, 6);
          pLight.position.set(x - gridW / 2 + 0.5, cellY + 0.8, y - gridH / 2 + 0.5);
          worldGroup.add(pLight);
          torchLightsRef.current.push(pLight);
        }
      }
    }

    // Render 3D Tokens on relief surface
    tokens.forEach((tok) => {
      const hLevel = cellElevations[`${tok.x},${tok.y}`] || 0;
      const tokZ = tok.z || 0;
      const cellY = Math.max(-1.6, hLevel * 0.8) + tokZ * 0.8;

      const tokenGroup = new THREE.Group();
      tokenGroup.position.set(
        tok.x - gridW / 2 + 0.5,
        cellY + 0.05,
        tok.y - gridH / 2 + 0.5
      );

      const isSelected = tok.id === selectedTokenId;
      const isTurn = tok.id === currentTurnTokenId;
      const tokHex = parseInt((tok.color || "#eab308").replace("#", "0x"), 16) || 0xeab308;

      // Vertical Stacking / Flight Beam Indicator
      if (tokZ > 0) {
        const beamGeo = new THREE.CylinderGeometry(0.08, 0.08, tokZ * 0.8, 12);
        const beamMat = new THREE.MeshBasicMaterial({
          color: tokHex,
          transparent: true,
          opacity: 0.4,
        });
        const beamMesh = new THREE.Mesh(beamGeo, beamMat);
        beamMesh.position.y = -(tokZ * 0.8) / 2;
        tokenGroup.add(beamMesh);
      }

      // Pedestal Base based on tok.model3D pedestal style
      let baseHex = tokHex;
      let emissiveHex = 0x000000;
      let metalnessVal = 0.8;
      let roughnessVal = 0.2;

      const pStyle = tok.model3D || "gold";
      if (pStyle === "paranormal") {
        baseHex = 0x8b5cf6;
        emissiveHex = 0x4c1d95;
      } else if (pStyle === "obsidian") {
        baseHex = 0x18181b;
        emissiveHex = 0xdc2626;
      } else if (pStyle === "arcane") {
        baseHex = 0x2563eb;
        emissiveHex = 0x1e40af;
      } else if (pStyle === "gold" || !tok.model3D) {
        baseHex = 0xd97706; // Gorgeous rich amber gold
        emissiveHex = 0x78350f;
      }

      // Pedestal Base
      const baseGeo = new THREE.CylinderGeometry(0.42, 0.45, 0.16, 24);
      const baseMat = new THREE.MeshStandardMaterial({
        color: baseHex,
        roughness: roughnessVal,
        metalness: metalnessVal,
        emissive: emissiveHex,
        emissiveIntensity: isTurn ? 0.8 : isSelected ? 0.5 : 0.2,
      });
      const baseMesh = new THREE.Mesh(baseGeo, baseMat);
      baseMesh.position.y = 0.08;
      baseMesh.castShadow = true;
      tokenGroup.add(baseMesh);

      // Token Standee Card (Thin card displaying the actual Avatar Artwork)
      const cardGeo = new THREE.BoxGeometry(0.72, 0.72, 0.04);
      const cardMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.5,
        metalness: 0.1,
      });

      if (tok.avatar) {
        const loader = new THREE.TextureLoader();
        loader.setCrossOrigin("anonymous");
        loader.load(
          tok.avatar,
          (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace;
            cardMat.map = texture;
            cardMat.needsUpdate = true;
          },
          undefined,
          (err) => {
            console.warn("Failed to load token avatar texture in 3D:", err);
            cardMat.color.setHex(tokHex);
          }
        );
      } else {
        cardMat.color.setHex(tokHex);
      }

      const cardMesh = new THREE.Mesh(cardGeo, cardMat);
      cardMesh.position.y = 0.52; // Centered above pedestal
      cardMesh.castShadow = true;
      cardMesh.receiveShadow = true;
      tokenGroup.add(cardMesh);

      // Active Selection or Turn Aura Ring
      if (isSelected || isTurn) {
        const ringGeo = new THREE.TorusGeometry(0.55, 0.04, 16, 32);
        const ringMat = new THREE.MeshBasicMaterial({
          color: isTurn ? 0xf59e0b : 0x3b82f6,
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = Math.PI / 2;
        ringMesh.position.y = 0.18;
        tokenGroup.add(ringMesh);
      }

      // Floating Status Orbs for applied conditions
      if (tok.conditions && tok.conditions.length > 0) {
        tok.conditions.forEach((cond, idx) => {
          const orbGeo = new THREE.SphereGeometry(0.06, 12, 12);
          const colors: Record<string, number> = {
            sangrando: 0xef4444,
            atordoado: 0xf59e0b,
            abençoado: 0x10b981,
            abencoado: 0x10b981,
            envenenado: 0xa855f7,
            caído: 0x6b7280,
            caido: 0x6b7280,
            invisível: 0x3b82f6,
            invisivel: 0x3b82f6,
          };
          const orbColor = colors[cond.toLowerCase()] || 0xeab308;
          const orbMat = new THREE.MeshStandardMaterial({
            color: orbColor,
            roughness: 0.1,
            metalness: 0.9,
            emissive: orbColor,
            emissiveIntensity: 0.8
          });
          const orbMesh = new THREE.Mesh(orbGeo, orbMat);
          
          // Position them orbiting above the card standee (around Y = 0.98)
          const angle = (idx / tok.conditions.length) * Math.PI * 2;
          orbMesh.position.set(Math.cos(angle) * 0.32, 0.98, Math.sin(angle) * 0.32);
          tokenGroup.add(orbMesh);
        });
      }

      worldGroup.add(tokenGroup);
    });

    // Animation Loop
    let animId: number;
    const clock = new THREE.Clock();

    // FPS Detection tracking variables
    let frameCount = 0;
    let lastTime = performance.now();
    const warmupEndTime = performance.now() + 2500; // 2.5s warmup
    let consecutiveLowFps = 0;
    const LOW_FPS_THRESHOLD = 20; // FPS below 20 is low performance
    const CONSECUTIVE_LOW_THRESHOLD = 3; // Trigger after 3 samples of low performance

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Flickering torches
      torchLightsRef.current.forEach((pl, idx) => {
        pl.intensity = 1.2 + Math.sin(elapsedTime * 8 + idx) * 0.35;
      });

      // Update Camera Position depending on View Mode
      if (isFirstPerson && selectedToken) {
        // FPV Eye Level Mode attached to Selected Token
        const curH = (cellElevations[`${selectedToken.x},${selectedToken.y}`] || 0) + (selectedToken.z || 0);
        const eyeY = Math.max(-1.6, curH * 0.8) + 1.25;

        const camX = selectedToken.x - gridW / 2 + 0.5;
        const camZ = selectedToken.y - gridH / 2 + 0.5;

        camera.position.set(camX, eyeY, camZ);

        // Calculate 3D look vector from yaw and pitch
        const lookTargetX = camX + Math.sin(fpYaw) * Math.cos(fpPitch) * 5;
        const lookTargetY = eyeY + Math.sin(fpPitch) * 5;
        const lookTargetZ = camZ - Math.cos(fpYaw) * Math.cos(fpPitch) * 5;

        camera.lookAt(lookTargetX, lookTargetY, lookTargetZ);
      } else {
        // 3D Orbital Camera
        const camX = Math.sin(orbitAngle) * Math.cos(orbitPitch) * orbitDistance;
        const camY = Math.sin(orbitPitch) * orbitDistance + 2;
        const camZ = Math.cos(orbitAngle) * Math.cos(orbitPitch) * orbitDistance;

        camera.position.set(camX, camY, camZ);
        camera.lookAt(0, 0, 0);
      }

      renderer.render(scene, camera);

      // --- Performance Monitoring ---
      const now = performance.now();
      frameCount++;
      if (now - lastTime >= 1000) {
        const fps = (frameCount * 1000) / (now - lastTime);
        frameCount = 0;
        lastTime = now;

        // Perform check only after warm-up
        if (now > warmupEndTime) {
          if (fps < LOW_FPS_THRESHOLD) {
            consecutiveLowFps++;
            if (consecutiveLowFps >= CONSECUTIVE_LOW_THRESHOLD) {
              console.warn(`[BattleMap3D] Low performance detected: ${fps.toFixed(1)} FPS. Activating 2D Fallback.`);
              setFallbackReason(`Baixo desempenho de renderização detectado (${fps.toFixed(0)} FPS). Alternando para o mapa 2D...`);
              setFallbackTriggered(true);
              if (onFallbackTo2D) {
                onFallbackTo2D();
              }
            }
          } else {
            consecutiveLowFps = 0;
          }
        }
      }
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [map, tokens, cellElevations, isFirstPerson, selectedTokenId, selectedToken?.x, selectedToken?.y, selectedToken?.z, fpYaw, fpPitch, orbitAngle, orbitPitch, orbitDistance, currentTurnTokenId, fallbackTriggered, onFallbackTo2D]);

  // Handle Mouse Zoom on Orbit Mode
  const handleWheel = (e: React.WheelEvent) => {
    if (isFirstPerson) return;
    setOrbitDistance((prev) => Math.max(8, Math.min(60, prev + e.deltaY * 0.02)));
  };

  // Mouse Drag for Camera Rotation
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingOrbit.current = true;
    dragStartPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingOrbit.current) return;
    const deltaX = e.clientX - dragStartPos.current.x;
    const deltaY = e.clientY - dragStartPos.current.y;
    dragStartPos.current = { x: e.clientX, y: e.clientY };

    if (isFirstPerson) {
      // Look around in FPV (yaw + pitch)
      setFpYaw((prev) => prev - deltaX * 0.005);
      setFpPitch((prev) => Math.max(-Math.PI / 3, Math.min(Math.PI / 3, prev - deltaY * 0.005)));
    } else {
      // Orbit camera rotation
      setOrbitAngle((prev) => prev - deltaX * 0.008);
      setOrbitPitch((prev) => Math.max(0.1, Math.min(Math.PI / 2 - 0.05, prev + deltaY * 0.008)));
    }
  };

  const handleMouseUp = () => {
    isDraggingOrbit.current = false;
  };

  // First Person Step Controls (WASD / D-Pad)
  const handleFpStep = (dir: "forward" | "backward" | "left" | "right") => {
    rpgAudio.playTokenMove();
    const gridW = map.gridWidth || 20;
    const gridH = map.gridHeight || 20;

    if (!selectedToken) return;

    let dx = 0;
    let dy = 0;

    if (dir === "forward") dy = -1;
    if (dir === "backward") dy = 1;
    if (dir === "left") dx = -1;
    if (dir === "right") dx = 1;

    const nextX = Math.max(0, Math.min(gridW - 1, selectedToken.x + dx));
    const nextY = Math.max(0, Math.min(gridH - 1, selectedToken.y + dy));

    setFpGridPos({ x: nextX, y: nextY });

    // Update selected token on global map state
    onUpdateTokens(
      tokens.map((t) => (t.id === selectedToken.id ? { ...t, x: nextX, y: nextY } : t))
    );
  };

  // Modify Terrain Elevation for a Cell
  const handleModifyElevation = (targetX: number, targetY: number, delta: number) => {
    const cellKey = `${targetX},${targetY}`;
    const curElev = cellElevations[cellKey] || 0;
    const newElev = Math.max(-2, Math.min(6, curElev + delta));

    if (onSaveSnapshot) {
      onSaveSnapshot(`Alterar Relevo do Terreno em (${targetX},${targetY}) para nível ${newElev}`);
    }

    setCellElevations((prev) => ({
      ...prev,
      [cellKey]: newElev,
    }));
    rpgAudio.playTokenMove();
  };

  // Modify Selected Token Z Coordinate (Vertical Altitude / Stacking)
  const handleUpdateTokenZ = (newZ: number) => {
    if (!selectedToken) return;
    const clampedZ = Math.max(-2, Math.min(10, newZ));
    const updatedTokens = tokens.map((t) =>
      t.id === selectedToken.id ? { ...t, z: clampedZ } : t
    );
    if (onSaveSnapshot) {
      onSaveSnapshot(`Alterar Altitude Z de ${selectedToken.name} para ${clampedZ}`);
    }
    onUpdateTokens(updatedTokens);
    rpgAudio.playTokenMove();
  };

  // Preset elevation for current selected token location or hovered cell
  const handleApplyPresetRelief = (preset: "elevate" | "lower" | "wall" | "water" | "reset") => {
    if (!selectedToken) return;
    const { x, y } = selectedToken;
    const cellKey = `${x},${y}`;

    let targetElev = 0;
    if (preset === "elevate") targetElev = (cellElevations[cellKey] || 0) + 1;
    if (preset === "lower") targetElev = (cellElevations[cellKey] || 0) - 1;
    if (preset === "wall") targetElev = 2;
    if (preset === "water") targetElev = -1;
    if (preset === "reset") targetElev = 0;

    targetElev = Math.max(-2, Math.min(4, targetElev));

    if (onSaveSnapshot) {
      onSaveSnapshot(`Aplicar Relevo (${preset}) em (${x},${y})`);
    }

    setCellElevations((prev) => ({ ...prev, [cellKey]: targetElev }));
    rpgAudio.playTokenMove();
  };

  if (fallbackTriggered) {
    return (
      <div className="relative w-full h-full bg-neutral-950">
        <BattleMap
          map={map}
          tokens={tokens}
          system={system}
          userRole={userRole}
          currentTurnTokenId={currentTurnTokenId}
          onUpdateTokens={onUpdateTokens}
          onUpdateMap={onUpdateMap}
          onSelectTokenForRoll={onSelectTokenForRoll}
          onUndo={onUndo}
          canUndo={canUndo}
          onSaveSnapshot={onSaveSnapshot}
        />
        {/* Floating absolute performance/fallback toast banner */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 bg-neutral-900/95 border border-amber-500/50 p-4 rounded-2xl max-w-md shadow-2xl flex items-center gap-3 animate-bounce backdrop-blur-md">
          <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-left">
            <div className="text-xs font-extrabold text-neutral-100 uppercase tracking-wide">
              Modo 2D de Compatibilidade
            </div>
            <div className="text-[11px] text-neutral-400">
              {fallbackReason || "Baixo desempenho detectado! Usando o mapa 2D para garantir fluidez."}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-neutral-950 overflow-hidden select-none flex flex-col">
      {/* 3D WebGL Canvas Container */}
      <div
        ref={mountRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      />

      {/* Crosshair Overlay for FPV Mode */}
      {isFirstPerson && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
          <div className="w-4 h-4 border border-amber-400/60 rounded-full flex items-center justify-center">
            <div className="w-1 h-1 bg-amber-400 rounded-full" />
          </div>
        </div>
      )}

      {/* Top Controls Header */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* View Mode Toggle Switcher */}
        <div className="pointer-events-auto bg-neutral-900/90 border border-amber-500/40 p-1.5 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-1.5">
          <button
            onClick={() => {
              setIsFirstPerson(false);
              rpgAudio.playTokenMove();
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              !isFirstPerson
                ? "bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20 font-extrabold"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Visão 3D Orbital</span>
          </button>

          {/* Primary FPV Button from Selected Token Camera */}
          <button
            onClick={() => {
              setIsFirstPerson(true);
              rpgAudio.playSpellCast();
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${
              isFirstPerson
                ? "bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 shadow-md shadow-amber-500/30 animate-pulse"
                : "text-amber-300 hover:text-amber-100 bg-amber-950/60 border border-amber-500/40"
            }`}
            title="Alternar para a Câmera em 1ª Pessoa do Token Selecionado"
          >
            <Eye className="w-3.5 h-3.5 text-amber-400" />
            <span>Visão FPV do Token 👁️</span>
          </button>
        </div>

        {/* Selected Token Selector */}
        <div className="pointer-events-auto bg-neutral-900/90 border border-neutral-800 p-1.5 rounded-2xl shadow-xl backdrop-blur-md flex items-center gap-2">
          <span className="text-[11px] font-bold text-neutral-400 pl-2 hidden sm:inline">
            Token Ativo:
          </span>
          <select
            value={selectedTokenId || ""}
            onChange={(e) => {
              setSelectedTokenId(e.target.value);
              rpgAudio.playTokenMove();
            }}
            className="bg-neutral-950 border border-neutral-800 text-amber-300 text-xs font-bold px-2.5 py-1 rounded-xl focus:outline-none focus:border-amber-500"
          >
            {tokens.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.x},{t.y})
              </option>
            ))}
          </select>
        </div>

        {/* Controls for Elevating / Modifying Terrain Relief */}
        <div className="pointer-events-auto bg-neutral-900/90 border border-neutral-800 p-1.5 rounded-2xl shadow-xl backdrop-blur-md flex items-center gap-1">
          <div className="flex items-center gap-1 px-2 border-r border-neutral-800 text-neutral-300">
            <Mountain className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider hidden lg:inline">
              Relevo 3D ({selectedToken ? cellElevations[`${selectedToken.x},${selectedToken.y}`] || 0 : 0})
            </span>
          </div>

          <button
            onClick={() => selectedToken && handleModifyElevation(selectedToken.x, selectedToken.y, 1)}
            className="p-1.5 bg-neutral-800 hover:bg-amber-500 text-amber-300 hover:text-neutral-950 rounded-xl text-xs font-bold transition-all"
            title="Elevar Relevo do Terreno sob o Token (+1)"
          >
            <Plus className="w-4 h-4" />
          </button>

          <button
            onClick={() => selectedToken && handleModifyElevation(selectedToken.x, selectedToken.y, -1)}
            className="p-1.5 bg-neutral-800 hover:bg-amber-500 text-amber-300 hover:text-neutral-950 rounded-xl text-xs font-bold transition-all"
            title="Abaixar Relevo do Terreno sob o Token (-1)"
          >
            <Minus className="w-4 h-4" />
          </button>

          <div className="hidden sm:flex items-center gap-1 pl-1 border-l border-neutral-800">
            <button
              onClick={() => handleApplyPresetRelief("wall")}
              className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[10px] font-bold rounded-lg transition-all"
              title="Criar Muralha / Coluna Elevada (+2)"
            >
              Muralha
            </button>
            <button
              onClick={() => handleApplyPresetRelief("water")}
              className="px-2 py-1 bg-blue-950/60 hover:bg-blue-900 text-blue-300 text-[10px] font-bold rounded-lg border border-blue-800/40 transition-all"
              title="Criar Fosso / Água (-1)"
            >
              <Waves className="w-3 h-3 inline mr-0.5" />
              Fosso
            </button>
            <button
              onClick={() => handleApplyPresetRelief("reset")}
              className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 text-[10px] font-bold rounded-lg transition-all"
              title="Resetar Terreno para Plano (0)"
            >
              Plano
            </button>
          </div>
        </div>
      </div>

      {/* Floating Vertical Z-Axis Altitude & Stacking Slider Panel */}
      {selectedToken && (
        <div className="absolute top-20 right-4 z-20 w-64 bg-neutral-900/90 border border-amber-500/50 p-3.5 rounded-3xl shadow-2xl backdrop-blur-md space-y-3 pointer-events-auto animate-in fade-in slide-in-from-right-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
            <div className="flex items-center gap-1.5 text-amber-400 font-extrabold text-xs">
              <Layers className="w-4 h-4" />
              <span>Controle do Eixo Z (Altura)</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded-full border border-amber-500/30 truncate max-w-[100px]">
              {selectedToken.name}
            </span>
          </div>

          {/* Slider 1: Token Z Altitude (Voo / Empilhamento) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-neutral-300 font-bold flex items-center gap-1">
                <ArrowUp className="w-3.5 h-3.5 text-amber-400" />
                Token Z (Voo/Empilhamento)
              </span>
              <span className="text-amber-300 font-extrabold font-mono">
                {(selectedToken.z || 0) === 0
                  ? "0m (Solo)"
                  : (selectedToken.z || 0) > 0
                  ? `+${selectedToken.z}m (Voando)`
                  : `${selectedToken.z}m (Subsolo)`}
              </span>
            </div>
            <input
              type="range"
              min="-2"
              max="10"
              step="0.5"
              value={selectedToken.z || 0}
              onChange={(e) => handleUpdateTokenZ(parseFloat(e.target.value))}
              className="w-full h-2 bg-neutral-950 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            {/* Quick Presets for Token Z */}
            <div className="grid grid-cols-4 gap-1 pt-1">
              <button
                onClick={() => handleUpdateTokenZ(0)}
                className={`py-1 rounded-lg text-[10px] font-bold transition-all ${
                  (selectedToken.z || 0) === 0
                    ? "bg-amber-500 text-neutral-950"
                    : "bg-neutral-800 text-neutral-400 hover:text-neutral-200"
                }`}
              >
                Solo
              </button>
              <button
                onClick={() => handleUpdateTokenZ(2)}
                className={`py-1 rounded-lg text-[10px] font-bold transition-all ${
                  selectedToken.z === 2
                    ? "bg-amber-500 text-neutral-950"
                    : "bg-neutral-800 text-neutral-400 hover:text-neutral-200"
                }`}
              >
                +2m
              </button>
              <button
                onClick={() => handleUpdateTokenZ(5)}
                className={`py-1 rounded-lg text-[10px] font-bold transition-all ${
                  selectedToken.z === 5
                    ? "bg-amber-500 text-neutral-950"
                    : "bg-neutral-800 text-neutral-400 hover:text-neutral-200"
                }`}
              >
                +5m
              </button>
              <button
                onClick={() => handleUpdateTokenZ((selectedToken.z || 0) + 1)}
                className="py-1 rounded-lg text-[10px] font-bold bg-amber-950/60 text-amber-300 hover:bg-amber-900 border border-amber-500/30 transition-all"
                title="Empilhar +1m acima"
              >
                +Empilhar
              </button>
            </div>
          </div>

          {/* Slider 2: Terrain Cell Z Elevation */}
          <div className="space-y-1.5 border-t border-neutral-800/80 pt-2.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-neutral-300 font-bold flex items-center gap-1">
                <Mountain className="w-3.5 h-3.5 text-amber-400" />
                Terreno Z (Ponto Relevo)
              </span>
              <span className="text-amber-300 font-extrabold font-mono">
                Nível {cellElevations[`${selectedToken.x},${selectedToken.y}`] || 0}
              </span>
            </div>
            <input
              type="range"
              min="-2"
              max="6"
              step="1"
              value={cellElevations[`${selectedToken.x},${selectedToken.y}`] || 0}
              onChange={(e) => {
                const targetZ = parseInt(e.target.value);
                const currentZ = cellElevations[`${selectedToken.x},${selectedToken.y}`] || 0;
                handleModifyElevation(selectedToken.x, selectedToken.y, targetZ - currentZ);
              }}
              className="w-full h-2 bg-neutral-950 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>
        </div>
      )}

      {/* FPV Mode Active Banner */}
      {isFirstPerson && selectedToken && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 bg-neutral-900/90 border border-amber-500/60 px-4 py-2 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="w-7 h-7 rounded-full bg-amber-500 text-neutral-950 font-bold flex items-center justify-center text-xs overflow-hidden border border-amber-400">
            {selectedToken.avatar ? (
              <img src={selectedToken.avatar} alt={selectedToken.name} className="w-full h-full object-cover" />
            ) : (
              selectedToken.name.charAt(0)
            )}
          </div>
          <div>
            <div className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1">
              <Eye className="w-3 h-3" />
              <span>Câmera FPV de {selectedToken.name}</span>
            </div>
            <div className="text-xs text-neutral-300 font-semibold">
              Posição: ({selectedToken.x}, {selectedToken.y}) • Elevação: Nível {cellElevations[`${selectedToken.x},${selectedToken.y}`] || 0}
            </div>
          </div>
          <button
            onClick={() => setIsFirstPerson(false)}
            className="ml-2 px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-xl text-xs font-bold transition-all"
          >
            Sair FPV
          </button>
        </div>
      )}

      {/* First Person On-Screen Walking Navigation D-Pad */}
      {isFirstPerson && (
        <div className="absolute bottom-6 left-6 z-20 bg-neutral-900/90 border border-amber-500/50 p-3 rounded-3xl shadow-2xl backdrop-blur-md space-y-2 text-center animate-in fade-in slide-in-from-bottom-4">
          <div className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider flex items-center justify-center gap-1">
            <Footprints className="w-3.5 h-3.5" />
            <span>Navegação FPV (WASD)</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 w-32 mx-auto">
            <div />
            <button
              onClick={() => handleFpStep("forward")}
              className="p-2.5 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-neutral-950 border border-amber-500/40 rounded-xl flex items-center justify-center transition-all active:scale-95"
              title="Avançar (W / Seta Cima)"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
            <div />

            <button
              onClick={() => handleFpStep("left")}
              className="p-2.5 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-neutral-950 border border-amber-500/40 rounded-xl flex items-center justify-center transition-all active:scale-95"
              title="Passo Esquerda (A / Seta Esquerda)"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleFpStep("backward")}
              className="p-2.5 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-neutral-950 border border-amber-500/40 rounded-xl flex items-center justify-center transition-all active:scale-95"
              title="Recuar (S / Seta Baixo)"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleFpStep("right")}
              className="p-2.5 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-neutral-950 border border-amber-500/40 rounded-xl flex items-center justify-center transition-all active:scale-95"
              title="Passo Direita (D / Seta Direita)"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Bottom Right Floating Instructions Banner */}
      <div className="absolute bottom-4 right-4 z-20 bg-neutral-950/80 border border-neutral-800 px-3 py-2 rounded-2xl text-[11px] text-neutral-400 backdrop-blur-md hidden md:block">
        💡 {isFirstPerson ? "Arraste o mouse para olhar em 360° | WASD / Setas para andar pelo terreno" : "Arraste o mouse para girar a câmera 3D | Scroll do mouse para zoom"}
      </div>
    </div>
  );
};

