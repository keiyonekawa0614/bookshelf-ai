import { storage } from "./firebase"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"

/**
 * 画像をCloud Storageにアップロード
 * @param userId ユーザーID
 * @param file 画像ファイル
 * @returns アップロードされた画像のURL
 */
export async function uploadBookImage(userId: string, file: File): Promise<string> {
  const timestamp = Date.now()
  const fileName = `${timestamp}_${file.name}`
  const storageRef = ref(storage, `users/${userId}/books/${fileName}`)

  // 画像をアップロード
  await uploadBytes(storageRef, file)

  // ダウンロードURLを取得
  const downloadUrl = await getDownloadURL(storageRef)
  return downloadUrl
}

/**
 * Base64画像をCloud Storageにアップロード
 * @param userId ユーザーID
 * @param base64 Base64エンコードされた画像データ
 * @param fileName ファイル名
 * @returns アップロードされた画像のURL
 */
export async function uploadBookImageBase64(
  userId: string,
  base64: string,
  fileName = "book-cover.jpg",
): Promise<string> {
  // Base64からBlobに変換
  const response = await fetch(base64)
  const blob = await response.blob()

  const timestamp = Date.now()
  const storageRef = ref(storage, `users/${userId}/books/${timestamp}_${fileName}`)

  // 画像をアップロード
  await uploadBytes(storageRef, blob)

  // ダウンロードURLを取得
  const downloadUrl = await getDownloadURL(storageRef)
  return downloadUrl
}
