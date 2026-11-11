'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowUp, ChevronRight, MessageCircleQuestionMark, RotateCcw, X } from 'lucide-react'
import type { SiteLocale } from '@/lib/i18n/config'
import { parseLocaleFromPathname, withLocalePath } from '@/lib/i18n/paths'
import { useFloatingButtonState } from '@/components/floating/useFloatingButtonState'
import { CHAT_COPY, type ChatCopy } from './chatCopy'
import ChatMarkdown from './ChatMarkdown'
import styles from './ChatWidget.module.css'

type TourCard = {
  slug: string
  title: string
  imageUrl: string | null
  priceFrom: number | null
  duration: string | null
  privateTour: boolean
}

type Msg = { role: 'user' | 'assistant'; content: string; error?: boolean; cards?: TourCard[] }

const STORAGE_KEY = 'poseidon_chat_v1'
const GREETED_KEY = 'poseidon_chat_greeted'
const MAX_STORED = 40
const PANEL_ID = 'poseidon-chat-panel'
const NUMBER_LOCALE: Record<SiteLocale, string> = { tr: 'tr-TR', en: 'en-GB', de: 'de-DE', ru: 'ru-RU' }

class ChatError extends Error {
  constructor(public kind: 'busy' | 'limit' | 'daily' | 'generic') {
    super(kind)
  }
}

function isMsg(x: unknown): x is Msg {
  const m = x as Msg
  return Boolean(m) && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string'
}

/** Yuvarlak fotoğraf (tur kapağı); fotoğraf yoksa marka renginde "P". */
function Avatar({ src, size }: { src: string | null; size: number }) {
  return (
    <span
      className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--primary,#2168b8)] text-white"
      style={{ width: size, height: size }}
    >
      {src ? (
        <Image src={src} alt="" width={size * 2} height={size * 2} sizes={`${size}px`} className="h-full w-full object-cover" />
      ) : (
        <span className="font-black" style={{ fontSize: size * 0.42 }}>
          P
        </span>
      )}
    </span>
  )
}

/**
 * Sitedeki sohbet asistanı: sağ altta (WhatsApp butonunun üstünde) açılır
 * pencere. Yanıt /api/chat'ten NDJSON akışıyla gelir; yanıtta bağlantısı geçen
 * turlar ilan kartı olarak gösterilir. Sohbet yalnızca bu sekmede
 * (sessionStorage) tutulur, sunucuda saklanmaz.
 */
export default function ChatWidget({
  whatsappHref,
  avatarUrl,
  heroUrl,
}: {
  whatsappHref: string | null
  avatarUrl: string | null
  heroUrl: string | null
}) {
  const pathname = usePathname() || '/'
  const { locale } = parseLocaleFromPathname(pathname)
  const copy = CHAT_COPY[locale]
  const { relaxBottom, hidden } = useFloatingButtonState()

  const [open, setOpen] = useState(false)
  const [greeting, setGreeting] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [checking, setChecking] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const restored = useRef(false)

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY)
      const arr: unknown = raw ? JSON.parse(raw) : null
      if (Array.isArray(arr)) setMessages(arr.filter(isMsg).filter((m) => m.content).slice(-MAX_STORED))
    } catch {
      // depolama kapalı — boş sohbetle devam
    }
    restored.current = true
  }, [])

  useEffect(() => {
    if (!restored.current || busy) return
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.filter((m) => m.content).slice(-MAX_STORED)))
    } catch {
      // yok say
    }
  }, [messages, busy])

  // Karşılama kartı: masaüstünde, oturum başına bir kez, birkaç saniye sonra.
  useEffect(() => {
    if (window.innerWidth < 1024) return
    try {
      if (window.sessionStorage.getItem(GREETED_KEY)) return
    } catch {
      return
    }
    const show = window.setTimeout(() => setGreeting(true), 6000)
    const hide = window.setTimeout(() => setGreeting(false), 20000)
    return () => {
      window.clearTimeout(show)
      window.clearTimeout(hide)
    }
  }, [])

  const dismissGreeting = () => {
    setGreeting(false)
    try {
      window.sessionStorage.setItem(GREETED_KEY, '1')
    } catch {
      // yok say
    }
  }

  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, checking, open])

  useEffect(() => {
    if (!open) return
    dismissGreeting()
    inputRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  // Pencere açıkken WhatsApp butonu gizlenir (useFloatingButtonState bu işarete bakar).
  useEffect(() => {
    if (!open) return
    document.body.dataset.chatOpen = '1'
    return () => {
      delete document.body.dataset.chatOpen
    }
  }, [open])

  // Mobilde pencere tam ekran: arkadaki sayfa kaymasın.
  useEffect(() => {
    if (!open || window.innerWidth >= 640) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  useEffect(() => () => abortRef.current?.abort(), [])

  const updateLast = (fn: (m: Msg) => Msg) =>
    setMessages((prev) => (prev.length ? [...prev.slice(0, -1), fn(prev[prev.length - 1])] : prev))

  const send = useCallback(
    async (text: string) => {
      const q = text.trim().slice(0, 2000)
      if (!q || busy) return
      const history = [
        ...messages.filter((m) => !m.error && m.content).map((m) => ({ role: m.role, content: m.content })),
        { role: 'user' as const, content: q },
      ]
      setMessages((prev) => [...prev, { role: 'user', content: q }, { role: 'assistant', content: '' }])
      setInput('')
      if (inputRef.current) inputRef.current.style.height = ''
      setBusy(true)
      setChecking(false)
      const ctrl = new AbortController()
      abortRef.current = ctrl
      let answer = ''
      const show = (s: string) => {
        answer = s
        updateLast((m) => ({ ...m, content: s }))
      }
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: history, page: pathname }),
          signal: ctrl.signal,
        })
        if (res.status === 429) {
          const j = (await res.json().catch(() => ({}))) as { error?: string }
          throw new ChatError(j.error === 'daily_limit' ? 'daily' : 'limit')
        }
        if (!res.ok || !res.body) throw new ChatError('generic')
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buf = ''
        let errorCode: string | null = null
        for (;;) {
          const { value, done } = await reader.read()
          if (done) break
          buf += decoder.decode(value, { stream: true })
          let nl: number
          while ((nl = buf.indexOf('\n')) >= 0) {
            const line = buf.slice(0, nl).trim()
            buf = buf.slice(nl + 1)
            if (!line) continue
            let ev: { t?: string; v?: unknown; code?: string }
            try {
              ev = JSON.parse(line)
            } catch {
              continue
            }
            if (ev.t === 'text' && typeof ev.v === 'string') {
              setChecking(false)
              show(answer + ev.v)
            } else if (ev.t === 'status') {
              setChecking(true)
            } else if (ev.t === 'cards' && Array.isArray(ev.v)) {
              const cards = ev.v as TourCard[]
              updateLast((m) => ({ ...m, cards }))
            } else if (ev.t === 'refusal' || ev.t === 'incomplete') {
              show(`${answer.trim() ? `${answer.trim()}\n\n` : ''}${ev.t === 'refusal' ? copy.refusal : copy.incomplete}`)
            } else if (ev.t === 'error') {
              errorCode = ev.code ?? 'error'
            }
          }
        }
        if (errorCode) throw new ChatError(errorCode === 'busy' ? 'busy' : 'generic')
        if (!answer.trim()) throw new ChatError('generic')
      } catch (e) {
        if (ctrl.signal.aborted) return
        const kind = e instanceof ChatError ? e.kind : 'generic'
        const msg =
          kind === 'busy' ? copy.errorBusy : kind === 'limit' ? copy.errorLimit : kind === 'daily' ? copy.errorDaily : copy.errorGeneric
        if (answer.trim()) setMessages((prev) => [...prev, { role: 'assistant', content: msg, error: true }])
        else updateLast(() => ({ role: 'assistant', content: msg, error: true }))
      } finally {
        if (abortRef.current === ctrl) abortRef.current = null
        setBusy(false)
        setChecking(false)
      }
    },
    [busy, messages, pathname, copy]
  )

  const reset = () => {
    abortRef.current?.abort()
    setMessages([])
    setBusy(false)
    setChecking(false)
    try {
      window.sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      // yok say
    }
    inputRef.current?.focus()
  }

  const hasUserMessage = messages.some((m) => m.role === 'user')
  const iconBtn =
    'flex h-9 w-9 items-center justify-center rounded-full text-[var(--secondary,#131719)] transition hover:bg-[#f2f3f5]'

  return (
    <>
      {!open && !hidden && (
        <>
          {greeting && (
            <div className={styles.greeting} role="status">
              <button type="button" className="flex flex-1 items-center gap-3 text-left" onClick={() => setOpen(true)}>
                <Avatar src={avatarUrl} size={40} />
                <span className="min-w-0">
                  <span className="block text-[13px] font-bold text-[var(--secondary,#131719)]">{copy.title}</span>
                  <span className="mt-0.5 block text-[13.5px] leading-snug text-[var(--text-color,#58595b)]">{copy.greeting}</span>
                </span>
              </button>
              <button
                type="button"
                onClick={dismissGreeting}
                aria-label={copy.close}
                className="flex h-7 w-7 shrink-0 items-center justify-center self-start rounded-full text-[#9aa0a8] hover:bg-[#f2f3f5] hover:text-[var(--secondary,#131719)]"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-expanded={false}
            aria-controls={PANEL_ID}
            aria-label={copy.title}
            className={`${styles.launcher} ${whatsappHref ? '' : styles.solo} ${relaxBottom ? styles.relaxBottom : ''}`}
          >
            <MessageCircleQuestionMark className={styles.icon} aria-hidden />
            <span className={styles.label}>{copy.launcher}</span>
          </button>
        </>
      )}

      {open && (
        <div
          id={PANEL_ID}
          role="dialog"
          aria-label={copy.title}
          className={`${styles.panel} fixed inset-0 z-[10001] flex flex-col bg-white text-[var(--secondary,#131719)] sm:inset-auto sm:bottom-5 sm:right-5 sm:h-[min(700px,calc(100dvh-40px))] sm:w-[400px] sm:overflow-hidden sm:rounded-[24px] sm:shadow-[0_24px_64px_-16px_rgba(19,23,25,0.38),0_0_0_1px_rgba(19,23,25,0.06)]`}
          style={{ fontFamily: 'var(--font-family)' }}
        >
          {/* Başlık: sade, beyaz — Airbnb mesaj ekranı gibi. */}
          <div
            className="flex items-center gap-3 border-b border-[#ebebeb] px-4 pb-3"
            style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
          >
            <Avatar src={avatarUrl} size={40} />
            <div className="min-w-0 flex-1">
              <p className="m-0 truncate text-[16px] font-bold leading-tight">{copy.title}</p>
              <p className="m-0 mt-0.5 truncate text-[13px] text-[var(--text-color,#58595b)]">{copy.status}</p>
            </div>
            {hasUserMessage && (
              <button type="button" onClick={reset} aria-label={copy.reset} title={copy.reset} className={iconBtn}>
                <RotateCcw className="h-[17px] w-[17px]" aria-hidden />
              </button>
            )}
            <button type="button" onClick={() => setOpen(false)} aria-label={copy.close} className={iconBtn}>
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto overscroll-contain px-4 pb-5 pt-4" aria-live="polite">
            {/* Karşılama: tur fotoğrafı üstünde sitenin başlık stili. */}
            <div className="relative overflow-hidden rounded-[18px] bg-[var(--primary,#2168b8)]">
              {heroUrl && (
                <Image src={heroUrl} alt="" width={820} height={420} sizes="370px" loading="eager" className="h-[150px] w-full object-cover" />
              )}
              <div
                className={`${heroUrl ? 'absolute inset-0' : 'min-h-[120px]'} flex flex-col justify-end p-4`}
                style={
                  heroUrl
                    ? { background: 'linear-gradient(to top, rgba(10,22,40,0.82) 0%, rgba(10,22,40,0.25) 55%, rgba(10,22,40,0) 100%)' }
                    : undefined
                }
              >
                <p
                  className="m-0 text-[19px] font-black uppercase leading-[1.15] text-white"
                  style={{ fontFamily: 'var(--font-family-title, var(--font-family))', WebkitTextStroke: '0.3px currentColor' }}
                >
                  {copy.heroTitle}
                </p>
              </div>
            </div>
            <p className="m-0 mt-3 text-[14.5px] leading-relaxed text-[var(--text-color,#58595b)]">{copy.welcome}</p>

            {!hasUserMessage && (
              <div className="mt-5">
                <p className="m-0 mb-1 text-[13px] font-bold uppercase tracking-[0.06em] text-[var(--secondary,#131719)]">{copy.quickTitle}</p>
                <ul className="m-0 list-none divide-y divide-[#ebebeb] p-0">
                  {copy.suggestions.map((s) => (
                    <li key={s}>
                      <button
                        type="button"
                        onClick={() => void send(s)}
                        className="group flex w-full items-center justify-between gap-3 py-3.5 text-left text-[15px] font-medium text-[var(--secondary,#131719)]"
                      >
                        <span className="underline-offset-4 group-hover:underline">{s}</span>
                        <ChevronRight
                          className="h-[18px] w-[18px] shrink-0 text-[#9aa0a8] transition group-hover:translate-x-0.5 group-hover:text-[var(--secondary,#131719)]"
                          aria-hidden
                        />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-5 space-y-4">
              {messages.map((m, i) => {
                if (m.role === 'user') {
                  return (
                    <div key={i} className="flex justify-end">
                      <div className="max-w-[82%] whitespace-pre-wrap break-words rounded-[20px] rounded-br-[6px] bg-[var(--primary,#2168b8)] px-4 py-2.5 text-[14.5px] leading-relaxed text-white">
                        {m.content}
                      </div>
                    </div>
                  )
                }
                const isPending = busy && i === messages.length - 1
                return (
                  <div key={i} className="flex items-start gap-2.5">
                    <Avatar src={avatarUrl} size={28} />
                    <div className="min-w-0 flex-1 space-y-3">
                      <div
                        className={`w-fit max-w-full break-words rounded-[20px] rounded-tl-[6px] px-4 py-2.5 text-[14.5px] leading-relaxed ${
                          m.error ? 'bg-[#fff1f1] text-[#8a1c1c]' : 'bg-[#f2f3f5] text-[var(--secondary,#131719)]'
                        }`}
                      >
                        {m.content ? <ChatMarkdown text={m.content} locale={locale} /> : null}
                        {isPending && checking && (
                          <p className={`m-0 text-[13.5px] italic text-[var(--text-color,#58595b)] ${m.content ? 'mt-2' : ''}`}>
                            {copy.checking}
                          </p>
                        )}
                        {isPending && !m.content && !checking && (
                          <span className="flex h-5 items-center gap-1" aria-label="…">
                            <span className={styles.dot} />
                            <span className={styles.dot} />
                            <span className={styles.dot} />
                          </span>
                        )}
                        {m.error && whatsappHref && (
                          <a
                            href={whatsappHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-block font-semibold text-[var(--secondary,#131719)] underline underline-offset-2"
                          >
                            {copy.whatsapp}
                          </a>
                        )}
                      </div>
                      {m.cards && m.cards.length > 0 && <TourCards cards={m.cards} locale={locale} copy={copy} />}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="border-t border-[#ebebeb] px-4 pt-3" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                void send(input)
              }}
              className="flex items-end gap-2 rounded-[26px] border border-[#dddddd] bg-white py-1.5 pl-4 pr-1.5 transition focus-within:border-[var(--secondary,#131719)]"
            >
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                maxLength={2000}
                placeholder={copy.placeholder}
                aria-label={copy.placeholder}
                onChange={(e) => {
                  setInput(e.target.value)
                  e.target.style.height = 'auto'
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault()
                    void send(input)
                  }
                }}
                className="max-h-32 min-h-[36px] flex-1 resize-none border-0 bg-transparent py-2 text-[16px] leading-snug text-[var(--secondary,#131719)] outline-none placeholder:text-[#8a9099] focus-visible:outline-none sm:text-[15px]"
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                aria-label={copy.send}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--primary,#2168b8)] text-white transition hover:brightness-110 disabled:bg-[#dddddd]"
              >
                <ArrowUp className="h-[18px] w-[18px]" aria-hidden />
              </button>
            </form>
            <p className="m-0 mt-2 text-center text-[11.5px] leading-snug text-[#8a9099]">
              {copy.disclaimer}
              {whatsappHref && (
                <>
                  {' '}
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-[var(--secondary,#131719)] underline underline-offset-2"
                  >
                    {copy.whatsapp}
                  </a>
                </>
              )}
            </p>
          </div>
        </div>
      )}
    </>
  )
}

/** Yanıtta bağlantısı geçen turlar — Airbnb ilan kartı düzeni: fotoğraf, başlık, süre, fiyat. */
function TourCards({ cards, locale, copy }: { cards: TourCard[]; locale: SiteLocale; copy: ChatCopy }) {
  const money = (n: number) => `${n.toLocaleString(NUMBER_LOCALE[locale])} ₺`
  return (
    <div className="-mr-4 flex snap-x gap-3 overflow-x-auto pb-1 pr-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {cards.map((c) => (
        <Link
          key={c.slug}
          href={withLocalePath(locale, `/tur/${c.slug}`)}
          className="group block w-[176px] shrink-0 snap-start text-[var(--secondary,#131719)] no-underline"
        >
          <span className="block aspect-[4/3] w-full overflow-hidden rounded-[14px] bg-[#ebebeb]">
            {c.imageUrl && (
              <Image
                src={c.imageUrl}
                alt=""
                width={400}
                height={300}
                sizes="176px"
                className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
              />
            )}
          </span>
          <span className="mt-2 line-clamp-2 block text-[13.5px] font-bold leading-snug group-hover:underline">{c.title}</span>
          {c.duration && <span className="mt-0.5 block text-[13px] text-[var(--text-color,#58595b)]">{c.duration}</span>}
          {c.priceFrom != null && (
            <span className="mt-0.5 block text-[13px] text-[var(--text-color,#58595b)]">
              <b className="font-bold text-[var(--secondary,#131719)]">{money(c.priceFrom)}</b> {c.privateTour ? copy.perGroup : copy.perPerson}
            </span>
          )}
        </Link>
      ))}
    </div>
  )
}
