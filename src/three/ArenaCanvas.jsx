import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import ArenaScene from './ArenaScene.jsx';

export default function ArenaCanvas() {
  return (
    <div className="canvas-layer">
      <Canvas
        camera={{ position: [0, 3, 8], fov: 55 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 1.5]}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <ArenaScene />
        </Suspense>
      </Canvas>
    </div>
  );
}
