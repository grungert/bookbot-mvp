import React, { useMemo } from "react";
import {
  AbsoluteFill,
  interpolate,
  interpolateColors,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// Physics settings - EXACT values from landing page sphere-background.tsx
// The key is shellRadius (3.2) < leaderRadius (3.85) so spheres try to get inside,
// but collision bounces them off - creating tight hugging cluster
const PHYSICS = {
  // Base unit for scaling: 1 "unit" = 45 pixels
  baseUnit: 45,

  // EXACT landing page values:
  leaderSize: 7,        // Leader is 7x base unit
  gravity: 24.0,
  shellRadius: 3.2,     // In units, NOT pixels
  shellStrength: 6.5,
  orbit: 1.0,
  maxVelocity: 15,
  friction: 0.96,
  soften: 0.2,
  collisionRestitution: 0.7,
  leaderBounceRestitution: 1.2,  // Landing page uses 1.2 for leader collision

  // Follower sizes (in units, like THREE.js sphereGeo scale)
  minSize: 0.55,
  maxSize: 1.55,

  // Sphere count
  baseCount: 50,
};

// Scene timing - must match theme.ts sceneTiming
const SCENES = {
  hook: { start: 0, end: 120 },
  hero: { start: 120, end: 270 },
  channels: { start: 270, end: 510 }, // NEW
  chatDemo: { start: 510, end: 810 },
  dashboard: { start: 810, end: 1110 },
  features: { start: 1110, end: 1410 },
  useCases: { start: 1410, end: 1560 },
  cta: { start: 1560, end: 1800 },
};

// Colors
const COLORS = {
  background: "#f8fafc",
  // Start colors (blue)
  primaryStart: "#1f56da",
  secondaryStart: "#86b6ff",
  leaderStart: "#1f56da",
  // End colors (purple)
  primaryEnd: "#7c3aed",
  secondaryEnd: "#c4b5fd",
  leaderEnd: "#7c3aed",
};

// Grid Background
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
          linear-gradient(to right, rgba(59, 130, 246, 0.1) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
        `,
        backgroundSize: "60px 60px",
        filter: "drop-shadow(0 0 3px rgba(59, 130, 246, 0.4))",
        maskImage: "linear-gradient(to bottom right, black 0%, black 25%, transparent 70%)",
        WebkitMaskImage: "linear-gradient(to bottom right, black 0%, black 25%, transparent 70%)",
      }}
    />
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

interface Sphere {
  id: number;
  x: number;
  y: number;
  z: number; // pseudo-depth for 3D effect (-1 to 1, 0 = same plane as leader)
  vx: number;
  vy: number;
  vz: number; // velocity in z
  size: number; // in base units
  colorType: "A" | "B";
  // 3D orbit axis (like THREE.js Vector3) - determines orbital plane inclination
  axisX: number;
  axisY: number;
  axisZ: number;
  // Rotation for highlight animation (like landing page lines 549-551)
  rotationX: number;
  rotationY: number;
  baseZIndex: number;
}

// Generate followers - spawn in 3D volume around leader (EXACT like landing page)
// Landing page spawns in cylindrical volume: r=10-22, y=-12 to 12, z=-14 to 8
function generateFollowers(count: number, width: number, height: number): Sphere[] {
  const spheres: Sphere[] = [];
  const unit = PHYSICS.baseUnit;
  const centerX = width * 0.22; // Initial leader position
  const centerY = height * 0.5;

  for (let i = 0; i < count; i++) {
    // Size: linear interpolation like landing page (line 277)
    const size = PHYSICS.minSize + Math.random() * (PHYSICS.maxSize - PHYSICS.minSize);

    // Spawn position matching landing page (lines 286-290)
    // Landing page: angle for x, r=10-22, y=-12 to 12, z=-14 to 8
    const angle = Math.random() * Math.PI * 2;
    const r = 10 + Math.random() * 12; // randFloat(10, 22) in units
    const spawnY_units = -12 + Math.random() * 24; // randFloat(-12, 12)
    const spawnZ_units = -14 + Math.random() * 22; // randFloat(-14, 8)

    // Convert to pixels (x uses cos(angle)*r, y is the vertical spread)
    // In landing page: position.set(cos(angle) * r, y, z)
    // Our 2D: x = horizontal, y = vertical, z = depth
    const spawnX = centerX + Math.cos(angle) * r * unit;
    const spawnY = centerY + spawnY_units * unit * 0.3; // Scale down y spread for video

    // Z depth normalized to our range (-1.5 to 1.5)
    // Landing page z: -14 to 8, center around -3, range 22
    const spawnZ = (spawnZ_units + 3) / 11; // Normalize to roughly -1 to 1

    // Random 3D axis for orbit (like landing page lines 299-303)
    let axisX = Math.random() - 0.5;
    let axisY = Math.random() - 0.5;
    let axisZ = Math.random() - 0.5;
    const axisLen = Math.sqrt(axisX * axisX + axisY * axisY + axisZ * axisZ) + 0.001;
    axisX /= axisLen;
    axisY /= axisLen;
    axisZ /= axisLen;

    spheres.push({
      id: i,
      x: spawnX,
      y: spawnY,
      z: spawnZ,
      // Initial velocity matching landing page (lines 292-296)
      // randFloatSpread(0.15) for x,y and randFloatSpread(0.1) for z
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.15,
      vz: (Math.random() - 0.5) * 0.1,
      size,
      colorType: Math.random() > 0.5 ? "A" : "B",
      axisX,
      axisY,
      axisZ,
      // Initial rotation (random start for variety)
      rotationX: Math.random() * Math.PI * 2,
      rotationY: Math.random() * Math.PI * 2,
      baseZIndex: Math.floor(30 + size * 25),
    });
  }

  return spheres;
}

// Get leader position based on scene
function getLeaderPosition(
  frame: number,
  width: number,
  height: number,
  fps: number
): { x: number; y: number } {
  const time = frame / fps;
  let baseX: number, baseY: number;

  if (frame < SCENES.hook.end) {
    // Hook: Enter from left
    const p = frame / SCENES.hook.end;
    baseX = interpolate(p, [0, 0.4, 1], [-100, width * 0.18, width * 0.22]);
    baseY = interpolate(p, [0, 0.5, 1], [height * 0.6, height * 0.45, height * 0.5]);
  } else if (frame < SCENES.hero.end) {
    // Hero: Float on left near logo
    const p = (frame - SCENES.hero.start) / (SCENES.hero.end - SCENES.hero.start);
    baseX = interpolate(p, [0, 0.5, 1], [width * 0.22, width * 0.18, width * 0.2]);
    baseY = interpolate(p, [0, 0.5, 1], [height * 0.5, height * 0.42, height * 0.46]);
  } else if (frame < SCENES.channels.end) {
    // Channels: Float on left side, gentle movement behind channel cards
    const p = (frame - SCENES.channels.start) / (SCENES.channels.end - SCENES.channels.start);
    baseX = interpolate(p, [0, 0.5, 1], [width * 0.2, width * 0.15, width * 0.18]);
    baseY = interpolate(p, [0, 0.5, 1], [height * 0.46, height * 0.5, height * 0.48]);
  } else if (frame < SCENES.chatDemo.end) {
    // Chat: Stay left, follow conversation
    const p = (frame - SCENES.chatDemo.start) / (SCENES.chatDemo.end - SCENES.chatDemo.start);
    baseX = interpolate(p, [0, 0.5, 1], [width * 0.18, width * 0.15, width * 0.18]);
    baseY = interpolate(p, [0, 0.3, 0.7, 1], [height * 0.48, height * 0.52, height * 0.48, height * 0.5]);
  } else if (frame < SCENES.dashboard.end) {
    // Dashboard: Move down below panel
    const p = (frame - SCENES.dashboard.start) / (SCENES.dashboard.end - SCENES.dashboard.start);
    baseX = interpolate(p, [0, 0.5, 1], [width * 0.18, width * 0.22, width * 0.2]);
    baseY = interpolate(p, [0, 0.4, 1], [height * 0.5, height * 0.72, height * 0.65]);
  } else if (frame < SCENES.features.end) {
    // Features: Sweep right across grid
    const p = (frame - SCENES.features.start) / (SCENES.features.end - SCENES.features.start);
    baseX = interpolate(p, [0, 0.4, 0.7, 1], [width * 0.2, width * 0.4, width * 0.5, width * 0.25]);
    baseY = interpolate(p, [0, 0.5, 1], [height * 0.65, height * 0.75, height * 0.6]);
  } else if (frame < SCENES.useCases.end) {
    // Use cases: Sweep across icons
    const p = (frame - SCENES.useCases.start) / (SCENES.useCases.end - SCENES.useCases.start);
    baseX = interpolate(p, [0, 0.5, 1], [width * 0.12, width * 0.5, width * 0.2]);
    baseY = interpolate(p, [0, 0.5, 1], [height * 0.6, height * 0.55, height * 0.5]);
  } else {
    // CTA: Center for finale
    const p = (frame - SCENES.cta.start) / (SCENES.cta.end - SCENES.cta.start);
    baseX = interpolate(p, [0, 0.5, 1], [width * 0.2, width * 0.28, width * 0.25]);
    baseY = interpolate(p, [0, 0.5, 1], [height * 0.5, height * 0.45, height * 0.48]);
  }

  // Organic floating motion
  const floatX = Math.sin(time * 0.5) * 25 + Math.sin(time * 0.3) * 15;
  const floatY = Math.cos(time * 0.4) * 20 + Math.cos(time * 0.25) * 12;

  return { x: baseX + floatX, y: baseY + floatY };
}

// Physics simulation - ported from landing page sphere-background.tsx
// Works in 3D (x, y, z) with units like the THREE.js implementation
// The z-axis creates depth illusion (spheres orbit around leader in 3D)
function simulatePhysics(
  initialSpheres: Sphere[],
  width: number,
  height: number,
  totalFrames: number,
  fps: number
): { spheres: Sphere[][]; leaderPath: { x: number; y: number }[] } {
  const dt = 1 / fps;
  const unit = PHYSICS.baseUnit;
  const shellR = PHYSICS.shellRadius; // 3.2 units
  const leaderR = 0.55 * PHYSICS.leaderSize; // 3.85 units

  // Z depth range in units (like landing page z: -14 to 8, normalized)
  const zDepthScale = 3; // How much z affects the physics

  const sphereHistory: Sphere[][] = [];
  const leaderPath: { x: number; y: number }[] = [];

  let spheres = initialSpheres.map(s => ({ ...s }));
  let prevLeader = getLeaderPosition(0, width, height, fps);

  for (let frame = 0; frame < totalFrames; frame++) {
    const leader = getLeaderPosition(frame, width, height, fps);
    leaderPath.push(leader);

    // Leader velocity in UNITS
    const leaderVxU = (leader.x - prevLeader.x) / unit / dt;
    const leaderVyU = (leader.y - prevLeader.y) / unit / dt;
    prevLeader = { ...leader };

    // Update each sphere - 3D PHYSICS
    for (const s of spheres) {
      // Convert positions to units (leader is at z=0)
      const sx = s.x / unit;
      const sy = s.y / unit;
      const sz = s.z * zDepthScale; // z is already in units (-1 to 1 * scale)
      const leaderX = leader.x / unit;
      const leaderY = leader.y / unit;
      const leaderZ = 0; // Leader is at z=0

      // 3D direction to leader
      const dx = leaderX - sx;
      const dy = leaderY - sy;
      const dz = leaderZ - sz;
      const dist3D = Math.sqrt(dx * dx + dy * dy + dz * dz) + 1e-6;
      const dirX = dx / dist3D;
      const dirY = dy / dist3D;
      const dirZ = dz / dist3D;

      // Gravity pull in 3D - landing page line 501
      const pull = PHYSICS.gravity / (dist3D + PHYSICS.soften);
      let ax = dirX * pull;
      let ay = dirY * pull;
      let az = dirZ * pull;

      // Shell force in 3D - keeps spheres at shellRadius from leader
      const shellError = dist3D - shellR;
      ax += dirX * shellError * PHYSICS.shellStrength;
      ay += dirY * shellError * PHYSICS.shellStrength;
      az += dirZ * shellError * PHYSICS.shellStrength;

      // 3D Orbital force using cross product (like landing page line 509)
      // tangent = dir × axis (cross product creates perpendicular orbit direction)
      const tangentX = dirY * s.axisZ - dirZ * s.axisY;
      const tangentY = dirZ * s.axisX - dirX * s.axisZ;
      const tangentZ = dirX * s.axisY - dirY * s.axisX;
      ax += tangentX * PHYSICS.orbit;
      ay += tangentY * PHYSICS.orbit;
      az += tangentZ * PHYSICS.orbit;

      // Leader collision with bounce - 3D version
      const followerR = 0.55 * s.size;
      const minDistLeader = leaderR + followerR;

      if (dist3D < minDistLeader) {
        const overlap = minDistLeader - dist3D;
        // Push out in 3D
        s.x -= dirX * overlap * unit;
        s.y -= dirY * overlap * unit;
        s.z -= dirZ * overlap / zDepthScale;

        // 3D relative velocity
        const relVx = s.vx - leaderVxU;
        const relVy = s.vy - leaderVyU;
        const relVz = s.vz; // Leader doesn't move in z
        const velAlongNormal = relVx * dirX + relVy * dirY + relVz * dirZ;

        if (velAlongNormal > 0) {
          const impulse = -(1 + PHYSICS.leaderBounceRestitution) * velAlongNormal;
          s.vx += impulse * dirX;
          s.vy += impulse * dirY;
          s.vz += impulse * dirZ;

          // Leader velocity influence
          const leaderSpeed = Math.sqrt(leaderVxU * leaderVxU + leaderVyU * leaderVyU);
          if (leaderSpeed > 0.5) {
            s.vx += -dirX * leaderSpeed * 1.5;
            s.vy += -dirY * leaderSpeed * 1.5;
          }
        }
      }

      // Integrate velocity
      s.vx += ax * dt;
      s.vy += ay * dt;
      s.vz += az * dt;

      // Clamp 3D velocity
      const speed = Math.sqrt(s.vx * s.vx + s.vy * s.vy + s.vz * s.vz);
      if (speed > PHYSICS.maxVelocity) {
        const scale = PHYSICS.maxVelocity / speed;
        s.vx *= scale;
        s.vy *= scale;
        s.vz *= scale;
      }

      // Friction
      const friction = Math.pow(PHYSICS.friction, dt * 60);
      s.vx *= friction;
      s.vy *= friction;
      s.vz *= friction;

      // Position update
      s.x += s.vx * unit * dt;
      s.y += s.vy * unit * dt;
      s.z += s.vz * dt; // z is in normalized units, not pixels

      // Clamp z to prevent spheres from going too far in depth
      s.z = Math.max(-1.5, Math.min(1.5, s.z));

      // Subtle rotation for highlights (like landing page lines 549-551)
      s.rotationY += dt * 0.25;
      s.rotationX += dt * 0.16;
    }

    // Sphere-to-sphere collision in 3D
    for (let i = 0; i < spheres.length; i++) {
      for (let j = i + 1; j < spheres.length; j++) {
        const a = spheres[i];
        const b = spheres[j];

        // 3D radii and distance
        const radiusA = 0.55 * a.size;
        const radiusB = 0.55 * b.size;
        const minDist = radiusA + radiusB;

        const ax_u = a.x / unit;
        const ay_u = a.y / unit;
        const az_u = a.z * zDepthScale;
        const bx_u = b.x / unit;
        const by_u = b.y / unit;
        const bz_u = b.z * zDepthScale;

        const dx = ax_u - bx_u;
        const dy = ay_u - by_u;
        const dz = az_u - bz_u;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < minDist && dist > 0.0001) {
          const overlap = minDist - dist;
          const nx = dx / dist;
          const ny = dy / dist;
          const nz = dz / dist;

          // Separate in 3D
          const correction = overlap * 0.5;
          a.x += nx * correction * unit;
          a.y += ny * correction * unit;
          a.z += nz * correction / zDepthScale;
          b.x -= nx * correction * unit;
          b.y -= ny * correction * unit;
          b.z -= nz * correction / zDepthScale;

          // 3D bounce
          const relVx = a.vx - b.vx;
          const relVy = a.vy - b.vy;
          const relVz = a.vz - b.vz;
          const velAlongNormal = relVx * nx + relVy * ny + relVz * nz;

          if (velAlongNormal < 0) {
            const impulse = -(1 + PHYSICS.collisionRestitution) * velAlongNormal * 0.5;
            a.vx += impulse * nx;
            a.vy += impulse * ny;
            a.vz += impulse * nz;
            b.vx -= impulse * nx;
            b.vy -= impulse * ny;
            b.vz -= impulse * nz;
          }
        }
      }
    }

    sphereHistory.push(spheres.map(s => ({ ...s })));
  }

  return { spheres: sphereHistory, leaderPath };
}

// Follower sphere visual with 3D glossy effect matching MeshPhysicalMaterial look
const FollowerSphere: React.FC<{
  x: number;
  y: number;
  z: number; // depth: -1 (far/behind) to 1 (close/front)
  size: number;
  color: string;
  baseZIndex: number;
  glowColor: string;
  distToLeader: number;
  leaderColor: string;
  rotationX: number;
  rotationY: number;
}> = ({ x, y, z, size, color, baseZIndex, glowColor, distToLeader, leaderColor, rotationX, rotationY }) => {
  // Z affects visual size (perspective) and opacity
  // z > 0 means closer (in front), z < 0 means further (behind)
  const depthScale = 1 + z * 0.15; // Closer = larger, further = smaller
  const sizePx = size * PHYSICS.baseUnit * depthScale;

  // Z affects opacity - further spheres are slightly faded
  const depthOpacity = 0.7 + (z + 1) * 0.15; // 0.7 at z=-1, 1.0 at z=1

  // Z affects zIndex - closer spheres render on top
  const zIndex = baseZIndex + Math.round(z * 20);

  // Rotation affects highlight position (simulates 3D sphere rotation)
  // Landing page rotates mesh.rotation.y and mesh.rotation.x
  const highlightOffsetX = Math.sin(rotationY) * 8; // ±8% shift
  const highlightOffsetY = Math.sin(rotationX) * 6; // ±6% shift

  // Proximity tinting - followers closer to leader get tinted (like landing page leaderColorInfluence)
  const tintRange = 200; // pixels
  const tintStrength = Math.max(0, 1 - distToLeader / tintRange) * 0.6;

  // Create slightly iridescent look by shifting hue based on position
  const iridescenceShift = (x + y) % 30;

  return (
    <div
      style={{
        position: "absolute",
        left: x - sizePx / 2,
        top: y - sizePx / 2,
        width: sizePx,
        height: sizePx,
        borderRadius: "50%",
        opacity: depthOpacity, // Depth-based opacity for 3D effect
        // Multi-stop gradient to simulate clearcoat + metalness + iridescence
        background: `radial-gradient(circle at 32% 28%,
          rgba(255,255,255,0.98) 0%,
          rgba(255,255,255,0.7) 6%,
          rgba(220,235,255,0.4) 12%,
          ${color} 28%,
          ${color} 55%,
          rgba(20,30,80,0.35) 85%,
          rgba(10,15,50,0.5) 100%)`,
        // Multiple shadow layers to simulate bloom effect
        boxShadow: `
          inset -${sizePx * 0.06}px -${sizePx * 0.06}px ${sizePx * 0.2}px rgba(0,20,80,0.4),
          inset ${sizePx * 0.03}px ${sizePx * 0.03}px ${sizePx * 0.12}px rgba(220,240,255,0.6),
          0 0 ${sizePx * 0.15}px ${glowColor},
          0 0 ${sizePx * 0.4}px ${glowColor}60,
          0 0 ${sizePx * 0.7}px ${glowColor}25
        `,
        zIndex,
        // Add subtle tint overlay from leader proximity
        filter: tintStrength > 0.1 ? `drop-shadow(0 0 ${sizePx * 0.2 * tintStrength}px ${leaderColor})` : undefined,
      }}
    >
      {/* Primary highlight - clearcoat reflection (animated by rotation) */}
      <div
        style={{
          position: "absolute",
          top: `${8 + highlightOffsetY}%`,
          left: `${16 + highlightOffsetX}%`,
          width: "35%",
          height: "25%",
          borderRadius: "50%",
          background: "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.3) 50%, transparent 100%)",
          filter: "blur(0.5px)",
        }}
      />
      {/* Secondary highlight - adds depth (animated by rotation) */}
      <div
        style={{
          position: "absolute",
          top: `${15 + highlightOffsetY * 0.5}%`,
          left: `${52 + highlightOffsetX * 0.5}%`,
          width: "12%",
          height: "8%",
          borderRadius: "50%",
          background: "rgba(255,255,255,0.5)",
          filter: "blur(0.5px)",
        }}
      />
      {/* Iridescence shimmer effect (animated by rotation) */}
      <div
        style={{
          position: "absolute",
          inset: "20%",
          borderRadius: "50%",
          background: `radial-gradient(ellipse at ${30 + iridescenceShift + highlightOffsetX}% ${40 + iridescenceShift + highlightOffsetY}%,
            rgba(150,180,255,0.15) 0%,
            rgba(200,150,255,0.1) 30%,
            transparent 70%)`,
          mixBlendMode: "overlay",
        }}
      />
    </div>
  );
};

// Leader sphere - large, glowing, emissive (matching landing page's leader with point light)
const LeaderSphere: React.FC<{
  x: number;
  y: number;
  color: string;
  glowColor: string;
  emissiveColor: string;
}> = ({ x, y, color, glowColor, emissiveColor }) => {
  const size = PHYSICS.leaderSize * PHYSICS.baseUnit; // 315px (7 * 45)

  return (
    <div
      style={{
        position: "absolute",
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        borderRadius: "50%",
        // Leader has clearcoat: 1.0, roughness: 0.15 - very glossy
        background: `radial-gradient(circle at 32% 26%,
          rgba(255,255,255,0.95) 0%,
          rgba(255,255,255,0.7) 5%,
          rgba(230,240,255,0.5) 10%,
          ${color} 25%,
          ${color} 50%,
          rgba(30,50,100,0.4) 80%,
          rgba(10,20,60,0.6) 100%)`,
        // Strong bloom simulation with multiple layers
        boxShadow: `
          inset -${size * 0.05}px -${size * 0.05}px ${size * 0.15}px rgba(0,20,80,0.45),
          inset ${size * 0.03}px ${size * 0.03}px ${size * 0.1}px rgba(220,240,255,0.7),
          0 0 ${size * 0.2}px ${glowColor},
          0 0 ${size * 0.5}px ${glowColor}80,
          0 0 ${size * 0.8}px ${glowColor}50,
          0 0 ${size * 1.2}px ${glowColor}30,
          0 0 ${size * 1.8}px ${emissiveColor}20
        `,
        zIndex: 45,
      }}
    >
      {/* Main clearcoat highlight - larger and more prominent */}
      <div
        style={{
          position: "absolute",
          top: "5%",
          left: "12%",
          width: "42%",
          height: "32%",
          borderRadius: "50%",
          background: "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.4) 40%, rgba(255,255,255,0.1) 70%, transparent 100%)",
          filter: "blur(2px)",
        }}
      />
      {/* Secondary highlight for depth */}
      <div
        style={{
          position: "absolute",
          top: "12%",
          left: "54%",
          width: "16%",
          height: "10%",
          borderRadius: "50%",
          background: "rgba(255,255,255,0.7)",
          filter: "blur(1.5px)",
        }}
      />
      {/* Emissive inner glow - simulates leaderEmissiveIntensity */}
      <div
        style={{
          position: "absolute",
          inset: "10%",
          borderRadius: "50%",
          background: `radial-gradient(circle at 50% 55%,
            ${emissiveColor}40 0%,
            ${emissiveColor}25 30%,
            ${glowColor}15 50%,
            transparent 75%)`,
        }}
      />
      {/* Rim light effect */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: `radial-gradient(circle at 75% 70%,
            transparent 40%,
            rgba(155,182,255,0.15) 70%,
            rgba(155,182,255,0.25) 85%,
            transparent 100%)`,
        }}
      />
      {/* Subtle iridescence */}
      <div
        style={{
          position: "absolute",
          inset: "15%",
          borderRadius: "50%",
          background: `radial-gradient(ellipse at 40% 35%,
            rgba(180,200,255,0.2) 0%,
            rgba(200,170,255,0.15) 30%,
            transparent 60%)`,
          mixBlendMode: "overlay",
        }}
      />
    </div>
  );
};

// Main component
export const AnimatedBackground: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();
  const progress = frame / durationInFrames;

  // Pre-compute simulation - use baseCount spheres
  const simulation = useMemo(() => {
    const followers = generateFollowers(PHYSICS.baseCount, width, height);
    return simulatePhysics(followers, width, height, durationInFrames, fps);
  }, [width, height, durationInFrames, fps]);

  const currentSpheres = simulation.spheres[Math.min(frame, durationInFrames - 1)] || [];
  const leaderPos = simulation.leaderPath[Math.min(frame, durationInFrames - 1)] || { x: width * 0.2, y: height * 0.5 };

  // Color transitions
  const colorA = interpolateColors(
    progress,
    [0, 0.5, 1],
    [COLORS.primaryStart, COLORS.primaryEnd, COLORS.primaryStart]
  );
  const colorB = interpolateColors(
    progress,
    [0, 0.5, 1],
    [COLORS.secondaryStart, COLORS.secondaryEnd, COLORS.secondaryStart]
  );
  const leaderColor = interpolateColors(
    progress,
    [0, 0.5, 1],
    [COLORS.leaderStart, COLORS.leaderEnd, COLORS.leaderStart]
  );

  // Glow colors (slightly lighter) - matching landing page bloom
  const glowA = interpolateColors(
    progress,
    [0, 0.5, 1],
    ["rgba(31,86,218,0.5)", "rgba(124,58,237,0.5)", "rgba(31,86,218,0.5)"]
  );
  const glowB = interpolateColors(
    progress,
    [0, 0.5, 1],
    ["rgba(134,182,255,0.4)", "rgba(196,181,253,0.4)", "rgba(134,182,255,0.4)"]
  );
  const leaderGlow = interpolateColors(
    progress,
    [0, 0.5, 1],
    ["rgba(31,86,218,0.6)", "rgba(124,58,237,0.6)", "rgba(31,86,218,0.6)"]
  );

  // Emissive color for leader (matching leaderLightColor in landing page)
  const leaderEmissive = interpolateColors(
    progress,
    [0, 0.5, 1],
    ["#052c7a", "#4c1d95", "#052c7a"]
  );

  return (
    <AbsoluteFill style={{ background: COLORS.background, overflow: "hidden" }}>
      <GridBackground />

      <div style={{ position: "absolute", inset: 0 }}>
        {/* Followers */}
        {currentSpheres.map((s) => {
          // Calculate distance to leader for proximity tinting
          const dx = s.x - leaderPos.x;
          const dy = s.y - leaderPos.y;
          const distToLeader = Math.sqrt(dx * dx + dy * dy);

          return (
            <FollowerSphere
              key={s.id}
              x={s.x}
              y={s.y}
              z={s.z}
              size={s.size}
              color={s.colorType === "A" ? colorA : colorB}
              glowColor={s.colorType === "A" ? glowA : glowB}
              baseZIndex={s.baseZIndex}
              distToLeader={distToLeader}
              leaderColor={leaderColor}
              rotationX={s.rotationX}
              rotationY={s.rotationY}
            />
          );
        })}

        {/* Leader */}
        <LeaderSphere
          x={leaderPos.x}
          y={leaderPos.y}
          color={leaderColor}
          glowColor={leaderGlow}
          emissiveColor={leaderEmissive}
        />
      </div>

      <AbsoluteFill style={{ zIndex: 100 }}>
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// Glass components
export const GlassPanel: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
  emphasized?: boolean;
}> = ({ children, style, emphasized = false }) => (
  <div
    style={{
      background: "rgba(255,255,255,0.88)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      border: "1px solid rgba(255,255,255,0.9)",
      borderRadius: 24,
      boxShadow: emphasized
        ? "0 25px 50px -12px rgba(59,130,246,0.25), 0 20px 40px -15px rgba(168,85,247,0.2)"
        : "0 10px 15px -3px rgba(59,130,246,0.08), 0 4px 6px -4px rgba(168,85,247,0.08)",
      ...style,
    }}
  >
    {children}
  </div>
);

export const GradientText: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ children, style }) => (
  <span
    style={{
      background: "linear-gradient(135deg, #3b82f6 0%, #7c3aed 100%)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
      ...style,
    }}
  >
    {children}
  </span>
);

export const GlassCard: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
  emphasized?: boolean;
}> = ({ children, style, emphasized = false }) => (
  <div
    style={{
      background: "rgba(255,255,255,0.92)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      border: "1px solid rgba(59,130,246,0.1)",
      borderRadius: 16,
      boxShadow: emphasized
        ? "0 25px 50px -12px rgba(59,130,246,0.25), 0 20px 40px -15px rgba(168,85,247,0.2)"
        : "0 10px 15px -3px rgba(59,130,246,0.08), 0 4px 6px -4px rgba(168,85,247,0.08)",
      ...style,
    }}
  >
    {children}
  </div>
);
