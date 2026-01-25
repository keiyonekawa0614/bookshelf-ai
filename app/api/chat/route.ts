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
  lastReadAt?: { toDate: () => Date } | { seconds: number; nanoseconds: number }
  totalReadingSeconds?: number
  totalReadingMinutes?: number // 後方互換性のため
}

interface Message {
  role: "user" | "assistant"
  content: string
}

interface FunctionCall {
  name: string
  args: Record<string, unknown>
}

interface ToolResult {
  success: boolean
  message: string
  bookTitle?: string
}

// Function Callingで使用するツールの定義
const tools = [
  {
    functionDeclarations: [
      {
        name: "startReadingSession",
        description: "指定した本の読書を開始します。読書時間の計測を開始し、本棚画面に遷移します。ユーザーが「はい」「読みます」「その本を読む」「今から読む」などと本を読むことに同意した場合に使用します。直前のAIの応答で提案された本に対して使用してください。",
        parameters: {
          type: "object",
          properties: {
            bookTitle: {
              type: "string",
              description: "読書を開始する本のタイトル（部分一致で検索）"
            }
          },
          required: ["bookTitle"]
        }
      }
    ]
  }
]

// 本を検索する関数
function findBookByTitle(books: Book[], searchTitle: string): Book | undefined {
  const normalizedSearch = searchTitle.toLowerCase()
  return books.find(book => 
    book.title.toLowerCase().includes(normalizedSearch) ||
    normalizedSearch.includes(book.title.toLowerCase())
  )
}

export async function POST(request: NextRequest) {
  try {
    const { message, books, history, userId, executeFunction } = (await request.json()) as {
      message: string
      books: Book[]
      history: Message[]
      userId?: string
      executeFunction?: { name: string; bookId: string; bookTitle: string }
    }

    // Google Auth を使用してアクセストークンを取得
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
    const formatDate = (timestamp: Book["createdAt"] | Book["lastReadAt"]) => {
      if (!timestamp) return ""
      let date: Date
      if ("toDate" in timestamp && typeof timestamp.toDate === "function") {
        date = timestamp.toDate()
      } else if ("seconds" in timestamp) {
        date = new Date(timestamp.seconds * 1000)
      } else {
        return ""
      }
      return date.toLocaleDateString("ja-JP")
    }

    const formatReadingTime = (minutes: number | undefined) => {
      if (!minutes) return "0分"
      if (minutes < 60) return `${minutes}分`
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      if (mins === 0) return `${hours}時間`
      return `${hours}時間${mins}分`
    }

    const booksContext = books.length > 0
      ? books.map(book => {
          const dateStr = formatDate(book.createdAt)
          const lastReadStr = formatDate(book.lastReadAt)
          // totalReadingSecondsを分に変換、後方互換性のためtotalReadingMinutesもチェック
          const totalMinutes = book.totalReadingSeconds 
            ? Math.floor(book.totalReadingSeconds / 60) 
            : (book.totalReadingMinutes || 0)
          const readingTimeStr = formatReadingTime(totalMinutes)
          return `- ID:${book.id} 「${book.title}」${book.author ? ` (著者: ${book.author})` : ""}${book.genre ? ` [ジャンル: ${book.genre}]` : ""}${dateStr ? ` [登録日: ${dateStr}]` : ""}${lastReadStr ? ` [最終読書日: ${lastReadStr}]` : ""} [読書時間: ${readingTimeStr}] - ${book.isRead ? "読了" : "未読"}`
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
- 「最近読んでいない」などの質問には、最終読書日が古い本や読書時間が少ない本を提案してください
- 「今週どれくらい読んだ？」などの質問には、読書時間を集計して回答してください
- 本棚にない本をおすすめする場合は、その旨を伝えてください
- 回答は日本語で、2-3文程度で簡潔にしてください

## ツールの使用について
- 本を提案した後、ユーザーが「はい」「読みます」「その本を読む」「今から読む」などと読書に同意した場合は、startReadingSession ツールを使用してください
- startReadingSession を使用する際は、直前に提案した本のタイトルを使用してください
- ツールを使用する際は、本棚にある本のタイトルと照合してください

## 本を提案した後の対応
本を提案した後は、「この本を今から読みますか？」と聞いてください。ユーザーが同意したら読書を開始できます。`

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
        tools,
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
    const candidate = result.candidates?.[0]?.content

    // Function Callがあるかチェック
    const functionCall = candidate?.parts?.find((part: { functionCall?: FunctionCall }) => part.functionCall)?.functionCall as FunctionCall | undefined

    if (functionCall) {
      const { name, args } = functionCall
      const bookTitle = args.bookTitle as string

      // 本を検索
      const foundBook = findBookByTitle(books, bookTitle)

      if (foundBook) {
        // クライアントに関数実行を指示
        return NextResponse.json({
          functionCall: {
            name,
            bookId: foundBook.id,
            bookTitle: foundBook.title,
            action: "startReading"
          }
        })
      } else {
        // 本が見つからない場合
        return NextResponse.json({
          response: `「${bookTitle}」という本が本棚に見つかりませんでした。正確なタイトルを教えてください。`
        })
      }
    }

    // 通常のテキスト応答
    const aiResponse = candidate?.parts?.[0]?.text || "申し訳ありません。回答を生成できませんでした。"

    return NextResponse.json({ response: aiResponse })
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json(
      { error: "チャットの処理中にエラーが発生しました" },
      { status: 500 }
    )
  }
}
