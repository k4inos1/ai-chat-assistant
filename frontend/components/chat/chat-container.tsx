"use client"

import { useCallback, useEffect, useRef, useState } from 'react'
import { useChat } from '@/hooks/use-chat'
import { ChatMessage } from './chat-message'
import { ChatInput } from './chat-input'
import { WelcomeScreen } from './welcome-screen'
import { ChatHeader } from './chat-header'
import type { AgentSummary, AgentsResponse } from '@/types/agent'
import type { SuggestionsResponse } from '@/types/suggestion'
import { apiUrl } from '@/lib/api'

const RATING_POSITIVE = 5
const RATING_NEGATIVE = 1

export function ChatContainer() {
  const [agents, setAgents] = useState<AgentSummary[]>([])
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)
  const [demoMode, setDemoMode] = useState(false)
  const [agentError, setAgentError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const agentInitializedRef = useRef(false)

  const { messages, isLoading, sendMessage, stopGeneration, clearMessages, conversationId } = useChat({
    onError: (error) => {
      console.error('Chat error:', error)
    },
    agentId: selectedAgentId,
  })

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const selectedAgent =
    agents.find(agent => agent.id === selectedAgentId) ?? agents[0]

  useEffect(() => {
    let isActive = true

    const loadAgents = async () => {
      try {
        const response = await fetch(apiUrl('/agents'))
        if (!response.ok) {
          throw new Error('No se pudieron cargar los agentes')
        }

        const data: AgentsResponse = await response.json()
        if (!isActive) return

        setAgents(data.agents)
        setDemoMode(data.demo_mode)
        setSelectedAgentId((current) => current ?? data.default_agent_id ?? data.agents[0]?.id ?? null)
      } catch (error) {
        if (!isActive) return
        setAgentError(error instanceof Error ? error.message : 'Error al cargar agentes')
      }
    }

    loadAgents()

    return () => {
      isActive = false
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    const loadSuggestions = async () => {
      try {
        const response = await fetch(apiUrl('/suggestions'), {
          signal: controller.signal,
        })
        if (!response.ok) {
          throw new Error(`No se pudieron cargar las sugerencias (${response.status})`)
        }
        const data: SuggestionsResponse = await response.json()
        if (Array.isArray(data.suggestions)) {
          const sanitizedSuggestions = data.suggestions.filter((item) => typeof item === 'string')
          setSuggestions(sanitizedSuggestions)
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
        console.warn('Error al cargar sugerencias:', error)
      }
    }

    loadSuggestions()

    return () => {
      controller.abort()
    }
  }, [])

  const handleClearChat = useCallback(async () => {
    const currentConversationId = conversationId
    clearMessages()
    if (currentConversationId) {
      try {
        const response = await fetch(apiUrl(`/conversations/${encodeURIComponent(currentConversationId)}`), {
          method: 'DELETE',
        })
        if (!response.ok) {
          throw new Error(`No se pudo borrar la conversación (${response.status})`)
        }
      } catch (error) {
        console.warn('Error al borrar la conversación:', error)
      }
    }
  }, [conversationId, clearMessages])

  const handleFeedback = useCallback(
    async (messageIndex: number, rating: 'up' | 'down') => {
      if (!conversationId) return
      try {
        const response = await fetch(apiUrl('/feedback'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            conversation_id: conversationId,
            message_index: messageIndex,
            rating: rating === 'up' ? RATING_POSITIVE : RATING_NEGATIVE,
          }),
        })

        if (!response.ok) {
          throw new Error(`No se pudo enviar la valoración (${response.status})`)
        }
      } catch (error) {
        console.warn('Error al enviar valoración:', error)
      }
    },
    [conversationId]
  )

  useEffect(() => {
    if (!selectedAgentId) return
    if (agentInitializedRef.current) {
      handleClearChat()
    }
    agentInitializedRef.current = true
  }, [selectedAgentId, handleClearChat])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion)
  }

  return (
    <div className="flex flex-col h-full">
      <ChatHeader
        onClearChat={handleClearChat}
        agents={agents}
        selectedAgentId={selectedAgentId}
        onAgentChange={setSelectedAgentId}
        demoMode={demoMode}
      />

      {agentError && (
        <div className="mx-auto mt-3 w-full max-w-4xl px-4 text-xs text-destructive">
          {agentError}
        </div>
      )}
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <WelcomeScreen
            onSuggestionClick={handleSuggestionClick}
            agentName={selectedAgent?.name}
            agentDescription={selectedAgent?.description}
            demoMode={demoMode}
            suggestions={suggestions}
          />
        ) : (
          <div className="max-w-4xl mx-auto">
            {messages.map((message, index) => (
              <ChatMessage
                key={message.id}
                role={message.role}
                content={message.content}
                isStreaming={isLoading && index === messages.length - 1 && message.role === 'assistant'}
                assistantName={selectedAgent?.name}
                feedbackDisabled={!conversationId}
                onFeedback={
                  message.role === 'assistant'
                    ? (rating) => handleFeedback(index, rating)
                    : undefined
                }
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t bg-background/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto p-4">
          <ChatInput
            onSend={sendMessage}
            onStop={stopGeneration}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  )
}
