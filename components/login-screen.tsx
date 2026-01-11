"use client"

import { useState } from "react"
import { BookOpen, Camera, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dashboard } from "@/components/dashboard"

export function LoginScreen() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  if (isLoggedIn) {
    return <Dashboard onLogout={() => setIsLoggedIn(false)} />
  }

  return (
    <main className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between p-6">
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-accent" />
          <span className="text-lg font-semibold tracking-tight">BookShelf AI</span>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col justify-center px-6 pb-12">
        <h1 className="text-4xl font-bold tracking-tight leading-tight text-balance">
          あなたの読書を、
          <br />
          <span className="text-accent">AI</span>がサポート。
        </h1>
        <p className="mt-4 text-muted-foreground text-base leading-relaxed">
          本の写真を撮るだけで管理。
          <br />
          AIがあなたにぴったりの本をおすすめします。
        </p>

        {/* Features */}
        <div className="mt-10 space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-secondary">
              <Camera className="h-5 w-5 text-foreground" />
            </div>
            <div>
              <p className="font-medium">写真で簡単登録</p>
              <p className="text-sm text-muted-foreground">本の写真を撮るだけで自動認識</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-secondary">
              <Sparkles className="h-5 w-5 text-foreground" />
            </div>
            <div>
              <p className="font-medium">AIおすすめ</p>
              <p className="text-sm text-muted-foreground">あなたの好みと積読状況から提案</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-secondary">
              <BookOpen className="h-5 w-5 text-foreground" />
            </div>
            <div>
              <p className="font-medium">積読管理</p>
              <p className="text-sm text-muted-foreground">読了状況をトラッキング</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <footer className="p-6 pb-10">
        <Button
          className="w-full h-14 text-base font-medium bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={() => setIsLoggedIn(true)}
        >
          Googleでログイン
        </Button>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          ログインすることで利用規約に同意したことになります
        </p>
      </footer>
    </main>
  )
}
