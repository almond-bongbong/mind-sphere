import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import Stars from '../stars';

function SphereSpace() {
  return (
    <Canvas
      style={{ width: '100%', height: '100vh' }}
      camera={{ position: [0, 0, 3], fov: 60 }}
      onCreated={({ gl }) => {
        gl.setClearColor(new THREE.Color('#000010'));
      }}
    >
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />

      {/* 디버깅을 위한 구; 운영 환경에서는 opacity를 0으로 설정 */}
      <mesh>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color="white"
          wireframe
          transparent
          opacity={0} // 운영 환경에서는 0으로 설정
        />
      </mesh>

      {/* 별 컴포넌트 */}
      <Stars />

      {/* 사용자 인터랙션을 위한 오빗 컨트롤 */}
      <OrbitControls
        enableZoom
        enableRotate
        enablePan
        minDistance={0.5}
        maxDistance={3}
      />
    </Canvas>
  );
}

export default SphereSpace;
