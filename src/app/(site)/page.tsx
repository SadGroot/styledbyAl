import Link from 'next/link'
import { getSettings, getWorks, getServices, photograph } from '@/lib/content'
import { Exhibition } from '@/components/Exhibition'
import { Arrow } from '@/components/Arrow'

export const metadata = { alternates: { canonical: '/' } }
export default async function Home() {
  const [settings, works, services] = await Promise.all([getSettings(), getWorks(), getServices()])
  const hero = settings.heroImage ? photograph(settings.heroImage) : { src: '/images/couture.jpg', alt: 'Preview editorial portrait in a sculptural dress' }
  const portrait = settings.portrait ? photograph(settings.portrait) : { src: '/images/portrait.jpg', alt: 'Illustrative portrait for the preview edition' }
  const lines = settings.heroLine.split('\n')
  return <>
    <section className="hero" aria-labelledby="hero-heading"><div className="hero-editorial-mark"><span>AN INDIVIDUAL POINT OF VIEW</span><span>EST. IN KERALA</span></div><div className="hero-image"><img src={hero.src} alt={hero.alt} width="1000" height="1400" fetchPriority="high" /><span className="hero-image-label">A STUDY IN SELF-EXPRESSION{settings.previewEdition && ' / PREVIEW'}</span></div><div className="hero-copy"><span className="eyebrow">CELEBRITY · BRIDAL · PERSONAL STYLING</span><h1 id="hero-heading">{lines.map((line, i) => <span key={i}>{i === lines.length - 1 ? <i>{line}</i> : line}</span>)}</h1><div className="hero-copy-bottom"><p>{settings.heroIntro}</p><Link href="#selected-work" className="circle-link" aria-label="Explore the selected work"><Arrow diagonal /></Link></div></div><div className="hero-baseline"><a href="#selected-work">SCROLL TO DISCOVER <span aria-hidden="true">↓</span></a><span>THOUGHTFULLY CURATED. DISTINCTLY PERSONAL.</span></div></section>
    <div className="discipline-strip" aria-label="Styling disciplines"><span>Celebrity & editorial</span><b aria-hidden="true">✳</b><span>Bridal stories</span><b aria-hidden="true">✳</b><span>Personal style</span><b aria-hidden="true">✳</b><span>Wardrobe edits</span></div>
    <Exhibition works={works} />
    <section className="services-preview" aria-labelledby="services-heading"><div className="section-heading"><div><span className="eyebrow">02 / THE PRACTICE</span><h2 id="services-heading">Every occasion.<br /><i>Your own expression.</i></h2></div><p className="section-summary">From the everyday to the unforgettable.<br />A considered approach to how you show up.</p></div><div className="service-list">{services.map((service, i) => <Link href={`/services#${service.key}`} key={service.id} className="service-row"><span className="service-number">{String(i + 1).padStart(2, '0')}</span><h3>{service.title}</h3><span className="service-tagline">{service.tagline}</span><Arrow diagonal /></Link>)}</div></section>
    <section className="about-preview" aria-labelledby="about-heading"><div className="about-preview-image"><img src={portrait.src} alt={portrait.alt} width="900" height="1100" loading="lazy" />{settings.previewEdition && <span className="image-note">PORTRAIT STUDY / PREVIEW IMAGERY</span>}</div><div className="about-preview-copy"><span className="eyebrow">03 / THE STYLIST</span><h2 id="about-heading">Style is personal.<br /><i>So is the process.</i></h2><p>{settings.aboutText}</p><Link className="text-link" href="/about">A little about Al <Arrow diagonal /></Link><span className="signature" aria-hidden="true">Al.</span></div></section>
  </>
}
