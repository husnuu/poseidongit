import { defineField, defineType } from 'sanity'

const CONTACT_CARD_TYPES = [
  { title: 'Email', value: 'email' },
  { title: 'Hours', value: 'hours' },
  { title: 'Location', value: 'location' },
  { title: 'Phone', value: 'phone' },
  { title: 'WhatsApp', value: 'whatsapp' },
  { title: 'Instagram', value: 'instagram' },
  { title: 'YouTube', value: 'youtube' },
  { title: 'Custom', value: 'custom' },
] as const

export default defineType({
  name: 'contactPage',
  title: 'Contact Page',
  type: 'document',
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'seo', title: 'SEO' },
    { name: 'form', title: 'Form' },
    { name: 'cards', title: 'Contact Cards' },
    { name: 'location', title: 'Konum / Harita' },
    { name: 'tours', title: 'Popular Tours' },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'content',
      initialValue: 'Contact Us',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'metaTitle',
      title: 'Meta title (sayfa başlığı / SEO)',
      type: 'string',
      group: 'seo',
      description: 'Tarayıcı sekmesi ve arama sonuçları için',
    }),
    defineField({
      name: 'metaDescription',
      title: 'Meta description (SEO)',
      type: 'text',
      group: 'seo',
      description: 'Arama sonuçlarında görünen kısa açıklama',
    }),
    defineField({
      name: 'intro',
      title: 'Intro (short description)',
      type: 'array',
      group: 'content',
      of: [{ type: 'block' }],
      description: '2–4 paragraph intro below the title',
    }),
    // Form
    defineField({
      name: 'form',
      title: 'Form',
      type: 'object',
      group: 'form',
      fields: [
        defineField({
          name: 'submitLabel',
          title: 'Submit button label',
          type: 'string',
          initialValue: 'SEND MESSAGE',
        }),
        defineField({
          name: 'successMessage',
          title: 'Success message',
          type: 'string',
          initialValue: 'Success!',
        }),
      ],
    }),
    // Contact cards (right column)
    defineField({
      name: 'contactCards',
      title: 'Contact Cards',
      type: 'array',
      group: 'cards',
      description: 'Items for the right-side info card',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'type',
              title: 'Type',
              type: 'string',
              options: { list: [...CONTACT_CARD_TYPES] },
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'label',
              title: 'Label',
              type: 'string',
              description: 'e.g. "EMAIL US"',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'value',
              title: 'Value',
              type: 'string',
              description: 'e.g. "info@example.com" or "Join 120k+ followers..."',
            }),
            defineField({
              name: 'href',
              title: 'Link (href)',
              type: 'string',
              description: 'mailto:, tel:, or https: URL',
            }),
            defineField({
              name: 'highlight',
              title: 'Highlight',
              type: 'boolean',
              description: 'Different color (e.g. accent for Instagram)',
              initialValue: false,
            }),
          ],
          preview: {
            select: { label: 'label', type: 'type' },
            prepare({ label, type }) {
              return { title: label || type || 'Card' }
            },
          },
        },
      ],
    }),
    // Legacy / fallback fields (populate contactCards or use as defaults)
    defineField({
      name: 'officeAddress',
      title: 'Office Address',
      type: 'text',
      group: 'cards',
    }),
    defineField({
      name: 'businessHours',
      title: 'Business Hours',
      type: 'string',
      group: 'cards',
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      group: 'cards',
    }),
    defineField({
      name: 'phone',
      title: 'Phone',
      type: 'string',
      group: 'cards',
    }),
    defineField({
      name: 'whatsapp',
      title: 'WhatsApp',
      type: 'string',
      group: 'cards',
    }),
    defineField({
      name: 'instagramUrl',
      title: 'Instagram URL',
      type: 'url',
      group: 'cards',
    }),
    defineField({
      name: 'youtubeUrl',
      title: 'YouTube URL',
      type: 'url',
      group: 'cards',
    }),
    defineField({
      name: 'youtubeLabel',
      title: 'YouTube link label',
      type: 'string',
      group: 'cards',
      initialValue: 'Find us on Youtube',
      description: 'e.g. "Find us on Youtube"',
    }),
    defineField({
      name: 'instagramLabel',
      title: 'Instagram link label',
      type: 'string',
      group: 'cards',
      initialValue: 'Follow us on Instagram',
      description: 'e.g. "Follow us on Instagram"',
    }),
    // Konum / Harita (sayfa altında)
    defineField({
      name: 'mapEmbedUrl',
      title: 'Google Maps Embed URL',
      type: 'url',
      group: 'location',
      description: 'Google Maps\'ten "Paylaş > Haritayı yerleştir" ile alınan iframe src linki',
    }),
    defineField({
      name: 'locationTitle',
      title: 'Konum başlığı',
      type: 'string',
      group: 'location',
      initialValue: 'KONUM',
    }),
    // Popular tours
    defineField({
      name: 'showPopularTours',
      title: 'Show Popular Tours',
      type: 'boolean',
      group: 'tours',
      initialValue: false,
    }),
    defineField({
      name: 'popularToursTitle',
      title: 'Popular Tours Title',
      type: 'string',
      group: 'tours',
      initialValue: 'OR YOU CAN FIND OUR MOST POPULAR TOURS HERE!',
    }),
    defineField({
      name: 'popularTours',
      title: 'Popular Tours',
      type: 'array',
      group: 'tours',
      of: [{ type: 'reference', to: [{ type: 'tour' }] }],
    }),
  ],
  preview: {
    select: { title: 'title' },
    prepare({ title }) {
      return { title: title || 'Contact Page' }
    },
  },
})
