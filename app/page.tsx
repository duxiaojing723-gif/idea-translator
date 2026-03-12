'use client'

import { useRouter } from 'next/navigation'
import { InputPanel } from '@/components/landing/InputPanel'
import { useAuth } from '@/hooks/useAuth'

export default function HomePage() {
  const router = useRouter()
  const { user, logout } = useAuth()

  const handleStart = (input: string) => {
    // Store in sessionStorage to pass to workspace
    sessionStorage.setItem('initial_input', input)
    router.push('/workspace')
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 md:p-8 relative">
      {user && (
        <div className="absolute top-4 right-4 flex items-center gap-3">
          <span className="text-sm text-slate-600">{user.username}</span>
          <button
            onClick={logout}
            className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            退出
          </button>
        </div>
      )}
      <InputPanel onStart={handleStart} />
    </main>
  )
}
