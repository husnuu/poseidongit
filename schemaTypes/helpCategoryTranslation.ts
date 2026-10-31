import { defineField, defineType } from 'sanity'
import { translationSlugOptions } from './translationSlugOptions'

export default defineType({
  name: 'helpCategoryTranslation',
  title: 'Yardım kategorisi çevirisi (tek dil)',
  type: 'object',
  fields: [
    defineField({ name: 'title', title: 'Başlık', type: 'string' }),
    defineField({
      name: 'slug',
      title: 'Slug (bu dilde kategori URL’si)',
      type: 'slug',
      options: translationSlugOptions,
    }),
    defineField({ name: 'shortDescription', title: 'Kısa açıklama', type: 'text', rows: 2 }),
  ],
})
