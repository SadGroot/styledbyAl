import Link from 'next/link'
import { getSettings, photograph } from '@/lib/content'
import { Arrow } from '@/components/Arrow'
export const metadata = { title: 'About Al', description: 'An individual approach to styling, based in Kerala. Get to know the practice behind Styled by Al.', alternates: { canonical: '/about' } }
export default async function AboutPage() {
  const settings = await getSettings()
  const portrait = settings.portrait ? photograph(settings.portrait) : { src: '/images/portrait.jpg', alt: 'Illustrative portrait for the preview edition' }
  return <><section className="page-intro"><span className="eyebrow">THE STYLIST / KERALA, INDIA</span><h1>{(settings.aboutHeading || 'The person\nbehind the look.').split('\n').map((s, i) => <span className="block" key={i}>{i ? <i>{s}</i> : s}</span>)}</h1></section><section className="about-story"><figure><img src={portrait.src} alt={portrait.alt} width="1000" height="1400" fetchPriority="high" />{settings.previewEdition && <figcaption>PORTRAIT STUDY / PREVIEW IMAGERY</figcaption>}</figure><div><span className="eyebrow">AN INTRODUCTION</span><h2>It starts<br />with <i>you.</i></h2><p className="about-body">{settings.aboutText}</p><p>A wedding, a frame, an evening, or a new everyday. The intention is the same: to find a way of dressing that feels unmistakably personal.</p><Link href="/enquire" className="text-link">Start a conversation <Arrow diagonal /></Link><span className="signature" aria-hidden="true">Al.</span></div></section><section className="manifesto"><span className="eyebrow">THE PHILOSOPHY</span><p>“The most compelling thing<br />you can wear is<br /><i>a sense of yourself.</i>”</p><span className="eyebrow">THE STYLED BY AL POINT OF VIEW</span></section></>
}
