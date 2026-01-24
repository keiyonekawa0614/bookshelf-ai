"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { X, ImageIcon, Loader2, Check, AlertCircle, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth-context"
import { addBook } from "@/lib/firestore"
import { uploadBookImageBase64 } from "@/lib/storage"

interface UploadModalProps {
  open: boolean
  onClose: () => void
  onComplete?: () => void
}

type UploadState = "idle" | "uploading" | "analyzing" | "form" | "saving" | "done"

export function UploadModal({ open, onClose, onComplete }: UploadModalProps) {
  const { user } = useAuth()
  const [state, setState] = useState<UploadState>("idle")
  const [preview, setPreview] = useState<string | null>(null)
  const [bookData, setBookData] = useState({
    title: "",
    author: "",
    genre: "",
  })
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isIOSNonSafari, setIsIOSNonSafari] = useState(false)

  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent)
    setIsIOSNonSafari(isIOS && !isSafari)
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const analyzeBookImage = async (imageBase64: string) => {
    try {
      const response = await fetch("/api/analyze-book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageBase64 }),
      })

      console.log("[v0] API Response status:", response.status)

      if (!response.ok) {
        throw new Error("AI解析に失敗しました")
      }

      const data = await response.json()
      console.log("[v0] API Response data:", data)
      console.log("[v0] Title:", data.title)
      console.log("[v0] Author:", data.author)
      console.log("[v0] Genre:", data.genre)
      return data
    } catch (err) {
      console.error("AI解析エラー:", err)
      return null
    }
  }

  const handleUpload = async () => {
    if (!preview) return

    setState("uploading")
    await new Promise((resolve) => setTimeout(resolve, 300))

    setState("analyzing")

    const result = await analyzeBookImage(preview)

    console.log("[v0] Analyze result:", result)

    if (result && !result.error) {
      console.log("[v0] Setting bookData:", {
        title: result.title || "",
        author: result.author || "",
        genre: result.genre || "",
      })
      setBookData({
        title: result.title || "",
        author: result.author || "",
        genre: result.genre || "",
      })
    } else {
      console.log("[v0] Result is null or has error:", result)
    }

    setState("form")
  }

  const handleSave = async () => {
    if (!user) return
    if (!bookData.title.trim()) {
      setError("タイトルを入力してください")
      return
    }

    setError(null)
    setState("saving")

    try {
      let coverImageUrl = ""
      if (preview) {
        coverImageUrl = await uploadBookImageBase64(user.uid, preview)
      }

      await addBook(user.uid, {
        title: bookData.title.trim(),
        author: bookData.author.trim() || "不明",
        genre: bookData.genre.trim() || "未分類",
        coverImageUrl,
        isRead: false,
      })

      setState("done")
      await new Promise((resolve) => setTimeout(resolve, 1000))

      if (onComplete) {
        onComplete()
      } else {
        handleClose()
      }
    } catch (err) {
      console.error("保存エラー:", err)
      setError("保存に失敗しました。もう一度お試しください。")
      setState("form")
    }
  }

  const handleClose = () => {
    setState("idle")
    setPreview(null)
    setBookData({ title: "", author: "", genre: "" })
    setError(null)
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm">
      <div className="flex flex-col h-full">
        {/* Header */}
        <header className="flex items-center justify-between p-6">
          <h2 className="text-lg font-semibold">本を追加</h2>
          <button onClick={handleClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-6 w-6" />
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto">
          {isIOSNonSafari && (
            <div className="w-full max-w-sm mb-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-200">
                iOSをお使いの場合、カメラ機能はSafariでのご利用を推奨します。ギャラリーからの写真選択は可能です。
              </p>
            </div>
          )}

          {!preview ? (
            <div className="w-full max-w-sm space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-8 border-2 border-dashed border-border rounded-2xl flex flex-col items-center gap-4 cursor-pointer hover:border-muted-foreground transition-colors"
              >
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="font-medium">写真を選択</p>
                  <p className="text-sm text-muted-foreground mt-1">本の表紙を撮影またはギャラリーから選択</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-sm space-y-6">
              {/* 画像プレビュー */}
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-secondary">
                <img src={preview || "/placeholder.svg"} alt="Preview" className="w-full h-full object-cover" />
                {(state === "uploading" || state === "analyzing" || state === "saving" || state === "done") && (
                  <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center gap-4">
                    {state === "uploading" && (
                      <>
                        <Loader2 className="h-8 w-8 animate-spin text-accent" />
                        <p className="text-sm">処理中...</p>
                      </>
                    )}
                    {state === "analyzing" && (
                      <>
                        <Sparkles className="h-8 w-8 animate-pulse text-accent" />
                        <p className="text-sm">AIが本の情報を解析中...</p>
                      </>
                    )}
                    {state === "saving" && (
                      <>
                        <Loader2 className="h-8 w-8 animate-spin text-accent" />
                        <p className="text-sm">保存中...</p>
                      </>
                    )}
                    {state === "done" && (
                      <>
                        <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center">
                          <Check className="h-6 w-6 text-accent-foreground" />
                        </div>
                        <p className="text-sm">登録完了</p>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* 手動入力フォーム */}
              {state === "form" && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground text-center">AIが解析した情報を確認・修正してください</p>
                  {error && <p className="text-sm text-destructive text-center">{error}</p>}
                  <div className="space-y-3">
                    <Input
                      placeholder="タイトル *"
                      value={bookData.title}
                      onChange={(e) => setBookData({ ...bookData, title: e.target.value })}
                    />
                    <Input
                      placeholder="著者"
                      value={bookData.author}
                      onChange={(e) => setBookData({ ...bookData, author: e.target.value })}
                    />
                    <Input
                      placeholder="ジャンル（例: ビジネス、技術書）"
                      value={bookData.genre}
                      onChange={(e) => setBookData({ ...bookData, genre: e.target.value })}
                    />
                  </div>
                  <div className="space-y-3 pt-2">
                    <Button
                      className="w-full h-14 bg-accent text-accent-foreground hover:bg-accent/90"
                      onClick={handleSave}
                    >
                      登録する
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full"
                      onClick={() => {
                        setPreview(null)
                        setState("idle")
                      }}
                    >
                      写真を変更
                    </Button>
                  </div>
                </div>
              )}

              {/* 初期状態のボタン */}
              {state === "idle" && (
                <div className="space-y-3">
                  <Button
                    className="w-full h-14 bg-accent text-accent-foreground hover:bg-accent/90"
                    onClick={handleUpload}
                  >
                    <Sparkles className="h-5 w-5 mr-2" />
                    AIで解析して登録
                  </Button>
                  <Button variant="ghost" className="w-full" onClick={() => setPreview(null)}>
                    写真を変更
                  </Button>
                </div>
              )}
            </div>
          )}

          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        </div>
      </div>
    </div>
  )
}
