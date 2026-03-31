"use client"

import { useCallback, useEffect, useRef, useState } from 'react'
import { useChat } from '@/hooks/use-chat'
import { ChatMessage } from './chat-message'
import { ChatInput } from './chat-input'
import { WelcomeScreen } from './welcome-screen'
import { ChatHeader } from './chat-header'
import type { AgentSummary, AgentsResponse } from '@/types/agent'
import { apiUrl } from '@/lib/api'

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
    let isActive = true

    const loadSuggestions = async () => {
      try {
        const response = await fetch(apiUrl('/suggestions'))
        if (!response.ok) {
          throw new Error('No se pudieron cargar las sugerencias')
        }
        const data = await response.json()
        if (!isActive) return
        if (Array.isArray(data.suggestions)) {
          setSuggestions(data.suggestions.filter((item: unknown) => typeof item === 'string'))
        }
      } catch (error) {
        if (!isActive) return
        console.warn('Suggestion load error:', error)
      }
    }

    loadSuggestions()

    return () => {
      isActive = false
    }
  }, [])

  const handleClearChat = useCallback(async () => {
    if (conversationId) {
      try {
        await fetch(apiUrl(`/conversations/${encodeURIComponent(conversationId)}`), {
          method: 'DELETE',
        })
      } catch (error) {
        console.warn('Failed to delete conversation:', error)
      }
    }
    clearMessages()
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
            rating: rating === 'up' ? 5 : 1,
          }),
        })

        if (!response.ok) {
          throw new Error('No se pudo enviar la valoración')
        }
      } catch (error) {
        console.warn('Feedback error:', error)
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
