import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'blogPage',
  title: 'Blog Sayfası',
  type: 'document',
  fields: [
    // URL Slug
    defineField({
      name: 'slug',
      title: 'URL (Slug)',
      type: 'slug',
      description: 'Blog sayfasının URL\'si (örn: /blog, /yazilar)',
      options: {
        source: 'heroTitle',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required().error('URL zorunludur'),
    }),
    defineField({
      name: 'heroTitle',
      title: 'Hero Başlık (Üst Satır)',
      type: 'string',
      description: 'Hero bölümü üst başlık (örn: "FIND EVERYTHING YOU NEED")',
      validation: (Rule) => Rule.required().error('Hero başlık zorunludur'),
    }),
    defineField({
      name: 'heroHighlightTitlePart',
      title: 'Hero Vurgulu Başlık (Alt Satır)',
      type: 'string',
      description: 'Hero bölümü vurgulu alt başlık (lacivert renkte gösterilir, örn: "FOR YOUR TRIP TO ÇEŞME!")',
      validation: (Rule) => Rule.required().error('Vurgulu başlık zorunludur'),
    }),
    defineField({
      name: 'heroDescription',
      title: 'Hero Açıklama',
      type: 'text',
      description: 'Hero bölümü açıklama metni',
      rows: 4,
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero Görseli',
      type: 'image',
      description: 'Hero bölümü sağ tarafta gösterilecek görsel',
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
  ],
  preview: {
    select: {
      title: 'heroTitle',
      subtitle: 'heroHighlightTitlePart',
      slug: 'slug.current',
      media: 'heroImage',
    },
    prepare({title, subtitle, slug, media}) {
      return {
        title: title || 'Blog Sayfası',
        subtitle: slug ? `/${slug}` : '',
        media: media,
      }
    },
  },
})

