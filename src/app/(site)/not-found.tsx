import Link from 'next/link'
export default function NotFound() { return <section className="page-intro error-page"><span className="eyebrow">404 · A MISSING PAGE</span><h1>A different<br /><i>direction.</i></h1><p>This page is unavailable or this project hasn’t been published yet.</p><Link className="text-link" href="/work">Explore the work ↗</Link></section> }
