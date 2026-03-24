import { defineField, defineType } from 'sanity'
import { TourIdField } from './components/TourIdField'

export default defineType({
  name: 'tour',
  title: 'Tur',
  type: 'document',
  fields: [
    // 1) Temel Bilgiler
    defineField({
      name: 'title',
      title: 'Tur Başlığı',
      type: 'string',
      description: 'Turun ana başlığı',
      validation: (Rule) => Rule.required().error('Tur başlığı zorunludur'),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'URL için kullanılacak benzersiz tanımlayıcı',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required().error('Slug zorunludur'),
    }),
    defineField({
      name: 'tourIdDisplay',
      title: 'Tur ID (Rezervasyon / API)',
      type: 'string',
      readOnly: true,
      description: 'Firestore ve availability API\'de bu tur için kullanılan ID. Değiştirilemez.',
      components: { input: TourIdField },
    }),
    defineField({
      name: 'shortDescription',
      title: 'Kısa Açıklama',
      type: 'text',
      description: 'Tur hakkında kısa özet (liste görünümünde gösterilir)',
      rows: 3,
    }),
    defineField({
      name: 'description',
      title: 'Detaylı Açıklama',
      type: 'array',
      description: 'Tur hakkında detaylı açıklama (zengin metin formatında)',
      of: [{ type: 'block' }],
    }),

    // 2) Medya
    defineField({
      name: 'mainImage',
      title: 'Ana Görsel',
      type: 'image',
      description: 'Turun ana görseli (liste ve detay sayfasında kullanılır)',
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alternatif Metin',
        },
      ],
    }),
    defineField({
      name: 'gallery',
      title: 'Galeri',
      type: 'array',
      description: 'Tur galeri görselleri',
      of: [
        {
          type: 'image',
          options: {
            hotspot: true,
          },
          fields: [
            {
              name: 'alt',
              type: 'string',
              title: 'Alternatif Metin',
            },
          ],
        },
      ],
    }),

    // Mobile Hero Section
    defineField({
      name: 'mobileHero',
      title: 'Mobil Hero Bölümü',
      type: 'object',
      description: 'Mobil cihazlarda gösterilecek hero görselleri ve galeri',
      fields: [
        defineField({
          name: 'enabled',
          title: 'Aktif',
          type: 'boolean',
          description: 'Mobil hero bölümünü aktif et',
          initialValue: true,
        }),
        defineField({
          name: 'topImage',
          title: 'Üst Görsel',
          type: 'image',
          description: 'Mobil hero\'da üstte gösterilecek görsel',
          options: {
            hotspot: true,
          },
          fields: [
            {
              name: 'alt',
              type: 'string',
              title: 'Alternatif Metin',
            },
          ],
        }),
        defineField({
          name: 'bottomImage',
          title: 'Alt Görsel',
          type: 'image',
          description: 'Mobil hero\'da altta gösterilecek görsel (CTA butonu bu görselin üzerinde)',
          options: {
            hotspot: true,
          },
          fields: [
            {
              name: 'alt',
              type: 'string',
              title: 'Alternatif Metin',
            },
          ],
        }),
        defineField({
          name: 'galleryImages',
          title: 'Galeri Görselleri',
          type: 'array',
          description: 'Galeri modal\'ında gösterilecek tüm görseller (boş bırakılırsa tur galerisi kullanılır)',
          of: [
            {
              type: 'image',
              options: {
                hotspot: true,
              },
              fields: [
                {
                  name: 'alt',
                  type: 'string',
                  title: 'Alternatif Metin',
                },
              ],
            },
          ],
        }),
        defineField({
          name: 'ctaText',
          title: 'CTA Buton Metni',
          type: 'string',
          description: 'Alt görsel üzerindeki buton metni',
          initialValue: 'VIEW ALL PHOTOS',
        }),
      ],
    }),
    defineField({
      name: 'tourVideo',
      title: 'Tur Videosu',
      type: 'object',
      description: 'Tur tanıtım videosu ayarları',
      fields: [
        defineField({
          name: 'enabled',
          title: 'Video Aktif mi?',
          type: 'boolean',
          initialValue: true,
        }),
        defineField({
          name: 'type',
          title: 'Video Türü',
          type: 'string',
          options: {
            list: [
              { title: 'YouTube', value: 'youtube' },
              { title: 'Vimeo', value: 'vimeo' },
              { title: 'Yükle', value: 'upload' },
            ],
          },
          initialValue: 'youtube',
          hidden: ({ parent }) => !parent?.enabled,
        }),
        defineField({
          name: 'youtubeUrl',
          title: 'YouTube Linki',
          type: 'url',
          description: 'YouTube video URL\'si (örn: https://www.youtube.com/watch?v=...)',
          hidden: ({ parent }) => !parent?.enabled || parent?.type !== 'youtube',
        }),
        defineField({
          name: 'vimeoUrl',
          title: 'Vimeo Linki',
          type: 'url',
          description: 'Vimeo video URL\'si',
          hidden: ({ parent }) => !parent?.enabled || parent?.type !== 'vimeo',
        }),
        defineField({
          name: 'file',
          title: 'Video Dosyası',
          type: 'file',
          description: 'Yüklenecek video dosyası',
          options: {
            accept: 'video/*',
          },
          hidden: ({ parent }) => !parent?.enabled || parent?.type !== 'upload',
        }),
        defineField({
          name: 'poster',
          title: 'Poster Görseli',
          type: 'image',
          description: 'Video için poster görseli (upload için)',
          options: {
            hotspot: true,
          },
          hidden: ({ parent }) => !parent?.enabled || parent?.type !== 'upload',
        }),
        defineField({
          name: 'caption',
          title: 'Video Açıklaması',
          type: 'string',
          description: 'Video altında gösterilecek açıklama metni',
          hidden: ({ parent }) => !parent?.enabled,
        }),
      ],
    }),

    // 3) Puan & Sosyal Kanıt
    defineField({
      name: 'rating',
      title: 'Puan',
      type: 'number',
      description: 'Tur puanı (örn: 4.9)',
      validation: (Rule) => Rule.min(0).max(5).error('Puan 0-5 arasında olmalıdır'),
    }),
    defineField({
      name: 'reviewCount',
      title: 'Yorum Sayısı',
      type: 'number',
      description: 'Toplam yorum sayısı',
      validation: (Rule) => Rule.min(0).integer().error('Yorum sayısı pozitif bir tam sayı olmalıdır'),
    }),
    defineField({
      name: 'isPopular',
      title: 'En Çok Tercih Edilen',
      type: 'boolean',
      description: 'Bu tur "En Çok Tercih Edilen" ribbon\'ı ile gösterilsin mi?',
      initialValue: false,
    }),
    defineField({
      name: 'ratingLabel',
      title: 'Puan Etiketi',
      type: 'string',
      description: 'Puan etiketi (örn: Mükemmel, Çok İyi)',
    }),
    defineField({
      name: 'reviewsUrl',
      title: 'Yorum Linki',
      type: 'url',
      description: 'Google, TripAdvisor veya diğer platformlardaki yorum sayfası linki',
    }),

    // 3B) Reviews Section (CMS-driven)
    defineField({
      name: 'reviewsSection',
      title: 'Yorumlar Bölümü',
      type: 'object',
      description: 'Tur detay sayfasındaki müşteri yorumları bölümü',
      fields: [
        defineField({
          name: 'enabled',
          title: 'Aktif mi?',
          type: 'boolean',
          initialValue: true,
        }),
        defineField({
          name: 'reviewCount',
          title: 'Toplam Yorum Sayısı (Başlık)',
          type: 'number',
          description: 'Örn: 351',
          validation: (Rule) => Rule.min(0).integer(),
        }),
        defineField({
          name: 'ratingValue',
          title: 'Puan (Sağ Blok)',
          type: 'number',
          description: 'Örn: 4.7',
          validation: (Rule) => Rule.min(0).max(5),
        }),
        defineField({
          name: 'ratingDots',
          title: 'Puan Nokta Sayısı',
          type: 'number',
          description: 'Örn: 5',
          initialValue: 5,
          validation: (Rule) => Rule.min(1).max(10).integer(),
        }),
        defineField({
          name: 'sourceLabel',
          title: 'Kaynak Etiketi',
          type: 'string',
          description: 'Örn: Google',
          initialValue: 'Google',
        }),
        defineField({
          name: 'moreLinkText',
          title: 'Daha Fazla Link Metni',
          type: 'string',
          initialValue: 'Daha fazla yorumu okuyun',
        }),
        defineField({
          name: 'moreLinkUrl',
          title: 'Daha Fazla Link URL',
          type: 'url',
          description: 'Opsiyonel: varsa link butonu gösterilir',
        }),
        defineField({
          name: 'items',
          title: 'Yorumlar',
          type: 'array',
          description: 'En az 4 yorum ekleyin (UI ilk 4 tanesini gösterir)',
          validation: (Rule) => Rule.min(4),
          of: [
            {
              type: 'object',
              name: 'reviewItem',
              title: 'Yorum',
              fields: [
                defineField({
                  name: 'name',
                  title: 'İsim',
                  type: 'string',
                  validation: (Rule) => Rule.required(),
                }),
                defineField({
                  name: 'title',
                  title: 'Başlık',
                  type: 'string',
                  validation: (Rule) => Rule.required(),
                }),
                defineField({
                  name: 'description',
                  title: 'Açıklama',
                  type: 'text',
                  rows: 3,
                  validation: (Rule) => Rule.required(),
                }),
                defineField({
                  name: 'rating',
                  title: 'Puan (1-5)',
                  type: 'number',
                  initialValue: 5,
                  validation: (Rule) => Rule.min(1).max(5).integer(),
                }),
                defineField({
                  name: 'avatar',
                  title: 'Avatar',
                  type: 'image',
                  options: { hotspot: true },
                }),
              ],
            },
          ],
        }),
      ],
    }),

    // 4) Hızlı Bilgiler
    defineField({
      name: 'quickFacts',
      title: 'Hızlı Bilgiler',
      type: 'object',
      description: 'Tur sayfasının üst kısmında gösterilecek hızlı bilgiler',
      fields: [
        defineField({
          name: 'durationText',
          title: 'Süre Metni',
          type: 'string',
          description: 'Tur süresi (örn: 3 saat, Yarım gün)',
        }),
        defineField({
          name: 'availabilityText',
          title: 'Uygunluk Metni',
          type: 'string',
          description: 'Uygunluk bilgisi (örn: Her gün, Hafta içi)',
        }),
        defineField({
          name: 'meetingLocation',
          title: 'Buluşma Noktası',
          type: 'string',
          description: 'Tur başlangıç noktası',
        }),
        defineField({
          name: 'startTime',
          title: 'Başlangıç saati',
          type: 'string',
          description: 'Tur kalkış saati (örn: 10:00) – e-posta ve detayda gösterilir',
        }),
        defineField({
          name: 'returnTime',
          title: 'Dönüş / varış saati',
          type: 'string',
          description: 'Teknenin limana dönüş saati (örn: 13:00) – bilet sayfasında gösterilir',
        }),
        defineField({
          name: 'language',
          title: 'Dil',
          type: 'string',
          description: 'Tur dil bilgisi (örn: Türkçe, İngilizce)',
        }),
        defineField({
          name: 'groupType',
          title: 'Tur Tipi',
          type: 'string',
          description: 'Grup tipi (örn: Küçük Grup, Özel Tur)',
        }),
        defineField({
          name: 'maxCapacity',
          title: 'Maksimum Kapasite',
          type: 'number',
          description: 'Maksimum katılımcı sayısı',
          validation: (Rule) => Rule.min(1).integer().error('Kapasite en az 1 olmalıdır'),
        }),
      ],
    }),

    // 4.5) Alım Noktaları
    defineField({
      name: 'pickupPoints',
      title: 'Alım Noktaları',
      type: 'array',
      description: 'Tur için alım noktaları (boş bırakılırsa varsayılan buluşma noktası kullanılır)',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'name',
              title: 'Nokta Adı',
              type: 'string',
              description: 'Alım noktası adı (örn: Çeşme Marina, Alaçatı Merkez)',
              validation: (Rule) => Rule.required().error('Nokta adı zorunludur'),
            }),
            defineField({
              name: 'address',
              title: 'Adres',
              type: 'text',
              description: 'Alım noktası adresi',
              rows: 2,
              validation: (Rule) => Rule.required().error('Adres zorunludur'),
            }),
            defineField({
              name: 'description',
              title: 'Açıklama',
              type: 'text',
              description: 'Ek açıklama (opsiyonel)',
              rows: 2,
            }),
            defineField({
              name: 'isDefault',
              title: 'Varsayılan',
              type: 'boolean',
              description: 'Varsayılan alım noktası mı? (Sadece bir tane varsayılan olabilir)',
              initialValue: false,
            }),
          ],
          preview: {
            select: {
              title: 'name',
              subtitle: 'address',
              isDefault: 'isDefault',
            },
            prepare({ title, subtitle, isDefault }) {
              return {
                title: isDefault ? `${title} (Varsayılan)` : title,
                subtitle: subtitle,
              }
            },
          },
        },
      ],
    }),

    // 4.55) Rezervasyon — yemek menüsü (Bilgileriniz adımında seçilir)
    defineField({
      name: 'mealMenu',
      title: 'Yemek menüsü (rezervasyon)',
      type: 'object',
      description:
        'Açıkken rezervasyon sihirbazında “Bilgileriniz” adımında zorunlu seçim gösterilir; Firestore ve e-postalara yazılır.',
      fields: [
        defineField({
          name: 'enabled',
          title: 'Aktif',
          type: 'boolean',
          initialValue: false,
        }),
        defineField({
          name: 'sectionTitle',
          title: 'Bölüm başlığı',
          type: 'string',
          initialValue: 'Yemek tercihi',
          description: 'Formda görünen başlık (örn. Yemek menüsü)',
        }),
        defineField({
          name: 'description',
          title: 'Açıklama',
          type: 'text',
          rows: 2,
          description: 'İsteğe bağlı kısa açıklama (formun altında gösterilir)',
        }),
        defineField({
          name: 'options',
          title: 'Menü seçenekleri',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                defineField({
                  name: 'key',
                  title: 'Anahtar (tekil)',
                  type: 'string',
                  description: 'Küçük harf, tire; örn. et-menu, vejetaryen (sistemde saklanır)',
                  validation: (Rule) => Rule.required().error('Anahtar zorunludur'),
                }),
                defineField({
                  name: 'label',
                  title: 'Görünen ad',
                  type: 'string',
                  description: 'Müşterinin gördüğü seçenek metni',
                  validation: (Rule) => Rule.required().error('Etiket zorunludur'),
                }),
                defineField({
                  name: 'description',
                  title: 'Alt açıklama',
                  type: 'text',
                  rows: 2,
                  description: 'İsteğe bağlı (sadece CMS / iç not)',
                }),
              ],
              preview: {
                select: { title: 'label', subtitle: 'key' },
              },
            },
          ],
        }),
      ],
    }),

    // 4.6) Nerede / Toplanma noktası ve harita
    defineField({
      name: 'whereSection',
      title: 'Nerede Bölümü',
      type: 'object',
      description: 'Toplanma noktası adresi ve Google Harita',
      fields: [
        defineField({
          name: 'enabled',
          title: 'Aktif',
          type: 'boolean',
          initialValue: false,
        }),
        defineField({
          name: 'heading',
          title: 'Bölüm Başlığı',
          type: 'string',
          initialValue: 'Nerede',
          description: 'Örn: Nerede',
        }),
        defineField({
          name: 'meetingPointLabel',
          title: 'Toplanma Noktası Etiketi',
          type: 'string',
          initialValue: 'Toplanma noktası:',
          description: 'Adresin yanında görünecek etiket',
        }),
        defineField({
          name: 'meetingPointAddress',
          title: 'Adres / Toplanma noktası açıklaması',
          type: 'text',
          rows: 3,
          description: 'Tam adres veya toplanma noktası tarifi (haritanın üstünde, ikonun yanında)',
        }),
        defineField({
          name: 'mapEmbedUrl',
          title: 'Harita gömme URL',
          type: 'url',
          description: 'Google Haritalar → Paylaş → Haritayı yerleştir → iframe src kopyalayın (https://www.google.com/maps/embed?pb=...)',
        }),
        defineField({
          name: 'openInMapsLabel',
          title: 'Harita butonu metni',
          type: 'string',
          initialValue: "Google Haritalar'da Aç",
        }),
      ],
    }),

    // 5) Öne Çıkanlar
    defineField({
      name: 'highlights',
      title: 'Öne Çıkanlar',
      type: 'array',
      description: 'Turun öne çıkan özellikleri',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'icon',
              title: 'İkon',
              type: 'string',
              description: 'Seçilmezse varsayılan tik (✓) gösterilir',
              options: {
                list: [
                  { value: '', title: 'Tik (varsayılan)' },
                  { value: 'food', title: 'Yemek' },
                  { value: 'new', title: 'Yeni' },
                  { value: 'captain', title: 'Kaptan' },
                  { value: 'comfort', title: 'Konfor' },
                  { value: 'luxury-bus', title: 'Lüks otobüs' },
                ],
                layout: 'dropdown',
              },
            }),
            defineField({
              name: 'title',
              title: 'Başlık',
              type: 'string',
              validation: (Rule) => Rule.required().error('Başlık zorunludur'),
            }),
            defineField({
              name: 'description',
              title: 'Açıklama',
              type: 'text',
              rows: 2,
            }),
          ],
          preview: {
            select: {
              title: 'title',
              subtitle: 'description',
              icon: 'icon',
            },
            prepare({ title, subtitle, icon }) {
              return {
                title: icon ? `${icon} ${title}` : title,
                subtitle: subtitle,
              }
            },
          },
        },
      ],
    }),

    // 6) Tur Detayları
    defineField({
      name: 'tourDetails',
      title: 'Tur Detayları',
      type: 'array',
      description: 'Tur detay bilgileri (kart formatında)',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'label',
              title: 'Etiket',
              type: 'string',
              description: 'Etiket metni (örn: Süre, Başlangıç Saati)',
              validation: (Rule) => Rule.required().error('Etiket zorunludur'),
            }),
            defineField({
              name: 'value',
              title: 'Değer',
              type: 'string',
              description: 'Değer metni (örn: 3 saat, 09:00)',
              validation: (Rule) => Rule.required().error('Değer zorunludur'),
            }),
            defineField({
              name: 'icon',
              title: 'İkon',
              type: 'string',
              description: 'İkon anahtarı (opsiyonel)',
            }),
          ],
          preview: {
            select: {
              label: 'label',
              value: 'value',
            },
            prepare({ label, value }) {
              return {
                title: label,
                subtitle: value,
              }
            },
          },
        },
      ],
    }),

    // 7) Program (Itinerary)
    defineField({
      name: 'itinerary',
      title: 'Tur Programı',
      type: 'array',
      description: 'Tur programı adımları',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'time',
              title: 'Saat / Adım',
              type: 'string',
              description: 'Saat veya adım bilgisi (örn: 10:00 veya 1. Durak)',
            }),
            defineField({
              name: 'title',
              title: 'Başlık',
              type: 'string',
              validation: (Rule) => Rule.required().error('Başlık zorunludur'),
            }),
            defineField({
              name: 'description',
              title: 'Açıklama',
              type: 'text',
              rows: 3,
            }),
            defineField({
              name: 'tag',
              title: 'Etiket',
              type: 'string',
              description: 'Kategori etiketi (örn: Yüzme, Doğa, Öğle Yemeği, Fotoğraf, Keşif)',
            }),
            defineField({
              name: 'iconType',
              title: 'İkon Tipi',
              type: 'string',
              description: 'İkon tipi (opsiyonel)',
            }),
            defineField({
              name: 'image',
              title: 'Görsel',
              type: 'image',
              description: 'Program adımı için görsel (opsiyonel)',
              options: {
                hotspot: true,
              },
            }),
          ],
          preview: {
            select: {
              time: 'time',
              title: 'title',
              media: 'image',
            },
            prepare({ time, title, media }) {
              return {
                title: time ? `${time} - ${title}` : title,
                media: media,
              }
            },
          },
        },
      ],
    }),

    // 8) Dahil Olanlar / Olmayanlar
    defineField({
      name: 'included',
      title: 'Dahil Olanlar',
      type: 'array',
      description: 'Tur fiyatına dahil olanlar listesi',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'notIncluded',
      title: 'Dahil Olmayanlar',
      type: 'array',
      description: 'Tur fiyatına dahil olmayanlar listesi',
      of: [{ type: 'string' }],
    }),

    // 9) SSS (FAQ)
    defineField({
      name: 'faqs',
      title: 'Sık Sorulan Sorular',
      type: 'array',
      description: 'Sık sorulan sorular ve cevapları',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'question',
              title: 'Soru',
              type: 'string',
              validation: (Rule) => Rule.required().error('Soru zorunludur'),
            }),
            defineField({
              name: 'answer',
              title: 'Cevap',
              type: 'text',
              rows: 3,
              validation: (Rule) => Rule.required().error('Cevap zorunludur'),
            }),
          ],
          preview: {
            select: {
              question: 'question',
            },
            prepare({ question }) {
              return {
                title: question,
              }
            },
          },
        },
      ],
    }),

    // 10) Kaptan/Host Bölümü
    defineField({
      name: 'host',
      title: 'Kaptan / Host',
      type: 'object',
      description: 'Tur kaptanı veya host bilgileri',
      fields: [
        defineField({
          name: 'name',
          title: 'İsim',
          type: 'string',
          validation: (Rule) => Rule.required().error('İsim zorunludur'),
        }),
        defineField({
          name: 'title',
          title: 'Ünvan',
          type: 'string',
          description: 'Ünvan (örn: Kaptan, Rehber)',
        }),
        defineField({
          name: 'photo',
          title: 'Fotoğraf',
          type: 'image',
          options: {
            hotspot: true,
          },
        }),
        defineField({
          name: 'note',
          title: 'Not',
          type: 'text',
          description: 'Ek notlar (opsiyonel)',
          rows: 2,
        }),
      ],
    }),

    // 11) Satış Bloğu
    defineField({
      name: 'whyYouWillLove',
      title: 'Neden Seveceksiniz?',
      type: 'object',
      description: 'Satış bloğu içeriği',
      fields: [
        defineField({
          name: 'title',
          title: 'Başlık',
          type: 'string',
          description: 'Bloğun başlığı',
        }),
        defineField({
          name: 'text',
          title: 'Metin',
          type: 'text',
          description: 'Açıklama metni',
          rows: 4,
        }),
      ],
    }),

    // 12) Bilet Sınıfları ve Yaşa Göre Fiyat
    defineField({
      name: 'ticketClasses',
      title: 'Bilet Sınıfları',
      type: 'array',
      description: 'Bilet sınıfları ve yaş gruplarına göre fiyatlar',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'key',
              title: 'Sınıf Anahtarı',
              type: 'string',
              options: {
                list: [
                  { title: 'Eco', value: 'eco' },
                  { title: 'Premium', value: 'premium' },
                  { title: 'First', value: 'first' },
                ],
              },
              validation: (Rule) => Rule.required().error('Sınıf anahtarı zorunludur'),
            }),
            defineField({
              name: 'label',
              title: 'Sınıf Adı',
              type: 'string',
              description: 'Sınıf adı (Eco/Premium/First)',
              validation: (Rule) => Rule.required().error('Sınıf adı zorunludur'),
            }),
            defineField({
              name: 'description',
              title: 'Açıklama',
              type: 'text',
              description: 'Sınıf açıklaması',
              rows: 2,
            }),
            defineField({
              name: 'badge',
              title: 'Rozet',
              type: 'string',
              description: 'Rozet metni (örn: En Popüler, Önerilen)',
            }),
            defineField({
              name: 'classImage',
              title: 'Sınıf Görseli',
              type: 'image',
              description: 'Sınıf için görsel (rezervasyon ekranında gösterilir)',
              options: {
                hotspot: true,
              },
              fields: [
                {
                  name: 'alt',
                  type: 'string',
                  title: 'Alternatif Metin',
                  description: 'Görsel için alternatif metin (erişilebilirlik)',
                },
              ],
            }),
            defineField({
              name: 'bullets',
              title: 'Özellik Listesi',
              type: 'array',
              description: 'Sınıf özellikleri (bullet list olarak gösterilir)',
              of: [
                {
                  type: 'string',
                },
              ],
            }),
            defineField({
              name: 'pricesByAge',
              title: 'Yaş Gruplarına Göre Fiyatlar',
              type: 'array',
              description: 'Bu sınıf için yaş gruplarına göre fiyatlar',
              of: [
                {
                  type: 'object',
                  fields: [
                    defineField({
                      name: 'ageKey',
                      title: 'Yaş Anahtarı',
                      type: 'string',
                      options: {
                        list: [
                          { title: 'Yetişkin', value: 'adult' },
                          { title: 'Çocuk', value: 'child' },
                          { title: 'Bebek', value: 'infant' },
                          { title: 'Yaşlı', value: 'senior' },
                        ],
                      },
                      validation: (Rule) => Rule.required().error('Yaş anahtarı zorunludur'),
                    }),
                    defineField({
                      name: 'ageLabel',
                      title: 'Yaş Etiketi',
                      type: 'string',
                      description: 'Yaş grubu etiketi (Yetişkin/Çocuk/Bebek/Yaşlı)',
                      validation: (Rule) => Rule.required().error('Yaş etiketi zorunludur'),
                    }),
                    defineField({
                      name: 'minAge',
                      title: 'Minimum Yaş',
                      type: 'number',
                      description: 'Minimum yaş (opsiyonel)',
                    }),
                    defineField({
                      name: 'maxAge',
                      title: 'Maksimum Yaş',
                      type: 'number',
                      description: 'Maksimum yaş (opsiyonel)',
                    }),
                    defineField({
                      name: 'price',
                      title: 'Fiyat (₺)',
                      type: 'number',
                      description: 'Fiyat Türk Lirası cinsinden',
                      validation: (Rule) =>
                        Rule.required()
                          .min(0)
                          .error('Fiyat zorunludur ve 0 veya daha büyük olmalıdır'),
                    }),
                  ],
                  preview: {
                    select: {
                      ageLabel: 'ageLabel',
                      price: 'price',
                      minAge: 'minAge',
                      maxAge: 'maxAge',
                    },
                    prepare({ ageLabel, price, minAge, maxAge }) {
                      const ageRange =
                        minAge !== undefined && maxAge !== undefined
                          ? ` (${minAge}-${maxAge} yaş)`
                          : minAge !== undefined
                            ? ` (${minAge}+ yaş)`
                            : maxAge !== undefined
                              ? ` (${maxAge} yaş altı)`
                              : ''
                      return {
                        title: `${ageLabel}${ageRange}`,
                        subtitle: `${price} ₺`,
                      }
                    },
                  },
                },
              ],
            }),
          ],
          preview: {
            select: {
              label: 'label',
              badge: 'badge',
            },
            prepare({ label, badge }) {
              return {
                title: label,
                subtitle: badge || '',
              }
            },
          },
        },
      ],
    }),

    // 13) Sezon Kuralları
    defineField({
      name: 'seasonRules',
      title: 'Sezon Kuralları',
      type: 'array',
      description: 'Sezon bazlı fiyat çarpanları',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'name',
              title: 'Sezon Adı',
              type: 'string',
              description: 'Sezon adı (örn: Nisan-Mayıs, Yaz Sezonu)',
              validation: (Rule) => Rule.required().error('Sezon adı zorunludur'),
            }),
            defineField({
              name: 'start',
              title: 'Başlangıç Tarihi',
              type: 'date',
              validation: (Rule) => Rule.required().error('Başlangıç tarihi zorunludur'),
            }),
            defineField({
              name: 'end',
              title: 'Bitiş Tarihi',
              type: 'date',
              validation: (Rule) => Rule.required().error('Bitiş tarihi zorunludur'),
            }),
            defineField({
              name: 'multiplier',
              title: 'Çarpan',
              type: 'number',
              description: 'Fiyat çarpanı (örn: 1.2 = %20 artış)',
              validation: (Rule) =>
                Rule.required()
                  .min(0.1)
                  .error('Çarpan zorunludur ve 0.1 veya daha büyük olmalıdır'),
            }),
          ],
          preview: {
            select: {
              name: 'name',
              start: 'start',
              end: 'end',
              multiplier: 'multiplier',
            },
            prepare({ name, start, end, multiplier }) {
              return {
                title: name,
                subtitle: `${start} - ${end} (x${multiplier})`,
              }
            },
          },
        },
      ],
    }),

    // 14) Kapora
    defineField({
      name: 'deposit',
      title: 'Kapora',
      type: 'object',
      description: 'Kapora ayarları',
      fields: [
        defineField({
          name: 'enabled',
          title: 'Kapora Aktif mi?',
          type: 'boolean',
          initialValue: false,
        }),
        defineField({
          name: 'type',
          title: 'Tür',
          type: 'string',
          options: {
            list: [
              { title: 'Yüzde', value: 'percentage' },
              { title: 'Sabit Tutar', value: 'fixed' },
            ],
          },
          initialValue: 'percentage',
          hidden: ({ parent }) => !parent?.enabled,
        }),
        defineField({
          name: 'value',
          title: 'Değer',
          type: 'number',
          description: 'Kapora değeri (% veya ₺)',
          validation: (Rule) =>
            Rule.min(0).error('Değer 0 veya daha büyük olmalıdır'),
          hidden: ({ parent }) => !parent?.enabled,
        }),
      ],
    }),

    // 15) Ekstra Hizmetler
    defineField({
      name: 'extras',
      title: 'Ekstra Hizmetler',
      type: 'array',
      description: 'Ekstra hizmetler ve fiyatları',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'title',
              title: 'Başlık',
              type: 'string',
              validation: (Rule) => Rule.required().error('Başlık zorunludur'),
            }),
            defineField({
              name: 'description',
              title: 'Açıklama',
              type: 'text',
              description: 'Hizmet açıklaması (opsiyonel)',
              rows: 2,
            }),
            defineField({
              name: 'price',
              title: 'Fiyat',
              type: 'number',
              validation: (Rule) =>
                Rule.required()
                  .min(0)
                  .error('Fiyat zorunludur ve 0 veya daha büyük olmalıdır'),
            }),
            defineField({
              name: 'priceType',
              title: 'Fiyat Tipi',
              type: 'string',
              options: {
                list: [
                  { title: 'Kişi Başı', value: 'perPerson' },
                  { title: 'Toplam', value: 'total' },
                ],
              },
              initialValue: 'perPerson',
            }),
            defineField({
              name: 'icon',
              title: 'İkon',
              type: 'string',
              description: 'İkon anahtarı (opsiyonel)',
            }),
          ],
          preview: {
            select: {
              title: 'title',
              price: 'price',
              priceType: 'priceType',
            },
            prepare({ title, price, priceType }) {
              return {
                title: title,
                subtitle: `${price} ₺ (${priceType === 'perPerson' ? 'Kişi Başı' : 'Toplam'})`,
              }
            },
          },
        },
      ],
    }),

    // 16) Booking Kart Metinleri
    defineField({
      name: 'bookingCard',
      title: 'Rezervasyon Kartı Metinleri',
      type: 'object',
      description: 'Rezervasyon kartında gösterilecek metinler',
      fields: [
        defineField({
          name: 'fromText',
          title: 'Fiyat Başlangıç Metni',
          type: 'string',
          description: 'Fiyat başlangıç metni (örn: Başlangıç, Fiyat)',
        }),
        defineField({
          name: 'ctaText',
          title: 'Buton Metni',
          type: 'string',
          description: 'Rezervasyon butonu metni (örn: Müsaitliği Kontrol Et)',
        }),
        defineField({
          name: 'urgencyText',
          title: 'Uyarı Metni',
          type: 'string',
          description: 'Acil durum uyarı metni (örn: Sık tükeniyor!)',
        }),
        defineField({
          name: 'trustBadges',
          title: 'Güven Rozetleri',
          type: 'array',
          description: 'Güven rozetleri (Ücretsiz iptal, Güvenli ödeme, vb.)',
          of: [{ type: 'string' }],
        }),
      ],
    }),

    // 17) Rezervasyon Kuralları
    defineField({
      name: 'bookingRules',
      title: 'Rezervasyon Kuralları',
      type: 'object',
      description: 'Rezervasyon adım 1\'de gösterilecek bilgi kutusu',
      fields: [
        defineField({
          name: 'show',
          title: 'Göster',
          type: 'boolean',
          description: 'Rezervasyon kuralları kutusunu göster',
          initialValue: true,
        }),
        defineField({
          name: 'title',
          title: 'Başlık',
          type: 'string',
          description: 'Bilgi kutusu başlığı',
          initialValue: 'Rezervasyon Bilgileri',
        }),
        defineField({
          name: 'bullets',
          title: 'Kurallar Listesi',
          type: 'array',
          description: 'Rezervasyon kuralları (madde madde)',
          of: [
            {
              type: 'string',
            },
          ],
        }),
      ],
    }),

    // 17) Sınıf Bazlı Kapasite Yönetimi
    defineField({
      name: 'baseCapacity',
      title: 'Varsayılan Kapasiteler',
      type: 'object',
      description: 'Her sınıf için varsayılan kapasite (tarih bazlı override yoksa kullanılır)',
      fields: [
        defineField({
          name: 'ecoCapacity',
          title: 'Eco Kapasitesi',
          type: 'number',
          description: 'Eco sınıfı için varsayılan kapasite',
          validation: (Rule) => Rule.min(0).error('Kapasite 0 veya daha büyük olmalıdır'),
        }),
        defineField({
          name: 'premiumCapacity',
          title: 'Premium Kapasitesi',
          type: 'number',
          description: 'Premium sınıfı için varsayılan kapasite',
          validation: (Rule) => Rule.min(0).error('Kapasite 0 veya daha büyük olmalıdır'),
        }),
        defineField({
          name: 'firstCapacity',
          title: 'First Kapasitesi',
          type: 'number',
          description: 'First sınıfı için varsayılan kapasite',
          validation: (Rule) => Rule.min(0).error('Kapasite 0 veya daha büyük olmalıdır'),
        }),
      ],
    }),
    defineField({
      name: 'availabilityOverrides',
      title: 'Tarih Bazlı Kapasite Değişiklikleri',
      type: 'array',
      description: 'Belirli tarihler için sınıf bazlı kapasite ayarları',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'date',
              title: 'Tarih',
              type: 'date',
              validation: (Rule) => Rule.required().error('Tarih zorunludur'),
            }),
            defineField({
              name: 'eco',
              title: 'Eco Kapasitesi',
              type: 'number',
              description: 'Bu tarih için Eco sınıfı kapasitesi',
              validation: (Rule) => Rule.required().error('Eco kapasitesi zorunludur').min(0).error('Kapasite 0 veya daha büyük olmalıdır'),
            }),
            defineField({
              name: 'premium',
              title: 'Premium Kapasitesi',
              type: 'number',
              description: 'Bu tarih için Premium sınıfı kapasitesi',
              validation: (Rule) => Rule.required().error('Premium kapasitesi zorunludur').min(0).error('Kapasite 0 veya daha büyük olmalıdır'),
            }),
            defineField({
              name: 'first',
              title: 'First Kapasitesi',
              type: 'number',
              description: 'Bu tarih için First sınıfı kapasitesi',
              validation: (Rule) => Rule.required().error('First kapasitesi zorunludur').min(0).error('Kapasite 0 veya daha büyük olmalıdır'),
            }),
            defineField({
              name: 'note',
              title: 'Not',
              type: 'string',
              description: 'Bu tarih için özel not (opsiyonel)',
            }),
          ],
          preview: {
            select: {
              date: 'date',
              eco: 'eco',
              premium: 'premium',
              first: 'first',
            },
            prepare({ date, eco, premium, first }) {
              return {
                title: date || 'Tarih belirtilmemiş',
                subtitle: `Eco: ${eco || 0} | Premium: ${premium || 0} | First: ${first || 0}`,
              }
            },
          },
        },
      ],
      options: {
        sortable: true,
      },
    }),

    // 18) Takvim ve Müsaitlik Yönetimi
    defineField({
      name: 'availability',
      title: 'Takvim ve Müsaitlik',
      type: 'object',
      description: 'Gün bazlı müsaitlik, fiyat ve sınıf durumu yönetimi',
      fields: [
        defineField({
          name: 'enabled',
          title: 'Aktif mi?',
          type: 'boolean',
          description: 'Takvim müsaitlik yönetimini aktif et',
          initialValue: false,
        }),
        defineField({
          name: 'defaultAvailable',
          title: 'Varsayılan Durum',
          type: 'boolean',
          description: 'Belirtilmeyen günler için varsayılan müsaitlik durumu',
          initialValue: true,
        }),
        defineField({
          name: 'dateRanges',
          title: 'Tarih Aralıkları',
          type: 'array',
          description: 'Satışa açık/kapalı tarih aralıkları',
          of: [
            {
              type: 'object',
              fields: [
                defineField({
                  name: 'start',
                  title: 'Başlangıç Tarihi',
                  type: 'date',
                  validation: (Rule) => Rule.required(),
                }),
                defineField({
                  name: 'end',
                  title: 'Bitiş Tarihi',
                  type: 'date',
                  validation: (Rule) => Rule.required(),
                }),
                defineField({
                  name: 'available',
                  title: 'Müsait mi?',
                  type: 'boolean',
                  description: 'Bu aralık satışa açık mı?',
                  initialValue: true,
                }),
              ],
              preview: {
                select: {
                  start: 'start',
                  end: 'end',
                  available: 'available',
                },
                prepare({ start, end, available }) {
                  return {
                    title: `${start} - ${end}`,
                    subtitle: available ? 'Satışa Açık' : 'Kapalı',
                  }
                },
              },
            },
          ],
        }),
        defineField({
          name: 'specificDates',
          title: 'Özel Gün Ayarları',
          type: 'array',
          description: 'Belirli günler için özel müsaitlik, fiyat ve sınıf durumu',
          of: [
            {
              type: 'object',
              fields: [
                defineField({
                  name: 'date',
                  title: 'Tarih',
                  type: 'date',
                  validation: (Rule) => Rule.required(),
                }),
                defineField({
                  name: 'enabled',
                  title: 'Aktif',
                  type: 'boolean',
                  description: 'Bu özel gün ayarı aktif mi?',
                  initialValue: true,
                }),
                defineField({
                  name: 'defaultAvailable',
                  title: 'Varsayılan Müsaitlik',
                  type: 'boolean',
                  description: 'Bu gün varsayılan olarak müsait mi? (Sınıf bazlı ayarlar bunu override edebilir)',
                  initialValue: true,
                }),
                defineField({
                  name: 'available',
                  title: 'Müsait mi? (Eski)',
                  type: 'boolean',
                  description: 'DEPRECATED: defaultAvailable kullanın',
                  initialValue: true,
                }),
                defineField({
                  name: 'priceOverrides',
                  title: 'Genel fiyat (tüm sınıflar)',
                  type: 'object',
                  description:
                    'Bu güne ortak özel fiyat. Sınıfa özel satırda o yaş için değer yoksa burası kullanılır; o da boşsa turun normal sınıf fiyatı uygulanır.',
                  fields: [
                    defineField({
                      name: 'adultPrice',
                      title: 'Yetişkin Fiyatı',
                      type: 'number',
                      description: 'Boş bırakılırsa (veya sınıf satırında tanımlıysa orası) normal fiyat kullanılır',
                    }),
                    defineField({
                      name: 'childPrice',
                      title: 'Çocuk Fiyatı',
                      type: 'number',
                      description: 'Bu gün için çocuk fiyatı',
                    }),
                    defineField({
                      name: 'infantPrice',
                      title: 'Bebek Fiyatı',
                      type: 'number',
                      description: 'Bu gün için bebek fiyatı',
                    }),
                  ],
                }),
                defineField({
                  name: 'classPriceOverrides',
                  title: 'Sınıfa özel fiyatlar',
                  type: 'array',
                  description:
                    'Eco, Premium veya First için ayrı fiyat. Girilen yaş fiyatı, genel fiyat ve tur varsayılanının önüne geçer.',
                  validation: (Rule) =>
                    Rule.custom((items) => {
                      if (!items) return true
                      const classKeys = (items as any[])
                        .map((item: any) => item?.classKey)
                        .filter(Boolean)
                      const uniqueKeys = new Set(classKeys)
                      if (classKeys.length !== uniqueKeys.size) {
                        return 'Her sınıf için yalnızca bir fiyat satırı ekleyin'
                      }
                      return true
                    }),
                  of: [
                    {
                      type: 'object',
                      fields: [
                        defineField({
                          name: 'classKey',
                          title: 'Sınıf',
                          type: 'string',
                          options: {
                            list: [
                              { title: 'Eco', value: 'eco' },
                              { title: 'Premium', value: 'premium' },
                              { title: 'First', value: 'first' },
                            ],
                          },
                          validation: (Rule) => Rule.required().error('Sınıf seçimi zorunludur'),
                        }),
                        defineField({
                          name: 'adultPrice',
                          title: 'Yetişkin',
                          type: 'number',
                        }),
                        defineField({
                          name: 'childPrice',
                          title: 'Çocuk',
                          type: 'number',
                        }),
                        defineField({
                          name: 'infantPrice',
                          title: 'Bebek',
                          type: 'number',
                        }),
                      ],
                      preview: {
                        select: {
                          classKey: 'classKey',
                          adultPrice: 'adultPrice',
                          childPrice: 'childPrice',
                          infantPrice: 'infantPrice',
                        },
                        prepare({
                          classKey,
                          adultPrice,
                          childPrice,
                          infantPrice,
                        }: Record<string, unknown>) {
                          const ck = typeof classKey === 'string' ? classKey : ''
                          const title = ck
                            ? ck.charAt(0).toUpperCase() + ck.slice(1)
                            : 'Sınıf'
                          const parts: string[] = []
                          if (adultPrice != null) parts.push(`Yetişkin ${adultPrice}`)
                          if (childPrice != null) parts.push(`Çocuk ${childPrice}`)
                          if (infantPrice != null) parts.push(`Bebek ${infantPrice}`)
                          return {
                            title,
                            subtitle: parts.length ? `${parts.join(' · ')} TRY` : 'Fiyat girilmedi',
                          }
                        },
                      },
                    },
                  ],
                }),
                defineField({
                  name: 'classAvailability',
                  title: 'Sınıf Müsaitliği',
                  type: 'array',
                  description: 'Her sınıf için dolu/kapalı durumu',
                  validation: (Rule) =>
                    Rule.custom((items) => {
                      if (!items) return true
                      const classKeys = items.map((item: any) => item?.classKey).filter(Boolean)
                      const uniqueKeys = new Set(classKeys)
                      if (classKeys.length !== uniqueKeys.size) {
                        return 'Her sınıf sadece bir kez tanımlanabilir'
                      }
                      return true
                    }),
                  of: [
                    {
                      type: 'object',
                      fields: [
                        defineField({
                          name: 'classKey',
                          title: 'Sınıf',
                          type: 'string',
                          options: {
                            list: [
                              { title: 'Eco', value: 'eco' },
                              { title: 'Premium', value: 'premium' },
                              { title: 'First', value: 'first' },
                            ],
                          },
                          validation: (Rule) => Rule.required().error('Sınıf seçimi zorunludur'),
                        }),
                        defineField({
                          name: 'status',
                          title: 'Durum',
                          type: 'string',
                          description: 'Bu sınıfın bu gün için durumu',
                          options: {
                            list: [
                              { title: 'Açık', value: 'open' },
                              { title: 'Dolu', value: 'full' },
                              { title: 'Kapalı', value: 'closed' },
                            ],
                          },
                          initialValue: 'open',
                          validation: (Rule) => Rule.required().error('Durum seçimi zorunludur'),
                        }),
                      ],
                      preview: {
                        select: {
                          classKey: 'classKey',
                          status: 'status',
                        },
                        prepare({ classKey, status }) {
                          const statusLabels: Record<string, string> = {
                            open: 'Açık',
                            full: 'Dolu',
                            closed: 'Kapalı',
                          }
                          return {
                            title: classKey ? classKey.charAt(0).toUpperCase() + classKey.slice(1) : 'Sınıf',
                            subtitle: statusLabels[status] || status,
                          }
                        },
                      },
                    },
                  ],
                }),
              ],
              preview: {
                select: {
                  date: 'date',
                  available: 'available',
                },
                prepare({ date, available }) {
                  return {
                    title: date,
                    subtitle: available ? 'Müsait' : 'Kapalı',
                  }
                },
              },
            },
          ],
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      media: 'mainImage',
      rating: 'rating',
    },
    prepare({ title, media, rating }) {
      return {
        title: title,
        subtitle: rating ? `${rating} ⭐` : '',
        media: media,
      }
    },
  },
})



