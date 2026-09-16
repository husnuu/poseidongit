# Anasayfa Tasarım Sistemi

Bu doküman, anasayfada (ve anasayfada kullanılan paylaşılan bileşenlerde: tur kartı,
özel tekne kartı, bilet sınıfı vitrini) kullanılan tek tip görsel dili tanımlar.
Yeni bir bölüm/kart eklerken buradaki token'ları ve kalıpları kullan.

> Not: Bu değerler `app/globals.css` içindeki `:root` bloğundan ve
> `components/tours/TourCard.tsx`, `components/home/HomePopularYachtCard.tsx`,
> `components/tour/TourClassShowcase.tsx`, `components/home/*Section.tsx`
> dosyalarından derlenmiştir.

## 1. Renkler

| Token | Değer | Kullanım |
|---|---|---|
| `--primary` | `#2168b8` | Marka mavisi — başlıklar, butonlar, ikon vurguları, aktif sekme |
| `--secondary` | `#131719` | Kart başlıkları, koyu metin |
| `--muted` | `#81848b` | Meta satırları, ikincil/yardımcı metin, fiyat altyazıları |
| `--text-color` | `#58595b` | Gövde/paragraf metni (açıklamalar, alt başlıklar) |
| Kart kenarlığı | `#f1f5f9` | Tüm kartların (`border`) rengi |
| Rozet sarısı | `#ffc736` | "EN POPÜLER" / "ÖNE ÇIKAN" rozetleri (koyu `#1a1a1a` metinle) |
| Yıldız/puan sarısı | `#f5a623` | Rating yıldız ikonu |
| Görsel üstü ikon zemini | `rgba(0,0,0,.25)` | Kalp (favori) ikonu arkaplanı, image üstü nav okları |

Marka mavisinin dışına çıkılmaz: eski `#1e3a8a`, `#1e3a5f` gibi lacivert tonları artık
kullanılmıyor, her yerde `var(--primary, #2168b8)` kullanılır.

## 2. Tipografi

- **Font ailesi:** `var(--font-family)` → Inter (next/font ile yüklenir), `var(--font-family-title)` aynı yığını kullanır.
- **Bölüm başlıkları (H2):** `font-black` (900), `uppercase`, tek renk `var(--primary)`, ortalanmış (`text-center`).
  - Standart boyut: `text-[26px] sm:text-[30px] md:text-[34px] lg:text-[38px]`
  - Anasayfanın ilk/hero-benzeri bölümü (Popüler Turlar) biraz daha büyük: `text-[30px] sm:text-[36px] md:text-[40px] lg:text-[46px]`
  - Split (yazı+görsel) bölümlerde bile (Hakkımızda, Koylar) başlık + açıklama + CTA satırı ortalanır.
- **Eyebrow/üst etiket:** `text-sm uppercase tracking-[0.1em]`, renk `var(--primary)`.
- **Gövde/açıklama paragrafları (tüm bölümlerde tek tip):** `text-base md:text-lg font-normal leading-relaxed`, renk `var(--text-color)`.
- **Kart başlığı (tur/tekne kartı):** `font-weight: 600` (semibold), **uppercase değil**, `color: var(--secondary)`, `font-size: 1.0625rem` (`sm:` 1.125rem), `line-height: 1.3`.
- **Kart açıklaması:** `text-sm text-zinc-500`, aynı font ailesi.
- **Meta satırları (süre/kalkış/özellik):** `text-sm`, renk `var(--muted)`.
- **Öne Çıkanlar (FeatureBar) başlığı:** `font-black uppercase` — açıklamasından **daha kalın** olmalı; açıklama `font-medium` (net kontrast — kalınlıkları asla eşitlenmez).

## 3. Radius / Gölge / Kenarlık

| Token | Değer |
|---|---|
| Kart radius | `rounded-2xl` (16px) |
| Buton radius | `rounded-lg` (8px), hero butonları `rounded-xl` (12px) |
| Kart kenarlığı | `border border-[#f1f5f9]` |
| Kart gölgesi (varsayılan) | `0 2px 8px rgba(19,23,25,0.06)` |
| Kart gölgesi (hover) | `0 12px 28px -8px rgba(19,23,25,0.12)`, `transition-shadow duration-300` |

## 4. Butonlar

- **Solid/primary CTA** (örn. "TURU GÖRÜNTÜLE", "TEKNEYİ İNCELE"):
  `background: var(--primary)`, `text-white`, `uppercase font-bold`, `rounded-lg`,
  `hover:brightness-110`.
- **Outline/secondary CTA** (örn. "TÜM TEKNELERİ GÖR", "TÜM YAZILARI GÖR", "DAHA FAZLA KOY GÖR", "BİZİ TAKİP ET"):
  beyaz zemin, `border-2` + metin rengi `var(--primary)`, `hover:bg-[var(--primary)]/[0.06]`.
  **Tüm anasayfa bölümlerinde bu buton tek tiptir** — Instagram gibi platforma özgü
  marka renkleri (gradyan vb.) kullanılmaz.
- **Hero birincil buton:** arkaplan gradyanı
  `linear-gradient(to right, var(--primary) 0%, #4f8dc7 51%, var(--primary) 100%)`,
  etrafında ince/sade dönen beyaz parıltı çerçevesi (`.hero-primary-btn-wrap` +
  `.hero-primary-inner` + `.hero-btn-shine`, bkz. `app/globals.css`). **Gökkuşağı /
  çok renkli efekt kullanılmaz** — efekt ince ve tek renkli (beyaz parıltı) kalmalı.
- **Hero ikincil buton:** beyaz zemin, `var(--primary)` metin, aynı boyut (`h-14`,
  mobilde `w-full`, `sm:` sabit genişlik).

## 5. Tur Kartı (`components/tours/TourCard.tsx`)

Yapı (yukarıdan aşağıya):
1. **Görsel** — `aspect-[4/3]`, `overflow-hidden`.
   - Sol üst: "EN POPÜLER" rozeti (sadece `isPopular` true ise) — sarı pill.
   - Sağ üst: kalp/favori ikonu — yarı saydam siyah daire, `backdrop-blur`.
2. **Başlık satırı** — başlık (solda, `line-clamp-2`) + puan rozeti (sağda: yıldız
   ikonu + `rating.toFixed(1)` + `(reviewCount)`, sadece veri varsa).
3. **Açıklama** — 2 satırla sınırlı, gri.
4. **Meta satırları** — süre (saat ikonu) ve kalkış (pin ikonu), ikon+metin `var(--muted)`.
5. **Ayırıcı çizgi** (`border-t border-[#f1f5f9]`).
6. **Alt satır** — fiyat bloğu (solda: büyük kalın fiyat + altında küçük "KİŞİ BAŞI"
   uppercase caption, `var(--muted)`) + CTA butonu (sağda, solid primary).

## 6. Özel Tekne Kartı (`components/home/HomePopularYachtCard.tsx`)

Tur kartıyla **birebir aynı iskelet** kullanılır (aynı `TourCard.module.css`
title/description class'ları paylaşılır), farklar sadece veri alanlarında:

- Başlık satırı: tekne adı + puan rozeti (varsa).
- Konum satırı: `locationTitle` (örn. "Kaş Marina"), tek satır gri metin.
- Meta satırları (ikon: lucide-react `Users`, `Calendar`, `BedDouble`, `Ruler`):
  - Misafir kapasitesi, Yapım yılı, Kabin, Uzunluk — format: `Etiket: **Değer**`.
- Rozet: sadece `isFeatured` true ise sarı "ÖNE ÇIKAN" pill.
- Fiyat bloğu: üstte küçük "ŞU FİYATTAN"/"FROM" caption, altında kalın fiyat,
  altında "GÜNLÜK"/"PER DAY" caption (veya konaklamalı fiyatlandırmada "KONAKLAMALI").
- Carousel (`PopularYachtsSection`): yatay kaydırmalı, altında aktif kartı gösteren
  nokta göstergeleri (dot pagination) — aktif nokta geniş + `var(--primary)`,
  diğerleri küçük gri (`#d4d4d8`).

## 7. Bilet Sınıfları Vitrini (`components/tour/TourClassShowcase.tsx`)

- **Sekmeler (tabs):** pill grubu, aktif sekme `background: var(--primary)`, pasif
  sekme beyaz zemin + gri metin, hover `var(--primary)`.
- **Galeri görseli:** `border-radius: 16px`, `border: 1px solid #f1f5f9`,
  hafif gölge (`0 2px 8px rgba(19,23,25,0.06)`) — ağır/koyu gölge kullanılmaz.
- **Sınıf başlığı** (örn. "Eco"): `font-weight: 600`, **uppercase değil**,
  `color: var(--secondary)` — kart başlığıyla aynı hizada.
- **Rozet** (varsa): sarı pill, tur kartındaki rozetle aynı stil.
- **"SUNULANLAR" alt başlığı:** küçük uppercase, `color: var(--primary)`.
- **Madde işaretleri:** nokta işaretleyici `background: var(--primary)`.

## 8. Öne Çıkanlar Şeridi (`components/home/FeatureBar.tsx`)

- Arkaplan gradyanı: `linear-gradient(to right, var(--primary), #a17fe0, #59c173)`
  (mavi → mor → yeşil).
- Her madde: ikon (beyaz stroke) + başlık (`font-black uppercase`) + açıklama
  (`font-medium`, başlıktan **daha ince**).
- Aynı `var(--font-family)` font yığını, başlık/açıklama arasında kalınlık
  kontrastı korunur.

## 9. Hero (`components/home/HeroBanner.tsx`)

- Üstte küçük pill rozet (örn. "Hantal Turizm - Belge No: 18888"):
  `rgba(33,104,184,0.55)` yarı saydam zemin, `rounded-full`, beyaz metin.
- Başlık: `font-black uppercase`, beyaz, `text-shadow` ile fotoğraf üzerinde okunur.
- CTA butonları: mobilde `flex-col` (tam genişlik, `h-14`), `sm:` üzeri yan yana
  sabit genişlik (`sm:w-[240px]`). Birincil buton gradyanlı + ince parıltı
  çerçeveli (bkz. §4), ikincil buton düz beyaz.

## 10. Genel Kurallar

- Renk paleti tek kaynaklıdır: `var(--primary)` / `var(--secondary)` / `var(--muted)` /
  `var(--text-color)`. Hardcoded lacivert (`#1e3a8a`, `#1e3a5f`) veya platforma özgü
  marka renkleri (Instagram gradyanı vb.) kullanılmaz.
- Tüm bölüm başlıkları ortalanır ve tek renklidir (split/yazı+görsel bölümler dahil).
- Kart bileşenleri (tur, tekne, bilet sınıfı) aynı radius/gölge/kenarlık/tipografi
  token'larını paylaşır — yeni bir kart tipi eklenirken bu döküman referans alınır.
