import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { random, randomInt, range } from 'es-toolkit';

interface Dummy {
  depth: number; // 1 ~ 5
  similarity: number; // 0 ~ 100
  category: number; // 1 ~ 10
  isUser?: boolean;
}

const CATEGORY_COUNT = 10;

// 배경 데이터
const BACKGROUND_DATA: Dummy[] = range(1000).map(() => ({
  depth: random(1, 5),
  similarity: random(0, 100),
  category: randomInt(0, CATEGORY_COUNT),
}));

// 유저 데이터
const USER_DATA: Dummy[] = range(5).map(() => ({
  depth: random(1, 5),
  similarity: random(0, 100),
  category: randomInt(0, CATEGORY_COUNT),
  isUser: true,
}));

// 모든 데이터
const ALL_DATA = [...BACKGROUND_DATA, ...USER_DATA];

function Stars() {
  // 포인트의 위치, 크기, 색상, 기본 크기 생성
  const [positions, sizes, colors, baseSizes] = useMemo(() => {
    const posArray: number[] = [];
    const sizeArray: number[] = [];
    const colorArray: number[] = [];
    const baseSizeArray: number[] = [];

    ALL_DATA.forEach((item) => {
      const categoryIndex = item.category; // 0부터 9까지

      const categoryWidth = (2 * Math.PI) / CATEGORY_COUNT;
      const overlap = categoryWidth * 0; // 각 카테고리 간 1% 겹침

      let phiMin = categoryIndex * categoryWidth - overlap;
      let phiMax = (categoryIndex + 1) * categoryWidth + overlap;

      // phiMin과 phiMax를 [0, 2π) 범위로 조정
      phiMin = (phiMin + 2 * Math.PI) % (2 * Math.PI);
      phiMax = (phiMax + 2 * Math.PI) % (2 * Math.PI);

      let phi: number;

      if (phiMin < phiMax) {
        // phiMin이 phiMax보다 작은 경우 (범위가 연속적임)
        phi = Math.random() * (phiMax - phiMin) + phiMin;
      } else {
        // phiMin이 phiMax보다 큰 경우 (범위가 0을 넘어감)
        // 두 부분으로 나눠서 처리
        const range1 = 2 * Math.PI - phiMin;
        const range2 = phiMax;
        const totalRange = range1 + range2;

        const rand = Math.random() * totalRange;
        if (rand < range1) {
          phi = phiMin + rand;
        } else {
          phi = rand - range1;
        }
      }

      // phi 값을 [0, 2π) 범위로 조정
      phi = (phi + 2 * Math.PI) % (2 * Math.PI);

      // theta는 [0, π] 범위에서 균등한 난수로 선택
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
        colorArray.push(0.3, 0.5, 1.0);
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

        // 진동 주파수
        const OSCILLATION_FREQUENCY = 1;

        // 진동 진폭
        const OSCILLATION_AMPLITUDE = 0.02;

        // 포인트 크기 애니메이션
        const oscillationValue =
          OSCILLATION_AMPLITUDE * Math.sin(OSCILLATION_FREQUENCY * time + i);

        sizeArray[i] = baseSize + oscillationValue;
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
