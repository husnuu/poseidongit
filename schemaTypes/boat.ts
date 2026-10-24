import { defineField, defineType } from 'sanity'

/**
 * Tekne (gemi) — tur dokümanlarından referansla kullanılır. Aynı tekne birden
 * çok turda hizmet verdiği için turun içine gömülü bir nesne değil, ayrı bir
 * doküman: bilgileri bir kez girip tüm turlara bağlarsınız.
 */
export default defineType({
  name: 'boat',
  title: 'Tekne',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Tekne adı',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'coverImage',
      title: 'Kapak görseli',
      description: 'Tur sayfasındaki "Tekneniz" satırında görünen küçük görsel.',
      type: 'image',
      options: { hotspot: true },
      fields: [{ name: 'alt', title: 'Alternatif metin', type: 'string' }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'gallery',
      title: 'Galeri',
      description:
        'Detay penceresindeki fotoğraf mozaiği. İlk 5 görsel mozaikte, tamamı "Tüm fotoğrafları gör" ile açılır.',
      type: 'array',
      of: [
        {
          type: 'image',
          options: { hotspot: true },
          fields: [{ name: 'alt', title: 'Alternatif metin', type: 'string' }],
        },
      ],
    }),
    defineField({
      name: 'amenities',
      title: 'Teknedeki olanaklar',
      description: 'Her satır bir madde — detay penceresinde tikli liste olarak görünür.',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'specs',
      title: 'Teknik özellikler',
      description: 'Boş bırakılan alanlar listede hiç gösterilmez.',
      type: 'object',
      options: { collapsible: true, collapsed: false },
      fields: [
        { name: 'buildYear', title: 'Yapım yılı', type: 'number' },
        { name: 'capacity', title: 'Yolcu kapasitesi', type: 'number' },
        { name: 'cabins', title: 'Kabin sayısı', type: 'number' },
        { name: 'wc', title: 'WC sayısı', type: 'number' },
        {
          name: 'length',
          title: 'Uzunluk',
          description: 'Birimiyle birlikte yazın — ör. "24m".',
          type: 'string',
        },
        { name: 'crew', title: 'Mürettebat sayısı', type: 'number' },
      ],
    }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'specs.buildYear', media: 'coverImage' },
    prepare({ title, subtitle, media }) {
      return { title, subtitle: subtitle ? `Yapım yılı ${subtitle}` : undefined, media }
    },
  },
})
