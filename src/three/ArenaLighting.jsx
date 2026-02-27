import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../stores/gameStore.js';
import { SPELL_TYPE_COLORS } from '../engine/elements.js';

export default function ArenaLighting() {
  const flashRef = useRef();
  const spellEvent = useGameStore(s => s.spellEvent);
  const lastTimestamp = useRef(0);

  useFrame((state) => {
    if (!flashRef.current) return;

    if (spellEvent && spellEvent.timestamp !== lastTimestamp.current) {
      lastTimestamp.current = spellEvent.timestamp;
      const color = SPELL_TYPE_COLORS[spellEvent.type] || '#8b5cf6';
      flashRef.current.color.set(color);
      flashRef.current.intensity = 3;
    }

    // Decay flash
    if (flashRef.current.intensity > 0) {
      flashRef.current.intensity *= 0.92;
      if (flashRef.current.intensity < 0.05) flashRef.current.intensity = 0;
    }
  });

  return (
    <>
      <ambientLight intensity={0.15} color="#1a0a2e" />
      <directionalLight position={[2, 6, 4]} intensity={0.3} color="#c4b5fd" />
      <pointLight position={[0, 4, 0]} intensity={0.5} color="#7c3aed" distance={12} />
      {/* Dynamic flash light for spell casts */}
      <pointLight ref={flashRef} position={[0, 2, 1]} intensity={0} distance={10} />
    </>
  );
}
