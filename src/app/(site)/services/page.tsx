import Link from 'next/link'
import { getServices } from '@/lib/content'
import { Arrow } from '@/components/Arrow'
export const metadata = { title: 'The Practice', description: 'Bespoke bridal, celebrity, event, personal styling and wardrobe consultations, based in Kerala.', alternates: { canonical: '/services' } }
export default async function ServicesPage() {
  const services = await getServices()
  return <><section className="page-intro"><span className="eyebrow">THE PRACTICE / CONSIDERED FROM THE START</span><h1>A way of<br /><i>seeing you.</i></h1><p className="intro-description">No two people are the same. Neither are the looks we create.<br />Discover a styling experience shaped around you.</p></section><section className="service-details">{services.map((service, i) => <article className="service-detail" id={service.key} key={service.id}><span className="service-number">{String(i + 1).padStart(2, '0')} /</span><div><h2>{service.title}</h2><span className="service-detail-tagline">{service.tagline}</span></div><div><p>{service.description}</p><h3>THE APPROACH</h3><p>{service.process}</p><Link href={`/enquire?service=${service.key}`} className="text-link">Enquire about this service <Arrow diagonal /></Link></div></article>)}</section></>
}
