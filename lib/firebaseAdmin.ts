import * as admin from 'firebase-admin'

const projectId = process.env.FIREBASE_PROJECT_ID
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
let privateKey = process.env.FIREBASE_PRIVATE_KEY

// .env'de \n bazen literal "backslash+n" olarak gelir; gerçek satır sonuna çevir. Tırnakları kaldır.
if (privateKey && typeof privateKey === 'string') {
  privateKey = privateKey.replace(/\\n/g, '\n').replace(/^["']|["']$/g, '').trim()
}

function getFirebaseAdmin(): admin.app.App {
  if (admin.apps.length > 0) {
    return admin.app()
  }
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Missing Firebase Admin env: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY'
    )
  }
  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  })
}

export function getFirestore(): admin.firestore.Firestore {
  getFirebaseAdmin()
  return admin.firestore()
}

export default getFirebaseAdmin
