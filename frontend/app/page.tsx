"use client"

import { ChatContainer } from '@/components/chat'

export default function HomePage() {
  return (
    <div className="flex flex-col h-screen bg-background">
      <main className="flex-1 overflow-hidden">
        <ChatContainer />
      </main>
    </div>
  )
}
