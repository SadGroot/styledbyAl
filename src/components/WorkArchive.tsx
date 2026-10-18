'use client'
import { useState } from 'react'
import type { Work } from '@/lib/content'
import { services } from '@/lib/constants'
import { WorkCard } from './WorkCard'
import { cn } from '@/lib/utils'

export function WorkArchive({ works }: { works: Work[] }) {
  const [category, setCategory] = useState('all')
  const filtered = category === 'all' ? works : works.filter(w => w.category === category)
  return <section className="archive-section"><div className="archive-filters" aria-label="Filter work"><button className={cn(category === 'all' && 'selected')} onClick={() => setCategory('all')} aria-pressed={category === 'all'}>All work <sup>{String(works.length).padStart(2, '0')}</sup></button>{services.filter(s => works.some(w => w.category === s.value)).map(s => <button key={s.value} className={cn(category === s.value && 'selected')} onClick={() => setCategory(s.value)} aria-pressed={category === s.value}>{s.label}</button>)}</div><div className="work-grid" aria-live="polite">{filtered.map((work, i) => <WorkCard key={work.id} work={work} index={i} />)}</div>{!filtered.length && <p className="empty-state">A new chapter is on its way. <a href="/enquire">Start a conversation ↗</a></p>}</section>
}
