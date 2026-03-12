import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.WHISPER_API_KEY || process.env.OPENAI_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const audioFile = formData.get('audio') as File | null

    if (!audioFile) {
      return NextResponse.json({ error: '没有收到音频文件' }, { status: 400 })
    }

    // Check file size (Whisper limit is 25MB)
    if (audioFile.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: '音频文件过大' }, { status: 400 })
    }

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'zh',
    })

    return NextResponse.json({ text: transcription.text })
  } catch (error) {
    console.error('[transcribe]', error)
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: '识别失败，请重试', detail: msg }, { status: 500 })
  }
}
