import type { SlugOptions } from 'sanity'

/**
 * Çeviri nesnelerindeki (translations.en / de / ru) slug alanı için seçenekler.
 * Studio'da "Generate" düğmesi çıkar ve aynı dildeki "Başlık" alanından adres
 * üretir (ör. "Cesme Island Boat Tour" → cesme-island-boat-tour; Kiril başlıklar
 * Latin harflere çevrilir). Slug boş bırakılırsa site o dilde de Türkçe adresi
 * kullanır — /en/tour/cesme-tekne-turu gibi.
 */
export const translationSlugOptions: SlugOptions = {
  source: (_doc, { parent }) => {
    const title = (parent as { title?: unknown } | undefined)?.title
    return typeof title === 'string' ? title : ''
  },
  maxLength: 96,
}
