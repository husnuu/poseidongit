import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'blog',
  title: 'Blog Yazıları',
  type: 'document',
  fields: [
    // A) Temel
    defineField({
      name: 'title',
      title: 'Başlık',
      type: 'string',
      description: 'Blog yazısının ana başlığı',
      validation: (Rule) => Rule.required().error('Başlık zorunludur'),
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
      name: 'excerpt',
      title: 'Kısa Özet',
      type: 'text',
      description: 'Liste görünümünde gösterilir. Hedef: 140-220 karakter.',
      rows: 3,
      validation: (Rule) =>
        Rule.required()
          .min(80)
          .max(280)
          .warning('Özet 140-220 karakter arası ideal, en fazla 280 karakter'),
    }),
    defineField({
      name: 'content',
      title: 'İçerik',
      type: 'array',
      description: 'Blog yazısının ana içeriği (zengin metin formatında)',
      of: [{type: 'block'}],
      validation: (Rule) => Rule.required().error('İçerik zorunludur'),
    }),
    defineField({
      name: 'coverImage',
      title: 'Kapak Görseli',
      type: 'image',
      description: 'Blog yazısının kapak görseli',
      options: {
        hotspot: true,
      },
      validation: (Rule) => Rule.required().error('Kapak görseli zorunludur'),
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alternatif Metin',
        },
      ],
    }),

    // B) Meta
    defineField({
      name: 'authorName',
      title: 'Yazar Adı',
      type: 'string',
      description: 'Blog yazısının yazarı',
    }),
    defineField({
      name: 'author',
      title: 'Yazar (Eski)',
      type: 'string',
      description: 'Eski alan - artık kullanılmıyor',
    }),
    defineField({
      name: 'publishedAt',
      title: 'Yayın Tarihi',
      type: 'datetime',
      description: 'Blog yazısının yayın tarihi',
      validation: (Rule) => Rule.required().error('Yayın tarihi zorunludur'),
    }),
    defineField({
      name: 'publishDate',
      title: 'Yayın Tarihi (Eski)',
      type: 'datetime',
      description: 'Eski alan - artık kullanılmıyor',
    }),
    defineField({
      name: 'readingTime',
      title: 'Okuma Süresi (Dakika)',
      type: 'number',
      description: 'Tahmini okuma süresi (dakika cinsinden, örn: 5)',
    }),
    defineField({
      name: 'readTime',
      title: 'Okuma Süresi (Eski)',
      type: 'string',
      description: 'Eski alan - artık kullanılmıyor',
    }),
    defineField({
      name: 'featured',
      title: 'Öne Çıkarılmış',
      type: 'boolean',
      description: 'Blog yazısı öne çıkarılmış mı?',
      initialValue: false,
    }),
    defineField({
      name: 'category',
      title: 'Kategori',
      type: 'string',
      description: 'Blog yazısının kategorisi',
    }),
    defineField({
      name: 'tags',
      title: 'Etiketler',
      type: 'array',
      description: 'Blog yazısı için etiketler',
      of: [{type: 'string'}],
    }),

    // C) SEO
    defineField({
      name: 'translations',
      title: 'Çeviriler — English / Deutsch',
      type: 'object',
      description:
        'İngilizce ve Almanca başlık, özet, içerik ve URL slug. Slug bu dilde /en/blog/… veya /de/blog/… adresinde kullanılır.',
      fields: [
        defineField({
          name: 'en',
          title: 'English',
          type: 'blogTranslation',
        }),
        defineField({
          name: 'de',
          title: 'Deutsch',
          type: 'blogTranslation',
        }),
      ],
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'object',
      description: 'Arama motoru optimizasyonu ayarları',
      fields: [
        defineField({
          name: 'metaTitle',
          title: 'Meta Başlık',
          type: 'string',
          description: 'SEO için meta başlık (genellikle başlıkla aynı olabilir)',
        }),
        defineField({
          name: 'metaDescription',
          title: 'Meta Açıklama',
          type: 'text',
          description: 'SEO için meta açıklama (150-160 karakter önerilir)',
          rows: 3,
        }),
        defineField({
          name: 'ogImage',
          title: 'OG Görseli',
          type: 'image',
          description: 'Sosyal medya paylaşımları için görsel (opsiyonel)',
          options: {
            hotspot: true,
          },
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      authorName: 'authorName',
      author: 'author',
      publishedAt: 'publishedAt',
      publishDate: 'publishDate',
      media: 'coverImage',
    },
    prepare({title, authorName, author, publishedAt, publishDate, media}) {
      const date = publishedAt || publishDate
        ? new Date(publishedAt || publishDate).toLocaleDateString('tr-TR')
        : ''
      const authorText = authorName || author || ''
      return {
        title: title,
        subtitle: authorText ? `${authorText} • ${date}` : date,
        media: media,
      }
    },
  },
})


