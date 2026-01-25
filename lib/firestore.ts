import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore"
import { getFirebaseDb } from "@/lib/firebase"

// 型定義
export interface Book {
  id: string
  title: string
  author: string
  genre: string
  coverImageUrl: string
  isRead: boolean
  createdAt: Timestamp | null
  lastReadAt: Timestamp | null
  totalReadingSeconds: number // 秒単位の合計読書時間
  currentReadingStartedAt: Timestamp | null // 読書中の開始時間（nullなら読書中ではない）
}

export interface UserProfile {
  displayName: string
  email: string
  photoURL: string
  createdAt: Timestamp | null
}

export interface Recommendation {
  id: string
  title: string
  author: string
  amazonUrl: string
  reason: string
  createdAt: Timestamp | null
}

// ユーザープロフィール関連
export async function createOrUpdateUserProfile(
  userId: string,
  data: { displayName: string; email: string; photoURL: string },
) {
  const db = getFirebaseDb()
  if (!db) throw new Error("Firestore is not initialized")

  const userRef = doc(db, "users", userId)
  const userSnap = await getDoc(userRef)

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      ...data,
      createdAt: serverTimestamp(),
    })
  } else {
    await updateDoc(userRef, data)
  }
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const db = getFirebaseDb()
  if (!db) throw new Error("Firestore is not initialized")

  const userRef = doc(db, "users", userId)
  const userSnap = await getDoc(userRef)

  if (userSnap.exists()) {
    return userSnap.data() as UserProfile
  }
  return null
}

// 本の管理関連
export async function addBook(userId: string, book: Omit<Book, "id" | "createdAt">): Promise<string> {
  const db = getFirebaseDb()
  if (!db) throw new Error("Firestore is not initialized")

  const booksRef = collection(db, "users", userId, "books")
  const newBookRef = doc(booksRef)

  await setDoc(newBookRef, {
    ...book,
    createdAt: serverTimestamp(),
  })

  return newBookRef.id
}

export async function getBooks(userId: string): Promise<Book[]> {
  const db = getFirebaseDb()
  if (!db) throw new Error("Firestore is not initialized")

  const booksRef = collection(db, "users", userId, "books")
  const q = query(booksRef, orderBy("createdAt", "desc"))
  const snapshot = await getDocs(q)

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Book[]
}

export async function updateBookReadStatus(userId: string, bookId: string, isRead: boolean) {
  const db = getFirebaseDb()
  if (!db) throw new Error("Firestore is not initialized")

  const bookRef = doc(db, "users", userId, "books", bookId)
  await updateDoc(bookRef, { isRead })
}

export async function deleteBook(userId: string, bookId: string) {
  const db = getFirebaseDb()
  if (!db) throw new Error("Firestore is not initialized")

  const bookRef = doc(db, "users", userId, "books", bookId)
  await deleteDoc(bookRef)
}

// 読書開始
export async function startReading(userId: string, bookId: string) {
  const db = getFirebaseDb()
  if (!db) throw new Error("Firestore is not initialized")

  console.log("[v0] startReading called - userId:", userId, "bookId:", bookId)

  const bookRef = doc(db, "users", userId, "books", bookId)
  await updateDoc(bookRef, {
    currentReadingStartedAt: serverTimestamp(),
  })

  console.log("[v0] startReading - serverTimestamp saved")
}

// 読書終了（時間を計測して保存）- 秒単位
export async function stopReading(userId: string, bookId: string) {
  const db = getFirebaseDb()
  if (!db) throw new Error("Firestore is not initialized")

  const bookRef = doc(db, "users", userId, "books", bookId)
  const bookSnap = await getDoc(bookRef)

  if (!bookSnap.exists()) throw new Error("Book not found")

  const bookData = bookSnap.data()
  console.log("[v0] stopReading - bookData:", bookData)
  console.log("[v0] stopReading - currentReadingStartedAt:", bookData.currentReadingStartedAt)
  
  const startedAt = bookData.currentReadingStartedAt as Timestamp | null

  if (!startedAt) {
    console.log("[v0] stopReading - startedAt is null/undefined!")
    throw new Error("Reading was not started")
  }

  const now = new Date()
  const startTime = startedAt.toDate()
  const elapsedSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000)

  console.log("[v0] stopReading - startTime:", startTime, "now:", now, "elapsedSeconds:", elapsedSeconds)

  // 既存データがtotalReadingMinutesの場合は秒に変換
  const currentTotalSeconds = bookData.totalReadingSeconds || (bookData.totalReadingMinutes || 0) * 60

  console.log("[v0] stopReading - currentTotalSeconds:", currentTotalSeconds, "newTotal:", currentTotalSeconds + elapsedSeconds)

  await updateDoc(bookRef, {
    currentReadingStartedAt: null,
    lastReadAt: serverTimestamp(),
    totalReadingSeconds: currentTotalSeconds + elapsedSeconds,
  })

  return elapsedSeconds
}

// おすすめ関連
export async function addRecommendation(
  userId: string,
  recommendation: Omit<Recommendation, "id" | "createdAt">,
): Promise<string> {
  const db = getFirebaseDb()
  if (!db) throw new Error("Firestore is not initialized")

  const recsRef = collection(db, "users", userId, "recommendations")
  const newRecRef = doc(recsRef)

  await setDoc(newRecRef, {
    ...recommendation,
    createdAt: serverTimestamp(),
  })

  return newRecRef.id
}

export async function getRecommendations(userId: string): Promise<Recommendation[]> {
  const db = getFirebaseDb()
  if (!db) throw new Error("Firestore is not initialized")

  const recsRef = collection(db, "users", userId, "recommendations")
  const q = query(recsRef, orderBy("createdAt", "desc"))
  const snapshot = await getDocs(q)

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Recommendation[]
}
