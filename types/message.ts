export interface Message {
  role: 'user' | 'assistant'
  content: string
  round: number
  timestamp: string
}
