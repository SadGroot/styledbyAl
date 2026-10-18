'use client'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { Component, Suspense, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { MotionValue } from 'motion/react'
import type { Work } from '@/lib/content'

function Panel({ work, index }: { work: Work; index: number }) {
  const original = useLoader(THREE.TextureLoader, work.cover.src)
  const texture = useMemo(() => { const t = original.clone(); t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true; return t }, [original])
  useEffect(() => () => texture.dispose(), [texture])
  const ratio = (original.image as HTMLImageElement).height / (original.image as HTMLImageElement).width
  const w = Math.min(4.4, 4.2 / ratio)
  const h = w * ratio
  return <group position={[index % 2 ? 1.7 : -1.7, index % 2 ? 0.15 : -0.1, -index * 6]} rotation={[0, index % 2 ? -0.1 : 0.1, 0]}>
    <mesh position={[0, 0, -0.035]}><boxGeometry args={[w + 0.035, h + 0.035, 0.04]} /><meshBasicMaterial color="#9b855f" /></mesh>
    <mesh><planeGeometry args={[w, h]} /><meshBasicMaterial map={texture} toneMapped={false} /></mesh>
  </group>
}

function Scene({ works, progress, active, mobile, onFailure }: { works: Work[]; progress: MotionValue<number>; active: number; mobile: boolean; onFailure: () => void }) {
  const { camera, invalidate, gl } = useThree()
  const sample = useRef({ frames: 0, slow: 0, failed: false })
  useEffect(() => {
    const update = () => {
      const p = progress.get() * (works.length - 1)
      const current = Math.floor(p)
      const next = Math.min(works.length - 1, current + 1)
      const blend = THREE.MathUtils.smoothstep(p - current, 0, 1)
      const x = THREE.MathUtils.lerp(current % 2 ? 1.7 : -1.7, next % 2 ? 1.7 : -1.7, blend)
      camera.position.set(x, 0, (mobile ? 8.8 : 7.1) - p * 6)
      camera.lookAt(x, 0, camera.position.z - 10)
      invalidate()
    }
    const lost = (event: Event) => { event.preventDefault(); onFailure() }
    gl.domElement.addEventListener('webglcontextlost', lost)
    update()
    const unsubscribe = progress.on('change', update)
    return () => { unsubscribe(); gl.domElement.removeEventListener('webglcontextlost', lost) }
  }, [camera, gl, invalidate, mobile, onFailure, progress, works.length])
  useFrame((_state, delta) => {
    // Demand rendering stops at rest; only evaluate consecutive active frames.
    if (delta < 0.3 && delta > 0.001) {
      sample.current.frames++
      if (delta > 0.055) sample.current.slow++
      if (sample.current.frames >= 60) {
        if (sample.current.slow > 36 && !sample.current.failed) { sample.current.failed = true; onFailure() }
        sample.current.frames = 0; sample.current.slow = 0
      }
    }
  })
  return <><color attach="background" args={['#141311']} /><fog attach="fog" args={['#141311', 12, 35]} />{works.map((work, i) => Math.abs(i - active) <= (mobile ? 1 : 2) && <Suspense key={work.id} fallback={null}><Panel work={work} index={i} /></Suspense>)}<gridHelper args={[100, 28, '#2c2821', '#201e19']} position={[0, -2.7, -20]} /></>
}

class CanvasBoundary extends Component<{ children: React.ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch() { this.props.onFailure() }
  render() { return this.state.failed ? null : this.props.children }
}

export default function SpatialCanvas(props: { works: Work[]; progress: MotionValue<number>; active: number; mobile: boolean; onFailure: () => void }) {
  return <CanvasBoundary onFailure={props.onFailure}><Canvas frameloop="demand" dpr={[1, props.mobile ? 1.25 : 1.5]} camera={{ position: [0, 0, 7.1], fov: 40, near: 0.1, far: 80 }} gl={{ antialias: !props.mobile, powerPreference: 'low-power' }} fallback={<span>Use the standard gallery to explore the work.</span>}><Scene {...props} /></Canvas></CanvasBoundary>
}
