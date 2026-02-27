import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const PARTICLE_COUNT = 150;

export default function AmbientParticles() {
  const meshRef = useRef();

  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const vel = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      pos[i3] = (Math.random() - 0.5) * 14;
      pos[i3 + 1] = Math.random() * 6;
      pos[i3 + 2] = (Math.random() - 0.5) * 14;
      vel[i3] = (Math.random() - 0.5) * 0.02;
      vel[i3 + 1] = Math.random() * 0.01 + 0.005;
      vel[i3 + 2] = (Math.random() - 0.5) * 0.02;
    }
    return { positions: pos, velocities: vel };
  }, []);

  useFrame(() => {
    if (!meshRef.current) return;
    const posAttr = meshRef.current.geometry.attributes.position;
    const arr = posAttr.array;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      arr[i3] += velocities[i3];
      arr[i3 + 1] += velocities[i3 + 1];
      arr[i3 + 2] += velocities[i3 + 2];

      if (arr[i3 + 1] > 7) {
        arr[i3] = (Math.random() - 0.5) * 14;
        arr[i3 + 1] = -0.5;
        arr[i3 + 2] = (Math.random() - 0.5) * 14;
      }
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={PARTICLE_COUNT}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#a78bfa"
        size={0.04}
        transparent
        opacity={0.5}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}
