"use client"

import type React from "react"

import { useState, useRef } from "react"
import { X, Camera, Upload, Loader2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

interface UploadModalProps {
  open: boolean
  onClose: () => void
}

type UploadState = "idle" | "uploading" | "analyzing" | "done"

export function UploadModal({ open, onClose }: UploadModalProps) {
  const [state, setState] = useState<UploadState>("idle")
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleUpload = async () => {
    if (!preview) return

    setState("uploading")
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setState("analyzing")
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setState("done")
    await new Promise((resolve) => setTimeout(resolve, 1000))

    handleClose()
  }

  const handleClose = () => {
    setState("idle")
    setPreview(null)
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
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          {!preview ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full max-w-sm aspect-[3/4] border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-muted-foreground transition-colors"
            >
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
                <Camera className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="font-medium">写真をアップロード</p>
                <p className="text-sm text-muted-foreground mt-1">タップして選択</p>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-sm space-y-6">
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-secondary">
                <img src={preview || "/placeholder.svg"} alt="Preview" className="w-full h-full object-cover" />
                {state !== "idle" && (
                  <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center gap-4">
                    {state === "uploading" && (
                      <>
                        <Loader2 className="h-8 w-8 animate-spin text-accent" />
                        <p className="text-sm">アップロード中...</p>
                      </>
                    )}
                    {state === "analyzing" && (
                      <>
                        <Loader2 className="h-8 w-8 animate-spin text-accent" />
                        <p className="text-sm">AIが解析中...</p>
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

              {state === "idle" && (
                <div className="space-y-3">
                  <Button
                    className="w-full h-14 bg-accent text-accent-foreground hover:bg-accent/90"
                    onClick={handleUpload}
                  >
                    <Upload className="h-5 w-5 mr-2" />
                    この写真で登録
                  </Button>
                  <Button variant="ghost" className="w-full" onClick={() => setPreview(null)}>
                    写真を変更
                  </Button>
                </div>
              )}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>
    </div>
  )
}
