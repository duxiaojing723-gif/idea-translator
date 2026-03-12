import { createHash, randomBytes, createHmac } from 'crypto'
import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'

const AUTH_COOKIE_NAME = 'auth_token'
const AUTH_SECRET = process.env.AUTH_SECRET || 'idea-translator-dev-secret'

// --- Password Hashing ---

export function generateSalt(): string {
  return randomBytes(16).toString('hex')
}

export function hashPassword(password: string, salt: string): string {
  return createHash('sha256').update(password + salt).digest('hex')
}

export function verifyPassword(password: string, salt: string, hash: string): boolean {
  return hashPassword(password, salt) === hash
}

// --- Cookie Signing ---

function sign(value: string): string {
  const signature = createHmac('sha256', AUTH_SECRET).update(value).digest('hex')
  return `${value}.${signature}`
}

function unsign(signed: string): string | null {
  const lastDot = signed.lastIndexOf('.')
  if (lastDot === -1) return null
  const value = signed.substring(0, lastDot)
  const expected = sign(value)
  if (expected !== signed) return null
  return value
}

// --- Auth Cookie ---

export function createAuthCookieValue(userId: string, username: string): string {
  const payload = JSON.stringify({ userId, username, ts: Date.now() })
  const base64 = Buffer.from(payload).toString('base64')
  return sign(base64)
}

export function parseAuthCookie(cookieValue: string): { userId: string; username: string } | null {
  const base64 = unsign(cookieValue)
  if (!base64) return null
  try {
    const payload = JSON.parse(Buffer.from(base64, 'base64').toString('utf8'))
    if (!payload.userId || !payload.username) return null
    return { userId: payload.userId, username: payload.username }
  } catch {
    return null
  }
}

export function getAuthCookieName(): string {
  return AUTH_COOKIE_NAME
}

// --- Request Helpers ---

export function getUserFromRequest(req: NextRequest): { userId: string; username: string } | null {
  const cookie = req.cookies.get(AUTH_COOKIE_NAME)
  if (!cookie) return null
  return parseAuthCookie(cookie.value)
}

// --- DB Operations ---

export async function findUserByUsername(username: string) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('username', username)
    .single()

  if (error || !data) return null
  return data as { id: string; username: string; password_hash: string; salt: string }
}

export async function createUser(username: string, password: string) {
  const salt = generateSalt()
  const password_hash = hashPassword(password, salt)

  const { data, error } = await supabaseAdmin
    .from('users')
    .upsert({ username, password_hash, salt }, { onConflict: 'username' })
    .select()
    .single()

  if (error) throw error
  return data
}
