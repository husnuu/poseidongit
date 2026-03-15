/**
 * Firebase Auth (client): Google sign-in for admin panel.
 * Requires NEXT_PUBLIC_FIREBASE_* in .env (Firebase Console > Project settings > Web app).
 */

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  type User,
  type Auth,
} from 'firebase/auth'

function getFirebaseConfig() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  if (!apiKey || !authDomain || !projectId) {
    throw new Error(
      'Firebase ayarları eksik. .env dosyasında NEXT_PUBLIC_FIREBASE_API_KEY, AUTH_DOMAIN ve PROJECT_ID tanımlı olmalı.'
    )
  }
  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? 'poseidonbooking.firebasestorage.app',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '',
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ?? undefined,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? undefined,
  }
}

function getApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApps()[0] as FirebaseApp
  }
  return initializeApp(getFirebaseConfig())
}

export function getFirebaseAuth(): Auth {
  return getAuth(getApp())
}

export function getGoogleProvider(): GoogleAuthProvider {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  return provider
}

/** User-friendly message for Firebase auth errors */
export function getAuthErrorMessage(err: unknown): string {
  if (!err || typeof err !== 'object') return 'Giriş yapılamadı.'
  const code = (err as { code?: string }).code
  const message = (err as { message?: string }).message ?? ''
  if (code === 'auth/popup-blocked') return 'Giriş penceresi engellendi. Lütfen açılır pencereye izin verin veya tekrar deneyin.'
  if (code === 'auth/popup-closed-by-user') return 'Giriş penceresi kapatıldı.'
  if (code === 'auth/cancelled-popup-request') return 'Lütfen tekrar deneyin.'
  if (code === 'auth/operation-not-allowed') return 'Google ile giriş etkin değil. Firebase Console\'da Authentication > Sign-in method\'dan Google\'ı açın.'
  if (code === 'auth/unauthorized-domain') return 'Bu alan adı yetkili değil. Firebase Console > Authentication > Authorized domains\'e ekleyin.'
  if (code === 'auth/network-request-failed') return 'Ağ hatası. İnternet bağlantınızı kontrol edin.'
  if (message) return message
  return 'Giriş sırasında bir hata oluştu. Tekrar deneyin.'
}

/** Önce popup dene; engellenmişse redirect kullan. */
export async function signInWithGoogle(): Promise<User | 'redirect'> {
  const auth = getFirebaseAuth()
  const provider = getGoogleProvider()
  try {
    const result = await signInWithPopup(auth, provider)
    return result.user
  } catch (err: unknown) {
    const code = err && typeof err === 'object' && 'code' in err ? (err as { code: string }).code : ''
    if (code === 'auth/popup-blocked' || code === 'auth/cancelled-popup-request') {
      signInWithRedirect(auth, provider)
      return 'redirect'
    }
    throw new Error(getAuthErrorMessage(err))
  }
}

/** Sadece redirect (popup denemeden). */
export function signInWithGoogleRedirect(): void {
  const auth = getFirebaseAuth()
  const provider = getGoogleProvider()
  signInWithRedirect(auth, provider)
}

/** Google'dan geri dönüldüğünde sonucu al (login sayfası mount'ta bir kez çağrılmalı). */
export async function getRedirectResultUser(): Promise<User | null> {
  try {
    const auth = getFirebaseAuth()
    const result = await getRedirectResult(auth)
    return result?.user ?? null
  } catch (err) {
    throw new Error(getAuthErrorMessage(err))
  }
}

export async function signOut(): Promise<void> {
  const auth = getFirebaseAuth()
  await firebaseSignOut(auth)
}

export async function getIdToken(user: User, forceRefresh = false): Promise<string> {
  return user.getIdToken(forceRefresh)
}
