"use client";

import { useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { RoundedBox, Float } from "@react-three/drei";
import * as THREE from "three";

type IconType = "calendar" | "invoice" | "chat";

interface Feature3DIconProps {
  type: IconType;
  className?: string;
}

// Calendar Icon - 3D box with grid lines
function CalendarMesh() {
  const meshRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.3;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
      <group ref={meshRef}>
        {/* Main calendar body */}
        <RoundedBox args={[1.8, 2, 0.3]} radius={0.1} smoothness={4}>
          <meshStandardMaterial color="#3B82F6" metalness={0.3} roughness={0.4} />
        </RoundedBox>
        {/* Calendar header */}
        <RoundedBox args={[1.8, 0.4, 0.35]} radius={0.08} position={[0, 0.8, 0.03]}>
          <meshStandardMaterial color="#2563EB" metalness={0.4} roughness={0.3} />
        </RoundedBox>
        {/* Calendar rings */}
        {[-0.5, 0.5].map((x, i) => (
          <mesh key={i} position={[x, 1.05, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 0.3, 16]} />
            <meshStandardMaterial color="#1E40AF" metalness={0.6} roughness={0.2} />
          </mesh>
        ))}
        {/* Grid dots */}
        {[...Array(9)].map((_, i) => (
          <mesh key={i} position={[(i % 3 - 1) * 0.45, 0.1 - Math.floor(i / 3) * 0.4, 0.18]}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshStandardMaterial color="#BFDBFE" metalness={0.2} roughness={0.5} />
          </mesh>
        ))}
      </group>
    </Float>
  );
}

// Invoice Icon - 3D document with lines
function InvoiceMesh() {
  const meshRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.3;
      meshRef.current.rotation.x = Math.cos(state.clock.elapsedTime * 0.4) * 0.1;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
      <group ref={meshRef}>
        {/* Document body */}
        <RoundedBox args={[1.6, 2.2, 0.15]} radius={0.08} smoothness={4}>
          <meshStandardMaterial color="#14B8A6" metalness={0.3} roughness={0.4} />
        </RoundedBox>
        {/* Document lines */}
        {[0.6, 0.2, -0.2, -0.6].map((y, i) => (
          <RoundedBox key={i} args={[1, 0.12, 0.08]} radius={0.02} position={[0, y, 0.1]}>
            <meshStandardMaterial color="#5EEAD4" metalness={0.2} roughness={0.5} />
          </RoundedBox>
        ))}
        {/* Checkmark circle */}
        <mesh position={[0.4, -0.9, 0.1]}>
          <circleGeometry args={[0.25, 32]} />
          <meshStandardMaterial color="#0D9488" metalness={0.3} roughness={0.4} />
        </mesh>
      </group>
    </Float>
  );
}

// Chat Icon - 3D speech bubble
function ChatMesh() {
  const meshRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.3;
      meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.3) * 0.05;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
      <group ref={meshRef}>
        {/* Main bubble */}
        <RoundedBox args={[2, 1.4, 0.5]} radius={0.3} smoothness={4}>
          <meshStandardMaterial color="#F43F5E" metalness={0.3} roughness={0.4} />
        </RoundedBox>
        {/* Bubble tail */}
        <mesh position={[-0.6, -0.9, 0]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.4, 0.4, 0.4]} />
          <meshStandardMaterial color="#F43F5E" metalness={0.3} roughness={0.4} />
        </mesh>
        {/* Chat dots */}
        {[-0.4, 0, 0.4].map((x, i) => (
          <mesh key={i} position={[x, 0, 0.3]}>
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshStandardMaterial color="#FECDD3" metalness={0.2} roughness={0.5} />
          </mesh>
        ))}
      </group>
    </Float>
  );
}

function Scene({ type }: { type: IconType }) {
  const icons = {
    calendar: CalendarMesh,
    invoice: InvoiceMesh,
    chat: ChatMesh,
  };

  const IconComponent = icons[type];

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <directionalLight position={[-5, -5, -5]} intensity={0.3} color="#8B5CF6" />
      <IconComponent />
    </>
  );
}

export function Feature3DIcon({ type, className }: Feature3DIconProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);

    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // Intersection observer to only render when visible
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Fallback colors for reduced motion
  const fallbackColors = {
    calendar: "from-blue-400 to-blue-600",
    invoice: "from-teal-400 to-teal-600",
    chat: "from-rose-400 to-rose-600",
  };

  if (prefersReducedMotion) {
    return (
      <div
        className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${fallbackColors[type]} ${className}`}
      />
    );
  }

  return (
    <div ref={containerRef} className={`w-20 h-20 ${className}`}>
      {isVisible && (
        <Canvas
          camera={{ position: [0, 0, 5], fov: 45 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true }}
        >
          <Scene type={type} />
        </Canvas>
      )}
    </div>
  );
}
