"use client"

import { cn } from '@/lib/utils'
import { Bot, User, Copy, Check, ThumbsUp, ThumbsDown } from 'lucide-react'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'

interface ChatMessageProps {
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
  assistantName?: string
  feedbackDisabled?: boolean
  onFeedback?: (rating: 'up' | 'down') => Promise<void> | void
}

export function ChatMessage({
  role,
  content,
  isStreaming,
  assistantName = 'Asistente',
  feedbackDisabled = false,
  onFeedback,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false)
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null)
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false)

  const isUser = role === 'user'
  const isFeedbackDisabled = feedbackDisabled || !onFeedback

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleFeedback = async (rating: 'up' | 'down') => {
    if (isSubmittingFeedback || isFeedbackDisabled) return

    const nextFeedback = feedback === rating ? null : rating
    setFeedback(nextFeedback)

    if (!onFeedback || !nextFeedback) return

    setIsSubmittingFeedback(true)
    try {
      await onFeedback(nextFeedback)
    } catch (error) {
      console.error('Error sending feedback:', error)
      setFeedback(null)
    } finally {
      setIsSubmittingFeedback(false)
    }
  }

  return (
    <div
      className={cn(
        "flex gap-4 px-4 py-6 group",
        isUser ? "bg-transparent" : "bg-secondary/30"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
          isUser 
            ? "bg-primary text-primary-foreground" 
            : "bg-gradient-to-br from-primary/80 to-accent text-primary-foreground"
        )}
      >
        {isUser ? (
          <User className="w-4 h-4" />
        ) : (
          <Bot className="w-4 h-4" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">
            {isUser ? 'Tú' : assistantName}
          </span>
        </div>

        <div className={cn(
          "prose prose-sm dark:prose-invert max-w-none",
          "prose-p:leading-relaxed prose-pre:bg-card prose-pre:border prose-pre:border-border",
          "prose-code:text-primary prose-code:bg-secondary prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none"
        )}>
          {content ? (
            <ReactMarkdown
              components={{
                pre: ({ children }) => (
                  <pre className="overflow-x-auto rounded-lg bg-card border border-border p-4 my-3">
                    {children}
                  </pre>
                ),
                code: ({ className, children, ...props }) => {
                  const isInline = !className
                  if (isInline) {
                    return (
                      <code className="text-primary bg-secondary px-1.5 py-0.5 rounded text-sm" {...props}>
                        {children}
                      </code>
                    )
                  }
                  return (
                    <code className={cn("text-sm", className)} {...props}>
                      {children}
                    </code>
                  )
                },
              }}
            >
              {content}
            </ReactMarkdown>
          ) : isStreaming ? (
            <div className="flex items-center gap-1">
              <div className="typing-dot w-2 h-2 bg-primary rounded-full" />
              <div className="typing-dot w-2 h-2 bg-primary rounded-full" />
              <div className="typing-dot w-2 h-2 bg-primary rounded-full" />
            </div>
          ) : null}
        </div>

        {/* Actions */}
        {!isUser && content && !isStreaming && (
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={copyToClipboard}
              className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              title="Copiar respuesta"
            >
              {copied ? (
                <Check className="w-4 h-4 text-primary" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={() => handleFeedback('up')}
              disabled={isSubmittingFeedback || isFeedbackDisabled}
              className={cn(
                "p-1.5 rounded-md hover:bg-secondary transition-colors",
                feedback === 'up' 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground",
                isFeedbackDisabled && "cursor-not-allowed opacity-60"
              )}
              title="Buena respuesta"
            >
              <ThumbsUp className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleFeedback('down')}
              disabled={isSubmittingFeedback || isFeedbackDisabled}
              className={cn(
                "p-1.5 rounded-md hover:bg-secondary transition-colors",
                feedback === 'down' 
                  ? "text-destructive" 
                  : "text-muted-foreground hover:text-foreground",
                isFeedbackDisabled && "cursor-not-allowed opacity-60"
              )}
              title="Mala respuesta"
            >
              <ThumbsDown className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
