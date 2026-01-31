import React, { useMemo, useRef } from "react";
import { ThreeCanvas } from "@remotion/three";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { Environment } from "@react-three/drei";
import { sceneTiming } from "../styles/theme";

// Settings from landing page sphere-background.tsx (FULL settings with scroll/X effects)
const SETTINGS = {
  // population - spheres increase over video progress
  baseCount: 50,
  maxCount: 140, // max spheres at end of video
  minSize: 0.55,
  maxSize: 1.55,

  // leader
  leaderSize: 7,

  // physics
  gravity: 24.0,
  shellRadius: 3.2,
  shellStrength: 6.5,
  orbit: 1.0,
  maxVelocity: 15,
  friction: 0.96,
  soften: 0.2,
  collisionRestitution: 0.7,
  leaderBounceRestitution: 1.2,

  // colors (center/base - start)
  colorA: "#1f56da",
  colorB: "#86b6ff",
  leaderColor: "#1f56da",
  leaderLightColor: "#052c7a",

  // colors (end - at full progress)
  colorAEnd: "#7c3aed",
  colorBEnd: "#c4b5fd",
  leaderColorEnd: "#7c3aed",
  leaderLightColorEnd: "#4c1d95",

  // colors (left - cooler blues, when leader moves left)
  colorALeft: "#0ea5e9",
  colorBLeft: "#7dd3fc",
  leaderColorLeft: "#0284c7",
  leaderLightColorLeft: "#0c4a6e",

  // colors (right - warmer purples, when leader moves right)
  colorARight: "#a855f7",
  colorBRight: "#e879f9",
  leaderColorRight: "#9333ea",
  leaderLightColorRight: "#581c87",

  // leader light (base → max over progress)
  leaderLightIntensity: 600,
  leaderLightIntensityMax: 900,
  leaderLightDistance: 11,
  leaderLightDistanceMax: 14.5,
  leaderEmissiveIntensity: 0.5,
  leaderEmissiveIntensityMax: 0.85,
  leaderColorInfluence: 0.6,
  leaderColorRange: 12,

  // lighting
  ambientIntensity: 0.25,
  keyIntensity: 0.6,
  rimIntensity: 1.2,

  // bloom (base → max over progress)
  bloomStrength: 0.25,
  bloomStrengthMax: 0.425,
  bloomRadius: 0.6,
  bloomThreshold: 0.75,
  bloomThresholdMin: 0.625,
};

// Derive scene timing from theme (so changes propagate automatically)
const SCENES = {
  hook: { start: sceneTiming.hook.start, end: sceneTiming.hook.start + sceneTiming.hook.duration },
  hero: { start: sceneTiming.hero.start, end: sceneTiming.hero.start + sceneTiming.hero.duration },
  channels: { start: sceneTiming.channels.start, end: sceneTiming.channels.start + sceneTiming.channels.duration },
  chatDemo: { start: sceneTiming.chatDemo.start, end: sceneTiming.chatDemo.start + sceneTiming.chatDemo.duration },
  dashboard: { start: sceneTiming.dashboard.start, end: sceneTiming.dashboard.start + sceneTiming.dashboard.duration },
  features: { start: sceneTiming.features.start, end: sceneTiming.features.start + sceneTiming.features.duration },
  useCases: { start: sceneTiming.useCases.start, end: sceneTiming.useCases.start + sceneTiming.useCases.duration },
  cta: { start: sceneTiming.cta.start, end: sceneTiming.cta.start + sceneTiming.cta.duration },
};

// Follower data for physics simulation
interface FollowerData {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  axis: THREE.Vector3;
  size: number;
  colorType: "A" | "B";
  rotationX: number;
  rotationY: number;
}

// Pre-compute leader path for the entire video
function computeLeaderPath(totalFrames: number, fps: number): THREE.Vector3[] {
  const path: THREE.Vector3[] = [];

  for (let frame = 0; frame < totalFrames; frame++) {
    const time = frame / fps;
    let baseX: number, baseY: number;

    // Map video position to 3D scene coordinates
    // Landing page camera is at z=20, looking at origin
    // We'll position leader in a smaller range for the 3D scene
    if (frame < SCENES.hook.end) {
      const p = frame / SCENES.hook.end;
      baseX = interpolate(p, [0, 0.4, 1], [-15, -8, -6]);
      baseY = interpolate(p, [0, 0.5, 1], [2, -1, 0]);
    } else if (frame < SCENES.hero.end) {
      const p = (frame - SCENES.hero.start) / (SCENES.hero.end - SCENES.hero.start);
      baseX = interpolate(p, [0, 0.5, 1], [-6, -8, -7]);
      baseY = interpolate(p, [0, 0.5, 1], [0, -2, -1]);
    } else if (frame < SCENES.channels.end) {
      // Smooth transition: start from Hero's end position (-7, -1) and gently move
      const p = (frame - SCENES.channels.start) / (SCENES.channels.end - SCENES.channels.start);
      baseX = interpolate(p, [0, 0.3, 0.7, 1], [-7, -5, -3, -4]); // Gentle drift right then settle
      baseY = interpolate(p, [0, 0.3, 0.7, 1], [-1, 0, -1, -2]); // Gentle wave motion
    } else if (frame < SCENES.chatDemo.end) {
      // Smooth transition: start from Channels' end position (-4, -2) and move to bottom-right
      const p = (frame - SCENES.chatDemo.start) / (SCENES.chatDemo.end - SCENES.chatDemo.start);
      baseX = interpolate(p, [0, 0.2, 0.5, 1], [-4, 0, 5, 6]); // Smooth move from left to right
      baseY = interpolate(p, [0, 0.2, 0.5, 1], [-2, -3, -5, -5]); // Smooth move down
    } else if (frame < SCENES.dashboard.end) {
      // Smooth transition: start from Chat Demo's end position (6, -5) and move to top-left
      const p = (frame - SCENES.dashboard.start) / (SCENES.dashboard.end - SCENES.dashboard.start);
      baseX = interpolate(p, [0, 0.3, 0.7, 1], [6, 0, -6, -7]); // Smooth move from right to left
      baseY = interpolate(p, [0, 0.3, 0.7, 1], [-5, 0, 4, 3]); // Smooth move up
    } else if (frame < SCENES.features.end) {
      // Smooth transition: start from Dashboard's end position (-7, 3)
      const p = (frame - SCENES.features.start) / (SCENES.features.end - SCENES.features.start);
      baseX = interpolate(p, [0, 0.3, 0.7, 1], [-7, -2, 2, -5]);
      baseY = interpolate(p, [0, 0.3, 0.7, 1], [3, 4, 3, 2]);
    } else if (frame < SCENES.useCases.end) {
      // Smooth transition: start from Features' end position (-5, 2)
      const p = (frame - SCENES.useCases.start) / (SCENES.useCases.end - SCENES.useCases.start);
      baseX = interpolate(p, [0, 0.5, 1], [-5, -8, -7]);
      baseY = interpolate(p, [0, 0.5, 1], [2, 1, 0]);
    } else {
      // Smooth transition: start from Use Cases' end position (-7, 0)
      const p = (frame - SCENES.cta.start) / (SCENES.cta.end - SCENES.cta.start);
      baseX = interpolate(p, [0, 0.5, 1], [-7, -5, -5]);
      baseY = interpolate(p, [0, 0.5, 1], [0, -1, 0]);
    }

    // Organic floating motion
    const floatX = Math.sin(time * 0.5) * 1.5 + Math.sin(time * 0.3) * 1;
    const floatY = Math.cos(time * 0.4) * 1.2 + Math.cos(time * 0.25) * 0.8;
    const floatZ = Math.sin(time * 0.35) * 0.8;

    path.push(new THREE.Vector3(baseX + floatX, baseY + floatY, floatZ));
  }

  return path;
}

// Helper to create a new follower
function createFollower(): FollowerData {
  const angle = Math.random() * Math.PI * 2;
  const r = 10 + Math.random() * 12;
  const y = -12 + Math.random() * 24;
  const z = -14 + Math.random() * 22;
  const size = SETTINGS.minSize + Math.random() * (SETTINGS.maxSize - SETTINGS.minSize);

  return {
    position: new THREE.Vector3(Math.cos(angle) * r, y, z),
    velocity: new THREE.Vector3(
      (Math.random() - 0.5) * 0.15,
      (Math.random() - 0.5) * 0.15,
      (Math.random() - 0.5) * 0.1
    ),
    axis: new THREE.Vector3(
      Math.random() - 0.5,
      Math.random() - 0.5,
      Math.random() - 0.5
    ).normalize(),
    size,
    colorType: Math.random() > 0.5 ? "A" : "B",
    rotationX: Math.random() * Math.PI * 2,
    rotationY: Math.random() * Math.PI * 2,
  };
}

// Pre-compute physics simulation for all frames
function simulatePhysics(
  totalFrames: number,
  fps: number,
  leaderPath: THREE.Vector3[]
): FollowerData[][] {
  const dt = 1 / fps;
  const history: FollowerData[][] = [];

  // Initialize with base count (like landing page)
  const followers: FollowerData[] = [];
  for (let i = 0; i < SETTINGS.baseCount; i++) {
    followers.push(createFollower());
  }

  // Track spawn threshold for gradual sphere addition
  let lastSpawnThreshold = 0;

  // Temp vectors for physics
  const tmp1 = new THREE.Vector3();
  const tmp2 = new THREE.Vector3();
  const tmp3 = new THREE.Vector3();

  let prevLeader = leaderPath[0].clone();

  for (let frame = 0; frame < totalFrames; frame++) {
    const leader = leaderPath[frame];
    const leaderVel = tmp1.copy(leader).sub(prevLeader).divideScalar(dt);
    prevLeader.copy(leader);

    // Video progress (like scroll progress in landing page)
    const progress = frame / totalFrames;
    const easeT = progress * progress * (3 - 2 * progress); // smoothstep easing

    // Spawn spheres based on progress (like landing page scroll spawning)
    const additionalSpheres = SETTINGS.maxCount - SETTINGS.baseCount;
    const targetCount = SETTINGS.baseCount + Math.floor(additionalSpheres * easeT);
    const currentThreshold = Math.floor(progress * 10);

    if (currentThreshold > lastSpawnThreshold && followers.length < targetCount) {
      const toSpawn = Math.min(
        Math.ceil(additionalSpheres / 10),
        targetCount - followers.length
      );
      for (let i = 0; i < toSpawn; i++) {
        followers.push(createFollower());
      }
      lastSpawnThreshold = currentThreshold;
    }

    // Physics step (from landing page stepFollowers)
    for (const fi of followers) {
      const p = fi.position;

      // Direction to leader
      tmp1.copy(leader).sub(p);
      const dist = tmp1.length() + 1e-6;
      const dir = tmp1.multiplyScalar(1 / dist);

      // Gravity pull
      const pull = SETTINGS.gravity / (dist + SETTINGS.soften);
      tmp2.copy(dir).multiplyScalar(pull);

      // Shell force
      const shellError = dist - SETTINGS.shellRadius;
      tmp2.addScaledVector(dir, shellError * SETTINGS.shellStrength);

      // Orbit: tangential force around random axis
      const tangent = tmp3.copy(dir).cross(fi.axis);
      tmp2.addScaledVector(tangent, SETTINGS.orbit);

      // Leader collision with bounce
      const radiusLeader = 0.55 * SETTINGS.leaderSize;
      const radiusFollower = 0.55 * fi.size;
      const minDistLeader = radiusLeader + radiusFollower;

      if (dist < minDistLeader) {
        const overlap = minDistLeader - dist;
        p.addScaledVector(dir, -overlap);

        const relVel = tmp3.copy(fi.velocity).sub(leaderVel);
        const velAlongNormal = relVel.dot(dir);

        if (velAlongNormal > 0) {
          const impulse = -(1 + SETTINGS.leaderBounceRestitution) * velAlongNormal;
          fi.velocity.addScaledVector(dir, impulse);

          const leaderSpeed = leaderVel.length();
          if (leaderSpeed > 0.5) {
            fi.velocity.addScaledVector(dir, -leaderSpeed * 1.5);
          }
        }
      }

      // Integrate
      fi.velocity.addScaledVector(tmp2, dt);

      // Clamp velocity
      const vlen = fi.velocity.length();
      if (vlen > SETTINGS.maxVelocity) {
        fi.velocity.multiplyScalar(SETTINGS.maxVelocity / vlen);
      }

      // Friction
      fi.velocity.multiplyScalar(Math.pow(SETTINGS.friction, dt * 60));

      // Position update
      p.addScaledVector(fi.velocity, dt);

      // Rotation for highlights
      fi.rotationY += dt * 0.25;
      fi.rotationX += dt * 0.16;
    }

    // Sphere-to-sphere collision
    for (let i = 0; i < followers.length; i++) {
      for (let j = i + 1; j < followers.length; j++) {
        const a = followers[i];
        const b = followers[j];

        const radiusA = 0.55 * a.size;
        const radiusB = 0.55 * b.size;
        const minDist = radiusA + radiusB;

        tmp1.copy(a.position).sub(b.position);
        const dist = tmp1.length();

        if (dist < minDist && dist > 0.0001) {
          const overlap = minDist - dist;
          const normal = tmp1.normalize();

          const correction = overlap * 0.5;
          a.position.addScaledVector(normal, correction);
          b.position.addScaledVector(normal, -correction);

          const relVel = tmp2.copy(a.velocity).sub(b.velocity);
          const velAlongNormal = relVel.dot(normal);

          if (velAlongNormal < 0) {
            const impulse = -(1 + SETTINGS.collisionRestitution) * velAlongNormal * 0.5;
            a.velocity.addScaledVector(normal, impulse);
            b.velocity.addScaledVector(normal, -impulse);
          }
        }
      }
    }

    // Save snapshot
    history.push(
      followers.map((f) => ({
        position: f.position.clone(),
        velocity: f.velocity.clone(),
        axis: f.axis.clone(),
        size: f.size,
        colorType: f.colorType,
        rotationX: f.rotationX,
        rotationY: f.rotationY,
      }))
    );
  }

  return history;
}

// Sphere geometry (shared)
const sphereGeometry = new THREE.SphereGeometry(0.55, 32, 24);

// Follower sphere component
const FollowerSphere: React.FC<{
  data: FollowerData;
  colorA: THREE.Color;
  colorB: THREE.Color;
  leaderPos: THREE.Vector3;
  leaderColor: THREE.Color;
}> = ({ data, colorA, colorB, leaderPos, leaderColor }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  const material = useMemo(() => {
    const baseColor = data.colorType === "A" ? colorA : colorB;
    return new THREE.MeshPhysicalMaterial({
      color: baseColor,
      roughness: 0.35,
      metalness: 0.1,
      clearcoat: 0.5,
      clearcoatRoughness: 0.1,
      envMapIntensity: 0.25,
      iridescence: 0.3,
      iridescenceIOR: 1.3,
      iridescenceThicknessRange: [100, 400],
    });
  }, [data.colorType, colorA, colorB]);

  // Leader color influence (tinting near leader)
  const dist = data.position.distanceTo(leaderPos);
  if (dist < SETTINGS.leaderColorRange) {
    const influence = (1 - dist / SETTINGS.leaderColorRange) * SETTINGS.leaderColorInfluence;
    material.color.lerp(leaderColor, influence);
  }

  return (
    <mesh
      ref={meshRef}
      geometry={sphereGeometry}
      material={material}
      position={[data.position.x, data.position.y, data.position.z]}
      scale={data.size}
      rotation={[data.rotationX, data.rotationY, 0]}
    />
  );
};

// Leader sphere component
const LeaderSphere: React.FC<{
  position: THREE.Vector3;
  color: THREE.Color;
  emissiveColor: THREE.Color;
  emissiveIntensity: number;
}> = ({ position, color, emissiveColor, emissiveIntensity }) => {
  const material = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: color,
      emissive: emissiveColor,
      emissiveIntensity: emissiveIntensity,
      roughness: 0.15,
      metalness: 0.1,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
    });
  }, [color, emissiveColor, emissiveIntensity]);

  return (
    <mesh
      geometry={sphereGeometry}
      material={material}
      position={[position.x, position.y, position.z]}
      scale={SETTINGS.leaderSize}
    />
  );
};

// Helper to lerp between values
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// Main scene component
const Scene: React.FC<{
  leaderPath: THREE.Vector3[];
  physicsHistory: FollowerData[][];
}> = ({ leaderPath, physicsHistory }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const progress = frame / durationInFrames;

  // Smoothstep easing (like landing page)
  const easeT = progress * progress * (3 - 2 * progress);

  // Get current state
  const currentFrame = Math.min(frame, physicsHistory.length - 1);
  const followers = physicsHistory[currentFrame] || [];
  const leaderPos = leaderPath[currentFrame] || new THREE.Vector3();

  // X position for color temperature (-1 to 1 range, normalized from leader X)
  // Leader X typically ranges from -10 to 2, normalize to -1 to 1
  const horizontalPos = Math.max(-1, Math.min(1, leaderPos.x / 8));
  const leftBlend = Math.max(0, -horizontalPos); // 0 to 1 when left
  const rightBlend = Math.max(0, horizontalPos); // 0 to 1 when right

  // Colors with scroll progress + horizontal temperature
  const colorA = useMemo(() => {
    // Base: scroll interpolation
    const start = new THREE.Color(SETTINGS.colorA);
    const end = new THREE.Color(SETTINGS.colorAEnd);
    const scrollColor = start.clone().lerp(end, easeT);

    // Apply horizontal temperature shift
    const left = new THREE.Color(SETTINGS.colorALeft);
    const right = new THREE.Color(SETTINGS.colorARight);
    return scrollColor.lerp(left, leftBlend * 0.7).lerp(right, rightBlend * 0.7);
  }, [easeT, leftBlend, rightBlend]);

  const colorB = useMemo(() => {
    const start = new THREE.Color(SETTINGS.colorB);
    const end = new THREE.Color(SETTINGS.colorBEnd);
    const scrollColor = start.clone().lerp(end, easeT);

    const left = new THREE.Color(SETTINGS.colorBLeft);
    const right = new THREE.Color(SETTINGS.colorBRight);
    return scrollColor.lerp(left, leftBlend * 0.7).lerp(right, rightBlend * 0.7);
  }, [easeT, leftBlend, rightBlend]);

  const leaderColor = useMemo(() => {
    const start = new THREE.Color(SETTINGS.leaderColor);
    const end = new THREE.Color(SETTINGS.leaderColorEnd);
    const scrollColor = start.clone().lerp(end, easeT);

    const left = new THREE.Color(SETTINGS.leaderColorLeft);
    const right = new THREE.Color(SETTINGS.leaderColorRight);
    return scrollColor.lerp(left, leftBlend * 0.7).lerp(right, rightBlend * 0.7);
  }, [easeT, leftBlend, rightBlend]);

  const leaderEmissive = useMemo(() => {
    const start = new THREE.Color(SETTINGS.leaderLightColor);
    const end = new THREE.Color(SETTINGS.leaderLightColorEnd);
    const scrollColor = start.clone().lerp(end, easeT);

    const left = new THREE.Color(SETTINGS.leaderLightColorLeft);
    const right = new THREE.Color(SETTINGS.leaderLightColorRight);
    return scrollColor.lerp(left, leftBlend * 0.7).lerp(right, rightBlend * 0.7);
  }, [easeT, leftBlend, rightBlend]);

  // Progress-based light intensity and bloom (like landing page scroll effects)
  const leaderLightIntensity = lerp(SETTINGS.leaderLightIntensity, SETTINGS.leaderLightIntensityMax, easeT);
  const leaderLightDistance = lerp(SETTINGS.leaderLightDistance, SETTINGS.leaderLightDistanceMax, easeT);
  const leaderEmissiveIntensity = lerp(SETTINGS.leaderEmissiveIntensity, SETTINGS.leaderEmissiveIntensityMax, easeT);
  const bloomStrength = lerp(SETTINGS.bloomStrength, SETTINGS.bloomStrengthMax, easeT);
  const bloomThreshold = lerp(SETTINGS.bloomThreshold, SETTINGS.bloomThresholdMin, easeT);

  // Camera follows leader slightly (parallax effect)
  const { camera } = useThree();
  React.useEffect(() => {
    camera.position.x = leaderPos.x * 0.02;
    camera.position.y = 0.2 + leaderPos.y * 0.02;
    camera.lookAt(0, 0, 0);
  }, [camera, leaderPos]);

  return (
    <>
      {/* Scene background - prevents white bloom artifacts */}
      <color attach="background" args={["#f8fafc"]} />

      {/* Lighting */}
      <ambientLight intensity={SETTINGS.ambientIntensity} />
      <directionalLight
        position={[7, 12, 10]}
        intensity={SETTINGS.keyIntensity}
      />
      <directionalLight
        position={[-10, 3, 8]}
        intensity={SETTINGS.rimIntensity}
        color="#9bb6ff"
      />

      {/* Leader with point light */}
      <LeaderSphere
        position={leaderPos}
        color={leaderColor}
        emissiveColor={leaderEmissive}
        emissiveIntensity={leaderEmissiveIntensity}
      />
      <pointLight
        position={[leaderPos.x, leaderPos.y, leaderPos.z]}
        color={leaderEmissive}
        intensity={leaderLightIntensity}
        distance={leaderLightDistance}
        decay={1}
      />

      {/* Followers */}
      {followers.map((f, i) => (
        <FollowerSphere
          key={i}
          data={f}
          colorA={colorA}
          colorB={colorB}
          leaderPos={leaderPos}
          leaderColor={leaderColor}
        />
      ))}

      {/* Environment for reflections */}
      <Environment preset="studio" />

      {/* Post-processing bloom - intensity increases with progress */}
      <EffectComposer>
        <Bloom
          intensity={bloomStrength}
          luminanceThreshold={bloomThreshold}
          radius={SETTINGS.bloomRadius}
        />
      </EffectComposer>
    </>
  );
};

// Grid Background (matching landing page style)
const GridBackground: React.FC = () => (
  <>
    {/* Base grid - subtle gray */}
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `
          linear-gradient(to right, #94a3b8 1px, transparent 1px),
          linear-gradient(to bottom, #94a3b8 1px, transparent 1px)
        `,
        backgroundSize: "60px 60px",
        opacity: 0.03,
      }}
    />
    {/* Glowing blue grid - masked to corner */}
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `
          linear-gradient(to right, rgba(59, 130, 246, 0.1) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
        `,
        backgroundSize: "60px 60px",
        filter: "drop-shadow(0 0 3px rgba(59, 130, 246, 0.4))",
        maskImage: "linear-gradient(to bottom right, black 0%, black 25%, transparent 70%)",
        WebkitMaskImage: "linear-gradient(to bottom right, black 0%, black 25%, transparent 70%)",
      }}
    />
    {/* Corner gradient accents */}
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `
          radial-gradient(ellipse 80% 60% at 0% 0%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
          radial-gradient(ellipse 50% 40% at 100% 100%, rgba(124, 58, 237, 0.1) 0%, transparent 50%)
        `,
      }}
    />
  </>
);

// Main component - standalone background layer (no children)
export const ThreeBackground: React.FC = () => {
  const { fps, durationInFrames, width, height } = useVideoConfig();

  // Pre-compute leader path and physics simulation
  const { leaderPath, physicsHistory } = useMemo(() => {
    const leaderPath = computeLeaderPath(durationInFrames, fps);
    const physicsHistory = simulatePhysics(durationInFrames, fps, leaderPath);
    return { leaderPath, physicsHistory };
  }, [durationInFrames, fps]);

  return (
    <div style={{ position: "absolute", inset: 0, width, height, background: "#f8fafc", overflow: "hidden" }}>
      {/* Three.js canvas */}
      <ThreeCanvas
        width={width}
        height={height}
        style={{ position: "absolute", inset: 0, zIndex: 0 }}
        camera={{
          fov: 42,
          position: [0, 0.2, 20],
          near: 0.1,
          far: 200,
        }}
        gl={{
          antialias: true,
          alpha: false, // Solid background prevents bloom artifacts
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
        }}
      >
        <Scene leaderPath={leaderPath} physicsHistory={physicsHistory} />
      </ThreeCanvas>

      {/* Grid overlay on top of Three.js */}
      <div style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none" }}>
        <GridBackground />
      </div>
    </div>
  );
};
