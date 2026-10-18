'use client'
import { useEffect, useRef, useState } from 'react'
import { services } from '@/lib/constants'
import { Arrow } from './Arrow'

export function EnquiryForm({ service = '', whatsapp = '', received = false, startedAt }: { service?: string; whatsapp?: string; received?: boolean; startedAt: number }) {
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [state, setState] = useState<'idle' | 'sending' | 'success'>(received ? 'success' : 'idle')
  const [key, setKey] = useState('')
  const sending = useRef(false)
  const success = useRef<HTMLHeadingElement>(null)
  useEffect(() => { setKey(crypto.randomUUID()) }, [])
  useEffect(() => { if (state === 'success') success.current?.focus() }, [state])
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (sending.current) return
    sending.current = true; setState('sending'); setErrors({})
    const form = event.currentTarget
    const fields = Object.fromEntries(new FormData(form))
    try {
      const response = await fetch('/api/enquiry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...fields, consent: fields.consent === 'on' }), signal: AbortSignal.timeout(20000) })
      const result = await response.json()
      if (!response.ok) { setErrors(result.errors || { form: [result.message || 'Your enquiry could not be sent. Please try again.'] }); setState('idle'); return }
      setState('success')
    } catch { setErrors({ form: ['The connection was interrupted. Please try again; your message will not be duplicated.'] }); setState('idle') }
    finally { sending.current = false }
  }
  const err = (field: string) => errors[field]?.[0]
  const attrs = (field: string) => ({ 'aria-invalid': Boolean(err(field)), 'aria-describedby': err(field) ? `${field}-error` : undefined })
  const error = (field: string) => err(field) && <span className="field-error" id={`${field}-error`}>{err(field)}</span>
  if (state === 'success') return <div className="enquiry-success" role="status"><span className="eyebrow">A NEW CONVERSATION</span><h2 ref={success} tabIndex={-1}>Consider it<br /><i>the beginning.</i></h2><p>Your enquiry has arrived safely in the studio. Thank you for sharing a little of your story.</p>{whatsapp && <a className="text-link" href={`https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('Hello Al, I have just submitted a styling enquiry on your website.')}`} target="_blank" rel="noreferrer">Continue on WhatsApp <Arrow diagonal /></a>}<a href="/work" className="text-link">Explore the work <Arrow diagonal /></a></div>
  return <form action="/api/enquiry" method="post" onSubmit={submit} className="enquiry-form" aria-busy={state === 'sending'}>
    <input type="hidden" name="submissionKey" value={key} /><input type="hidden" name="startedAt" value={startedAt} />
    <div className="honeypot" aria-hidden="true"><label htmlFor="website">Leave this field empty</label><input id="website" name="website" tabIndex={-1} autoComplete="off" /></div>
    <div className="form-grid"><div className="form-field"><label htmlFor="name">Your name <span>*</span></label><input id="name" name="name" autoComplete="name" required minLength={2} maxLength={100} placeholder="How should we address you?" {...attrs('name')} />{error('name')}</div><div className="form-field"><label htmlFor="email">Email address <span>*</span></label><input id="email" type="email" name="email" autoComplete="email" required maxLength={254} placeholder="you@example.com" {...attrs('email')} />{error('email')}</div><div className="form-field"><label htmlFor="phone">Phone / WhatsApp <span>optional</span></label><input id="phone" type="tel" name="phone" autoComplete="tel" maxLength={40} placeholder="With country code" {...attrs('phone')} />{error('phone')}</div><div className="form-field"><label htmlFor="service">What brings you here? <span>*</span></label><select id="service" name="service" required defaultValue={services.some(s => s.value === service) ? service : ''} {...attrs('service')}><option value="" disabled>Select a styling service</option>{services.map(s => <option value={s.value} key={s.value}>{s.label}</option>)}</select>{error('service')}</div><div className="form-field"><label htmlFor="eventDate">Occasion date <span>optional</span></label><input id="eventDate" name="eventDate" type="date" {...attrs('eventDate')} />{error('eventDate')}</div><div className="form-field"><label htmlFor="location">Location <span>optional</span></label><input id="location" name="location" autoComplete="address-level2" maxLength={160} placeholder="City or destination" {...attrs('location')} />{error('location')}</div><div className="form-field form-full"><label htmlFor="budget">A budget in mind? <span>optional</span></label><input id="budget" name="budget" maxLength={100} placeholder="A range is perfectly fine" {...attrs('budget')} />{error('budget')}</div><div className="form-field form-full"><label htmlFor="message">Tell me a little about your story <span>*</span></label><textarea id="message" name="message" rows={4} required minLength={10} maxLength={5000} placeholder="The occasion, the feeling, the details that matter to you…" {...attrs('message')} />{error('message')}</div></div><div className="consent-field"><input id="consent" type="checkbox" name="consent" required {...attrs('consent')} /><label htmlFor="consent">You may contact me about this enquiry. I’ve read the <a href="/privacy">privacy note</a>.</label>{error('consent')}</div>{errors.form && <p className="field-error" role="alert">{errors.form[0]}</p>}<div aria-live="polite">{Object.keys(errors).length > 0 && <p className="field-error">Please review the highlighted fields.</p>}</div><button className="submit-button" type="submit" disabled={state === 'sending'}>{state === 'sending' ? 'Sending your story…' : 'Send your enquiry'}<Arrow diagonal /></button><p className="form-footnote">Every enquiry is personal. Every response, considered.</p>
  </form>
}
