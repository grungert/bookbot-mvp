import React, { useMemo, useRef } from "react";
import { ThreeCanvas } from "@remotion/three";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { Environment } from "@react-three/drei";
import { whatsappSceneTiming } from "../whatsappConstants";

// WhatsApp-themed settings
const SETTINGS = {
  // population - fewer spheres spawn over time
  baseCount: 50,
  maxCount: 65,
  minSize: 0.55,
  maxSize: 1.55,

  // leader
  leaderSize: 7,

  // physics - smoother bounces
  gravity: 18.0,
  shellRadius: 3.4,
  shellStrength: 4.0,
  orbit: 0.8,
  maxVelocity: 10,
  friction: 0.92,
  soften: 0.3,
  collisionRestitution: 0.3,
  leaderBounceRestitution: 0.5,

  // WhatsApp green + dark purple gradient (center/base - start)
  colorA: "#25D366",        // WhatsApp green
  colorB: "#7C3AED",        // Dark purple/violet
  leaderColor: "#25D366",
  leaderLightColor: "#075E54",

  // colors (end - at full progress)
  colorAEnd: "#20BD5A",
  colorBEnd: "#6B21A8",     // Deeper purple
  leaderColorEnd: "#20BD5A",
  leaderLightColorEnd: "#064940",

  // colors (left - green dominant)
  colorALeft: "#34eb7a",    // Bright green
  colorBLeft: "#A78BFA",    // Light purple
  leaderColorLeft: "#2ecc71",
  leaderLightColorLeft: "#0a5c4a",

  // colors (right - purple dominant)
  colorARight: "#059669",   // Teal green
  colorBRight: "#581C87",   // Deep dark purple
  leaderColorRight: "#16a085",
  leaderLightColorRight: "#4c1d95",

  // leader light
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

  // bloom
  bloomStrength: 0.25,
  bloomStrengthMax: 0.425,
  bloomRadius: 0.6,
  bloomThreshold: 0.75,
  bloomThresholdMin: 0.625,
};

// Derive scene timing
const SCENES = {
  hook: { start: whatsappSceneTiming.hook.start, end: whatsappSceneTiming.hook.start + whatsappSceneTiming.hook.duration },
  hero: { start: whatsappSceneTiming.hero.start, end: whatsappSceneTiming.hero.start + whatsappSceneTiming.hero.duration },
  demo: { start: whatsappSceneTiming.demo.start, end: whatsappSceneTiming.demo.start + whatsappSceneTiming.demo.duration },
  features: { start: whatsappSceneTiming.features.start, end: whatsappSceneTiming.features.start + whatsappSceneTiming.features.duration },
  useCases: { start: whatsappSceneTiming.useCases.start, end: whatsappSceneTiming.useCases.start + whatsappSceneTiming.useCases.duration },
  cta: { start: whatsappSceneTiming.cta.start, end: whatsappSceneTiming.cta.start + whatsappSceneTiming.cta.duration },
};

interface FollowerData {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  axis: THREE.Vector3;
  size: number;
  colorType: "A" | "B";
  rotationX: number;
  rotationY: number;
}

function computeLeaderPath(totalFrames: number, fps: number): THREE.Vector3[] {
  const path: THREE.Vector3[] = [];

  for (let frame = 0; frame < totalFrames; frame++) {
    const time = frame / fps;
    let baseX: number, baseY: number;

    if (frame < SCENES.hook.end) {
      // Hook: Start from far left, move toward center-left
      const p = frame / SCENES.hook.end;
      baseX = interpolate(p, [0, 0.4, 1], [-12, -8, -5]);
      baseY = interpolate(p, [0, 0.5, 1], [2, -1, 0]);
    } else if (frame < SCENES.hero.end) {
      // Hero: Move from left toward center
      const p = (frame - SCENES.hero.start) / (SCENES.hero.end - SCENES.hero.start);
      baseX = interpolate(p, [0, 0.5, 1], [-5, -3, 0]);
      baseY = interpolate(p, [0, 0.5, 1], [0, -1, -1]);
    } else if (frame < SCENES.demo.end) {
      // Demo: Stay center-left (green visible through glass panel)
      const p = (frame - SCENES.demo.start) / (SCENES.demo.end - SCENES.demo.start);
      baseX = interpolate(p, [0, 0.3, 0.7, 1], [0, -3, -5, -4]);
      baseY = interpolate(p, [0, 0.3, 0.7, 1], [-1, 0, -1, -2]);
    } else if (frame < SCENES.features.end) {
      // Features: Move from center to right (purple becomes visible)
      const p = (frame - SCENES.features.start) / (SCENES.features.end - SCENES.features.start);
      baseX = interpolate(p, [0, 0.3, 0.7, 1], [-4, 0, 4, 6]);
      baseY = interpolate(p, [0, 0.3, 0.7, 1], [-2, 0, -1, 1]);
    } else if (frame < SCENES.useCases.end) {
      // UseCases: Stay on right side (purple dominant)
      const p = (frame - SCENES.useCases.start) / (SCENES.useCases.end - SCENES.useCases.start);
      baseX = interpolate(p, [0, 0.5, 1], [6, 5, 4]);
      baseY = interpolate(p, [0, 0.5, 1], [1, 0, -1]);
    } else {
      // CTA: Move back toward center
      const p = (frame - SCENES.cta.start) / (SCENES.cta.end - SCENES.cta.start);
      baseX = interpolate(p, [0, 0.5, 1], [4, 2, 0]);
      baseY = interpolate(p, [0, 0.5, 1], [-1, 0, 0]);
    }

    const floatX = Math.sin(time * 0.5) * 1.5 + Math.sin(time * 0.3) * 1;
    const floatY = Math.cos(time * 0.4) * 1.2 + Math.cos(time * 0.25) * 0.8;
    const floatZ = Math.sin(time * 0.35) * 0.8;

    path.push(new THREE.Vector3(baseX + floatX, baseY + floatY, floatZ));
  }

  return path;
}

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

function simulatePhysics(
  totalFrames: number,
  fps: number,
  leaderPath: THREE.Vector3[]
): FollowerData[][] {
  const dt = 1 / fps;
  const history: FollowerData[][] = [];

  const followers: FollowerData[] = [];
  for (let i = 0; i < SETTINGS.baseCount; i++) {
    followers.push(createFollower());
  }

  let lastSpawnThreshold = 0;
  const tmp1 = new THREE.Vector3();
  const tmp2 = new THREE.Vector3();
  const tmp3 = new THREE.Vector3();

  let prevLeader = leaderPath[0].clone();

  for (let frame = 0; frame < totalFrames; frame++) {
    const leader = leaderPath[frame];
    const leaderVel = tmp1.copy(leader).sub(prevLeader).divideScalar(dt);
    prevLeader.copy(leader);

    const progress = frame / totalFrames;
    const easeT = progress * progress * (3 - 2 * progress);

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

    for (const fi of followers) {
      const p = fi.position;

      tmp1.copy(leader).sub(p);
      const dist = tmp1.length() + 1e-6;
      const dir = tmp1.multiplyScalar(1 / dist);

      const pull = SETTINGS.gravity / (dist + SETTINGS.soften);
      tmp2.copy(dir).multiplyScalar(pull);

      const shellError = dist - SETTINGS.shellRadius;
      tmp2.addScaledVector(dir, shellError * SETTINGS.shellStrength);

      const tangent = tmp3.copy(dir).cross(fi.axis);
      tmp2.addScaledVector(tangent, SETTINGS.orbit);

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

      fi.velocity.addScaledVector(tmp2, dt);

      const vlen = fi.velocity.length();
      if (vlen > SETTINGS.maxVelocity) {
        fi.velocity.multiplyScalar(SETTINGS.maxVelocity / vlen);
      }

      fi.velocity.multiplyScalar(Math.pow(SETTINGS.friction, dt * 60));
      p.addScaledVector(fi.velocity, dt);

      fi.rotationY += dt * 0.25;
      fi.rotationX += dt * 0.16;
    }

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

const sphereGeometry = new THREE.SphereGeometry(0.55, 32, 24);

const FollowerSphere: React.FC<{
  data: FollowerData;
  colorA: THREE.Color;
  colorB: THREE.Color;
  leaderPos: THREE.Vector3;
  leaderColor: THREE.Color;
}> = ({ data, colorA, colorB, leaderPos, leaderColor }) => {
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

  const dist = data.position.distanceTo(leaderPos);
  if (dist < SETTINGS.leaderColorRange) {
    const influence = (1 - dist / SETTINGS.leaderColorRange) * SETTINGS.leaderColorInfluence;
    material.color.lerp(leaderColor, influence);
  }

  return (
    <mesh
      geometry={sphereGeometry}
      material={material}
      position={[data.position.x, data.position.y, data.position.z]}
      scale={data.size}
      rotation={[data.rotationX, data.rotationY, 0]}
    />
  );
};

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

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

const Scene: React.FC<{
  leaderPath: THREE.Vector3[];
  physicsHistory: FollowerData[][];
}> = ({ leaderPath, physicsHistory }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const progress = frame / durationInFrames;

  const easeT = progress * progress * (3 - 2 * progress);

  const currentFrame = Math.min(frame, physicsHistory.length - 1);
  const followers = physicsHistory[currentFrame] || [];
  const leaderPos = leaderPath[currentFrame] || new THREE.Vector3();

  const horizontalPos = Math.max(-1, Math.min(1, leaderPos.x / 8));
  const leftBlend = Math.max(0, -horizontalPos);
  const rightBlend = Math.max(0, horizontalPos);

  const colorA = useMemo(() => {
    const start = new THREE.Color(SETTINGS.colorA);
    const end = new THREE.Color(SETTINGS.colorAEnd);
    const scrollColor = start.clone().lerp(end, easeT);
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

  const leaderLightIntensity = lerp(SETTINGS.leaderLightIntensity, SETTINGS.leaderLightIntensityMax, easeT);
  const leaderLightDistance = lerp(SETTINGS.leaderLightDistance, SETTINGS.leaderLightDistanceMax, easeT);
  const leaderEmissiveIntensity = lerp(SETTINGS.leaderEmissiveIntensity, SETTINGS.leaderEmissiveIntensityMax, easeT);
  const bloomStrength = lerp(SETTINGS.bloomStrength, SETTINGS.bloomStrengthMax, easeT);
  const bloomThreshold = lerp(SETTINGS.bloomThreshold, SETTINGS.bloomThresholdMin, easeT);

  const { camera } = useThree();
  React.useEffect(() => {
    camera.position.x = leaderPos.x * 0.02;
    camera.position.y = 0.2 + leaderPos.y * 0.02;
    camera.lookAt(0, 0, 0);
  }, [camera, leaderPos]);

  return (
    <>
      <color attach="background" args={["#f8fafc"]} />

      <ambientLight intensity={SETTINGS.ambientIntensity} />
      <directionalLight
        position={[7, 12, 10]}
        intensity={SETTINGS.keyIntensity}
      />
      <directionalLight
        position={[-10, 3, 8]}
        intensity={SETTINGS.rimIntensity}
        color="#a78bfa"
      />

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

      <Environment preset="studio" />

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

const GridBackground: React.FC = () => (
  <>
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
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `
          linear-gradient(to right, rgba(37, 211, 102, 0.1) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(37, 211, 102, 0.1) 1px, transparent 1px)
        `,
        backgroundSize: "60px 60px",
        filter: "drop-shadow(0 0 3px rgba(37, 211, 102, 0.4))",
        maskImage: "linear-gradient(to bottom right, black 0%, black 25%, transparent 70%)",
        WebkitMaskImage: "linear-gradient(to bottom right, black 0%, black 25%, transparent 70%)",
      }}
    />
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `
          radial-gradient(ellipse 80% 60% at 0% 0%, rgba(37, 211, 102, 0.12) 0%, transparent 50%),
          radial-gradient(ellipse 50% 40% at 100% 100%, rgba(18, 140, 126, 0.08) 0%, transparent 50%)
        `,
      }}
    />
  </>
);

export const WhatsAppBackground: React.FC = () => {
  const { fps, durationInFrames, width, height } = useVideoConfig();

  const { leaderPath, physicsHistory } = useMemo(() => {
    const leaderPath = computeLeaderPath(durationInFrames, fps);
    const physicsHistory = simulatePhysics(durationInFrames, fps, leaderPath);
    return { leaderPath, physicsHistory };
  }, [durationInFrames, fps]);

  return (
    <div style={{ position: "absolute", inset: 0, width, height, background: "#f8fafc", overflow: "hidden" }}>
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
          alpha: false,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
        }}
      >
        <Scene leaderPath={leaderPath} physicsHistory={physicsHistory} />
      </ThreeCanvas>

      <div style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none" }}>
        <GridBackground />
      </div>
    </div>
  );
};
