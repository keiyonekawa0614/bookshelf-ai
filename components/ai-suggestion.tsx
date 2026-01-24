"use client"

import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AISuggestionProps {
  booksCount: number
  unreadCount: number
  onAskQuestion: (question: string) => void
}

export function AISuggestion({ booksCount, unreadCount, onAskQuestion }: AISuggestionProps) {
  return (
    <div className="bg-card rounded-xl p-5 border border-border">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-accent" />
        <p className="text-sm font-medium">AIに質問してみよう</p>
      </div>

      {booksCount === 0 ? (
        <p className="text-sm text-muted-foreground leading-relaxed">
          本を登録すると、AIがおすすめの本を提案します。写真をアップロードして始めましょう。
        </p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-4">
            {unreadCount > 0
              ? `積読が${unreadCount}冊あります。何を読むか迷ったら聞いてください。`
              : "読書についてなんでも聞いてください。"}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="bg-transparent text-xs"
              onClick={() => onAskQuestion("今日読むべき本は？")}
            >
              今日読むべき本は？
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-transparent text-xs"
              onClick={() => onAskQuestion("最近登録した本は？")}
            >
              最近登録した本は？
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-transparent text-xs"
              onClick={() => onAskQuestion("積読になっている本は？")}
            >
              積読になっている本は？
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
