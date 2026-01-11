"use client"

import type React from "react"

import { LogOut, ChevronRight, Bell, Shield, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ProfileViewProps {
  onLogout: () => void
}

export function ProfileView({ onLogout }: ProfileViewProps) {
  const stats = {
    totalBooks: 23,
    readBooks: 18,
    unreadBooks: 5,
    genres: 6,
  }

  return (
    <div className="p-6 space-y-6">
      {/* Profile Header */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
          <span className="text-2xl font-bold">U</span>
        </div>
        <div>
          <h1 className="text-xl font-bold">ユーザー</h1>
          <p className="text-sm text-muted-foreground">user@example.com</p>
        </div>
      </div>

      {/* Reading Stats */}
      <div className="bg-card rounded-xl p-5 border border-border">
        <h2 className="text-sm font-medium text-muted-foreground mb-4">読書統計</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-2xl font-bold">{stats.totalBooks}</p>
            <p className="text-xs text-muted-foreground">総登録数</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.readBooks}</p>
            <p className="text-xs text-muted-foreground">読了</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.unreadBooks}</p>
            <p className="text-xs text-muted-foreground">積読</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.genres}</p>
            <p className="text-xs text-muted-foreground">ジャンル</p>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="bg-card rounded-xl border border-border divide-y divide-border">
        <SettingsItem icon={<Bell className="h-5 w-5" />} label="通知設定" />
        <SettingsItem icon={<Shield className="h-5 w-5" />} label="プライバシー" />
        <SettingsItem icon={<HelpCircle className="h-5 w-5" />} label="ヘルプ" />
      </div>

      {/* Logout */}
      <Button
        variant="ghost"
        className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
        onClick={onLogout}
      >
        <LogOut className="h-5 w-5 mr-3" />
        ログアウト
      </Button>
    </div>
  )
}

function SettingsItem({
  icon,
  label,
}: {
  icon: React.ReactNode
  label: string
}) {
  return (
    <button className="flex items-center justify-between w-full p-4 hover:bg-secondary/50 transition-colors">
      <div className="flex items-center gap-3">
        <span className="text-muted-foreground">{icon}</span>
        <span>{label}</span>
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground" />
    </button>
  )
}
