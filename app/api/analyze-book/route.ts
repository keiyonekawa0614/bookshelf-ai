import { GoogleAuth } from "google-auth-library"
import { type NextRequest, NextResponse } from "next/server"

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
const LOCATION = "asia-northeast1"
const MODEL = "gemini-2.5-flash"

export async function POST(request: NextRequest) {
  try {
    const { imageBase64 } = await request.json()

    if (!imageBase64) {
      return NextResponse.json({ error: "画像が必要です" }, { status: 400 })
    }

    // Base64からデータ部分のみ抽出
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "")

    console.log("[v0] PROJECT_ID:", PROJECT_ID)
    console.log("[v0] Base64 data length:", base64Data.length)

    // Google Auth を使用してアクセストークンを取得
    const auth = new GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    })
    const client = await auth.getClient()
    const accessToken = await client.getAccessToken()

    const endpoint = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL}:generateContent`

    console.log("[v0] Calling Vertex AI endpoint:", endpoint)

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: base64Data,
                },
              },
              {
                text: `本の表紙画像から以下のJSON形式で情報を抽出:
{"title":"タイトル","author":"著者","genre":"ジャンル"}
JSONのみ出力。`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 1024,
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Vertex AI Error:", errorText)
      return NextResponse.json({ error: "AIの解析に失敗しました" }, { status: 500 })
    }

    const result = await response.json()
    console.log("[v0] Vertex AI raw result:", JSON.stringify(result, null, 2))

    const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text || ""
    console.log("[v0] Text response:", textResponse)

    // JSONを抽出
    const jsonMatch = textResponse.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const bookInfo = JSON.parse(jsonMatch[0])
      console.log("[v0] Parsed book info:", bookInfo)
      return NextResponse.json(bookInfo)
    }

    console.log("[v0] No JSON found in response, returning empty")
    return NextResponse.json({ title: "", author: "", genre: "" })
  } catch (error) {
    console.error("[v0] Error analyzing book:", error)
    return NextResponse.json({ error: "解析中にエラーが発生しました" }, { status: 500 })
  }
}
