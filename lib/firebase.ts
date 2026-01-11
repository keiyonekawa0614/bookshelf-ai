import { initializeApp, getApps, type FirebaseApp } from "firebase/app"
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth"
import { getFirestore, type Firestore } from "firebase/firestore"
import { getStorage, type FirebaseStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebasestorage.app`,
}

let app: FirebaseApp | null = null
let auth: Auth | null = null
let googleProvider: GoogleAuthProvider | null = null
let db: Firestore | null = null
let storage: FirebaseStorage | null = null
let initialized = false

function initializeFirebase() {
  if (initialized) return
  if (typeof window === "undefined") return
  if (!firebaseConfig.apiKey) {
    console.error("Firebase API Key is missing")
    return
  }

  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
    auth = getAuth(app)
    googleProvider = new GoogleAuthProvider()
    db = getFirestore(app)
    storage = getStorage(app)
    initialized = true
  } catch (error) {
    console.error("Firebase initialization error:", error)
  }
}

export function getFirebaseAuth(): Auth | null {
  initializeFirebase()
  return auth
}

export function getGoogleProvider(): GoogleAuthProvider | null {
  initializeFirebase()
  return googleProvider
}

export function getFirebaseDb(): Firestore | null {
  initializeFirebase()
  return db
}

export function getFirebaseStorage(): FirebaseStorage | null {
  initializeFirebase()
  return storage
}

export { app, auth, googleProvider, db, storage }
