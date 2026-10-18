'use client'
export default function ErrorPage({ reset }: { reset: () => void }) { return <section className="page-intro error-page"><span className="eyebrow">A MOMENT, PLEASE</span><h1>Let’s try<br /><i>that again.</i></h1><p>The studio is taking a moment to respond.</p><button className="text-link" onClick={reset}>Try again ↗</button></section> }
