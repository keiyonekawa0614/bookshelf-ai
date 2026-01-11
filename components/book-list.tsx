"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Check, BookOpen, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { getBooks, updateBookReadStatus, type Book } from "@/lib/firestore"

type Filter = "all" | "unread" | "read"

export function BookList() {
  const { user } = useAuth()
  const [filter, setFilter] = useState<Filter>("all")
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)

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

  const filteredBooks = books.filter((book) => {
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
          filteredBooks.map((book) => (
            <div key={book.id} className="flex gap-4 bg-card rounded-xl p-4 border border-border">
              <img
                src={book.coverImageUrl || "/placeholder.svg?height=96&width=64&query=book cover"}
                alt={book.title}
                className="w-16 h-24 object-cover rounded-lg bg-secondary"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{book.title}</h3>
                <p className="text-sm text-muted-foreground truncate">{book.author}</p>
                <span className="inline-block mt-2 px-2 py-1 text-xs bg-secondary rounded-md">{book.genre}</span>
              </div>
              <button
                onClick={() => toggleRead(book.id)}
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors self-center",
                  book.isRead
                    ? "bg-accent border-accent text-accent-foreground"
                    : "border-border text-muted-foreground",
                )}
              >
                {book.isRead ? <Check className="h-5 w-5" /> : <BookOpen className="h-4 w-4" />}
              </button>
            </div>
          ))
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
