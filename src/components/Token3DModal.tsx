import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { MapToken } from "../types";
import { X, RotateCw, Sparkles, Shield, Heart, Zap, Flame, Eye } from "lucide-react";

interface Token3DModalProps {
  token: MapToken | null;
  onClose: () => void;
  onUpdateToken?: (updated: Partial<MapToken>) => void;
}

export const Token3DModal: React.FC<Token3DModalProps> = ({ token, onClose, onUpdateToken }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [pedestalStyle, setPedestalStyle] = useState<"gold" | "paranormal" | "obsidian" | "arcane">("gold");
  const [isRotating, setIsRotating] = useState(true);
  const [lightIntensity, setLightIntensity] = useState(1.5);

  useEffect(() => {
    if (!token || !mountRef.current) return;

    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0f);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 3.5, 6.5);
    camera.lookAt(0, 1.2, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Group for the complete miniature
    const miniGroup = new THREE.Group();
    scene.add(miniGroup);

    // 1. Pedestal Base
    let baseColor = 0xd97706;
    let emissiveColor = 0x000000;

    if (pedestalStyle === "paranormal") {
      baseColor = 0x8b5cf6;
      emissiveColor = 0x4c1d95;
    } else if (pedestalStyle === "obsidian") {
      baseColor = 0x18181b;
      emissiveColor = 0xdc2626;
    } else if (pedestalStyle === "arcane") {
      baseColor = 0x2563eb;
      emissiveColor = 0x1e40af;
    }

    const baseGeometry = new THREE.CylinderGeometry(1.6, 1.8, 0.35, 32);
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: baseColor,
      metalness: 0.85,
      roughness: 0.25,
      emissive: emissiveColor,
      emissiveIntensity: 0.3,
    });
    const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
    baseMesh.position.y = 0.175;
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    miniGroup.add(baseMesh);

    // Base Accent Ring (Token color)
    const tokenHexColor = parseInt((token.color || "#eab308").replace("#", "0x"), 16) || 0xeab308;
    const ringGeo = new THREE.TorusGeometry(1.65, 0.06, 16, 64);
    const ringMat = new THREE.MeshStandardMaterial({
      color: tokenHexColor,
      emissive: tokenHexColor,
      emissiveIntensity: 0.6,
      metalness: 0.9,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = 0.36;
    miniGroup.add(ringMesh);

    // 2. Token Miniature Stand / Figure
    const standGeo = new THREE.BoxGeometry(0.12, 1.8, 0.05);
    const standMat = new THREE.MeshStandardMaterial({ color: 0x27272a, metalness: 0.9 });
    const standMesh = new THREE.Mesh(standGeo, standMat);
    standMesh.position.set(0, 1.25, 0);
    miniGroup.add(standMesh);

    // 3. Texture Loader for Avatar
    const textureLoader = new THREE.TextureLoader();
    const defaultAvatarUrl =
      token.avatar ||
      (token.system === "ordem"
        ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80"
        : "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=300&auto=format&fit=crop&q=80");

    textureLoader.load(
      defaultAvatarUrl,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        // Circular Portrait Stand Disc
        const discGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.08, 48);
        const discMaterials = [
          new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.2 }), // side
          new THREE.MeshStandardMaterial({ map: texture, roughness: 0.3 }), // top
          new THREE.MeshStandardMaterial({ map: texture, roughness: 0.3 }), // bottom
        ];
        const discMesh = new THREE.Mesh(discGeo, discMaterials);
        discMesh.rotation.x = Math.PI / 2;
        discMesh.position.set(0, 1.5, 0);
        discMesh.castShadow = true;
        miniGroup.add(discMesh);
      },
      undefined,
      () => {
        // Fallback cube if image fails
        const fallbackGeo = new THREE.BoxGeometry(1.5, 2, 0.1);
        const fallbackMat = new THREE.MeshStandardMaterial({ color: tokenHexColor });
        const fallbackMesh = new THREE.Mesh(fallbackGeo, fallbackMat);
        fallbackMesh.position.set(0, 1.4, 0);
        miniGroup.add(fallbackMesh);
      }
    );

    // 4. Magic Particles / Runes surrounding the base
    const particleCount = 45;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const radius = 1.3 + Math.random() * 0.8;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = 0.2 + Math.random() * 2.2;
      positions[i * 3 + 2] = Math.sin(angle) * radius;

      particleColors[i * 3] = ((tokenHexColor >> 16) & 255) / 255;
      particleColors[i * 3 + 1] = ((tokenHexColor >> 8) & 255) / 255;
      particleColors[i * 3 + 2] = (tokenHexColor & 255) / 255;
    }

    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute("color", new THREE.BufferAttribute(particleColors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    miniGroup.add(particles);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, lightIntensity * 1.5);
    keyLight.position.set(4, 8, 5);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(tokenHexColor, 2.5, 8);
    rimLight.position.set(-3, 3, -3);
    scene.add(rimLight);

    const floorLight = new THREE.PointLight(baseColor, 1.2, 5);
    floorLight.position.set(0, 0.2, 0);
    scene.add(floorLight);

    // Mouse drag rotation controls
    let isDragging = false;
    let previousMouseX = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMouseX = e.clientX;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const delta = e.clientX - previousMouseX;
      miniGroup.rotation.y += delta * 0.015;
      previousMouseX = e.clientX;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    container.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      if (isRotating && !isDragging) {
        miniGroup.rotation.y += 0.012;
      }

      // Gentle floating animation of particles
      const posAttr = particleGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < particleCount; i++) {
        let y = posAttr.getY(i);
        y += 0.006;
        if (y > 2.5) y = 0.2;
        posAttr.setY(i, y);
      }
      posAttr.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      container.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [token, pedestalStyle, isRotating, lightIntensity]);

  if (!token) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 text-neutral-400 hover:text-white bg-neutral-800/80 hover:bg-neutral-700 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 3D Canvas Area */}
        <div className="relative flex-1 min-h-[360px] md:min-h-[480px] bg-neutral-950/90 flex items-center justify-center overflow-hidden">
          <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

          {/* Canvas Overlay Controls */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-neutral-900/90 border border-neutral-800 backdrop-blur px-3 py-1.5 rounded-xl text-xs text-neutral-300">
            <button
              onClick={() => setIsRotating(!isRotating)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors ${
                isRotating ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" : "hover:bg-neutral-800"
              }`}
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRotating ? "animate-spin" : ""}`} />
              {isRotating ? "Giro Ativo" : "Pausado"}
            </button>
            <span className="text-neutral-500">|</span>
            <span className="text-neutral-400">Arraste para girar</span>
          </div>

          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="px-3 py-1 bg-amber-500/20 border border-amber-500/40 rounded-full text-xs font-semibold text-amber-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Miniatura 3D Interativa
            </span>
          </div>
        </div>

        {/* Token Details & Customization Sidebar */}
        <div className="w-full md:w-80 p-6 flex flex-col justify-between bg-neutral-900 border-t md:border-t-0 md:border-l border-neutral-800 overflow-y-auto">
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: token.color || "#eab308" }}
                />
                <span className="text-xs font-mono uppercase text-neutral-400 tracking-wider">
                  {token.type === "hero" ? "Herói / Agente" : token.type === "enemy" ? "Inimigo" : token.type === "boss" ? "Chefe Épico" : "NPC"}
                </span>
              </div>
              <h2 className="text-xl font-bold font-serif text-amber-100 mt-1">{token.name}</h2>
              <p className="text-xs text-neutral-400">
                Sistema: {token.system === "ordem" ? "Ordem Paranormal" : token.system === "dnd5e" ? "D&D 5e" : "Custom"}
              </p>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 flex items-center gap-3">
                <Heart className="w-5 h-5 text-red-400" />
                <div>
                  <div className="text-xs text-neutral-400">Pontos de Vida</div>
                  <div className="text-sm font-bold text-red-200">
                    {token.hp} / {token.maxHp}
                  </div>
                </div>
              </div>

              <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 flex items-center gap-3">
                <Shield className="w-5 h-5 text-blue-400" />
                <div>
                  <div className="text-xs text-neutral-400">Defesa / CA</div>
                  <div className="text-sm font-bold text-blue-200">{token.ac || 10}</div>
                </div>
              </div>

              {token.system === "ordem" && (
                <>
                  <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 flex items-center gap-3">
                    <Eye className="w-5 h-5 text-purple-400" />
                    <div>
                      <div className="text-xs text-neutral-400">Sanidade (PS)</div>
                      <div className="text-sm font-bold text-purple-200">{token.san || 20} / {token.maxSan || 20}</div>
                    </div>
                  </div>

                  <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 flex items-center gap-3">
                    <Zap className="w-5 h-5 text-amber-400" />
                    <div>
                      <div className="text-xs text-neutral-400">Esforço (PE)</div>
                      <div className="text-sm font-bold text-amber-200">{token.pe || 10} / {token.maxPe || 10}</div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Pedestal Style Chooser */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                Estilo do Pedestal 3D
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "gold", label: "Ouro Heroico", color: "bg-amber-600" },
                  { id: "paranormal", label: "Paranormal", color: "bg-purple-600" },
                  { id: "obsidian", label: "Obsidiana Rubra", color: "bg-red-800" },
                  { id: "arcane", label: "Arcano Celeste", color: "bg-blue-600" },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setPedestalStyle(st.id as any)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                      pedestalStyle === st.id
                        ? "border-amber-500 bg-amber-500/10 text-amber-200 shadow-sm"
                        : "border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700"
                    }`}
                  >
                    <span className={`w-3 h-3 rounded-full ${st.color}`} />
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Conditions & Status */}
            {token.conditions && token.conditions.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Condições Ativas
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {token.conditions.map((cond, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-red-950/60 border border-red-800/60 text-red-300 rounded-lg text-xs font-medium"
                    >
                      {cond}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-neutral-800">
            <button
              onClick={onClose}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-neutral-950 font-semibold rounded-xl text-sm transition-all shadow-md active:scale-98"
            >
              Concluir Inspeção
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
