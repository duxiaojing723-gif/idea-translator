'use client'

import { useRouter } from 'next/navigation'
import { InputPanel } from '@/components/landing/InputPanel'

export default function HomePage() {
  const router = useRouter()

  const handleStart = (input: string) => {
    // Store in sessionStorage to pass to workspace
    sessionStorage.setItem('initial_input', input)
    router.push('/workspace')
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 md:p-8">
      <InputPanel onStart={handleStart} />
    </main>
  )
}
