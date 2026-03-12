import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
// Server-side client uses service role key (bypasses RLS) if available, else falls back to anon key
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey

// Client-side Supabase client (uses anon key, respects RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side Supabase client (uses service role key, bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export interface SavedRequirement {
  id: string
  created_at: string
  idea_summary: string
  target_user: string
  scenario: string
  core_problem: string
  desired_outcome: string
  mvp_must_have: string[]
  clarity_score: number
  markdown: string
  full_json: Record<string, unknown>
}
