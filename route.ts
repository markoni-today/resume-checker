import { NextRequest, NextResponse } from 'next/server'
import { SimpleATSAnalyzer } from '@/lib/analyzer'
import { BrowserFileParser } from '@/lib/fileParser'

// Максимальный размер файла (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type')
    
    let resumeText: string
    let vacancyText: string
    
    if (contentType?.includes('application/json')) {
      // Обработка JSON (текстовый ввод)
      const body = await request.json()
      
      if (!body.resumeText || !body.vacancyText) {
        return NextResponse.json(
          { error: 'Необходимо предоставить текст резюме и вакансии' },
          { status: 400 }
        )
      }
      
      resumeText = body.resumeText.trim()
      vacancyText = body.vacancyText.trim()
      
    } else {
      // Обработка FormData (файлы)
      const formData = await request.formData()
      const resumeFile = formData.get('resume') as File
      const vacancyFile = formData.get('vacancy') as File
      
      // Валидация файлов
      if (!resumeFile || !vacancyFile) {
        return NextResponse.json(
          { error: 'Необходимо загрузить оба файла' },
          { status: 400 }
        )
      }
    
      // Проверка размеров файлов
      if (resumeFile.size > MAX_FILE_SIZE || vacancyFile.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `Файл слишком большой. Максимальный размер: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
          { status: 400 }
        )
      }
      
      // Проверка типов файлов (пока поддерживаем только TXT для Vercel)
      const allowedTypes = ['text/plain']
      
      if (!allowedTypes.includes(resumeFile.type) || !allowedTypes.includes(vacancyFile.type)) {
        return NextResponse.json(
          { error: 'В данной версии поддерживаются только TXT файлы. PDF и DOCX будут добавлены в следующих версиях.' },
          { status: 400 }
        )
      }
      
      // Парсинг файлов
      const parser = new BrowserFileParser()
      
      try {
        resumeText = await parser.parseFile(resumeFile)
        vacancyText = await parser.parseFile(vacancyFile)
        
      } catch (parseError) {
        console.error('File parsing error:', parseError)
        return NextResponse.json(
          { error: parseError instanceof Error ? parseError.message : 'Ошибка при обработке файлов' },
          { status: 400 }
        )
      }
    }
    
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
      supportedFormats: ['text/plain'],
      maxFileSize: '5MB',
      status: 'active'
    },
    { status: 200 }
  )
}