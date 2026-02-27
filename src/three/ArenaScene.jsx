import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import ArenaFloor from './ArenaFloor.jsx';
import Pillars from './Pillars.jsx';
import SigilRing from './SigilRing.jsx';
import AmbientParticles from './AmbientParticles.jsx';
import ArenaLighting from './ArenaLighting.jsx';
import SpellEffect from './SpellEffect.jsx';

export default function ArenaScene() {
  return (
    <>
      <fog attach="fog" args={['#070a14', 6, 22]} />
      <ArenaLighting />
      <ArenaFloor />
      <Pillars />
      <SigilRing />
      <AmbientParticles />
      <SpellEffect />
    </>
  );
}
