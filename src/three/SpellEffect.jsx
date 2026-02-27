import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../stores/gameStore.js';
import { SPELL_TYPE_COLORS } from '../engine/elements.js';

const PROJECTILE_PARTICLES = 50;
const BURST_PARTICLES = 20;
const MIN_PARTICLE_SIZE = 0.03;
const MAX_PARTICLE_SIZE = 0.08;

const SPELL_TRAIL_COLORS = {
  damage: '#ff8844',   // orange sparks
  heal: '#88ffaa',     // green sparkles
  buff: '#66aaff',     // blue motes
  debuff: '#cc88ff',   // purple wisps
};

// Custom points material with per-vertex size attribute
function TrailPointsMaterial({ color, opacity, ...props }) {
  const uniforms = useMemo(() => ({
    uColor: { value: new THREE.Color(color) },
    uOpacity: { value: opacity },
  }), [color, opacity]);

  const vertexShader = `
    attribute float size;
    varying float vSize;
    void main() {
      vSize = size;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = size * (800.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `;
  const fragmentShader = `
    uniform vec3 uColor;
    uniform float uOpacity;
    varying float vSize;
    void main() {
      float dist = length(gl_PointCoord - vec2(0.5));
      float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
      gl_FragColor = vec4(uColor, alpha * uOpacity);
    }
  `;

  return (
    <shaderMaterial
      attach="material"
      uniforms={uniforms}
      vertexShader={vertexShader}
      fragmentShader={fragmentShader}
      transparent
      depthWrite={false}
      {...props}
    />
  );
}

export default function SpellEffect() {
  const spellEvent = useGameStore(s => s.spellEvent);
  const [effect, setEffect] = useState(null);
  const lastTimestamp = useRef(0);

  useEffect(() => {
    if (spellEvent && spellEvent.timestamp !== lastTimestamp.current) {
      lastTimestamp.current = spellEvent.timestamp;
      setEffect({
        ...spellEvent,
        startTime: performance.now(),
        phase: 'projectile',
      });
    }
  }, [spellEvent]);

  if (!effect) return null;

  return <ProjectileEffect effect={effect} onComplete={() => setEffect(null)} />;
}

function ProjectileEffect({ effect, onComplete }) {
  const groupRef = useRef();
  const particlesRef = useRef();
  const burstRef = useRef();
  const sceneGroupRef = useRef();
  const { scene } = useThree();
  useEffect(() => { sceneGroupRef.current = scene; }, [scene]);

  const orbColor = SPELL_TYPE_COLORS[effect.type] || '#8b5cf6';
  const trailColor = SPELL_TRAIL_COLORS[effect.type] || '#a78bfa';
  const toEnemy = effect.direction === 'toEnemy';
  const isDamage = effect.type === 'damage';

  const start = useMemo(() => new THREE.Vector3(toEnemy ? -2 : 2, 1, 2), [toEnemy]);
  const end = useMemo(() => new THREE.Vector3(toEnemy ? 2 : -2, 1.5, -1), [toEnemy]);

  const trailPositions = useMemo(() => {
    const arr = new Float32Array(PROJECTILE_PARTICLES * 3);
    for (let i = 0; i < PROJECTILE_PARTICLES; i++) {
      const i3 = i * 3;
      arr[i3] = start.x;
      arr[i3 + 1] = start.y;
      arr[i3 + 2] = start.z;
    }
    return arr;
  }, [start]);

  const particleSizes = useMemo(() => {
    const arr = new Float32Array(PROJECTILE_PARTICLES);
    for (let i = 0; i < PROJECTILE_PARTICLES; i++) {
      arr[i] = MIN_PARTICLE_SIZE + Math.random() * (MAX_PARTICLE_SIZE - MIN_PARTICLE_SIZE);
    }
    return arr;
  }, []);

  const progress = useRef(0);
  const impactTime = useRef(0);
  const burstParticles = useRef(null);
  const shakeOffset = useRef(new THREE.Vector3(0, 0, 0));
  const shakeDecay = useRef(1);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Camera shake decay (for damage impact) - offset scene group position
    const sceneGroup = sceneGroupRef.current;
    if (sceneGroup && shakeDecay.current < 1) {
      shakeDecay.current = Math.min(1, shakeDecay.current + delta * 4);
      const decay = 1 - shakeDecay.current;
      sceneGroup.position.x = shakeOffset.current.x * decay;
      sceneGroup.position.y = shakeOffset.current.y * decay;
      sceneGroup.position.z = shakeOffset.current.z * decay;
      if (shakeDecay.current >= 1) {
        sceneGroup.position.set(0, 0, 0);
      }
    }

    if (effect.phase === 'projectile') {
      progress.current += delta * 2.5;
      const t = Math.min(1, progress.current);

      // Move main orb along path with arc
      const pos = new THREE.Vector3().lerpVectors(start, end, t);
      pos.y += Math.sin(t * Math.PI) * 1.2;

      groupRef.current.position.copy(pos);

      // Update trail particles
      if (particlesRef.current) {
        const posAttr = particlesRef.current.geometry.attributes.position;
        const arr = posAttr.array;
        const jitter = effect.type === 'damage' ? 0.15 : effect.type === 'debuff' ? 0.12 : effect.type === 'buff' ? 0.08 : 0.06;
        for (let i = PROJECTILE_PARTICLES - 1; i > 0; i--) {
          const i3 = i * 3;
          const p3 = (i - 1) * 3;
          arr[i3] = arr[p3] + (Math.random() - 0.5) * jitter;
          arr[i3 + 1] = arr[p3 + 1] + (Math.random() - 0.5) * jitter;
          arr[i3 + 2] = arr[p3 + 2] + (Math.random() - 0.5) * jitter;
        }
        arr[0] = pos.x;
        arr[1] = pos.y;
        arr[2] = pos.z;
        posAttr.needsUpdate = true;
      }

      if (t >= 1) {
        effect.phase = 'impact';
        impactTime.current = 0;

        // Spawn burst particles at impact position
        const dirs = [];
        for (let i = 0; i < BURST_PARTICLES; i++) {
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          dirs.push(new THREE.Vector3(
            Math.sin(phi) * Math.cos(theta),
            Math.sin(phi) * Math.sin(theta),
            Math.cos(phi)
          ));
        }
        burstParticles.current = { directions: dirs, velocities: dirs.map(() => 0.5 + Math.random() * 1.5) };

        // Camera shake on damage
        if (isDamage && sceneGroupRef.current) {
          shakeOffset.current.set(
            (Math.random() - 0.5) * 0.08,
            (Math.random() - 0.5) * 0.08,
            (Math.random() - 0.5) * 0.04
          );
          shakeDecay.current = 0;
        }
      }
    } else if (effect.phase === 'impact') {
      impactTime.current += delta;

      // Update burst particles (positions in local space; group is at impact)
      if (burstRef.current && burstParticles.current) {
        const { directions, velocities } = burstParticles.current;
        const posAttr = burstRef.current.geometry.attributes.position;
        const arr = posAttr.array;
        const t = impactTime.current;
        const expand = t * 4;
        const fade = Math.max(0, 1 - t / 0.4);

        for (let i = 0; i < BURST_PARTICLES; i++) {
          const i3 = i * 3;
          const dist = expand * velocities[i];
          arr[i3] = directions[i].x * dist;
          arr[i3 + 1] = directions[i].y * dist;
          arr[i3 + 2] = directions[i].z * dist;
        }
        posAttr.needsUpdate = true;

        if (burstRef.current.material) {
          burstRef.current.material.opacity = fade * 0.8;
        }
      }

      if (impactTime.current > 0.4) {
        onComplete();
      }
    }
  });

  const burstPositions = useMemo(() => {
    const arr = new Float32Array(BURST_PARTICLES * 3);
    for (let i = 0; i < BURST_PARTICLES; i++) {
      const i3 = i * 3;
      arr[i3] = 0;
      arr[i3 + 1] = 0;
      arr[i3 + 2] = 0;
    }
    return arr;
  }, []);

  const showOrb = effect.phase === 'projectile';

  return (
    <group ref={groupRef} position={start.toArray()}>
      {/* Main orb (hidden during impact burst) */}
      <mesh visible={showOrb}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshBasicMaterial color={orbColor} transparent opacity={0.9} />
      </mesh>
      {/* Glow halo */}
      <mesh visible={showOrb}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshBasicMaterial color={orbColor} transparent opacity={0.3} />
      </mesh>
      {/* Point light on the projectile */}
      <pointLight color={orbColor} intensity={2} distance={4} visible={showOrb} />
      {/* Trail particles */}
      <points ref={particlesRef} visible={showOrb}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={PROJECTILE_PARTICLES}
            array={trailPositions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-size"
            count={PROJECTILE_PARTICLES}
            array={particleSizes}
            itemSize={1}
          />
        </bufferGeometry>
        <TrailPointsMaterial color={trailColor} opacity={0.6} />
      </points>
      {/* Impact burst particles */}
      <points ref={burstRef} visible={effect.phase === 'impact'}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={BURST_PARTICLES}
            array={burstPositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          color={orbColor}
          size={0.1}
          transparent
          opacity={0.8}
          sizeAttenuation
          depthWrite={false}
        />
      </points>
    </group>
  );
}
