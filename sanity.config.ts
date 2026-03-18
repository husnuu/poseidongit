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
            ...S.documentTypeListItems().filter(
              (item) => !['contactPage', 'covesPage'].includes(item.getId() ?? '')
            ),
          ]),
    }),
  ],
  schema: {
    types: schemaTypes,
  },
})
