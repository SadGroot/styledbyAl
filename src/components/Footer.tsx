import Link from 'next/link'
import { Arrow } from './Arrow'

export function Footer({ settings }: { settings: any }) {
  return <footer className="site-footer">
    <div className="footer-invitation"><span className="eyebrow">THE NEXT CHAPTER</span><Link href="/enquire">Let’s make it <i>yours.</i><Arrow diagonal /></Link></div>
    <div className="footer-bottom"><span>© {new Date().getFullYear()} {settings.brandName || 'Styled by Al'}</span><span>{settings.location || 'Kerala, India'} <span className="footer-timezone">· IST</span></span><div>{settings.instagram && <a href={settings.instagram} target="_blank" rel="noreferrer">Instagram ↗</a>}<Link href="/privacy">Privacy</Link><Link href="/studio">Studio ↗</Link></div></div>
    {settings.previewEdition && <p className="preview-disclaimer">PREVIEW EDITION · Selected imagery illustrates the art direction and is not presented as commissioned work. Portrait imagery is illustrative.</p>}
  </footer>
}
