'use client'

import Link from 'next/link'
import { Fragment, type ReactNode } from 'react'
import type { SiteLocale } from '@/lib/i18n/config'
import { withLocalePath } from '@/lib/i18n/paths'

/**
 * Asistan yanıtları için küçük, güvenli biçimlendirme: paragraflar, "- " /
 * "1." maddeleri, **kalın** ve [metin](adres) bağlantıları. HTML yorumlanmaz;
 * bağlantılar yalnızca site içi yollar ve bilinen adreslerle (WhatsApp,
 * harita, telefon, e-posta) sınırlı — aksi halde düz metin kalır.
 */

const EXTERNAL_OK = /^(https:\/\/(www\.)?cesmetekneturu\.net\/|https:\/\/wa\.me\/|https:\/\/(www\.)?google\.[a-z.]+\/maps|https:\/\/maps\.google\.[a-z.]+\/|https:\/\/maps\.app\.goo\.gl\/|https:\/\/goo\.gl\/maps\/|tel:|mailto:)/i

function renderLink(label: string, href: string, locale: SiteLocale, key: string): ReactNode {
  const cls = 'font-semibold text-[var(--primary,#2168b8)] underline underline-offset-2 hover:no-underline'
  if (href.startsWith('/') && !href.startsWith('//')) {
    return (
      <Link key={key} href={withLocalePath(locale, href)} className={cls}>
        {label}
      </Link>
    )
  }
  if (EXTERNAL_OK.test(href)) {
    const external = href.startsWith('http')
    return (
      <a key={key} href={href} className={cls} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
        {label}
      </a>
    )
  }
  return <Fragment key={key}>{label}</Fragment>
}

function inline(text: string, locale: SiteLocale, keyBase: string): ReactNode[] {
  const out: ReactNode[] = []
  const re = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g
  let last = 0
  let m: RegExpExecArray | null
  let i = 0
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index))
    const key = `${keyBase}-${i++}`
    if (m[1] != null) out.push(<strong key={key} className="font-semibold">{m[1]}</strong>)
    else out.push(renderLink(m[2], m[3], locale, key))
    last = m.index + m[0].length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

type Block = { kind: 'p'; lines: string[] } | { kind: 'ul' | 'ol'; items: string[] }

function parseBlocks(text: string): Block[] {
  const blocks: Block[] = []
  for (const raw of text.replace(/\r\n/g, '\n').split('\n')) {
    const line = raw.trimEnd()
    const ul = /^\s*[-*•]\s+(.*)$/.exec(line)
    const ol = /^\s*\d+[.)]\s+(.*)$/.exec(line)
    const last = blocks[blocks.length - 1]
    if (ul || ol) {
      const kind = ul ? 'ul' : 'ol'
      const item = (ul ?? ol)![1]
      if (last && last.kind === kind) last.items.push(item)
      else blocks.push({ kind, items: [item] })
    } else if (!line.trim()) {
      blocks.push({ kind: 'p', lines: [] })
    } else if (last && last.kind === 'p') {
      last.lines.push(line.replace(/^#+\s*/, ''))
    } else {
      blocks.push({ kind: 'p', lines: [line.replace(/^#+\s*/, '')] })
    }
  }
  return blocks.filter((b) => (b.kind === 'p' ? b.lines.length > 0 : b.items.length > 0))
}

export default function ChatMarkdown({ text, locale }: { text: string; locale: SiteLocale }) {
  return (
    <>
      {parseBlocks(text).map((b, bi) => {
        if (b.kind === 'p') {
          return (
            <p key={bi} className="m-0 [&+*]:mt-2">
              {b.lines.map((l, li) => (
                <Fragment key={li}>
                  {li > 0 && <br />}
                  {inline(l, locale, `${bi}-${li}`)}
                </Fragment>
              ))}
            </p>
          )
        }
        const ListTag = b.kind
        return (
          <ListTag key={bi} className={`m-0 space-y-1 pl-5 [&+*]:mt-2 ${b.kind === 'ul' ? 'list-disc' : 'list-decimal'}`}>
            {b.items.map((it, ii) => (
              <li key={ii}>{inline(it, locale, `${bi}-${ii}`)}</li>
            ))}
          </ListTag>
        )
      })}
    </>
  )
}
