import { defineArrayMember, defineField, defineType } from 'sanity'

/**
 * Sohbet asistanının ek bilgi kaynağı (tek belge, id: chatbotSettings).
 * Turlar, yatlar ve SSS sayfası zaten otomatik okunur; buraya onların dışında
 * kalan bilgiler girer. Bkz. docs/CHATBOT_KURULUM.md
 */
export default defineType({
  name: 'chatbotSettings',
  title: 'Sohbet Asistanı',
  type: 'document',
  fields: [
    defineField({
      name: 'knowledgeFiles',
      title: 'Bilgi belgeleri',
      description:
        'Asistanın cevap verirken kullanacağı belgeler: sık sorulan sorular, iptal/iade kuralları, transfer, ' +
        'evcil hayvan, engelli erişimi vb. PDF, Word (.docx), .txt veya .md yükleyin. Kısa tutun (birkaç sayfa ideal, ' +
        'en fazla ~40 sayfa): her mesajda okunur. Fotoğrafı çekilmiş/taranmış PDF\'lerdeki yazı okunamaz. ' +
        'Okunup okunmadığını admin panelinde "Sohbet asistanı" sayfasından görebilirsiniz.',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'knowledgeFile',
          title: 'Belge',
          fields: [
            defineField({
              name: 'title',
              title: 'Başlık',
              type: 'string',
              description: 'Örn. "Sık sorulan sorular 2027", "İptal ve iade kuralları"',
              validation: (r) => r.required(),
            }),
            defineField({
              name: 'file',
              title: 'Dosya',
              type: 'file',
              options: { accept: '.pdf,.docx,.txt,.md,application/pdf,text/plain,text/markdown' },
              validation: (r) => r.required(),
            }),
            defineField({
              name: 'enabled',
              title: 'Asistan kullansın',
              type: 'boolean',
              initialValue: true,
            }),
          ],
          preview: {
            select: { title: 'title', filename: 'file.asset.originalFilename', enabled: 'enabled' },
            prepare({ title, filename, enabled }: { title?: string; filename?: string; enabled?: boolean }) {
              return {
                title: title || filename || 'Belge',
                subtitle: `${filename ?? 'dosya yok'}${enabled === false ? ' · kapalı' : ''}`,
              }
            },
          },
        }),
      ],
    }),
    defineField({
      name: 'notes',
      title: 'Ek bilgiler (metin)',
      description:
        'Dosya yüklemek yerine doğrudan da yazabilirsiniz: soru-cevaplar, kurallar, duyurular. Asistan bunları da kullanır.',
      type: 'text',
      rows: 14,
    }),
  ],
  preview: {
    prepare: () => ({ title: 'Sohbet Asistanı', subtitle: 'Bilgi belgeleri' }),
  },
})
