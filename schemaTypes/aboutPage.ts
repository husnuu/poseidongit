import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'aboutPage',
  title: 'Hakkımızda Sayfası',
  type: 'document',
  fields: [
    // A) URL
    defineField({
      name: 'slug',
      title: 'URL (Slug)',
      type: 'slug',
      description: 'Sayfa URL\'si (örn: /hakkimizda)',
      options: {
        source: 'titleTop',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required().error('URL zorunludur'),
    }),
    
    // B) Hero Section (WakeUpReykjavik style)
    defineField({
      name: 'titleTop',
      title: 'Üst Başlık',
      type: 'string',
      description:
        'Hero üst satır (örn. "BİZ KİMİZ?"). **Hero logosu** yüklediğinizde sayfada metin yerine logo gösterilir; bu alanlar yedek veya erişilebilirlik için doldurulabilir.',
    }),
    defineField({
      name: 'titleBottom',
      title: 'Alt Başlık (Accent Renk)',
      type: 'string',
      description:
        'Hero alt satır (örn. "ÇEŞME POSEIDON"). Logo kullanılıyorsa görünmez; logo yoksa accent renkte gösterilir.',
    }),
    defineField({
      name: 'heroLogo',
      title: 'Hero logosu',
      type: 'image',
      description:
        'Doldurulduğunda hero bölümünde üst/alt başlık yerine bu logo gösterilir (kart çerçevesi olmadan). Şeffaf PNG/SVG önerilir.',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          title: 'Alternatif metin',
          type: 'string',
          description: 'Ekran okuyucular ve SEO için (örn. Poseidon Çeşme logosu)',
        }),
      ],
    }),
    defineField({
      name: 'intro',
      title: 'Giriş Metni (Portable Text)',
      type: 'array',
      description: 'Hero altı açıklama metni (zengin metin)',
      of: [
        {
          type: 'block',
        },
      ],
    }),

    // C) Hakkımızda Section
    defineField({
      name: 'sectionTitle',
      title: 'Bölüm Başlığı',
      type: 'string',
      description: 'Hakkımızda bölümü başlığı (örn: "HAKKIMIZDA")',
    }),
    defineField({
      name: 'sectionSubtitle',
      title: 'Bölüm Alt Başlığı',
      type: 'string',
      description: 'Hakkımızda bölümü alt başlığı (örn: "NASIL BAŞLADIK")',
    }),
    defineField({
      name: 'sectionBody',
      title: 'Bölüm İçeriği (Portable Text)',
      type: 'array',
      description: 'Hakkımızda bölümü paragraf metinleri',
      of: [
        {
          type: 'block',
        },
      ],
    }),
    defineField({
      name: 'ctaLabel',
      title: 'CTA Buton Metni',
      type: 'string',
      description: 'Call-to-action buton metni (opsiyonel, örn: "Read more")',
    }),
    defineField({
      name: 'ctaHref',
      title: 'CTA Buton Linki',
      type: 'url',
      description: 'Call-to-action buton linki (opsiyonel)',
    }),

    // D) Timeline Section
    defineField({
      name: 'timelineTitle',
      title: 'Timeline Başlığı',
      type: 'string',
      description: 'Timeline bölümü başlığı (örn: "GEÇMİŞTEN GÜNÜMÜZE TEKNELERİMİZ")',
    }),
    defineField({
      name: 'timelineDescription',
      title: 'Timeline Açıklaması',
      type: 'text',
      description: 'Timeline bölümü kısa açıklama metni',
      rows: 3,
    }),
    defineField({
      name: 'boats',
      title: 'Tekneler (Timeline)',
      type: 'array',
      description: 'Geçmişten günümüze teknelerimiz',
      of: [
        {
          type: 'boatTimelineItem',
        },
      ],
    }),

    defineField({
      name: 'seo',
      title: 'SEO (varsayılan / Türkçe)',
      type: 'object',
      fields: [
        defineField({
          name: 'metaTitle',
          title: 'Meta başlık',
          type: 'string',
          description: 'Tarayıcı sekmesi; boşsa site varsayılanı kullanılır.',
        }),
        defineField({
          name: 'metaDescription',
          title: 'Meta açıklama',
          type: 'text',
          rows: 3,
        }),
      ],
    }),
    defineField({
      name: 'pageTranslations',
      title: 'Çeviriler — English / Deutsch',
      type: 'object',
      description: 'Hero, metinler ve timeline başlıkları. Tekne görselleri TR kaydından; metinler sırayla eşleşir.',
      fields: [
        defineField({ name: 'en', title: 'English', type: 'aboutPageLocaleOverlay' }),
        defineField({ name: 'de', title: 'Deutsch', type: 'aboutPageLocaleOverlay' }),
      ],
    }),

    // E) Legacy fields (backward compatibility)
    defineField({
      name: 'heroTitle',
      title: 'Ana Başlık (Eski)',
      type: 'string',
      description: 'Eski alan - artık kullanılmıyor',
    }),
    defineField({
      name: 'heroSubtitle',
      title: 'Alt Başlık (Eski)',
      type: 'text',
      description: 'Eski alan - artık kullanılmıyor',
      rows: 2,
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero Görseli',
      type: 'image',
      description: 'Hero bölümünde gösterilecek görsel',
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
      name: 'introText',
      title: 'Giriş Metni (Eski)',
      type: 'text',
      description: 'Eski alan - artık kullanılmıyor',
      rows: 4,
    }),
    defineField({
      name: 'mission',
      title: 'Misyon',
      type: 'text',
      description: 'Şirket misyonu',
      rows: 3,
    }),
    defineField({
      name: 'vision',
      title: 'Vizyon',
      type: 'text',
      description: 'Şirket vizyonu',
      rows: 3,
    }),
    defineField({
      name: 'values',
      title: 'Değerler',
      type: 'array',
      description: 'Şirket değerleri listesi',
      of: [{type: 'string'}],
    }),

    // D) Hikaye
    defineField({
      name: 'storyTitle',
      title: 'Hikaye Başlığı',
      type: 'string',
      description: 'Hikaye bölümünün başlığı',
    }),
    defineField({
      name: 'storyText',
      title: 'Hikaye Metni',
      type: 'text',
      description: 'Şirket hikayesi',
      rows: 6,
    }),
    defineField({
      name: 'storyImage',
      title: 'Hikaye Görseli',
      type: 'image',
      description: 'Hikaye bölümünde gösterilecek görsel',
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

    // E) Ekip
    defineField({
      name: 'team',
      title: 'Ekip',
      type: 'array',
      description: 'Ekip üyeleri',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'name',
              title: 'İsim',
              type: 'string',
              validation: (Rule) => Rule.required().error('İsim zorunludur'),
            }),
            defineField({
              name: 'role',
              title: 'Görev',
              type: 'string',
              description: 'Ekip üyesinin görevi/ünvanı',
            }),
            defineField({
              name: 'photo',
              title: 'Fotoğraf',
              type: 'image',
              description: 'Ekip üyesinin fotoğrafı',
              options: {
                hotspot: true,
              },
            }),
            defineField({
              name: 'bio',
              title: 'Kısa Biyografi',
              type: 'text',
              description: 'Ekip üyesinin kısa biyografisi',
              rows: 3,
            }),
          ],
          preview: {
            select: {
              name: 'name',
              role: 'role',
              media: 'photo',
            },
            prepare({name, role, media}) {
              return {
                title: name,
                subtitle: role || '',
                media: media,
              }
            },
          },
        },
      ],
    }),

    // F) Güven Alanı
    defineField({
      name: 'trustItems',
      title: 'Güven Unsurları',
      type: 'array',
      description: 'Güven unsurları (sertifikalar, ödüller, vb.)',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'icon',
              title: 'İkon',
              type: 'string',
              description: 'İkon anahtarı veya emoji',
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
              description: 'Güven unsurunun açıklaması',
              rows: 2,
            }),
          ],
          preview: {
            select: {
              title: 'title',
              subtitle: 'description',
              icon: 'icon',
            },
            prepare({title, subtitle, icon}) {
              return {
                title: icon ? `${icon} ${title}` : title,
                subtitle: subtitle,
              }
            },
          },
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: 'titleTop',
      subtitle: 'titleBottom',
      slug: 'slug.current',
      media: 'heroLogo',
      heroImg: 'heroImage',
    },
    prepare({title, subtitle, slug, media, heroImg}) {
      return {
        title: title || subtitle || 'Hakkımızda Sayfası',
        subtitle: slug ? `/${slug}` : 'URL yok',
        media: media || heroImg,
      }
    },
  },
})


