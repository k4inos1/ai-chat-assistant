"use client"

import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { cn } from '@/lib/utils'
import { Send, Square, Sparkles } from 'lucide-react'

interface ChatInputProps {
  onSend: (message: string) => void
  onStop?: () => void
  isLoading?: boolean
  placeholder?: string
}

export function ChatInput({ 
  onSend, 
  onStop,
  isLoading = false, 
  placeholder = "Escribe tu mensaje..." 
}: ChatInputProps) {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [input])

  const handleSubmit = () => {
    if (input.trim() && !isLoading) {
      onSend(input.trim())
      setInput('')
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="relative">
      <div className={cn(
        "flex items-end gap-2 p-3 rounded-2xl border bg-card",
        "focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50",
        "transition-all duration-200"
      )}>
        <Sparkles className="w-5 h-5 text-primary mb-2.5 flex-shrink-0" />
        
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading}
          rows={1}
          className={cn(
            "flex-1 resize-none bg-transparent border-0 outline-none",
            "text-foreground placeholder:text-muted-foreground",
            "min-h-[24px] max-h-[200px] py-2",
            "disabled:opacity-50"
          )}
        />

        {isLoading ? (
          <button
            onClick={onStop}
            className={cn(
              "flex-shrink-0 p-2.5 rounded-xl",
              "bg-destructive text-destructive-foreground",
              "hover:bg-destructive/90 transition-colors"
            )}
            title="Detener generación"
          >
            <Square className="w-4 h-4 fill-current" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!input.trim()}
            className={cn(
              "flex-shrink-0 p-2.5 rounded-xl transition-all duration-200",
              input.trim()
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-secondary text-muted-foreground cursor-not-allowed"
            )}
            title="Enviar mensaje"
          >
            <Send className="w-4 h-4" />
          </button>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center mt-2">
        NexusAI puede cometer errores. Verifica la información importante.
      </p>
    </div>
  )
}
