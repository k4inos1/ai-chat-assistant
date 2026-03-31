"use client"

import { useEffect, useRef, useState } from 'react'
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
  const [feedbackError, setFeedbackError] = useState<string | null>(null)
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
    if (!selectedAgentId) return
    if (agentInitializedRef.current) {
      clearMessages()
    }
    agentInitializedRef.current = true
  }, [selectedAgentId, clearMessages])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion)
  }

  const handleFeedback = async (messageIndex: number, rating: 'up' | 'down') => {
    if (!conversationId) {
      const errorMessage = 'La conversación aún no está lista para recibir feedback.'
      setFeedbackError(errorMessage)
      throw new Error(errorMessage)
    }

    setFeedbackError(null)
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
      const errorMessage = 'No se pudo enviar tu valoración. Intenta nuevamente.'
      setFeedbackError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <ChatHeader
        onClearChat={clearMessages}
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
      {feedbackError && (
        <div className="mx-auto mt-3 w-full max-w-4xl px-4 text-xs text-destructive">
          {feedbackError}
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
          />
        ) : (
          <div className="max-w-4xl mx-auto">
            {messages.map((message, index) => (
              <ChatMessage
                key={message.id}
                role={message.role}
                content={message.content}
                isStreaming={isLoading && index === messages.length - 1 && message.role === 'assistant'}
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
