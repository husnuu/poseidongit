/**
 * docs/help-center-faq-icerik-tr.md → lib/helpCenter/staticHelpData.ts
 * Çalıştır: node scripts/generate-static-help-data.cjs
 */
const fs = require('fs')
const path = require('path')

const mdPath = path.join(__dirname, '..', 'docs', 'help-center-faq-icerik-tr.md')
const outPath = path.join(__dirname, '..', 'lib', 'helpCenter', 'staticHelpData.ts')

const META = {
  1: {
    slug: 'rezervasyon-bilet',
    shortDescription:
      'Online bilet, ödeme yöntemleri, onay, grup ve rezervasyon yönetimi.',
    iconName: 'calendar',
    order: 10,
    isFeatured: true,
  },
  2: {
    slug: 'tur-detaylari-program',
    shortDescription:
      'Çeşme sahilden 11:00 çıkış; Akvaryum, Eşek ve Mercan durakları, öğle yemeği, son durakta Kış Limanı veya Mağaralar; günbatımında dönüş ~18:00. Wi‑Fi, yolcu sigortası, Eco / Premium / First Class alanları.',
    iconName: 'ship',
    order: 20,
    isFeatured: true,
  },
  3: {
    slug: 'fiyatlandirma',
    shortDescription: 'Dahil olanlar, çocuk ve bebek fiyatları, VIP seçenekleri.',
    iconName: 'credit-card',
    order: 30,
    isFeatured: true,
  },
  4: {
    slug: 'iptal-degisiklik',
    shortDescription:
      '24 saat kuralı, kapora iadesi, tarih değişimi, işletme kaynaklı iptal ve mücbir sebepler. Son güncelleme: 19 Mart 2026.',
    iconName: 'umbrella',
    order: 40,
    isFeatured: false,
  },
  5: {
    slug: 'pratik-bilgiler',
    shortDescription:
      'Çeşme’nin en büyük teknesi: ferah güverte, gölgede veya güneşte oturma, sakin seyir. Çanta, kıyafet; deniz tutması için yanınızdayız.',
    iconName: 'life-buoy',
    order: 50,
    isFeatured: false,
  },
  6: {
    slug: 'ulasim-lokasyon',
    shortDescription:
      'İzmir servis noktaları, otelden alma ek ücretli, park sıkıntısı; check-in için tekneye en az 30 dk önce.',
    iconName: 'map-pin',
    order: 60,
    isFeatured: false,
  },
}

function slugify(title) {
  const map = {
    ğ: 'g',
    ü: 'u',
    ş: 's',
    ı: 'i',
    ö: 'o',
    ç: 'c',
    İ: 'i',
    â: 'a',
    û: 'u',
    '’': '',
    "'": '',
  }
  let s = title.toLowerCase()
  for (const [k, v] of Object.entries(map)) {
    s = s.split(k).join(v)
  }
  return s
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .replace(/-+/g, '-')
    .slice(0, 96)
}

function stripInlineMd(s) {
  return s.replace(/\*\*(.+?)\*\*/g, '$1')
}

const md = fs.readFileSync(mdPath, 'utf8')
const lines = md.split(/\r?\n/)

const sections = []
let currentSection = null
let sectionTitle = ''
let buffer = []

function flush() {
  if (currentSection !== null) {
    sections.push({ num: currentSection, title: sectionTitle, body: buffer.join('\n') })
  }
}

for (const line of lines) {
  const secMatch = line.match(/^## (\d+)\.\s+(.+)$/)
  if (secMatch) {
    flush()
    currentSection = parseInt(secMatch[1], 10)
    sectionTitle = secMatch[2].trim()
    buffer = []
    continue
  }
  if (currentSection !== null) buffer.push(line)
}
flush()

const articleRe =
  /\*\*Soru:\*\*\s*(.+?)\s*\n\n\*\*Cevap:\*\*\s*([\s\S]+?)(?=\n\n\*\*SEO|\n\n---|\n###|\n##|$)/g

const outCategories = []

for (const sec of sections) {
  const meta = META[sec.num]
  if (!meta) continue
  const articles = []
  let m
  const re = new RegExp(articleRe.source, articleRe.flags)
  while ((m = re.exec(sec.body)) !== null) {
    const title = m[1].trim()
    const answer = stripInlineMd(m[2].trim())
    const slug = slugify(title)
    articles.push({ slug, title, answer })
  }
  outCategories.push({
    slug: meta.slug,
    title: sec.title,
    shortDescription: meta.shortDescription,
    iconName: meta.iconName,
    order: meta.order,
    isFeatured: meta.isFeatured,
    articles,
  })
}

for (const c of outCategories) {
  const seen = new Set()
  for (const a of c.articles) {
    if (seen.has(a.slug)) throw new Error(`Yinelenen slug: ${a.slug} (${c.slug})`)
    seen.add(a.slug)
  }
}

const totalArticles = outCategories.reduce((n, c) => n + c.articles.length, 0)
if (totalArticles !== 38) {
  console.warn(`Beklenen 38 makale, bulunan: ${totalArticles}`)
}

const STATIC_PAGE = `export const STATIC_HELP_PAGE = {
  heroEyebrow: 'Yardım Merkezi',
  title: 'Poseidon Çeşme Tekne Turu — Sık Sorulan Sorular',
  shortDescription:
    'Online rezervasyon, tur programı, fiyatlar, iptal ve Çeşme’de buluşma hakkında sık sorulan soruların yanıtları. Güncel saat ve fiyat için tur sayfanızı ve biletinizi esas alın.',
  seoTitle: 'Çeşme Tekne Turu Yardım Merkezi | Poseidon',
  seoDescription:
    'Poseidon günlük tekne turu: rezervasyon, ödeme, iptal, rota ve pratik bilgiler. cesmetekneturu.net üzerinden online bilet ve destek.',
} as const
`

let catTs =
  'export type StaticHelpArticle = {\n  slug: string\n  title: string\n  answer: string\n}\n\n'
catTs +=
  'export type StaticHelpCategory = {\n  slug: string\n  title: string\n  shortDescription: string\n  iconName: string\n  order: number\n  isFeatured: boolean\n  articles: StaticHelpArticle[]\n}\n\n'

catTs += 'export const STATIC_HELP_CATEGORIES: StaticHelpCategory[] = [\n'

for (const c of outCategories) {
  catTs += `  {\n    slug: '${c.slug}',\n    title: ${JSON.stringify(c.title)},\n    shortDescription: ${JSON.stringify(
    c.shortDescription,
  )},\n    iconName: '${c.iconName}',\n    order: ${c.order},\n    isFeatured: ${c.isFeatured},\n    articles: [\n`
  for (const a of c.articles) {
    catTs += `      { slug: '${a.slug}', title: ${JSON.stringify(a.title)}, answer: ${JSON.stringify(a.answer)} },\n`
  }
  catTs += `    ],\n  },\n`
}
catTs += ']\n'

const header = `/**\n * Kaynak: docs/help-center-faq-icerik-tr.md\n * Yenilemek için: node scripts/generate-static-help-data.cjs\n */\n\n`

fs.writeFileSync(outPath, header + STATIC_PAGE + '\n' + catTs)
console.log('Yazıldı:', outPath, `(${totalArticles} makale)`)
