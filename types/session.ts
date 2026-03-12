import { RequirementDraft } from './draft'
import { Message } from './message'

export type SessionStatus =
  | 'idle'
  | 'parsing_initial_input'
  | 'clarifying'
  | 'ready_to_finalize'
  | 'finalized'

export interface Progress {
  completed: number
  total: number
  current_focus: string
  missing_slots: string[]
}

export interface SessionState {
  id: string
  status: SessionStatus
  messages: Message[]
  draft: RequirementDraft
  askedQuestions: string[]
  round: number
  initialInput: string
  finalMarkdown?: string
  finalJson?: RequirementDraft
  isStreaming: boolean
  streamingContent: string
  progress: Progress
}

// API request/response types
export interface StartRequest {
  initial_input: string
}

export interface StartResponse {
  session_id: string
  status: 'clarifying' | 'ready_to_finalize'
  assistant_message: string
  draft: RequirementDraft
  next_questions: string[]
  asked_questions: string[]
  progress: Progress
}

export interface ReplyRequest {
  session_id: string
  answer: string
  current_draft: RequirementDraft
  asked_questions: string[]
  round: number
}

export interface ReplyResponse {
  status: 'clarifying' | 'ready_to_finalize'
  assistant_message: string
  draft: RequirementDraft
  next_questions: string[]
  asked_questions: string[]
  progress: Progress
}

export interface FinalizeRequest {
  session_id: string
  final_draft: RequirementDraft
  initial_input: string
}

export interface FinalizeResponse {
  status: 'finalized'
  markdown: string
  json: RequirementDraft
  clarity_score: number
  confidence: number
}
