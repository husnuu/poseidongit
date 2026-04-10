import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'legalPage',
  title: 'Yasal Sayfa',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Başlık',
      type: 'string',
      description: 'Yasal sayfanın başlığı (örn: "İşlem Güvenliği", "Gizlilik Politikası")',
      validation: (Rule) => Rule.required().error('Başlık zorunludur'),
    }),
    defineField({
      name: 'slug',
      title: 'URL (Slug)',
      type: 'slug',
      description: 'Sayfa URL\'si (örn: islem-guvenligi, gizlilik-politikasi). URL otomatik olarak /yasal/ ile başlayacak.',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required().error('URL zorunludur'),
    }),
    defineField({
      name: 'seoTitle',
      title: 'SEO Başlık',
      type: 'string',
      description: 'Arama motorları için başlık (boş bırakılırsa normal başlık kullanılır)',
    }),
    defineField({
      name: 'seoDescription',
      title: 'SEO Açıklama',
      type: 'text',
      description: 'Arama motorları için açıklama metni',
      rows: 3,
    }),
    defineField({
      name: 'content',
      title: 'İçerik',
      type: 'array',
      description: 'Yasal sayfa içeriği (zengin metin)',
      of: [
        {
          type: 'block',
          styles: [
            {title: 'Normal', value: 'normal'},
            {title: 'Başlık 1', value: 'h1'},
            {title: 'Başlık 2', value: 'h2'},
            {title: 'Başlık 3', value: 'h3'},
            {title: 'Alıntı', value: 'blockquote'},
          ],
          lists: [
            {title: 'Numaralı Liste', value: 'number'},
            {title: 'Madde İşareti', value: 'bullet'},
          ],
          marks: {
            decorators: [
              {title: 'Kalın', value: 'strong'},
              {title: 'İtalik', value: 'em'},
              {title: 'Altı Çizili', value: 'underline'},
            ],
            annotations: [
              {
                title: 'URL',
                name: 'link',
                type: 'object',
                fields: [
                  {
                    title: 'URL',
                    name: 'href',
                    type: 'url',
                  },
                ],
              },
            ],
          },
        },
      ],
      validation: (Rule) => Rule.required().error('İçerik zorunludur'),
    }),
    defineField({
      name: 'updatedAt',
      title: 'Son Güncelleme Tarihi',
      type: 'datetime',
      description: 'Sayfanın son güncellendiği tarih (otomatik olarak gösterilir)',
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'translations',
      title: 'Çeviriler — English / Deutsch',
      type: 'object',
      description:
        'İngilizce ve Almanca başlık, slug ve içerik. Slug bu dilde /en/yasal/… veya /de/yasal/… adresinde kullanılır.',
      fields: [
        defineField({ name: 'en', title: 'English', type: 'legalPageTranslation' }),
        defineField({ name: 'de', title: 'Deutsch', type: 'legalPageTranslation' }),
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      slug: 'slug.current',
      updatedAt: 'updatedAt',
    },
    prepare({title, slug, updatedAt}) {
      return {
        title: title || 'Yasal Sayfa',
        subtitle: slug ? `/yasal/${slug}` : '',
        media: () => '📄',
      }
    },
  },
})

