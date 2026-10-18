'use client'
import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'
import { useScroll, useMotionValueEvent } from 'motion/react'
import Link from 'next/link'
import type { Work } from '@/lib/content'
import { categoryLabel } from '@/lib/constants'
import { WorkCard } from './WorkCard'
import { Arrow } from './Arrow'

const SpatialCanvas = dynamic(() => import('./SpatialCanvas'), { ssr: false })

export function Exhibition({ works }: { works: Work[] }) {
  const selected = works.filter(w => w.featured).slice(0, 6)
  const region = useRef<HTMLDivElement>(null)
  const [mode, setMode] = useState<'poster' | '3d' | 'standard'>('poster')
  const [active, setActive] = useState(0)
  const [reason, setReason] = useState('')
  const [mobile, setMobile] = useState(false)
  const { scrollYProgress } = useScroll({ target: region, offset: ['start start', 'end end'] })
  useMotionValueEvent(scrollYProgress, 'change', value => setActive(Math.min(selected.length - 1, Math.round(value * (selected.length - 1)))))

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    const phones = window.matchMedia('(max-width: 760px)')
    setMobile(phones.matches)
    const sizeChanged = () => setMobile(phones.matches)
    const motionChanged = () => { if (reduced.matches) { setMode('standard'); setReason('Reduced motion is enabled.') } }
    phones.addEventListener('change', sizeChanged)
    reduced.addEventListener('change', motionChanged)
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: true })
      const supported = Boolean(gl)
      gl?.getExtension('WEBGL_lose_context')?.loseContext()
      const standard = reduced.matches || localStorage.getItem('al-gallery') === 'standard' || !supported
      setMode(standard ? 'standard' : '3d')
      if (!supported) setReason('The editorial gallery is available on this device.')
    } catch { setMode('standard') }
    return () => { phones.removeEventListener('change', sizeChanged); reduced.removeEventListener('change', motionChanged) }
  }, [])

  const fallback = () => { setMode('standard'); setReason('Switched to the editorial gallery for a smoother experience.') }
  const chooseStandard = () => { setMode('standard'); try { localStorage.setItem('al-gallery', 'standard') } catch {} }
  if (!selected.length) return <div ref={region} />
  const current = selected[active] || selected[0]
  return <section className="exhibition" id="selected-work" aria-labelledby="exhibition-heading">
    <div className="section-heading"><div><span className="eyebrow">01 / SELECTED WORK</span><h2 id="exhibition-heading">Dressed in<br /><i>intention.</i></h2></div><div className="section-heading-note"><p>A study in individuality.<br />One look at a time.</p><Link href="/work" className="text-link">The full edit <Arrow diagonal /></Link></div></div>
    <div className="exhibition-toolbar"><span className="eyebrow">{mode === '3d' ? 'THE SPATIAL EDIT · SCROLL TO EXPLORE' : 'THE EDITORIAL EDIT'}</span>{mode === '3d' ? <button onClick={chooseStandard} className="gallery-toggle">View standard gallery <span aria-hidden="true">↗</span></button> : <span className="gallery-status" role="status">{reason || 'A selection from the studio'}</span>}</div>
    <div ref={region} className={mode === '3d' ? 'spatial-region' : undefined} style={mode === '3d' ? { height: `${Math.max(200, selected.length * 75)}vh` } : undefined}>
    {mode === '3d' ? <>
      <div className="spatial-sticky"><div className="spatial-canvas" aria-hidden="true"><SpatialCanvas works={selected} progress={scrollYProgress} active={active} mobile={mobile} onFailure={fallback} /></div><div className="spatial-caption"><span className="eyebrow">{categoryLabel(current.category)}{current.previewImagery && ' · PREVIEW'}</span><h3><Link href={`/work/${current.slug}`}>{current.title} <Arrow diagonal /></Link></h3></div><div className="spatial-position"><span>{String(active + 1).padStart(2, '0')}</span><span className="position-rule" /><span>{String(selected.length).padStart(2, '0')}</span></div><div className="spatial-controls">{selected.map((w, i) => <button key={w.id} aria-label={`Explore ${w.title}`} aria-pressed={i === active} onClick={() => { if (region.current) window.scrollTo({ top: region.current.offsetTop + i / Math.max(1, selected.length - 1) * (region.current.offsetHeight - window.innerHeight), behavior: 'smooth' }) }}>{String(i + 1).padStart(2, '0')}</button>)}</div></div>
    </> : <div className="work-grid featured-grid">{selected.slice(0, 4).map((w, i) => <WorkCard key={w.id} work={w} index={i} />)}</div>}
    </div>
    <noscript><p>Browse the <a href="/work">complete Work archive</a>.</p></noscript>
  </section>
}
