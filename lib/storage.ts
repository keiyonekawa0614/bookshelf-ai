import { getFirebaseStorage } from "./firebase"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"

/**
 * 画像をCloud Storageにアップロード
 */
export async function uploadBookImage(userId: string, file: File): Promise<string> {
  const storage = getFirebaseStorage()
  if (!storage) throw new Error("Firebase Storage is not initialized")

  const timestamp = Date.now()
  const fileName = `${timestamp}_${file.name}`
  const storageRef = ref(storage, `users/${userId}/books/${fileName}`)

  await uploadBytes(storageRef, file)
  const downloadUrl = await getDownloadURL(storageRef)
  return downloadUrl
}

/**
 * Base64画像をCloud Storageにアップロード
 */
export async function uploadBookImageBase64(
  userId: string,
  base64: string,
  fileName = "book-cover.jpg",
): Promise<string> {
  const storage = getFirebaseStorage()
  if (!storage) throw new Error("Firebase Storage is not initialized")

  const response = await fetch(base64)
  const blob = await response.blob()

  const timestamp = Date.now()
  const storageRef = ref(storage, `users/${userId}/books/${timestamp}_${fileName}`)

  await uploadBytes(storageRef, blob)
  const downloadUrl = await getDownloadURL(storageRef)
  return downloadUrl
}
