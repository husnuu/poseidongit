import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { schemaTypes } from './schemaTypes'

export default defineConfig({
  name: 'poseidonbooking',
  title: 'Booking Studio',
  projectId: '7q8277he',
  dataset: 'production',
  // Studio'yu düzenlenebilir yap (bazı ortamlarda read-only açılabiliyor)
  unstable_readOnly: false,
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            S.listItem()
              .title('Contact Page')
              .id('contactPage')
              .child(S.document().schemaType('contactPage').documentId('contactPage')),
            S.listItem()
              .title('Koylar Sayfası')
              .id('covesPage')
              .child(S.document().schemaType('covesPage').documentId('covesPage')),
            S.listItem()
              .title('Yat kiralama — lokasyonlar')
              .id('yachtLocation-list')
              .child(S.documentTypeList('yachtLocation').title('Lokasyonlar')),
            S.listItem()
              .title('Yat kiralama — yatlar')
              .id('yachtRental-list')
              .child(S.documentTypeList('yachtRental').title('Yatlar')),
            S.listItem()
              .title('Yat kiralama — ana sayfa')
              .id('yachtRentalsPage')
              .child(S.document().schemaType('yachtRentalsPage').documentId('yachtRentalsPage')),
            S.listItem()
              .title('Yardım Merkezi — sayfa ayarları')
              .id('helpCenterPage')
              .child(S.document().schemaType('helpCenterPage').documentId('helpCenterPage')),
            S.listItem()
              .title('Yardım — kategoriler')
              .id('helpCategory-list')
              .child(S.documentTypeList('helpCategory').title('Kategoriler')),
            S.listItem()
              .title('Yardım — makaleler')
              .id('helpArticle-list')
              .child(S.documentTypeList('helpArticle').title('Makaleler')),
            ...S.documentTypeListItems().filter(
              (item) =>
                ![
                  'contactPage',
                  'covesPage',
                  'yachtLocation',
                  'yachtRental',
                  'yachtRentalsPage',
                  'helpCenterPage',
                  'helpCategory',
                  'helpArticle',
                ].includes(item.getId() ?? '')
            ),
          ]),
    }),
  ],
  schema: {
    types: schemaTypes,
  },
})
