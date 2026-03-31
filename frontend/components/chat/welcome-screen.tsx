"use client"

import { Bot, Code, FileText, Languages, Lightbulb, Pencil, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WelcomeScreenProps {
  onSuggestionClick: (suggestion: string) => void
  agentName?: string
  agentDescription?: string
  demoMode?: boolean
}

const suggestions = [
  {
    icon: Code,
    title: "Ayuda con código",
    prompt: "Escribe código Python para ordenar una lista de números",
    color: "text-blue-500"
  },
  {
    icon: Pencil,
    title: "Escribir contenido",
    prompt: "Ayúdame a escribir un correo profesional",
    color: "text-green-500"
  },
  {
    icon: Lightbulb,
    title: "Ideas creativas",
    prompt: "Dame ideas para un proyecto de programación",
    color: "text-yellow-500"
  },
  {
    icon: FileText,
    title: "Resumir textos",
    prompt: "Resume este texto que te voy a compartir",
    color: "text-purple-500"
  },
  {
    icon: Languages,
    title: "Traducir",
    prompt: "Traduce este párrafo al inglés",
    color: "text-pink-500"
  },
  {
    icon: Zap,
    title: "Explicaciones",
    prompt: "Explícame cómo funciona la inteligencia artificial",
    color: "text-orange-500"
  }
]

export function WelcomeScreen({
  onSuggestionClick,
  agentName,
  agentDescription,
  demoMode,
}: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-full px-4 py-12">
      {/* Logo and Title */}
      <div className="flex flex-col items-center mb-12">
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Bot className="w-10 h-10 text-primary-foreground" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 border-4 border-background" />
        </div>
        
        <h1 className="text-3xl font-bold text-foreground mb-2 text-balance text-center">
          Bienvenido a NexusAI
        </h1>
        <p className="text-muted-foreground text-center max-w-md text-pretty">
          Tu asistente de IA inteligente. Pregúntame lo que quieras o elige una de las sugerencias.
        </p>
        {agentName && (
          <div className="mt-3 text-center">
            <p className="text-sm font-medium text-foreground">Agente: {agentName}</p>
            {agentDescription && (
              <p className="text-xs text-muted-foreground">{agentDescription}</p>
            )}
          </div>
        )}
        {demoMode && (
          <p className="mt-2 text-xs text-primary">Modo demo gratuito activado</p>
        )}
      </div>

      {/* Suggestions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full max-w-3xl">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSuggestionClick(suggestion.prompt)}
            className={cn(
              "flex items-start gap-3 p-4 rounded-xl text-left",
              "bg-card border border-border",
              "hover:bg-secondary/50 hover:border-primary/30",
              "transition-all duration-200",
              "group"
            )}
          >
            <suggestion.icon className={cn(
              "w-5 h-5 flex-shrink-0 mt-0.5",
              suggestion.color,
              "group-hover:scale-110 transition-transform"
            )} />
            <div>
              <p className="font-medium text-foreground text-sm">
                {suggestion.title}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                {suggestion.prompt}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Features */}
      <div className="flex flex-wrap justify-center gap-4 mt-12 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          Respuestas en tiempo real
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          Memoria de conversación
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          Múltiples idiomas
        </div>
      </div>
    </div>
  )
}
