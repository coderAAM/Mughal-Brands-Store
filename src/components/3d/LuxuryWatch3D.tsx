import { useRef, Suspense, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, Float, MeshReflectorMaterial, RoundedBox, Torus, Ring, Text } from '@react-three/drei';
import * as THREE from 'three';

const WatchCase = () => {
  return (
    <group>
      {/* Main case body */}
      <RoundedBox args={[2.2, 2.2, 0.5]} radius={0.3} smoothness={4}>
        <meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.15} />
      </RoundedBox>
      
      {/* Case bezel - outer ring */}
      <Torus args={[1.0, 0.12, 32, 64]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.2]}>
        <meshStandardMaterial color="#d4af37" metalness={1} roughness={0.1} />
      </Torus>
      
      {/* Crown */}
      <mesh position={[1.3, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.12, 0.14, 0.3, 32]} />
        <meshStandardMaterial color="#d4af37" metalness={1} roughness={0.15} />
      </mesh>
      
      {/* Crown detail rings */}
      {[0.1, 0.0, -0.1].map((z, i) => (
        <mesh key={i} position={[1.35, 0, z]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.14, 0.01, 16, 32]} />
          <meshStandardMaterial color="#b8860b" metalness={0.9} roughness={0.2} />
        </mesh>
      ))}
    </group>
  );
};

const WatchDial = () => {
  const hourMarkers = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
      const radius = 0.75;
      return {
        position: [Math.cos(angle) * radius, Math.sin(angle) * radius, 0.26] as [number, number, number],
        rotation: [0, 0, angle + Math.PI / 2] as [number, number, number],
        isMain: i % 3 === 0,
      };
    });
  }, []);

  return (
    <group position={[0, 0, 0.2]}>
      {/* Dial face */}
      <mesh position={[0, 0, 0.05]}>
        <circleGeometry args={[0.95, 64]} />
        <meshStandardMaterial color="#0a1628" metalness={0.3} roughness={0.6} />
      </mesh>
      
      {/* Hour markers */}
      {hourMarkers.map((marker, i) => (
        <mesh key={i} position={marker.position} rotation={marker.rotation}>
          <boxGeometry args={[marker.isMain ? 0.08 : 0.04, marker.isMain ? 0.15 : 0.08, 0.02]} />
          <meshStandardMaterial color="#d4af37" metalness={1} roughness={0.1} />
        </mesh>
      ))}
      
      {/* Center pivot */}
      <mesh position={[0, 0, 0.28]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.08, 32]} />
        <meshStandardMaterial color="#d4af37" metalness={1} roughness={0.1} />
      </mesh>
      
      {/* Hour hand */}
      <group position={[0, 0, 0.27]} rotation={[0, 0, Math.PI / 6]}>
        <mesh position={[0, 0.22, 0]}>
          <boxGeometry args={[0.06, 0.44, 0.015]} />
          <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>
      
      {/* Minute hand */}
      <group position={[0, 0, 0.29]} rotation={[0, 0, -Math.PI / 4]}>
        <mesh position={[0, 0.32, 0]}>
          <boxGeometry args={[0.04, 0.64, 0.012]} />
          <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>
      
      {/* Second hand */}
      <group position={[0, 0, 0.31]} rotation={[0, 0, Math.PI / 3]}>
        <mesh position={[0, 0.36, 0]}>
          <boxGeometry args={[0.015, 0.72, 0.008]} />
          <meshStandardMaterial color="#c41e3a" metalness={0.7} roughness={0.3} />
        </mesh>
      </group>

      {/* Brand name */}
      <Text
        position={[0, 0.4, 0.07]}
        fontSize={0.08}
        color="#d4af37"
        anchorX="center"
        anchorY="middle"
        font="/fonts/inter-bold.woff"
      >
        MUGHAL
      </Text>
    </group>
  );
};

const WatchStrap = () => {
  return (
    <group>
      {/* Top strap */}
      <RoundedBox args={[0.8, 2.5, 0.15]} radius={0.05} smoothness={2} position={[0, 2.2, -0.1]}>
        <meshStandardMaterial color="#1a1a1a" metalness={0.2} roughness={0.8} />
      </RoundedBox>
      
      {/* Bottom strap */}
      <RoundedBox args={[0.8, 3, 0.15]} radius={0.05} smoothness={2} position={[0, -2.4, -0.1]}>
        <meshStandardMaterial color="#1a1a1a" metalness={0.2} roughness={0.8} />
      </RoundedBox>
      
      {/* Buckle */}
      <RoundedBox args={[0.9, 0.4, 0.08]} radius={0.02} smoothness={2} position={[0, -3.6, 0]}>
        <meshStandardMaterial color="#d4af37" metalness={1} roughness={0.15} />
      </RoundedBox>
    </group>
  );
};

interface WatchModelProps {
  scrollProgress: number;
}

const WatchModel = ({ scrollProgress }: WatchModelProps) => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame(({ clock }) => {
    if (groupRef.current) {
      // Scroll-based rotation
      const targetRotationY = scrollProgress * Math.PI * 2;
      const targetRotationX = Math.sin(scrollProgress * Math.PI) * 0.5;
      
      // Smooth interpolation
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        targetRotationY,
        0.05
      );
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        targetRotationX,
        0.05
      );
      
      // Subtle floating animation
      groupRef.current.position.y = Math.sin(clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <Float speed={1} rotationIntensity={0.1} floatIntensity={0.3}>
      <group ref={groupRef} scale={0.65}>
        <WatchCase />
        <WatchDial />
        <WatchStrap />
      </group>
    </Float>
  );
};

const Scene = ({ scrollProgress }: { scrollProgress: number }) => {
  return (
    <>
      <ambientLight intensity={0.3} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
      <spotLight position={[-10, 5, 10]} angle={0.3} penumbra={0.5} intensity={0.5} color="#d4af37" />
      <pointLight position={[0, 5, 0]} intensity={0.5} color="#ffffff" />
      
      <WatchModel scrollProgress={scrollProgress} />
      
      {/* Reflective floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -4, 0]}>
        <planeGeometry args={[30, 30]} />
        <MeshReflectorMaterial
          blur={[300, 100]}
          resolution={1024}
          mixBlur={1}
          mixStrength={40}
          roughness={1}
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#050505"
          metalness={0.5}
          mirror={0.5}
        />
      </mesh>
      
      <Environment preset="city" />
      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
    </>
  );
};

interface LuxuryWatch3DProps {
  scrollProgress?: number;
  className?: string;
}

const LuxuryWatch3D = ({ scrollProgress = 0, className = '' }: LuxuryWatch3DProps) => {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 8], fov: 45 }}
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <Scene scrollProgress={scrollProgress} />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default LuxuryWatch3D;
