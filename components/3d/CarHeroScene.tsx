'use client'
import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import {
  Environment,
  ContactShadows,
  OrbitControls,
  Float,
  MeshDistortMaterial,
  RoundedBox,
} from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'

function CarFallback() {
  const ref = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.3
    }
  })

  return (
    <group ref={ref}>
      {/* Body */}
      <RoundedBox args={[2.4, 0.7, 1.1]} radius={0.15} position={[0, 0.35, 0]}>
        <meshStandardMaterial color="#f97316" metalness={0.8} roughness={0.2} />
      </RoundedBox>
      {/* Cabin */}
      <RoundedBox args={[1.2, 0.5, 0.95]} radius={0.12} position={[0.1, 0.85, 0]}>
        <meshStandardMaterial color="#1a1a2e" metalness={0.6} roughness={0.3} />
      </RoundedBox>
      {/* Wheels */}
      {[[-0.7, 0, 0.55], [-0.7, 0, -0.55], [0.7, 0, 0.55], [0.7, 0, -0.55]].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.22, 0.22, 0.15, 16]} />
          <meshStandardMaterial color="#222" metalness={0.5} roughness={0.4} />
        </mesh>
      ))}
      {/* Headlights */}
      {[[1.2, 0.4, 0.35], [1.2, 0.4, -0.35]].map((pos, i) => (
        <mesh key={`hl-${i}`} position={pos as [number, number, number]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={2} />
        </mesh>
      ))}
    </group>
  )
}

function FloatingSpecs() {
  return (
    <>
      <Float speed={2} rotationIntensity={0} floatIntensity={0.5} floatingRange={[-0.1, 0.1]}>
        <mesh position={[2, 1.2, 0.5]}>
          <planeGeometry args={[0.8, 0.35]} />
          <meshBasicMaterial color="#f97316" opacity={0.08} transparent />
        </mesh>
      </Float>
      <Float speed={1.5} rotationIntensity={0} floatIntensity={0.5} floatingRange={[-0.15, 0.1]}>
        <mesh position={[-2, 0.8, -0.3]}>
          <planeGeometry args={[0.6, 0.3]} />
          <meshBasicMaterial color="#fbbf24" opacity={0.06} transparent />
        </mesh>
      </Float>
    </>
  )
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={1} color="#ffffff" />
      <pointLight position={[3, 2, 2]} intensity={0.8} color="#f97316" />
      <pointLight position={[-3, 2, -2]} intensity={0.5} color="#fb923c" />

      <CarFallback />
      <FloatingSpecs />

      <ContactShadows
        position={[0, -0.15, 0]}
        opacity={0.4}
        scale={8}
        blur={2}
        far={4}
        color="#f97316"
      />

      <Environment preset="studio" />

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={1}
        maxPolarAngle={Math.PI / 2.2}
        minPolarAngle={Math.PI / 4}
      />

      <EffectComposer>
        <Bloom
          luminanceThreshold={0.8}
          luminanceSmoothing={0.9}
          intensity={0.4}
        />
      </EffectComposer>
    </>
  )
}

function LoadingFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-12 h-12 rounded-full border-2 border-orange-500/20 border-t-orange-500 animate-spin" />
    </div>
  )
}

export function CarHeroScene({ className }: { className?: string }) {
  return (
    <div className={className}>
      <Suspense fallback={<LoadingFallback />}>
        <Canvas
          dpr={[1, 2]}
          camera={{ position: [4, 2, 4], fov: 35 }}
          style={{ background: 'transparent' }}
        >
          <Scene />
        </Canvas>
      </Suspense>
    </div>
  )
}
