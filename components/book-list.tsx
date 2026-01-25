"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Check, BookOpen, Loader2, Play, Square, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { getBooks, updateBookReadStatus, startReading, stopReading, type Book } from "@/lib/firestore"
import { Button } from "@/components/ui/button"

type Filter = "all" | "unread" | "read"

// 読書時間をフォーマット（秒単位）
function formatReadingTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}秒`
  }
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}分${secs}秒`
  }
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  if (mins === 0) {
    return `${hours}時間`
  }
  return `${hours}時間${mins}分`
}

// 経過時間を計算（読書中の場合）- 秒単位
function getElapsedSeconds(startedAt: { toDate: () => Date } | null): number {
  if (!startedAt) return 0
  const now = new Date()
  const start = startedAt.toDate()
  return Math.floor((now.getTime() - start.getTime()) / 1000)
}

export function BookList() {
  const { user } = useAuth()
  const [filter, setFilter] = useState<Filter>("all")
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [processingBookId, setProcessingBookId] = useState<string | null>(null)
  const [, setTick] = useState(0) // 経過時間更新用

  useEffect(() => {
    async function fetchBooks() {
      if (!user) return

      try {
        const fetchedBooks = await getBooks(user.uid)
        setBooks(fetchedBooks)
      } catch (error) {
        console.error("本の取得エラー:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchBooks()
  }, [user])

  // 読書中の本がある場合、1秒ごとに経過時間を更新
  useEffect(() => {
    const hasReadingBook = books.some(b => b.currentReadingStartedAt)
    if (!hasReadingBook) return

    const interval = setInterval(() => {
      setTick(t => t + 1)
    }, 1000) // 1秒ごと

    return () => clearInterval(interval)
  }, [books])

  // 本を並び替え: 読書中 > 最終読書日時 > 合計時間
  const sortedBooks = [...books].sort((a, b) => {
    // 1. 読書中のものを一番上に
    const aIsReading = a.currentReadingStartedAt ? 1 : 0
    const bIsReading = b.currentReadingStartedAt ? 1 : 0
    if (aIsReading !== bIsReading) return bIsReading - aIsReading

    // 2. 最終読書日時が新しい順
    const aLastRead = a.lastReadAt?.toDate?.()?.getTime() || 0
    const bLastRead = b.lastReadAt?.toDate?.()?.getTime() || 0
    if (aLastRead !== bLastRead) return bLastRead - aLastRead

    // 3. 合計読書時間が長い順
    const aTotal = a.totalReadingSeconds || 0
    const bTotal = b.totalReadingSeconds || 0
    return bTotal - aTotal
  })

  const filteredBooks = sortedBooks.filter((book) => {
    if (filter === "unread") return !book.isRead
    if (filter === "read") return book.isRead
    return true
  })

  const toggleRead = async (id: string) => {
    if (!user) return

    const book = books.find((b) => b.id === id)
    if (!book) return

    const newStatus = !book.isRead

    // 楽観的UI更新
    setBooks(books.map((b) => (b.id === id ? { ...b, isRead: newStatus } : b)))

    try {
      await updateBookReadStatus(user.uid, id, newStatus)
    } catch (error) {
      console.error("状態更新エラー:", error)
      // エラー時は元に戻す
      setBooks(books.map((b) => (b.id === id ? { ...b, isRead: !newStatus } : b)))
    }
  }

  const handleStartReading = async (bookId: string) => {
    if (!user) return
    setProcessingBookId(bookId)

    try {
      await startReading(user.uid, bookId)
      // 開始時刻を固定値としてキャプチャ
      const startTime = new Date()
      // UIを更新
      setBooks(books.map(b => 
        b.id === bookId 
          ? { ...b, currentReadingStartedAt: { toDate: () => startTime } as Book['currentReadingStartedAt'] }
          : b
      ))
    } catch (error) {
      console.error("読書開始エラー:", error)
    } finally {
      setProcessingBookId(null)
    }
  }

  const handleStopReading = async (bookId: string) => {
    if (!user) return
    setProcessingBookId(bookId)

    try {
      const elapsedSeconds = await stopReading(user.uid, bookId)
      console.log("[v0] handleStopReading - elapsedSeconds:", elapsedSeconds)
      const book = books.find(b => b.id === bookId)
      // 既存データがtotalReadingMinutesの場合は秒に変換
      const currentTotalSeconds = book?.totalReadingSeconds || ((book as unknown as { totalReadingMinutes?: number })?.totalReadingMinutes || 0) * 60
      
      // UIを更新
      setBooks(books.map(b => 
        b.id === bookId 
          ? { 
              ...b, 
              currentReadingStartedAt: null,
              lastReadAt: { toDate: () => new Date() } as Book['lastReadAt'],
              totalReadingSeconds: currentTotalSeconds + elapsedSeconds
            }
          : b
      ))
    } catch (error) {
      console.error("読書終了エラー:", error)
    } finally {
      setProcessingBookId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">本棚</h1>
        <p className="text-sm text-muted-foreground mt-1">{books.length}冊の本を管理中</p>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <FilterButton active={filter === "all"} onClick={() => setFilter("all")}>
          すべて
        </FilterButton>
        <FilterButton active={filter === "unread"} onClick={() => setFilter("unread")}>
          積読
        </FilterButton>
        <FilterButton active={filter === "read"} onClick={() => setFilter("read")}>
          読了
        </FilterButton>
      </div>

      {/* Book List */}
      <div className="space-y-3">
        {filteredBooks.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>本がまだ登録されていません</p>
            <p className="text-sm mt-1">写真をアップロードして追加しましょう</p>
          </div>
        ) : (
          filteredBooks.map((book) => {
            const isReading = !!book.currentReadingStartedAt
            const elapsedSeconds = getElapsedSeconds(book.currentReadingStartedAt)
            // 既存データがtotalReadingMinutesの場合は秒に変換
            const existingSeconds = book.totalReadingSeconds || ((book as unknown as { totalReadingMinutes?: number }).totalReadingMinutes || 0) * 60
            const totalSeconds = existingSeconds + elapsedSeconds
            const isProcessing = processingBookId === book.id

            return (
              <div key={book.id} className="bg-card rounded-xl p-4 border border-border">
                <div className="flex gap-4">
                  <img
                    src={book.coverImageUrl || "/placeholder.svg?height=96&width=64&query=book cover"}
                    alt={book.title}
                    className="w-16 h-24 object-cover rounded-lg bg-secondary"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{book.title}</h3>
                    <p className="text-sm text-muted-foreground truncate">{book.author}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="px-2 py-1 text-xs bg-secondary rounded-md">{book.genre}</span>
                      {book.createdAt && (
                        <span className="text-xs text-muted-foreground">
                          {book.createdAt.toDate().toLocaleDateString("ja-JP")}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleRead(book.id)}
                    className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors self-start shrink-0",
                      book.isRead
                        ? "bg-accent border-accent text-accent-foreground"
                        : "border-border text-muted-foreground",
                    )}
                  >
                    {book.isRead ? <Check className="h-5 w-5" /> : <BookOpen className="h-4 w-4" />}
                  </button>
                </div>

                {/* 読書時間セクション */}
                <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>合計: {formatReadingTime(totalSeconds)}</span>
                    </div>
                    {book.lastReadAt && (
                      <span>
                        最終: {book.lastReadAt.toDate().toLocaleDateString("ja-JP")}
                      </span>
                    )}
                  </div>

                  {isReading ? (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-8"
                      onClick={() => handleStopReading(book.id)}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <Square className="h-3 w-3 mr-1" />
                      )}
                      終了 ({formatReadingTime(elapsedSeconds)})
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 bg-transparent"
                      onClick={() => handleStartReading(book.id)}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <Play className="h-3 w-3 mr-1" />
                      )}
                      読書開始
                    </Button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-full text-sm font-medium transition-colors",
        active ? "bg-accent text-accent-foreground" : "bg-secondary text-secondary-foreground",
      )}
    >
      {children}
    </button>
  )
}
