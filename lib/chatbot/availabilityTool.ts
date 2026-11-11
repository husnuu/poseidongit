import type Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { GET as tourCalendarGET } from '@/app/api/availability/tour-calendar/route'
import { todayStrIstanbul } from '@/lib/istanbulTime'
import type { ChatTourRef } from './knowledge'

export const CHECK_AVAILABILITY_TOOL: Anthropic.Beta.BetaTool = {
  name: 'check_availability',
  description:
    'Bir turun belirli bir tarihte çalışıp çalışmadığını ve bilet sınıflarına göre kalan kontenjanı döndürür. ' +
    'Tur o gün kapalı ya da doluysa aynı aydaki en yakın müsait günleri de verir. ' +
    'Ziyaretçi belirli bir gün için yer sorduğunda kullan.',
  input_schema: {
    type: 'object',
    properties: {
      tour_slug: { type: 'string', description: 'Bilgideki "Sayfa: /tur/<slug>" satırındaki slug, ör. "gunbatimi-turu".' },
      date: { type: 'string', description: 'Tarih, YYYY-MM-DD biçiminde (İstanbul saati).' },
    },
    required: ['tour_slug', 'date'],
    additionalProperties: false,
  },
  eager_input_streaming: true,
}

const Input = z.object({
  tour_slug: z.string().min(1).max(120),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

type CalendarDay = { date: string; scheduleOpen: boolean; remaining: number; available: boolean }

/** Kullanıcının IP başlıkları aktarılır: rate limit sunucu değil ziyaretçi başına işler. */
function forwardedHeaders(request: Request): Headers {
  const h = new Headers()
  for (const name of ['cf-connecting-ip', 'x-real-ip', 'x-forwarded-for']) {
    const v = request.headers.get(name)
    if (v) h.set(name, v)
  }
  return h
}

/**
 * Aracı çalıştırır. Mevcut /api/availability/tour-calendar mantığını doğrudan
 * çağırır (rezervasyon sihirbazındaki takvimle aynı hesap).
 */
export async function runCheckAvailability(
  rawInput: unknown,
  tours: ChatTourRef[],
  request: Request
): Promise<{ content: string; isError: boolean }> {
  const parsed = Input.safeParse(rawInput)
  if (!parsed.success) {
    return { content: JSON.stringify({ error: 'invalid_input', expected: { tour_slug: 'string', date: 'YYYY-MM-DD' } }), isError: true }
  }
  const { date } = parsed.data
  const slug = parsed.data.tour_slug.replace(/^\/?tur\//, '').trim()
  const tour = tours.find((t) => t.slug === slug)
  if (!tour) {
    return { content: JSON.stringify({ error: 'unknown_tour', known_slugs: tours.map((t) => t.slug) }), isError: true }
  }
  const today = todayStrIstanbul()
  if (date < today) return { content: JSON.stringify({ error: 'date_in_past', today }), isError: true }

  const month = date.slice(0, 7)
  // Sınıfı olmayan (tek fiyat) turlar varsayılan "eco" kontenjanını kullanır.
  const classes = tour.classes.length ? tour.classes : [{ key: 'eco', label: 'Standart' }]
  const origin = new URL(request.url).origin

  const perClass = await Promise.all(
    classes.map(async (cl) => {
      const url = new URL('/api/availability/tour-calendar', origin)
      url.searchParams.set('tourId', tour.slug)
      url.searchParams.set('month', month)
      url.searchParams.set('classId', cl.key)
      const res = await tourCalendarGET(new NextRequest(url, { headers: forwardedHeaders(request) }))
      if (!res.ok) throw new Error(`calendar ${res.status}`)
      const body = (await res.json()) as { days?: CalendarDay[] }
      return { cl, days: body.days ?? [] }
    })
  ).catch((e: unknown) => {
    console.error('[chat] availability failed', e instanceof Error ? e.message : e)
    return null
  })
  if (!perClass) return { content: JSON.stringify({ error: 'availability_unavailable' }), isError: true }

  const dayFor = (days: CalendarDay[]) => days.find((d) => d.date === date)
  const operating = perClass.some(({ days }) => dayFor(days)?.scheduleOpen)
  const classesOut = perClass.map(({ cl, days }) => ({ class: cl.label, remaining_seats: dayFor(days)?.remaining ?? 0 }))
  const anySeat = operating && classesOut.some((c) => c.remaining_seats > 0)

  // Kapalı/dolu ise aynı ayda bu tarihten sonraki ilk 5 müsait gün.
  const nextAvailable = anySeat
    ? []
    : [...new Set(perClass.flatMap(({ days }) => days.filter((d) => d.available && d.date > date).map((d) => d.date)))]
        .sort()
        .slice(0, 5)

  return {
    content: JSON.stringify({
      tour: tour.title,
      page: `/tur/${tour.slug}`,
      date,
      operating,
      classes: classesOut,
      ...(tour.privateTour ? { note: 'Özel tur: kontenjan grup rezervasyonu içindir, talep ekip onayıyla kesinleşir.' } : {}),
      ...(!anySeat ? { next_available_dates_this_month: nextAvailable } : {}),
    }),
    isError: false,
  }
}
