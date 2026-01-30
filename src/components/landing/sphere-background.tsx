"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

// Base settings configuration
const createSettings = (isMobile: boolean) => ({
  // population
  baseCount: isMobile ? 30 : 40,
  maxCount: isMobile ? 30 : 80, // max spheres at full scroll (reduced for performance)
  minSize: 0.55,
  maxSize: 1.55,

  // leader follow
  leaderSize: 7,
  leaderFollow: 0.28,
  leaderPlaneDist: 30,

  // surround physics
  gravity: 24.0,
  shellRadius: 3.2,
  shellStrength: 6.5,
  orbit: 1.0,
  separation: 0.8,
  maxVelocity: 15,
  friction: 0.96,
  soften: 0.2,
  collisionRestitution: 0.7,

  // colors (center/base)
  colorA: "#1f56da",
  colorB: "#86b6ff",
  leaderColor: "#1f56da",
  leaderLightColor: "#052c7a",

  // colors (end - on scroll)
  colorAEnd: "#7c3aed",
  colorBEnd: "#c4b5fd",
  leaderColorEnd: "#7c3aed",
  leaderLightColorEnd: "#4c1d95",

  // colors (left - cooler blues)
  colorALeft: "#0ea5e9",
  colorBLeft: "#7dd3fc",
  leaderColorLeft: "#0284c7",
  leaderLightColorLeft: "#0c4a6e",

  // colors (right - warmer purples/pinks)
  colorARight: "#a855f7",
  colorBRight: "#e879f9",
  leaderColorRight: "#9333ea",
  leaderLightColorRight: "#581c87",

  // camera tilt
  cameraTiltAmount: 0.15, // max tilt in radians

  // leader light (base)
  leaderLightIntensity: 600,
  leaderLightIntensityMax: 900, // at full scroll (halved change)
  leaderLightDistance: 11,
  leaderLightDistanceMax: 14.5, // at full scroll (halved change)
  leaderEmissiveIntensity: 0.5,
  leaderEmissiveIntensityMax: 0.85, // at full scroll (halved change)
  leaderColorInfluence: 0.6,
  leaderColorRange: 12,

  // lighting
  ambientIntensity: 0.25,
  keyIntensity: 0.6,
  rimIntensity: 1.2,
  exposure: 1.1,

  // bloom (base)
  bloomStrength: 0.25,
  bloomStrengthMax: 0.425, // at full scroll (halved change)
  bloomRadius: 0.6,
  bloomThreshold: 0.75,
  bloomThresholdMin: 0.625, // at full scroll (halved change)
});

interface Follower {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  axis: THREE.Vector3;
  baseColor: THREE.Color;
  colorType: 'A' | 'B'; // track which color this sphere uses
}

function makeSphereMaterial(hex: string): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(hex),
    roughness: 0.35,
    metalness: 0.1,
    clearcoat: 0.5,
    clearcoatRoughness: 0.1,
    envMapIntensity: 0.25,
    iridescence: 0.3,
    iridescenceIOR: 1.3,
    iridescenceThicknessRange: [100, 400],
  });
}

export function SphereBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);

    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion || !containerRef.current) return;

    const container = containerRef.current;
    const isMobile = window.innerWidth < 768;
    const settings = createSettings(isMobile);

    // Scroll state
    let scrollProgress = 0; // 0 to 1
    let horizontalPos = 0; // -1 (left) to 1 (right)
    let smoothHorizontalPos = 0; // smoothed version for effects
    let currentColorA = new THREE.Color(settings.colorA);
    let currentColorB = new THREE.Color(settings.colorB);
    const targetColorA = new THREE.Color(settings.colorA);
    const targetColorB = new THREE.Color(settings.colorB);
    const startColorA = new THREE.Color(settings.colorA);
    const startColorB = new THREE.Color(settings.colorB);
    const endColorA = new THREE.Color(settings.colorAEnd);
    const endColorB = new THREE.Color(settings.colorBEnd);
    const startLeaderColor = new THREE.Color(settings.leaderColor);
    const endLeaderColor = new THREE.Color(settings.leaderColorEnd);
    const startLeaderLightColor = new THREE.Color(settings.leaderLightColor);
    const endLeaderLightColor = new THREE.Color(settings.leaderLightColorEnd);

    // Horizontal color temperature colors
    const leftColorA = new THREE.Color(settings.colorALeft);
    const leftColorB = new THREE.Color(settings.colorBLeft);
    const rightColorA = new THREE.Color(settings.colorARight);
    const rightColorB = new THREE.Color(settings.colorBRight);
    const leftLeaderColor = new THREE.Color(settings.leaderColorLeft);
    const rightLeaderColor = new THREE.Color(settings.leaderColorRight);
    const leftLeaderLightColor = new THREE.Color(settings.leaderLightColorLeft);
    const rightLeaderLightColor = new THREE.Color(settings.leaderLightColorRight);

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      42,
      window.innerWidth / window.innerHeight,
      0.1,
      200
    );
    camera.position.set(0, 0.2, 20);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    // Limit pixel ratio for performance (1.5 is sufficient for most displays)
    const pixelRatio = Math.min(window.devicePixelRatio, isMobile ? 1 : 1.5);
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = settings.exposure;
    container.appendChild(renderer.domElement);

    // Environment (glossy highlights)
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, settings.ambientIntensity);
    scene.add(ambient);

    const key = new THREE.DirectionalLight(0xffffff, settings.keyIntensity);
    key.position.set(7, 12, 10);
    scene.add(key);

    const rim = new THREE.DirectionalLight(0x9bb6ff, settings.rimIntensity);
    rim.position.set(-10, 3, 8);
    scene.add(rim);

    // Bloom pipeline
    const renderScene = new RenderPass(scene, camera);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      settings.bloomStrength,
      settings.bloomRadius,
      settings.bloomThreshold
    );

    const bloomComposer = new EffectComposer(renderer);
    bloomComposer.renderToScreen = false;
    bloomComposer.addPass(renderScene);
    bloomComposer.addPass(bloomPass);

    const finalPass = new ShaderPass(
      new THREE.ShaderMaterial({
        uniforms: {
          baseTexture: { value: null },
          bloomTexture: { value: bloomComposer.renderTarget2.texture },
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform sampler2D baseTexture;
          uniform sampler2D bloomTexture;
          varying vec2 vUv;
          void main() {
            vec4 base = texture2D(baseTexture, vUv);
            vec4 bloom = texture2D(bloomTexture, vUv);
            gl_FragColor = base + bloom;
          }
        `,
      }),
      "baseTexture"
    );
    finalPass.needsSwap = true;

    const finalComposer = new EffectComposer(renderer);
    finalComposer.addPass(renderScene);
    finalComposer.addPass(finalPass);

    // Sphere geometry (reduced segments for better performance)
    const sphereGeo = new THREE.SphereGeometry(0.55, 24, 16);

    // Leader sphere with emissive material
    const leaderMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(settings.leaderColor),
      emissive: new THREE.Color(settings.leaderLightColor),
      emissiveIntensity: settings.leaderEmissiveIntensity,
      roughness: 0.15,
      metalness: 0.1,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
    });
    const leader = new THREE.Mesh(sphereGeo, leaderMaterial);
    leader.scale.setScalar(settings.leaderSize);
    leader.position.set(0, 0, 0);
    scene.add(leader);

    // Point light attached to leader
    const leaderLight = new THREE.PointLight(
      new THREE.Color(settings.leaderLightColor),
      settings.leaderLightIntensity,
      settings.leaderLightDistance,
      1
    );
    leaderLight.position.set(0, 0, 0);
    scene.add(leaderLight);

    // Followers
    const followers: Follower[] = [];
    const tmp1 = new THREE.Vector3();
    const tmp2 = new THREE.Vector3();
    const tmp3 = new THREE.Vector3();

    // Function to spawn a single follower
    function spawnFollower(colA: THREE.Color, colB: THREE.Color): Follower {
      const s = THREE.MathUtils.lerp(settings.minSize, settings.maxSize, Math.random());
      const m = new THREE.Mesh(sphereGeo, makeSphereMaterial("#ffffff"));
      // Randomly pick either colorA or colorB (no blending)
      const colorType: 'A' | 'B' = Math.random() > 0.5 ? 'A' : 'B';
      const originalColor = colorType === 'A' ? colA.clone() : colB.clone();
      m.material.color.copy(originalColor);
      m.scale.setScalar(s);

      // spawn around the screen volume
      const angle = Math.random() * Math.PI * 2;
      const r = THREE.MathUtils.randFloat(10, 22);
      const y = THREE.MathUtils.randFloat(-12, 12);
      const z = THREE.MathUtils.randFloat(-14, 8);
      m.position.set(Math.cos(angle) * r, y, z);

      const v = new THREE.Vector3(
        THREE.MathUtils.randFloatSpread(0.15),
        THREE.MathUtils.randFloatSpread(0.15),
        THREE.MathUtils.randFloatSpread(0.1)
      );

      // random axis for this particle to orbit around
      const axis = new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5
      ).normalize();

      scene.add(m);
      return { mesh: m, vel: v, axis, baseColor: originalColor.clone(), colorType };
    }

    // Initial follower spawn
    for (let i = 0; i < settings.baseCount; i++) {
      followers.push(spawnFollower(currentColorA, currentColorB));
    }

    // Track how many spheres we've spawned via scroll
    let lastSpawnThreshold = 0;

    // Leader follow via raycasting
    const pointerNDC = new THREE.Vector2(0, 0);
    const raycaster = new THREE.Raycaster();
    const leaderTarget = new THREE.Vector3(0, 0, 0);
    const leaderVel = new THREE.Vector3(0, 0, 0);
    const leaderPrevPos = new THREE.Vector3(0, 0, 0);

    const planeNormal = new THREE.Vector3();
    const planePoint = new THREE.Vector3();
    const followPlane = new THREE.Plane();

    function updateFollowPlane() {
      camera.getWorldDirection(planeNormal);
      planePoint.copy(camera.position).addScaledVector(planeNormal, settings.leaderPlaneDist);
      followPlane.setFromNormalAndCoplanarPoint(planeNormal, planePoint);
    }

    updateFollowPlane();

    const onPointerMove = (e: PointerEvent) => {
      pointerNDC.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointerNDC.y = -(e.clientY / window.innerHeight) * 2 + 1;

      // Track horizontal position for color temperature effect
      horizontalPos = pointerNDC.x;

      raycaster.setFromCamera(pointerNDC, camera);
      const hit = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(followPlane, hit)) {
        leaderTarget.copy(hit);
      }
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });

    // Scroll handler
    const onScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      scrollProgress = scrollHeight > 0 ? Math.min(1, window.scrollY / scrollHeight) : 0;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // Initialize

    // Update scroll-based and horizontal effects
    function updateScrollEffects() {
      const t = scrollProgress;
      const easeT = t * t * (3 - 2 * t); // smoothstep easing

      // Smooth horizontal position
      smoothHorizontalPos = THREE.MathUtils.lerp(smoothHorizontalPos, horizontalPos, 0.03);
      const h = smoothHorizontalPos; // -1 to 1

      // Calculate horizontal color blend factor
      // h = -1 (left/cool), h = 0 (center), h = 1 (right/warm)
      const leftBlend = Math.max(0, -h); // 0 to 1 when moving left
      const rightBlend = Math.max(0, h); // 0 to 1 when moving right

      // Base colors with scroll effect
      const scrollColorA = new THREE.Color().copy(startColorA).lerp(endColorA, easeT);
      const scrollColorB = new THREE.Color().copy(startColorB).lerp(endColorB, easeT);
      const scrollLeaderColor = new THREE.Color().copy(startLeaderColor).lerp(endLeaderColor, easeT);
      const scrollLeaderLightColor = new THREE.Color().copy(startLeaderLightColor).lerp(endLeaderLightColor, easeT);

      // Apply horizontal color temperature shift
      targetColorA.copy(scrollColorA).lerp(leftColorA, leftBlend * 0.7).lerp(rightColorA, rightBlend * 0.7);
      targetColorB.copy(scrollColorB).lerp(leftColorB, leftBlend * 0.7).lerp(rightColorB, rightBlend * 0.7);
      currentColorA.lerp(targetColorA, 0.05);
      currentColorB.lerp(targetColorB, 0.05);

      // Update leader colors with horizontal temperature
      const leaderColor = new THREE.Color().copy(scrollLeaderColor)
        .lerp(leftLeaderColor, leftBlend * 0.7)
        .lerp(rightLeaderColor, rightBlend * 0.7);
      const leaderLightColorNew = new THREE.Color().copy(scrollLeaderLightColor)
        .lerp(leftLeaderLightColor, leftBlend * 0.7)
        .lerp(rightLeaderLightColor, rightBlend * 0.7);
      leaderMaterial.color.lerp(leaderColor, 0.05);
      leaderMaterial.emissive.lerp(leaderLightColorNew, 0.05);
      leaderLight.color.lerp(leaderLightColorNew, 0.05);

      // Light intensity
      const targetIntensity = THREE.MathUtils.lerp(
        settings.leaderLightIntensity,
        settings.leaderLightIntensityMax,
        easeT
      );
      leaderLight.intensity = THREE.MathUtils.lerp(leaderLight.intensity, targetIntensity, 0.05);

      const targetDistance = THREE.MathUtils.lerp(
        settings.leaderLightDistance,
        settings.leaderLightDistanceMax,
        easeT
      );
      leaderLight.distance = THREE.MathUtils.lerp(leaderLight.distance, targetDistance, 0.05);

      const targetEmissive = THREE.MathUtils.lerp(
        settings.leaderEmissiveIntensity,
        settings.leaderEmissiveIntensityMax,
        easeT
      );
      leaderMaterial.emissiveIntensity = THREE.MathUtils.lerp(
        leaderMaterial.emissiveIntensity,
        targetEmissive,
        0.05
      );

      // Bloom intensity
      const targetBloomStrength = THREE.MathUtils.lerp(
        settings.bloomStrength,
        settings.bloomStrengthMax,
        easeT
      );
      bloomPass.strength = THREE.MathUtils.lerp(bloomPass.strength, targetBloomStrength, 0.05);

      const targetBloomThreshold = THREE.MathUtils.lerp(
        settings.bloomThreshold,
        settings.bloomThresholdMin,
        easeT
      );
      bloomPass.threshold = THREE.MathUtils.lerp(bloomPass.threshold, targetBloomThreshold, 0.05);

      // Spawn/remove spheres based on scroll
      const additionalSpheres = settings.maxCount - settings.baseCount;
      const targetCount = settings.baseCount + Math.floor(additionalSpheres * easeT);

      // Spawn spheres when scrolling down
      const currentThreshold = Math.floor(t * 10);
      if (currentThreshold > lastSpawnThreshold && followers.length < targetCount) {
        const toSpawn = Math.min(
          Math.ceil(additionalSpheres / 10),
          targetCount - followers.length
        );
        for (let i = 0; i < toSpawn; i++) {
          followers.push(spawnFollower(currentColorA, currentColorB));
        }
        lastSpawnThreshold = currentThreshold;
      }

      // Remove spheres when scrolling back up
      if (followers.length > targetCount && followers.length > settings.baseCount) {
        const toRemove = Math.min(
          Math.ceil(additionalSpheres / 20), // Remove slower than spawn
          followers.length - targetCount
        );
        for (let i = 0; i < toRemove; i++) {
          const removed = followers.pop();
          if (removed) {
            scene.remove(removed.mesh);
            (removed.mesh.material as THREE.Material).dispose();
          }
        }
      }

      // Update threshold when scrolling up
      if (currentThreshold < lastSpawnThreshold) {
        lastSpawnThreshold = currentThreshold;
      }

      // Update base colors of existing followers (smooth transition)
      for (let i = 0; i < followers.length; i++) {
        const fi = followers[i];
        // Use tracked colorType to shift toward correct color in new palette
        const targetBase = fi.colorType === 'A' ? currentColorA : currentColorB;
        fi.baseColor.lerp(targetBase, 0.002); // very slow transition
      }
    }

    // Physics step function
    function stepFollowers(dt: number) {
      const L = leader.position;
      const shellR = settings.shellRadius;

      // attraction + shell + orbit
      for (let i = 0; i < followers.length; i++) {
        const fi = followers[i];
        const p = fi.mesh.position;

        // dir to leader
        tmp1.copy(L).sub(p);
        const dist = tmp1.length() + 1e-6;
        const dir = tmp1.multiplyScalar(1 / dist);

        // gravity-ish pull
        const pull = settings.gravity / (dist + settings.soften);
        tmp2.copy(dir).multiplyScalar(pull);

        // shell: keep them around leader at shellRadius
        const shellError = dist - shellR;
        tmp2.addScaledVector(dir, shellError * settings.shellStrength);

        // orbit: tangential force around random axis
        const tangent = tmp3.copy(dir).cross(fi.axis);
        tmp2.addScaledVector(tangent, settings.orbit);

        // Leader collision with bounce
        const radiusLeader = 0.55 * settings.leaderSize;
        const radiusFollower = 0.55 * fi.mesh.scale.x;
        const minDistLeader = radiusLeader + radiusFollower;

        if (dist < minDistLeader) {
          const overlap = minDistLeader - dist;
          p.addScaledVector(dir, -overlap);

          const relVel = tmp3.copy(fi.vel).sub(leaderVel);
          const velAlongNormal = relVel.dot(dir);

          if (velAlongNormal > 0) {
            const restitution = 1.2;
            const impulse = -(1 + restitution) * velAlongNormal;
            fi.vel.addScaledVector(dir, impulse);

            const leaderSpeed = leaderVel.length();
            if (leaderSpeed > 0.5) {
              fi.vel.addScaledVector(dir, -leaderSpeed * 1.5);
            }
          }
        }

        // integrate
        fi.vel.addScaledVector(tmp2, dt);

        // clamp velocity
        const vlen = fi.vel.length();
        if (vlen > settings.maxVelocity) fi.vel.multiplyScalar(settings.maxVelocity / vlen);

        // friction
        fi.vel.multiplyScalar(Math.pow(settings.friction, dt * 60));

        // position update
        p.addScaledVector(fi.vel, dt);

        // subtle rotation for highlights
        fi.mesh.rotation.y += dt * 0.25;
        fi.mesh.rotation.x += dt * 0.16;
      }

      // Sphere-to-sphere collision with bounce (only run every other frame for performance)
      if (frameCount % 2 === 0) {
        for (let i = 0; i < followers.length; i++) {
          for (let j = i + 1; j < followers.length; j++) {
            const a = followers[i];
            const b = followers[j];

          const radiusA = 0.55 * a.mesh.scale.x;
          const radiusB = 0.55 * b.mesh.scale.x;
          const minDist = radiusA + radiusB;

          tmp1.copy(a.mesh.position).sub(b.mesh.position);
          const dist = tmp1.length();

          if (dist < minDist && dist > 0.0001) {
            const overlap = minDist - dist;
            const normal = tmp1.normalize();

            const correction = overlap * 0.5;
            a.mesh.position.addScaledVector(normal, correction);
            b.mesh.position.addScaledVector(normal, -correction);

            const relVel = tmp2.copy(a.vel).sub(b.vel);
            const velAlongNormal = relVel.dot(normal);

            if (velAlongNormal < 0) {
              const restitution = settings.collisionRestitution;
              const impulse = -(1 + restitution) * velAlongNormal * 0.5;

              a.vel.addScaledVector(normal, impulse);
              b.vel.addScaledVector(normal, -impulse);
            }
          }
        }
        }
      }
    }

    // Dynamic color tinting
    const leaderLightCol = new THREE.Color();
    const tintedColor = new THREE.Color();

    function updateFollowerColors() {
      // Only update colors every 6 frames for performance
      if (frameCount % 6 !== 0) return;
      if (settings.leaderColorInfluence <= 0) return;

      leaderLightCol.copy(leaderLight.color);
      const L = leader.position;
      const range = settings.leaderColorRange;
      const influence = settings.leaderColorInfluence;

      for (let i = 0; i < followers.length; i++) {
        const fi = followers[i];
        const dist = fi.mesh.position.distanceTo(L);

        const t = Math.max(0, 1 - dist / range);
        const blend = t * t * influence;

        tintedColor.copy(fi.baseColor).lerp(leaderLightCol, blend);
        (fi.mesh.material as THREE.MeshPhysicalMaterial).color.copy(tintedColor);
      }
    }

    // Animation
    const clock = new THREE.Clock();
    let animationId: number;
    let isDocumentVisible = true;
    let frameCount = 0;

    // Pause animation when tab is not visible
    const onVisibilityChange = () => {
      isDocumentVisible = !document.hidden;
      if (isDocumentVisible) {
        clock.getDelta(); // Reset delta to avoid huge time jump
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    function animate() {
      animationId = requestAnimationFrame(animate);

      // Skip rendering when tab is hidden
      if (!isDocumentVisible) return;

      frameCount++;
      const dt = Math.min(clock.getDelta(), 0.033);

      updateFollowPlane();
      updateScrollEffects();

      // leader moves to target
      const a = 1.0 - Math.pow(1.0 - settings.leaderFollow, dt * 60);
      leader.position.lerp(leaderTarget, a);

      // Track leader velocity for collision response
      if (dt > 0) {
        leaderVel.copy(leader.position).sub(leaderPrevPos).divideScalar(dt);
      }
      leaderPrevPos.copy(leader.position);

      // Leader light follows leader position
      leaderLight.position.copy(leader.position);

      stepFollowers(dt);
      updateFollowerColors();

      // small camera parallax
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, leader.position.x * 0.02, 0.04);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, 0.2 + leader.position.y * 0.02, 0.04);
      camera.lookAt(0, 0, 0);

      // Camera tilt based on horizontal mouse position
      const targetTilt = smoothHorizontalPos * settings.cameraTiltAmount;
      camera.rotation.z = THREE.MathUtils.lerp(camera.rotation.z, -targetTilt, 0.03);

      bloomComposer.render();
      finalComposer.render();
    }

    // Resize handler
    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      bloomComposer.setSize(window.innerWidth, window.innerHeight);
      finalComposer.setSize(window.innerWidth, window.innerHeight);
    }

    window.addEventListener("resize", onResize);

    // Start animation
    setIsLoaded(true);
    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibilityChange);

      // Dispose Three.js resources
      sphereGeo.dispose();
      leaderMaterial.dispose();

      for (const f of followers) {
        (f.mesh.material as THREE.Material).dispose();
        scene.remove(f.mesh);
      }

      scene.remove(leader);
      scene.remove(leaderLight);
      scene.remove(ambient);
      scene.remove(key);
      scene.remove(rim);

      bloomPass.dispose();
      bloomComposer.dispose();
      finalComposer.dispose();

      pmrem.dispose();
      if (scene.environment) scene.environment.dispose();

      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, [prefersReducedMotion]);

  if (prefersReducedMotion) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-blue-400/5 to-transparent" />
    );
  }

  return (
    <>
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-blue-400/5 to-transparent" />
      )}
      <div
        ref={containerRef}
        className="absolute inset-0 w-full h-full"
        style={{
          opacity: isLoaded ? 1 : 0,
          transition: "opacity 0.5s ease-in-out",
          pointerEvents: "none",
        }}
      />
    </>
  );
}
