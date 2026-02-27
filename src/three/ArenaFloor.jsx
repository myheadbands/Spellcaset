import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function ArenaFloor() {
  const meshRef = useRef();

  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#0d0a1a',
      roughness: 0.9,
      metalness: 0.1,
      emissive: '#1a0a2e',
      emissiveIntensity: 0.15,
    });
  }, []);

  return (
    <group>
      <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <circleGeometry args={[8, 64]} />
        <primitive object={material} attach="material" />
      </mesh>
      {/* Subtle rune circles on floor */}
      <RuneCircle radius={3} y={-0.48} />
      <RuneCircle radius={5} y={-0.48} speed={-0.3} />
    </group>
  );
}

function RuneCircle({ radius, y, speed = 0.5 }) {
  const ringRef = useRef();

  useFrame((_, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * speed;
    }
  });

  return (
    <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]}>
      <ringGeometry args={[radius - 0.03, radius + 0.03, 64]} />
      <meshBasicMaterial color="#6d28d9" transparent opacity={0.2} side={THREE.DoubleSide} />
    </mesh>
  );
}
