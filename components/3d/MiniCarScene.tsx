'use client'
import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

function MiniCar() {
  const ref = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.5
  })

  return (
    <group ref={ref} scale={0.8}>
      <RoundedBox args={[2.4, 0.7, 1.1]} radius={0.15} position={[0, 0.35, 0]}>
        <meshStandardMaterial color="#f97316" metalness={0.7} roughness={0.25} />
      </RoundedBox>
      <RoundedBox args={[1.2, 0.5, 0.95]} radius={0.12} position={[0.1, 0.85, 0]}>
        <meshStandardMaterial color="#1a1a2e" metalness={0.5} roughness={0.3} />
      </RoundedBox>
      {[[-0.7, 0, 0.55], [-0.7, 0, -0.55], [0.7, 0, 0.55], [0.7, 0, -0.55]].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.22, 0.22, 0.15, 12]} />
          <meshStandardMaterial color="#222" />
        </mesh>
      ))}
    </group>
  )
}

export function MiniCarScene({ className }: { className?: string }) {
  return (
    <div className={className}>
      <Suspense fallback={null}>
        <Canvas
          dpr={[1, 1.5]}
          camera={{ position: [3, 1.5, 3], fov: 30 }}
          style={{ background: 'transparent' }}
        >
          <ambientLight intensity={0.4} />
          <directionalLight position={[3, 3, 3]} intensity={0.8} />
          <pointLight position={[2, 1, 1]} intensity={0.4} color="#f97316" />
          <MiniCar />
        </Canvas>
      </Suspense>
    </div>
  )
}
