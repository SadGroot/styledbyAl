import Link from 'next/link'
import type { Work } from '@/lib/content'
import { categoryLabel } from '@/lib/constants'
import { Arrow } from './Arrow'

export function WorkCard({ work, index = 0 }: { work: Work; index?: number }) {
  return <article className="work-card"><Link href={`/work/${work.slug}`} className="work-image"><img src={work.cover.src} alt={work.cover.alt} loading="lazy" width="1000" height="1400" /><span className="work-image-action"><Arrow diagonal /></span>{work.previewImagery && <span className="image-preview-label">PREVIEW IMAGERY</span>}</Link><div className="work-caption"><div><span className="eyebrow">{categoryLabel(work.category)}</span><h3><Link href={`/work/${work.slug}`}>{work.title}</Link></h3></div><span className="work-index">{String(index + 1).padStart(2, '0')}</span></div></article>
}
