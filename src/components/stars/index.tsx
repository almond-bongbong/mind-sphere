import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { random, range } from 'es-toolkit';

interface Dummy {
  depth: number; // 1 ~ 5
  similarity: number; // 0 ~ 100
  category: number; // 1 ~ 10
  isUser?: boolean;
}

const CATEGORY_COUNT = 10;

const BACKGROUND_DATA: Dummy[] = range(1000).map(() => ({
  depth: random(1, 5),
  similarity: random(0, 100),
  category: random(0, CATEGORY_COUNT - 1),
}));

const USER_DATA: Dummy[] = range(5).map(() => ({
  depth: random(1, 5),
  similarity: random(0, 100),
  category: random(0, CATEGORY_COUNT - 1),
  isUser: true,
}));

const ALL_DATA = [...BACKGROUND_DATA, ...USER_DATA];

function Stars() {
  // 포인트의 위치, 크기, 색상, 기본 크기 생성
  const [positions, sizes, colors, baseSizes] = useMemo(() => {
    const posArray: number[] = [];
    const sizeArray: number[] = [];
    const colorArray: number[] = [];
    const baseSizeArray: number[] = [];

    const totalCategories = 10; // 카테고리 수

    ALL_DATA.forEach((item) => {
      // 카테고리에 따른 phi 범위 계산
      const categoryIndex = item.category; // 0부터 9까지
      const overlap = ((2 * Math.PI) / totalCategories) * 0.01; // 각 카테고리 간 1% 겹침
      let phiMin = (categoryIndex / totalCategories) * 2 * Math.PI - overlap;
      let phiMax =
        ((categoryIndex + 1) / totalCategories) * 2 * Math.PI + overlap;

      // phi 값을 0에서 2π 사이로 보정
      phiMin = (phiMin + 2 * Math.PI) % (2 * Math.PI);
      phiMax = (phiMax + 2 * Math.PI) % (2 * Math.PI);

      // phi 범위가 역전된 경우 처리 (예: phiMin > phiMax)
      if (phiMin > phiMax) {
        phiMax += 2 * Math.PI;
      }

      // phi를 해당 범위 내에서 랜덤하게 선택
      let phi = Math.random() * (phiMax - phiMin) + phiMin;

      // phi 값을 0에서 2π 사이로 보정
      phi = (phi + 2 * Math.PI) % (2 * Math.PI);

      // theta는 [0, π] 범위에서 균일한 난수로 선택
      const theta = Math.acos(Math.random() * 2 - 1); // [0, π]

      const radius = 1; // 구의 반지름

      // 구면 좌표를 직교 좌표로 변환
      const x = radius * Math.sin(theta) * Math.cos(phi);
      const y = radius * Math.sin(theta) * Math.sin(phi);
      const z = radius * Math.cos(theta);

      // X축을 기준으로 -90도 회전 적용 (적도가 카메라 방향과 평행하도록)
      const rotatedX = x;
      const rotatedY = z;
      const rotatedZ = -y;

      posArray.push(rotatedX, rotatedY, rotatedZ);

      // 기본 크기 설정
      const baseSize = item.isUser ? 0.1 : 0.03; // USER_DATA는 더 크게
      baseSizeArray.push(baseSize);

      // 초기 크기는 baseSize로 설정
      sizeArray.push(baseSize);

      // 색상 설정 (RGB)
      if (item.isUser) {
        // 파란색 (USER_DATA)
        colorArray.push(0.0, 0.0, 1.0);
      } else {
        // 흰색 (BACKGROUND_DATA)
        colorArray.push(1.0, 1.0, 1.0);
      }
    });

    return [
      new Float32Array(posArray),
      new Float32Array(sizeArray),
      new Float32Array(colorArray),
      new Float32Array(baseSizeArray),
    ];
  }, []);

  // 지오메트리 생성 및 속성 설정
  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // baseSize 속성 추가
    geom.setAttribute('baseSize', new THREE.BufferAttribute(baseSizes, 1));

    return geom;
  }, [positions, sizes, colors, baseSizes]);

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
      const baseSizesAttribute = pointsRef.current.geometry.getAttribute(
        'baseSize'
      ) as THREE.BufferAttribute;

      const sizeArray = sizesAttribute.array as Float32Array;
      const baseSizeArray = baseSizesAttribute.array as Float32Array;

      for (let i = 0; i < sizeArray.length; i++) {
        const baseSize = baseSizeArray[i]; // 각 포인트의 기본 크기
        sizeArray[i] = baseSize + 0.01 * Math.sin(1 * time + i);
      }

      sizesAttribute.needsUpdate = true;
    }
  });

  // 버텍스 셰이더
  const vertexShader = `
    attribute float size;
    attribute vec3 color;
    varying vec3 vColor;

    void main() {
      vColor = color;
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

export default Stars;
