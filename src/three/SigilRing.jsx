import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function SigilRing() {
  const groupRef = useRef();
  const glowRef = useRef();

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.15;
    }
    if (glowRef.current) {
      glowRef.current.material.opacity = 0.15 + Math.sin(state.clock.elapsedTime * 1.5) * 0.08;
    }
  });

  const segments = useMemo(() => {
    const items = [];
    const count = 12;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const r = 2.5;
      items.push({
        position: [Math.cos(angle) * r, 0, Math.sin(angle) * r],
        rotation: [0, -angle + Math.PI / 2, 0],
      });
    }
    return items;
  }, []);

  return (
    <group ref={groupRef} position={[0, -0.3, 0]}>
      {/* Main sigil ring */}
      <mesh ref={glowRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.3, 2.7, 64]} />
        <meshBasicMaterial color="#8b5cf6" transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>

      {/* Sigil marks around the ring */}
      {segments.map((seg, i) => (
        <mesh key={i} position={seg.position} rotation={[Math.PI / 2, seg.rotation[1], 0]}>
          <planeGeometry args={[0.15, 0.4]} />
          <meshBasicMaterial color="#a78bfa" transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}
