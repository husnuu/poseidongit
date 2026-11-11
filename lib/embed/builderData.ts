import { loadToursForLocale } from '@/lib/tours/listForLocale'
import type { WidgetTourOption } from '@/components/embed/WidgetBuilder'

/** Widget oluşturucudaki tur seçenekleri (kimlik dilden bağımsız Sanity _id). */
export async function loadWidgetTourOptions(): Promise<WidgetTourOption[]> {
  try {
    const tours = await loadToursForLocale('tr')
    return tours.filter((t) => t.slug).map((t) => ({ id: t._id, title: t.title ?? t.slug ?? t._id }))
  } catch (e) {
    console.error('[widget] tours', e)
    return []
  }
}
