import { NextRequest, NextResponse } from 'next/server'
import {
  findUserByUsername,
  verifyPassword,
  createAuthCookieValue,
  getAuthCookieName,
} from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()

    if (!username || !password) {
      return NextResponse.json({ error: '请输入用户名和密码' }, { status: 400 })
    }

    const user = await findUserByUsername(username)
    if (!user) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 })
    }

    if (!verifyPassword(password, user.salt, user.password_hash)) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 })
    }

    const cookieValue = createAuthCookieValue(user.id, user.username)

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, username: user.username },
    })

    response.cookies.set(getAuthCookieName(), cookieValue, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
  } catch (error) {
    console.error('[auth/login]', error)
    return NextResponse.json({ error: '登录失败' }, { status: 500 })
  }
}
