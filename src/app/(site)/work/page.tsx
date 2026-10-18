import { getWorks } from '@/lib/content'
import { WorkArchive } from '@/components/WorkArchive'
export const metadata = { title: 'The Work', description: 'Explore bridal, editorial, event, and personal styling projects from Styled by Al.', alternates: { canonical: '/work' } }
export default async function WorkPage() {
  const works = await getWorks()
  return <><section className="page-intro archive-intro"><span className="eyebrow">THE PORTFOLIO / A CONTINUING CONVERSATION</span><div className="page-intro-row"><h1>The <i>work.</i></h1><p>Different people. Different moments.<br />One considered point of view.</p></div></section><WorkArchive works={works} /></>
}
