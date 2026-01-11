"use client"

import { ExternalLink, Sparkles, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Recommendation {
  id: string
  title: string
  author: string
  reason: string
  genre: string
  amazonUrl: string
  coverUrl: string
}

const mockRecommendations: Recommendation[] = [
  {
    id: "1",
    title: "思考の整理学",
    author: "外山滋比古",
    reason: "「人を動かす」が好きな方におすすめ。自己啓発の視点から思考を整理する方法を学べます。",
    genre: "自己啓発",
    amazonUrl: "https://amazon.co.jp",
    coverUrl: "/thinking-book-cover.jpg",
  },
  {
    id: "2",
    title: "ホモ・デウス",
    author: "ユヴァル・ノア・ハラリ",
    reason: "「サピエンス全史」の続編。人類の未来を考察する必読の一冊です。",
    genre: "歴史",
    amazonUrl: "https://amazon.co.jp",
    coverUrl: "/future-history-book-cover.jpg",
  },
  {
    id: "3",
    title: "Clean Code",
    author: "Robert C. Martin",
    reason: "技術書をよく読まれる方に。コードの品質を高めるための実践的なガイドです。",
    genre: "技術書",
    amazonUrl: "https://amazon.co.jp",
    coverUrl: "/programming-clean-code-book-cover.jpg",
  },
]

export function RecommendationsView() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AIおすすめ</h1>
          <p className="text-sm text-muted-foreground mt-1">あなたの読書傾向に基づいた提案</p>
        </div>
        <Button variant="ghost" size="icon" className="text-muted-foreground">
          <RefreshCw className="h-5 w-5" />
        </Button>
      </div>

      {/* AI Analysis */}
      <div className="bg-secondary rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-accent" />
          <p className="text-sm font-medium">分析結果</p>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          自己啓発と技術書を中心に読まれています。視野を広げるため、歴史やビジネス書もおすすめします。
        </p>
      </div>

      {/* Recommendations */}
      <div className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground">おすすめの本</h2>
        {mockRecommendations.map((rec) => (
          <div key={rec.id} className="bg-card rounded-xl p-4 border border-border space-y-4">
            <div className="flex gap-4">
              <img
                src={rec.coverUrl || "/placeholder.svg"}
                alt={rec.title}
                className="w-20 h-28 object-cover rounded-lg bg-secondary"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium">{rec.title}</h3>
                <p className="text-sm text-muted-foreground">{rec.author}</p>
                <span className="inline-block mt-2 px-2 py-1 text-xs bg-secondary rounded-md">{rec.genre}</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{rec.reason}</p>
            <a
              href={rec.amazonUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-secondary hover:bg-secondary/80 rounded-lg text-sm font-medium transition-colors"
            >
              Amazonで見る
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}
