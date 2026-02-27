import React, { useMemo } from 'react';
import * as THREE from 'three';

const PILLAR_POSITIONS = [
  [-4, 0, -2],
  [4, 0, -2],
  [-3.5, 0, 2],
  [3.5, 0, 2],
];

export default function Pillars() {
  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#1a1a2e',
      roughness: 0.85,
      metalness: 0.15,
      emissive: '#2d1b69',
      emissiveIntensity: 0.08,
    });
  }, []);

  return (
    <group>
      {PILLAR_POSITIONS.map((pos, i) => (
        <Pillar key={i} position={pos} material={material} />
      ))}
    </group>
  );
}

function Pillar({ position, material }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.3, 3, 8]} />
        <primitive object={material} attach="material" />
      </mesh>
      {/* Pillar cap with subtle glow */}
      <mesh position={[0, 3.1, 0]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshBasicMaterial color="#8b5cf6" transparent opacity={0.6} />
      </mesh>
      <pointLight position={[0, 3.2, 0]} color="#8b5cf6" intensity={0.4} distance={3} />
    </group>
  );
}
