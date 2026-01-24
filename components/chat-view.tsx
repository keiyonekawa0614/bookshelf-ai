"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Send, Sparkles, Loader2, User, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { type Book, updateBookReadStatus } from "@/lib/firestore"
import { useAuth } from "@/lib/auth-context"

interface Message {
  role: "user" | "assistant"
  content: string
}

interface ChatViewProps {
  books: Book[]
  initialQuestion?: string
  onInitialQuestionHandled?: () => void
  onBooksUpdated?: () => void
}

const SUGGESTED_QUESTIONS = [
  "今日読むべき本は？",
  "積読を減らすには？",
  "最近登録した本は？",
  "ビジネス書でおすすめは？",
]

export function ChatView({ books, initialQuestion, onInitialQuestionHandled, onBooksUpdated }: ChatViewProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 初期質問を受け取ったらpendingに設定
  useEffect(() => {
    if (initialQuestion) {
      setPendingQuestion(initialQuestion)
      onInitialQuestionHandled?.()
    }
  }, [initialQuestion, onInitialQuestionHandled])

  // pendingの質問を送信
  useEffect(() => {
    if (pendingQuestion && books.length > 0 && !isLoading) {
      const question = pendingQuestion
      setPendingQuestion(null)
      sendMessageInternal(question)
    }
  }, [pendingQuestion, books.length, isLoading])

  const sendMessageInternal = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return

    const userMessage: Message = { role: "user", content: messageText }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageText,
          books,
          history: messages,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const data = await response.json()

      // Function Callがある場合、実行してから再度AIに結果を返す
      if (data.functionCall) {
        const { name, bookId, bookTitle, newStatus } = data.functionCall
        
        if (user) {
          try {
            // Firestoreを更新
            await updateBookReadStatus(user.uid, bookId, newStatus)
            
            // 本の一覧を更新
            onBooksUpdated?.()
            
            // 成功メッセージを表示
            const statusText = newStatus ? "読了" : "未読"
            const assistantMessage: Message = {
              role: "assistant",
              content: `「${bookTitle}」を${statusText}に更新しました！`,
            }
            setMessages((prev) => [...prev, assistantMessage])
          } catch (error) {
            console.error("Failed to update book status:", error)
            const errorMessage: Message = {
              role: "assistant",
              content: `「${bookTitle}」の更新に失敗しました。もう一度お試しください。`,
            }
            setMessages((prev) => [...prev, errorMessage])
          }
        }
      } else {
        // 通常のテキスト応答
        const assistantMessage: Message = { role: "assistant", content: data.response }
        setMessages((prev) => [...prev, assistantMessage])
      }
    } catch (error) {
      console.error("Chat error:", error)
      const errorMessage: Message = {
        role: "assistant",
        content: "申し訳ありません。エラーが発生しました。もう一度お試しください。",
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const sendMessage = (messageText: string) => {
    sendMessageInternal(messageText)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessageInternal(input)
  }

  const clearChat = () => {
    setMessages([])
  }

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent" />
          <h1 className="text-lg font-semibold">AIアシスタント</h1>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearChat} className="text-muted-foreground">
            <Trash2 className="h-4 w-4 mr-1" />
            クリア
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-4">
              <Sparkles className="h-8 w-8 text-accent" />
            </div>
            <h2 className="text-lg font-medium mb-2">読書アシスタント</h2>
            <p className="text-sm text-muted-foreground mb-6">
              {books.length === 0
                ? "本を登録すると、AIがあなたの読書をサポートします"
                : `${books.length}冊の本をもとに、読書のアドバイスをします`}
            </p>
            {books.length > 0 && (
              <div className="w-full max-w-sm space-y-2">
                <p className="text-xs text-muted-foreground mb-2">こんな質問ができます</p>
                <div className="grid grid-cols-2 gap-2">
                  {SUGGESTED_QUESTIONS.map((question) => (
                    <Button
                      key={question}
                      variant="outline"
                      size="sm"
                      className="text-xs h-auto py-3 px-3 whitespace-normal text-left bg-transparent"
                      onClick={() => sendMessage(question)}
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {messages.map((msg, index) => (
              <div key={index} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-4 w-4 text-accent" />
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${
                    msg.role === "user" ? "bg-accent text-accent-foreground" : "bg-muted text-foreground"
                  }`}
                >
                  {msg.content}
                </div>
                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-4 w-4 text-accent" />
                </div>
                <div className="bg-muted rounded-2xl px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border bg-background">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={books.length === 0 ? "本を登録してください" : "質問を入力..."}
            disabled={isLoading || books.length === 0}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim() || books.length === 0}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
