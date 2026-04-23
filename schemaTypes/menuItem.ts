import { defineField, defineType } from 'sanity'

const MENU_CATEGORIES = [
  { title: 'Kokteyller (Margarita, Mojito vb.)', value: 'kokteyller' },
  { title: 'Mocktails', value: 'mocktails' },
  { title: 'Alkollü içecekler', value: 'alkollu_icecekler' },
  { title: 'Soft içecekler', value: 'soft_icecekler' },
  { title: 'Şişeler', value: 'siseler' },
  { title: 'Soğuk Kahveler', value: 'soguk_kahveler' },
  { title: 'Sıcak Kahveler', value: 'sicak_kahveler' },
  { title: 'Premium Çaylar', value: 'premium_caylar' },
  { title: 'Dondurmalar', value: 'dondurmalar' },
  { title: 'Tatlılar', value: 'tatlilar' },
] as const

export default defineType({
  name: 'menuItem',
  title: 'Menü Ürünü',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Ürün adı',
      type: 'string',
      validation: (Rule) => Rule.required().error('Ürün adı zorunludur'),
    }),
    defineField({
      name: 'category',
      title: 'Kategori',
      type: 'string',
      options: {
        list: MENU_CATEGORIES.map(({ title, value }) => ({ title, value })),
        layout: 'dropdown',
      },
      initialValue: 'mocktails',
      validation: (Rule) => Rule.required().error('Kategori seçin'),
    }),
    defineField({
      name: 'price',
      title: 'Fiyat (₺)',
      type: 'number',
      validation: (Rule) => Rule.required().positive().error('Geçerli bir fiyat girin'),
    }),
    defineField({
      name: 'description',
      title: 'Açıklama',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'image',
      title: 'Görsel',
      type: 'image',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          type: 'string',
          title: 'Alternatif metin',
        }),
      ],
    }),
    defineField({
      name: 'inStock',
      title: 'Stokta var',
      type: 'boolean',
      initialValue: true,
    }),
  ],
  preview: {
    select: { title: 'title', category: 'category', media: 'image' },
    prepare({ title, category, media }) {
      const cat =
        MENU_CATEGORIES.find((c) => c.value === category)?.title ?? category
      return { title, subtitle: cat, media }
    },
  },
})
