import { NextRequest, NextResponse } from 'next/server'
import { SimpleATSAnalyzer } from '@/lib/analyzer'

export async function POST(request: NextRequest) {
  try {
    // Теперь работаем только с JSON (текстом)
    const body = await request.json()
    
    if (!body.resumeText || !body.vacancyText) {
      return NextResponse.json(
        { error: 'Необходимо предоставить текст резюме и вакансии' },
        { status: 400 }
      )
    }
    
    const resumeText = body.resumeText.trim()
    const vacancyText = body.vacancyText.trim()
    
    // Проверка на пустые тексты
    if (!resumeText.trim()) {
      return NextResponse.json(
        { error: 'Резюме пустое или не содержит текста' },
        { status: 400 }
      )
    }
    
    if (!vacancyText.trim()) {
      return NextResponse.json(
        { error: 'Вакансия пустая или не содержит текста' },
        { status: 400 }
      )
    }
    
    // Анализ резюме
    console.log('Starting analysis...', {
      resumeLength: resumeText.length,
      vacancyLength: vacancyText.length
    })
    
    const analyzer = new SimpleATSAnalyzer()
    const result = analyzer.analyzeResume(resumeText, vacancyText)
    
    console.log('Analysis completed:', {
      score: result.score,
      matchedKeywords: result.matchedKeywords.length
    })
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('Error in analyze API:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера. Попробуйте позже.' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { 
      message: 'Resume Checker API v1.0 (alpha)',
      supportedFormats: ['text/plain', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      supportedExtensions: ['.txt', '.pdf', '.doc', '.docx'],
      maxFileSize: '5MB',
      status: 'active'
    },
    { status: 200 }
  )
}
