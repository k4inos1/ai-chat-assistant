"use client"

import { ChatContainer } from '@/components/chat'
import { ChatHeader } from '@/components/chat'
import { useChat } from '@/hooks/use-chat'

export default function HomePage() {
  return (
    <div className="flex flex-col h-screen bg-background">
      <ChatHeader />
      <main className="flex-1 overflow-hidden">
        <ChatContainer />
      </main>
    </div>
  )
}
