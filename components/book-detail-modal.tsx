"use client"

import { useState } from "react"
import { X, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { type Book, updateBook, deleteBook } from "@/lib/firestore"
import { useAuth } from "@/lib/auth-context"

const GENRES = [
  "ビジネス",
  "自己啓発",
  "小説",
  "技術書",
  "歴史",
  "心理学",
  "科学",
  "エッセイ",
  "その他",
]

interface BookDetailModalProps {
  book: Book
  isOpen: boolean
  onClose: () => void
  onUpdated: () => void
  onDeleted: () => void
}

export function BookDetailModal({ book, isOpen, onClose, onUpdated, onDeleted }: BookDetailModalProps) {
  const { user } = useAuth()
  const [title, setTitle] = useState(book.title)
  const [author, setAuthor] = useState(book.author)
  const [genre, setGenre] = useState(book.genre)
  const [isLoading, setIsLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  if (!isOpen) return null

  const handleSave = async () => {
    if (!user || !title.trim()) return

    setIsLoading(true)
    try {
      await updateBook(user.uid, book.id, {
        title: title.trim(),
        author: author.trim(),
        genre,
      })
      onUpdated()
      onClose()
    } catch (error) {
      console.error("本の更新エラー:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      await deleteBook(user.uid, book.id)
      onDeleted()
      onClose()
    } catch (error) {
      console.error("本の削除エラー:", error)
    } finally {
      setIsLoading(false)
      setShowDeleteConfirm(false)
    }
  }

  const formatReadingTime = (seconds: number): string => {
    if (!seconds) return "0秒"
    if (seconds < 60) return `${seconds}秒`
    if (seconds < 3600) {
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${mins}分${secs}秒`
    }
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    if (mins === 0) return `${hours}時間`
    return `${hours}時間${mins}分`
  }

  return (
    <>
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed inset-x-4 top-[50%] translate-y-[-50%] z-50 max-w-md mx-auto bg-card border border-border rounded-xl shadow-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">本の詳細</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* 表紙画像 */}
          <div className="flex justify-center">
            <img
              src={book.coverImageUrl || "/placeholder.svg?height=192&width=128&query=book cover"}
              alt={book.title}
              className="w-32 h-48 object-cover rounded-lg bg-secondary"
            />
          </div>

          {/* 読書統計 */}
          <div className="bg-secondary/50 rounded-lg p-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">合計読書時間</span>
              <span className="font-medium">{formatReadingTime(book.totalReadingSeconds || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">登録日</span>
              <span className="font-medium">
                {book.createdAt?.toDate().toLocaleDateString("ja-JP") || "-"}
              </span>
            </div>
            {book.lastReadAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">最終読書日</span>
                <span className="font-medium">
                  {book.lastReadAt.toDate().toLocaleDateString("ja-JP")}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">ステータス</span>
              <span className="font-medium">{book.isRead ? "読了" : "未読"}</span>
            </div>
          </div>

          {/* 編集フォーム */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">タイトル</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="本のタイトル"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="author">著者</Label>
              <Input
                id="author"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="著者名"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="genre">ジャンル</Label>
              <Select value={genre} onValueChange={setGenre}>
                <SelectTrigger>
                  <SelectValue placeholder="ジャンルを選択" />
                </SelectTrigger>
                <SelectContent>
                  {GENRES.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border space-y-3">
          <Button
            className="w-full"
            onClick={handleSave}
            disabled={isLoading || !title.trim()}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            保存する
          </Button>
          <Button
            variant="outline"
            className="w-full text-destructive hover:text-destructive bg-transparent"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isLoading}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            この本を削除
          </Button>
        </div>
      </div>

      {/* 削除確認ダイアログ */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>本を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              「{book.title}」を削除します。この操作は取り消せません。読書記録も一緒に削除されます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              削除する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
