"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Home, BookOpen, Sparkles, User, Plus, Camera, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BookList } from "@/components/book-list"
import { RecommendationsView } from "@/components/recommendations-view"
import { UploadModal } from "@/components/upload-modal"
import { ProfileView } from "@/components/profile-view"
import { useAuth } from "@/lib/auth-context"
import { getBooks, type Book } from "@/lib/firestore"
import { AIChat } from "@/components/ai-chat"

type Tab = "home" | "books" | "recommend" | "profile"

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("home")
  const [showUpload, setShowUpload] = useState(false)
  const { user, signOut } = useAuth()
  const [books, setBooks] = useState<Book[]>([])
  const [loadingBooks, setLoadingBooks] = useState(true)

  useEffect(() => {
    async function fetchBooks() {
      if (!user) return
      try {
        const fetchedBooks = await getBooks(user.uid)
        setBooks(fetchedBooks)
      } catch (error) {
        console.error("本の取得エラー:", error)
      } finally {
        setLoadingBooks(false)
      }
    }
    fetchBooks()
  }, [user])

  const handleUploadComplete = async () => {
    if (!user) return
    setShowUpload(false)
    setLoadingBooks(true)
    try {
      const fetchedBooks = await getBooks(user.uid)
      setBooks(fetchedBooks)
    } catch (error) {
      console.error("本の取得エラー:", error)
    } finally {
      setLoadingBooks(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col bg-background pb-20">
      {/* Content */}
      <div className="flex-1">
        {activeTab === "home" && (
          <HomeView
            onUpload={() => setShowUpload(true)}
            userName={user?.displayName || "ゲスト"}
            books={books}
            loading={loadingBooks}
          />
        )}
        {activeTab === "books" && <BookList />}
        {activeTab === "recommend" && <RecommendationsView />}
        {activeTab === "profile" && <ProfileView onLogout={signOut} user={user} books={books} />}
      </div>

      {/* Upload FAB */}
      <Button
        size="icon"
        className="fixed bottom-24 right-6 h-14 w-14 rounded-full bg-accent text-accent-foreground shadow-lg hover:bg-accent/90"
        onClick={() => setShowUpload(true)}
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="flex items-center justify-around h-16 max-w-md mx-auto">
          <NavItem
            icon={<Home className="h-5 w-5" />}
            label="ホーム"
            active={activeTab === "home"}
            onClick={() => setActiveTab("home")}
          />
          <NavItem
            icon={<BookOpen className="h-5 w-5" />}
            label="本棚"
            active={activeTab === "books"}
            onClick={() => setActiveTab("books")}
          />
          <NavItem
            icon={<Sparkles className="h-5 w-5" />}
            label="おすすめ"
            active={activeTab === "recommend"}
            onClick={() => setActiveTab("recommend")}
          />
          <NavItem
            icon={<User className="h-5 w-5" />}
            label="プロフィール"
            active={activeTab === "profile"}
            onClick={() => setActiveTab("profile")}
          />
        </div>
      </nav>

      {/* Upload Modal */}
      <UploadModal open={showUpload} onClose={() => setShowUpload(false)} onComplete={handleUploadComplete} />
    </main>
  )
}

function NavItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 px-4 py-2 transition-colors ${
        active ? "text-accent" : "text-muted-foreground"
      }`}
    >
      {icon}
      <span className="text-xs">{label}</span>
    </button>
  )
}

function HomeView({
  onUpload,
  userName,
  books,
  loading,
}: {
  onUpload: () => void
  userName: string
  books: Book[]
  loading: boolean
}) {
  const unreadCount = books.filter((b) => !b.isRead).length
  const totalBooks = books.length

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div>
        <p className="text-sm text-muted-foreground">こんにちは、{userName}さん</p>
        <h1 className="text-2xl font-bold tracking-tight">読書を始めましょう</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card rounded-xl p-5 border border-border">
          <p className="text-sm text-muted-foreground">積読</p>
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin mt-2" />
          ) : (
            <>
              <p className="text-3xl font-bold mt-1">{unreadCount}</p>
              <p className="text-xs text-muted-foreground mt-1">冊</p>
            </>
          )}
        </div>
        <div className="bg-card rounded-xl p-5 border border-border">
          <p className="text-sm text-muted-foreground">総登録数</p>
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin mt-2" />
          ) : (
            <>
              <p className="text-3xl font-bold mt-1">{totalBooks}</p>
              <p className="text-xs text-muted-foreground mt-1">冊</p>
            </>
          )}
        </div>
      </div>

      {/* Quick Action */}
      <div className="bg-secondary rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent/20">
            <Camera className="h-5 w-5 text-accent" />
          </div>
          <div>
            <p className="font-medium">本を追加</p>
            <p className="text-sm text-muted-foreground">写真を撮って登録</p>
          </div>
        </div>
        <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90" onClick={onUpload}>
          写真をアップロード
        </Button>
      </div>

      {/* AI Chat */}
      <AIChat books={books} />
    </div>
  )
}
