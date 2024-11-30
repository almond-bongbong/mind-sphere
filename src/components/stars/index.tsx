import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { random, range } from 'es-toolkit';

interface Dummy {
  depth: number; // 1 ~ 5
  similarity: number; // 0 ~ 100
  category: number; // 1 ~ 10
}

const DUMMY_DATA: Dummy[] = range(1000).map(() => ({
  depth: random(1, 5),
  similarity: random(0, 100),
  category: random(0, 9),
}));

function Stars() {
  // 포인트의 위치 생성
  const positions = useMemo(() => {
    const posArray: number[] = [];

    DUMMY_DATA.forEach((item) => {
      // 카테고리와 깊이에 따라 각도 계산
      const phi = ((item.category + Math.random()) / 10) * Math.PI * 2;
      const theta = ((item.depth + Math.random()) / 5) * Math.PI;

      const radius = 1; // 구의 반지름

      // 구면 좌표를 직교 좌표로 변환
      const x = radius * Math.sin(theta) * Math.cos(phi);
      const y = radius * Math.sin(theta) * Math.sin(phi);
      const z = radius * Math.cos(theta);

      posArray.push(x, y, z);
    });

    return new Float32Array(posArray);
  }, []);

  // 포인트 크기를 위한 sizes 속성 초기화
  const sizes = useMemo(() => {
    return new Float32Array(DUMMY_DATA.length).fill(0.02);
  }, []);

  // 지오메트리 생성 및 속성 설정
  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    return geom;
  }, [positions, sizes]);

  // 포인트 객체에 대한 참조
  const pointsRef = useRef<THREE.Points>(null);

  // 포인트를 애니메이션하여 반짝이는 효과 구현
  useFrame(({ clock }) => {
    if (pointsRef.current) {
      const time = clock.getElapsedTime();
      // sizes 속성에 접근
      const sizesAttribute = pointsRef.current.geometry.getAttribute(
        'size'
      ) as THREE.BufferAttribute;
      const sizeArray = sizesAttribute.array as Float32Array;

      for (let i = 0; i < sizeArray.length; i++) {
        sizeArray[i] = 0.02 + 0.015 * Math.sin(0.5 * time + i);
      }
      sizesAttribute.needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      {/* 커스텀 셰이더 머티리얼 */}
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// 버텍스 셰이더
const vertexShader = `
  attribute float size;
  varying vec3 vColor;

  void main() {
    vColor = vec3(1.0);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

// 프래그먼트 셰이더
const fragmentShader = `
  varying vec3 vColor;

  void main() {
    float distanceToCenter = length(gl_PointCoord - vec2(0.5));
    float alpha = smoothstep(0.5, 0.0, distanceToCenter);
    gl_FragColor = vec4(vColor, alpha);
  }
`;

export default Stars;
