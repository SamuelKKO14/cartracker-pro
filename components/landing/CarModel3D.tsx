'use client'
import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import type { Group } from 'three'

function RotatingCar() {
  const ref = useRef<Group>(null)
  const { scene } = useGLTF('/models/car.glb')

  useFrame(() => {
    if (ref.current) ref.current.rotation.y += 0.005
  })

  return <primitive ref={ref} object={scene} scale={0.8} position={[0, -0.5, 0]} />
}

export function CarModel3D() {
  return (
    <div className="w-[200px] h-[200px]">
      <Canvas
        gl={{ alpha: true, antialias: true }}
        camera={{ position: [3, 1.5, 3], fov: 35 }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} />
        <directionalLight position={[-3, 2, -3]} intensity={0.4} />
        <RotatingCar />
      </Canvas>
    </div>
  )
}
