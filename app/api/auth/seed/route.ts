import { NextResponse } from 'next/server'
import { createUser } from '@/lib/auth'

// POST /api/auth/seed — 初始化种子用户（幂等操作）
export async function POST() {
  try {
    const seedUsers = [
      { username: 'user1', password: '888888' },
      { username: 'user2', password: '88888' },
      { username: 'user3', password: '888888' },
    ]

    const results = []
    for (const { username, password } of seedUsers) {
      const user = await createUser(username, password)
      results.push({ username: user.username, id: user.id })
    }

    return NextResponse.json({ success: true, users: results })
  } catch (error) {
    console.error('[auth/seed]', error)
    return NextResponse.json({ error: '种子用户创建失败' }, { status: 500 })
  }
}
