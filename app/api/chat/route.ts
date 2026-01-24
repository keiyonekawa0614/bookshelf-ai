import { NextRequest, NextResponse } from "next/server"

const VERTEX_AI_ENDPOINT = `https://asia-northeast1-aiplatform.googleapis.com/v1/projects/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}/locations/asia-northeast1/publishers/google/models/gemini-2.5-flash:generateContent`

interface Book {
  id: string
  title: string
  author: string
  genre: string
  isRead: boolean
}

interface Message {
  role: "user" | "assistant"
  content: string
}

async function getAccessToken(): Promise<string> {
  const response = await fetch(
    "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token",
    {
      headers: {
        "Metadata-Flavor": "Google",
      },
    }
  )

  if (!response.ok) {
    throw new Error("Failed to get access token")
  }

  const data = await response.json()
  return data.access_token
}

export async function POST(request: NextRequest) {
  try {
    const { message, books, history } = await request.json() as {
      message: string
      books: Book[]
      history: Message[]
    }

    const accessToken = await getAccessToken()

    // 本の情報をコンテキストとして整形
    const booksContext = books.length > 0
      ? books.map((book, index) => {
          const status = book.isRead ? "読了" : "未読（積読）"
          return `${index + 1}. 「${book.title}」 - ${book.author}（${book.genre}）[${status}]`
        }).join("\n")
      : "まだ本が登録されていません。"

    const unreadBooks = books.filter(b => !b.isRead)
    const readBooks = books.filter(b => b.isRead)

    // 会話履歴を整形
    const conversationHistory = history.map(msg => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }]
    }))

    const systemPrompt = `あなたは読書アドバイザーAIです。ユーザーの本棚にある本の情報を元に、読書に関するアドバイスや提案を行います。

## ユーザーの本棚情報
登録冊数: ${books.length}冊
未読（積読）: ${unreadBooks.length}冊
読了: ${readBooks.length}冊

### 本の一覧
${booksContext}

## あなたの役割
- ユーザーの質問に対して、本棚にある本の中から適切な本を提案する
- 読書のモチベーションを高めるアドバイスをする
- 積読本を減らすための提案をする
- 読書時間や気分に合った本を提案する
- 親しみやすく、簡潔に回答する（日本語で）

## 注意事項
- 本棚にない本は提案しない（ユーザーが持っている本の中から選ぶ）
- 長すぎる回答は避け、2-3文程度で簡潔に回答する
- 本を提案する際は、なぜその本を勧めるのか理由も簡単に添える`

    const requestBody = {
      contents: [
        {
          role: "user",
          parts: [{ text: systemPrompt }]
        },
        {
          role: "model",
          parts: [{ text: "はい、あなたの読書アドバイザーとしてお手伝いします。本棚の情報を確認しました。何でも聞いてください！" }]
        },
        ...conversationHistory,
        {
          role: "user",
          parts: [{ text: message }]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 512,
      },
    }

    const response = await fetch(VERTEX_AI_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Vertex AI error:", errorText)
      throw new Error(`Vertex AI API error: ${response.status}`)
    }

    const data = await response.json()
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "申し訳ありません、回答を生成できませんでした。"

    return NextResponse.json({ response: aiResponse })
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json(
      { error: "チャットの処理中にエラーが発生しました" },
      { status: 500 }
    )
  }
}
