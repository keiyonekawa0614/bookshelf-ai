"use client"

import type React from "react"

import { useState } from "react"
import { Check, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"

interface Book {
  id: string
  title: string
  author: string
  genre: string
  coverUrl: string
  isRead: boolean
}

const mockBooks: Book[] = [
  {
    id: "1",
    title: "人を動かす",
    author: "D・カーネギー",
    genre: "自己啓発",
    coverUrl: "/self-help-book-cover.png",
    isRead: false,
  },
  {
    id: "2",
    title: "ゼロから作るDeep Learning",
    author: "斎藤康毅",
    genre: "技術書",
    coverUrl: "/programming-book-cover.png",
    isRead: true,
  },
  {
    id: "3",
    title: "サピエンス全史",
    author: "ユヴァル・ノア・ハラリ",
    genre: "歴史",
    coverUrl: "/history-book-cover.png",
    isRead: false,
  },
  {
    id: "4",
    title: "嫌われる勇気",
    author: "岸見一郎",
    genre: "自己啓発",
    coverUrl: "/psychology-book-cover.png",
    isRead: false,
  },
  {
    id: "5",
    title: "コンテナ物語",
    author: "マルク・レビンソン",
    genre: "ビジネス",
    coverUrl: "/business-book-cover.png",
    isRead: true,
  },
]

type Filter = "all" | "unread" | "read"

export function BookList() {
  const [filter, setFilter] = useState<Filter>("all")
  const [books, setBooks] = useState(mockBooks)

  const filteredBooks = books.filter((book) => {
    if (filter === "unread") return !book.isRead
    if (filter === "read") return book.isRead
    return true
  })

  const toggleRead = (id: string) => {
    setBooks(books.map((book) => (book.id === id ? { ...book, isRead: !book.isRead } : book)))
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
        {filteredBooks.map((book) => (
          <div key={book.id} className="flex gap-4 bg-card rounded-xl p-4 border border-border">
            <img
              src={book.coverUrl || "/placeholder.svg"}
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
                book.isRead ? "bg-accent border-accent text-accent-foreground" : "border-border text-muted-foreground",
              )}
            >
              {book.isRead ? <Check className="h-5 w-5" /> : <BookOpen className="h-4 w-4" />}
            </button>
          </div>
        ))}
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
