import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getWork } from '@/lib/content'
import { categoryLabel } from '@/lib/constants'
import { Arrow } from '@/components/Arrow'
type Args = { params: Promise<{ slug: string }>; searchParams: Promise<{ preview?: string }> }
export async function generateMetadata({ params, searchParams }: Args) {
  const { slug } = await params
  const project = await getWork(slug, (await searchParams).preview === 'true')
  return { title: project?.title || 'Project unavailable', description: project?.description?.slice(0, 160), alternates: { canonical: `/work/${slug}` }, ...((await searchParams).preview ? { robots: { index: false, follow: false } } : {}), ...(project ? { openGraph: { title: project.title, description: project.description.slice(0, 160), url: `/work/${slug}`, images: [{ url: project.cover.detail, alt: project.cover.alt }] } } : {}) }
}
export default async function ProjectPage({ params, searchParams }: Args) {
  const work = await getWork((await params).slug, (await searchParams).preview === 'true')
  if (!work) notFound()
  return <article className="project-page"><section className="page-intro"><Link href="/work" className="eyebrow back-link">← BACK TO THE EDIT</Link><div className="project-title"><span className="eyebrow">{categoryLabel(work.category)}{work.previewImagery && ' / PREVIEW STUDY'}</span><h1>{work.title}</h1><p>{work.subtitle}</p></div></section><div className="project-cover"><img src={work.cover.detail} alt={work.cover.alt} width="1800" height="2400" fetchPriority="high" /></div><section className="project-story"><span className="eyebrow">THE STORY</span><div><p>{work.description}</p>{work.previewImagery && <p className="project-preview-note">This is a visual study using preview photography, not a commissioned styling project. Real work and credits will replace it.</p>}</div><dl>{work.credits.map((c, i) => <div key={i}><dt>{c.role}</dt><dd>{c.name}</dd></div>)}</dl></section><div className="project-gallery">{work.gallery.map((item, i) => <figure key={i}><img src={item.image.detail} alt={item.image.alt} loading="lazy" width="1000" height="1400" />{item.caption && <figcaption>{item.caption}</figcaption>}</figure>)}</div>{work.videoLinks.length > 0 && <section className="project-videos"><span className="eyebrow">IN MOTION</span>{work.videoLinks.map((v, i) => <a className="text-link" href={v.url} target="_blank" rel="noreferrer" key={i}>{v.label}<Arrow diagonal /></a>)}</section>}<div className="project-enquire"><span className="eyebrow">A STORY OF YOUR OWN?</span><Link href={`/enquire?service=${work.category}`} className="text-link">Let’s begin <Arrow diagonal /></Link></div></article>
}
