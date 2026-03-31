"use client"

import { Bot, Moon, Sun, Trash2 } from 'lucide-react'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'
import type { AgentSummary } from '@/types/agent'

interface ChatHeaderProps {
  onClearChat?: () => void
  agents?: AgentSummary[]
  selectedAgentId?: string | null
  onAgentChange?: (agentId: string) => void
  demoMode?: boolean
}

export function ChatHeader({
  onClearChat,
  agents,
  selectedAgentId,
  onAgentChange,
  demoMode,
}: ChatHeaderProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const selectedAgent =
    agents?.find(agent => agent.id === selectedAgentId) ?? agents?.[0]
  const selectedAgentValue = selectedAgent?.id ?? ''

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
            {agents && agents.length > 0 && onAgentChange && (
              <div className="flex items-center gap-2">
                <label className="hidden sm:block text-xs text-muted-foreground">Agente</label>
                <select
                  className={cn(
                    "rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-primary/30"
                  )}
                  value={selectedAgentValue}
                  onChange={(event) => onAgentChange(event.target.value)}
                  title={selectedAgent?.description}
                >
                  {agents.map(agent => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name}
                    </option>
                  ))}
                </select>
                {demoMode && (
                  <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] text-primary">
                    Demo gratis
                  </span>
                )}
              </div>
            )}
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
