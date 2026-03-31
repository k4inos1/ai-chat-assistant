"use client"

import { Bot, Moon, Sun, Trash2, Menu } from 'lucide-react'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'

interface ChatHeaderProps {
  onClearChat?: () => void
}

export function ChatHeader({ onClearChat }: ChatHeaderProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
      <div className="flex items-center justify-between h-14 px-4 max-w-7xl mx-auto">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Bot className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">NexusAI</h1>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {onClearChat && (
            <button
              onClick={onClearChat}
              className={cn(
                "p-2 rounded-lg",
                "text-muted-foreground hover:text-foreground",
                "hover:bg-secondary transition-colors"
              )}
              title="Nueva conversación"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
          
          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={cn(
                "p-2 rounded-lg",
                "text-muted-foreground hover:text-foreground",
                "hover:bg-secondary transition-colors"
              )}
              title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
