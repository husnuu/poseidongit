import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'boatTimelineItem',
  title: 'Tekne Timeline Öğesi',
  type: 'object',
  fields: [
    defineField({
      name: 'year',
      title: 'Yıl',
      type: 'string',
      description: 'Teknenin yılı (örn: "2020" veya "2020-2023")',
      validation: (Rule) => Rule.required().error('Yıl zorunludur'),
    }),
    defineField({
      name: 'name',
      title: 'Tekne Adı',
      type: 'string',
      description: 'Teknenin adı',
      validation: (Rule) => Rule.required().error('Tekne adı zorunludur'),
    }),
    defineField({
      name: 'description',
      title: 'Açıklama',
      type: 'text',
      description: 'Tekne hakkında açıklama',
      rows: 4,
    }),
    defineField({
      name: 'image',
      title: 'Görsel',
      type: 'image',
      description: 'Tekne görseli',
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
      name: 'isActive',
      title: 'Aktif',
      type: 'boolean',
      description: 'Timeline\'da gösterilsin mi?',
      initialValue: true,
    }),
    defineField({
      name: 'order',
      title: 'Sıralama',
      type: 'number',
      description: 'Sıralama numarası (küçükten büyüğe: eski → yeni)',
      validation: (Rule) => Rule.required().error('Sıralama numarası zorunludur'),
    }),
  ],
  preview: {
    select: {
      name: 'name',
      year: 'year',
      media: 'image',
      isActive: 'isActive',
    },
    prepare({name, year, media, isActive}) {
      return {
        title: `${year} - ${name}`,
        subtitle: isActive ? 'Aktif' : 'Pasif',
        media: media,
      }
    },
  },
})

