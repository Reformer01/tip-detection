import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Environment } from '@react-three/drei';
import * as THREE from 'three';

function Coin() {
  const meshRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 2;
    }
  });

  return (
    <Float speed={4} rotationIntensity={0.5} floatIntensity={2}>
      <group ref={meshRef}>
        {}
        <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[1.5, 1.5, 0.2, 32]} />
          <meshStandardMaterial color="#FFE792" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Inner ring */}
        <mesh position={[0, 0, 0.1]} rotation={[0, 0, 0]}>
          <torusGeometry args={[1.1, 0.1, 16, 32]} />
          <meshStandardMaterial color="#FFC107" metalness={1} roughness={0.1} />
        </mesh>
        {/* Back inner ring */}
        <mesh position={[0, 0, -0.1]} rotation={[0, 0, 0]}>
          <torusGeometry args={[1.1, 0.1, 16, 32]} />
          <meshStandardMaterial color="#FFC107" metalness={1} roughness={0.1} />
        </mesh>
      </group>
    </Float>
  );
}

export function ThreeDCoin() {
  return (
    <div className="w-full h-full absolute inset-0 pointer-events-none z-0 opacity-50">
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        <Coin />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
