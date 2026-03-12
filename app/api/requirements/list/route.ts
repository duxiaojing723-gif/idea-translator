import { NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase/client'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('requirements')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error) {
    console.error('[requirements/list]', error)
    return NextResponse.json({ error: '获取失败' }, { status: 500 })
  }
}
