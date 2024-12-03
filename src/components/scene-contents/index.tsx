import { OrbitControls } from '@react-three/drei';
import Stars from '../stars';
import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
function SceneContents() {
  const { camera, size } = useThree();

  // 카메라를 PerspectiveCamera로 캐스팅
  const perspectiveCamera = camera as THREE.PerspectiveCamera;

  useEffect(() => {
    // 화면 크기에 따라 카메라 설정 조정
    if (size.width < 600) {
      perspectiveCamera.position.set(0, 0, 4); // 카메라를 뒤로 이동
      perspectiveCamera.fov = 80; // 시야각 확대
    } else {
      perspectiveCamera.position.set(0, 0, 3);
      perspectiveCamera.fov = 60;
    }

    perspectiveCamera.updateProjectionMatrix();
  }, [size, perspectiveCamera]);

  return (
    <>
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
        autoRotate
        autoRotateSpeed={0.5}
        touches={{
          ONE: THREE.TOUCH.ROTATE,
          TWO: THREE.TOUCH.ROTATE,
        }}
      />
    </>
  );
}

export default SceneContents;
