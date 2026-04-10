import { defineField, defineType } from 'sanity'

/** Yasal sayfa portable text — ana `legalPage.content` ile aynı stiller */
const legalBlocks = {
  type: 'block',
  styles: [
    { title: 'Normal', value: 'normal' },
    { title: 'Başlık 1', value: 'h1' },
    { title: 'Başlık 2', value: 'h2' },
    { title: 'Başlık 3', value: 'h3' },
    { title: 'Alıntı', value: 'blockquote' },
  ],
  lists: [
    { title: 'Numaralı Liste', value: 'number' },
    { title: 'Madde İşareti', value: 'bullet' },
  ],
  marks: {
    decorators: [
      { title: 'Kalın', value: 'strong' },
      { title: 'İtalik', value: 'em' },
      { title: 'Altı Çizili', value: 'underline' },
    ],
    annotations: [
      {
        title: 'URL',
        name: 'link',
        type: 'object',
        fields: [{ title: 'URL', name: 'href', type: 'url' }],
      },
    ],
  },
}

export default defineType({
  name: 'legalPageTranslation',
  title: 'Yasal sayfa çevirisi (tek dil)',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Başlık',
      type: 'string',
    }),
    defineField({
      name: 'slug',
      title: 'URL slug (bu dil)',
      type: 'slug',
      options: { maxLength: 96 },
    }),
    defineField({ name: 'seoTitle', title: 'SEO başlık', type: 'string' }),
    defineField({ name: 'seoDescription', title: 'SEO açıklama', type: 'text', rows: 3 }),
    defineField({
      name: 'content',
      title: 'İçerik',
      type: 'array',
      of: [legalBlocks],
    }),
  ],
})
