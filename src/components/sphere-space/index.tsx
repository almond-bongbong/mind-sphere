import { Canvas } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import SceneContents from '../scene-contents';

function SphereSpace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  return (
    <Canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100%' }}
      camera={{ position: [0, 0, 3], fov: 60 }}
      dpr={[1, 2]}
      onCreated={({ gl }) => {
        gl.setClearColor(new THREE.Color('#000010'));
      }}
    >
      <SceneContents />
    </Canvas>
  );
}

export default SphereSpace;
