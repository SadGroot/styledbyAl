'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export function Header({ brand }: { brand: string }) {
  const path = usePathname()
  return <header className="site-header">
    <Link href="/" className="wordmark" aria-label={`${brand}, home`}>{brand === 'Styled by Al' ? <>styled <i>by Al</i></> : brand}<span className="wordmark-dot">.</span></Link>
    <nav aria-label="Main navigation"><Link className={cn('nav-link', path.startsWith('/work') && 'active')} href="/work">Work</Link><Link className={cn('nav-link', path === '/services' && 'active')} href="/services">Services</Link><Link className={cn('nav-link', path === '/about' && 'active')} href="/about">About</Link><Link className="nav-enquire" href="/enquire">Let’s talk <span aria-hidden="true">↗</span></Link></nav>
  </header>
}
