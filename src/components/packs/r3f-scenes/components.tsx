"use client";
import * as React from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Float, MeshDistortMaterial, Sphere, Box, Torus, TorusKnot, Icosahedron } from "@react-three/drei";
import * as THREE from "three";
import type { PackComponentProps } from "../react-bits/components";

/* ============ 通用 Canvas 包装 ============ */
function SceneCanvas({ children, bg = "#0f0f23" }: { children: React.ReactNode; bg?: string }) {
  return (
    <div className="w-full h-full rounded-xl overflow-hidden">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }} style={{ background: bg }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <pointLight position={[-5, -5, -5]} intensity={0.3} color="#818cf8" />
        {children}
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={1} />
      </Canvas>
    </div>
  );
}

/* ============ 1. 旋转扭结 ============ */
function TorusKnotInner() {
  const ref = React.useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.x += delta * 0.3;
      ref.current.rotation.y += delta * 0.5;
    }
  });
  return (
    <mesh ref={ref}>
      <torusKnotGeometry args={[1, 0.35, 128, 32]} />
      <MeshDistortMaterial color="#6366f1" speed={2} distort={0.2} roughness={0.2} metalness={0.8} />
    </mesh>
  );
}
function TorusKnotScene() {
  return (
    <SceneCanvas>
      <TorusKnotInner />
    </SceneCanvas>
  );
}
const R3fTorusKnot: React.FC<PackComponentProps> = () => <TorusKnotScene />;

/* ============ 2. 漂浮几何体 ============ */
function FloatingShapesScene() {
  return (
    <SceneCanvas bg="#1a1a2e">
      <Float speed={2} rotationIntensity={1.5} floatIntensity={2}>
        <Icosahedron args={[0.8, 1]} position={[-1.2, 0.5, 0]}>
          <meshStandardMaterial color="#ec4899" flatShading metalness={0.5} roughness={0.3} />
        </Icosahedron>
      </Float>
      <Float speed={1.5} rotationIntensity={2} floatIntensity={1.5}>
        <Box args={[0.9, 0.9, 0.9]} position={[1.2, -0.3, 0]}>
          <meshStandardMaterial color="#22c55e" flatShading metalness={0.4} roughness={0.4} />
        </Box>
      </Float>
      <Float speed={2.5} rotationIntensity={1} floatIntensity={2.5}>
        <Sphere args={[0.6, 32, 32]} position={[0, 0.8, -1]}>
          <meshStandardMaterial color="#f59e0b" metalness={0.7} roughness={0.2} />
        </Sphere>
      </Float>
      <Float speed={1.8} rotationIntensity={1.2} floatIntensity={1.8}>
        <Torus args={[0.5, 0.2, 16, 32]} position={[0.3, -0.8, 0.5]}>
          <meshStandardMaterial color="#06b6d4" flatShading metalness={0.6} roughness={0.3} />
        </Torus>
      </Float>
    </SceneCanvas>
  );
}
const R3fFloatingShapes: React.FC<PackComponentProps> = () => <FloatingShapesScene />;

/* ============ 3. 粒子星空 ============ */
function ParticleInner({ positions }: { positions: Float32Array }) {
  const ref = React.useRef<THREE.Points>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.05;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.03} color="#818cf8" sizeAttenuation transparent opacity={0.8} />
    </points>
  );
}
function ParticleFieldScene() {
  const count = 500;
  const positions = React.useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) arr[i] = (Math.random() - 0.5) * 10;
    return arr;
  }, []);
  return (
    <SceneCanvas bg="#050510">
      <ParticleInner positions={positions} />
      <Float speed={1} floatIntensity={0.5}>
        <Sphere args={[0.5, 32, 32]}>
          <meshStandardMaterial color="#312e81" emissive="#4338ca" emissiveIntensity={0.5} metalness={0.9} roughness={0.1} />
        </Sphere>
      </Float>
    </SceneCanvas>
  );
}
const R3fParticles: React.FC<PackComponentProps> = () => <ParticleFieldScene />;

/* ============ 4. 产品展示台 ============ */
function ProductInner() {
  const ref = React.useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.8;
  });
  return (
    <mesh ref={ref} position={[0, 0.3, 0]}>
      <torusKnotGeometry args={[0.7, 0.25, 100, 16]} />
      <meshStandardMaterial color="#8b5cf6" metalness={0.9} roughness={0.1} />
    </mesh>
  );
}
function ProductStageScene() {
  return (
    <SceneCanvas bg="#fafafa">
      <ambientLight intensity={0.6} />
      <spotLight position={[0, 5, 0]} intensity={1} angle={0.5} penumbra={0.5} />
      <ProductInner />
      {/* 展台 */}
      <mesh position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.5, 1.5, 0.1, 32]} />
        <meshStandardMaterial color="#e5e7eb" metalness={0.3} roughness={0.7} />
      </mesh>
    </SceneCanvas>
  );
}
const R3fProductStage: React.FC<PackComponentProps> = () => <ProductStageScene />;

/* ============ 5. 变形球体 ============ */
function DistortSphereScene() {
  return (
    <SceneCanvas bg="#0f172a">
      <Float speed={1.5} rotationIntensity={0.5} floatIntensity={1}>
        <Sphere args={[1.2, 64, 64]}>
          <MeshDistortMaterial color="#ec4899" speed={3} distort={0.4} roughness={0.2} metalness={0.8} />
        </Sphere>
      </Float>
    </SceneCanvas>
  );
}
const R3fDistortSphere: React.FC<PackComponentProps> = () => <DistortSphereScene />;

/* ============ 6. 线框地球 ============ */
function WireGlobeInner() {
  const ref = React.useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.3;
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[1.5, 24, 24]} />
      <meshBasicMaterial color="#06b6d4" wireframe transparent opacity={0.6} />
    </mesh>
  );
}
function WireGlobeScene() {
  return (
    <SceneCanvas bg="#0a0a1a">
      <WireGlobeInner />
      <mesh>
        <sphereGeometry args={[1.48, 24, 24]} />
        <meshBasicMaterial color="#0e7490" wireframe={false} transparent opacity={0.05} />
      </mesh>
    </SceneCanvas>
  );
}
const R3fWireGlobe: React.FC<PackComponentProps> = () => <WireGlobeScene />;

/* ============ 导出 ============ */
export const r3fComponents: Record<string, React.FC<PackComponentProps>> = {
  "r3f-torus-knot": R3fTorusKnot,
  "r3f-floating-shapes": R3fFloatingShapes,
  "r3f-particles": R3fParticles,
  "r3f-product-stage": R3fProductStage,
  "r3f-distort-sphere": R3fDistortSphere,
  "r3f-wire-globe": R3fWireGlobe,
};

/** 动态加载入口：根据 id 渲染对应 R3F 场景 */
export function R3FRenderer({ id, ...props }: PackComponentProps & { id: string }) {
  const C = r3fComponents[id];
  if (!C) return <div className="w-full h-full grid place-items-center text-xs text-gray-400 bg-gray-50 rounded-md">未知 3D 场景</div>;
  return <C {...props} />;
}
