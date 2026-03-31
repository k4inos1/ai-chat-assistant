export interface AgentSummary {
  id: string
  name: string
  description: string
}

export interface AgentsResponse {
  default_agent_id: string
  demo_mode: boolean
  agents: AgentSummary[]
}
