import { GoogleAuth } from "google-auth-library"
import { type NextRequest, NextResponse } from "next/server"

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
const LOCATION = "asia-northeast1"
const MODEL = "gemini-2.5-flash"

const VERTEX_AI_ENDPOINT = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL}:generateContent`

interface Book {
  id: string
  title: string
  author: string
  genre: string
  isRead: boolean
  createdAt?: { toDate: () => Date } | { seconds: number; nanoseconds: number }
}

interface Message {
  role: "user" | "assistant"
  content: string
}

export async function POST(request: NextRequest) {
  try {
    const { message, books, history } = (await request.json()) as {
      message: string
      books: Book[]
      history: Message[]
    }

    // Google Auth を使用してアクセストークンを取得
    // ローカル: gcloud auth application-default login の認証情報を使用
    // Cloud Run: サービスアカウントの認証情報を自動使用
    const auth = new GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    })
    const client = await auth.getClient()
    const tokenResponse = await client.getAccessToken()
    const accessToken = tokenResponse.token

    if (!accessToken) {
      throw new Error("Failed to get access token")
    }

    // 本棚の情報をコンテキストとして作成
    const formatDate = (createdAt: Book["createdAt"]) => {
      if (!createdAt) return ""
      let date: Date
      if ("toDate" in createdAt && typeof createdAt.toDate === "function") {
        date = createdAt.toDate()
      } else if ("seconds" in createdAt) {
        date = new Date(createdAt.seconds * 1000)
      } else {
        return ""
      }
      return date.toLocaleDateString("ja-JP")
    }

    const booksContext = books.length > 0
      ? books.map(book => {
          const dateStr = formatDate(book.createdAt)
          return `- 「${book.title}」${book.author ? ` (著者: ${book.author})` : ""}${book.genre ? ` [ジャンル: ${book.genre}]` : ""}${dateStr ? ` [登録日: ${dateStr}]` : ""} - ${book.isRead ? "読了" : "未読"}`
        }).join("\n")
      : "まだ本が登録されていません。"

    const unreadBooks = books.filter(b => !b.isRead)
    const readBooks = books.filter(b => b.isRead)
    const today = new Date().toLocaleDateString("ja-JP")

    const systemPrompt = `あなたは読書アドバイザーのAIアシスタントです。
ユーザーの本棚にある本の情報をもとに、読書に関するアドバイスや提案を行います。
親しみやすく、簡潔に回答してください。

## 今日の日付
${today}

## ユーザーの本棚情報
登録冊数: ${books.length}冊
未読（積読）: ${unreadBooks.length}冊
読了: ${readBooks.length}冊

### 本の一覧
${booksContext}

## 回答のルール
- ユーザーの本棚にある本をもとに回答してください
- 「本日登録」「最近登録」などの質問には、登録日を確認して回答してください
- 「最近読んでいない」などの質問には、登録日が古く未読の本を提案してください
- 本棚にない本をおすすめする場合は、その旨を伝えてください
- 回答は日本語で、2-3文程度で簡潔にしてください`

    // 会話履歴を含めてリクエストを作成
    const contents = [
      ...history.map(msg => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }]
      })),
      {
        role: "user",
        parts: [{ text: message }]
      }
    ]

    const response = await fetch(VERTEX_AI_ENDPOINT, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents,
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 512,
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Vertex AI error:", errorText)
      throw new Error(`Vertex AI API error: ${response.status}`)
    }

    const result = await response.json()
    const aiResponse = result.candidates?.[0]?.content?.parts?.[0]?.text || "申し訳ありません。回答を生成できませんでした。"

    return NextResponse.json({ response: aiResponse })
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json(
      { error: "チャットの処理中にエラーが発生しました" },
      { status: 500 }
    )
  }
}
