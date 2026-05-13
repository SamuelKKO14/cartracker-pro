'use client'
import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

function TinyCar() {
  const ref = useRef<THREE.Group>(null)
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 1.5
  })

  return (
    <group ref={ref} scale={0.5}>
      <RoundedBox args={[2, 0.6, 0.9]} radius={0.12} position={[0, 0.3, 0]}>
        <meshStandardMaterial color="#f97316" metalness={0.6} roughness={0.3} />
      </RoundedBox>
      <RoundedBox args={[1, 0.4, 0.8]} radius={0.1} position={[0.05, 0.7, 0]}>
        <meshStandardMaterial color="#1a1a2e" />
      </RoundedBox>
    </group>
  )
}

export function Loader3D({ size = 80 }: { size?: number }) {
  return (
    <div style={{ width: size, height: size }} className="mx-auto">
      <Suspense fallback={<div className="w-full h-full flex items-center justify-center"><div className="w-6 h-6 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" /></div>}>
        <Canvas dpr={1} camera={{ position: [2, 1, 2], fov: 35 }} style={{ background: 'transparent' }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[2, 2, 2]} intensity={0.7} />
          <TinyCar />
        </Canvas>
      </Suspense>
    </div>
  )
}
