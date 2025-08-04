import { NextRequest, NextResponse } from 'next/server'
import { SimpleATSAnalyzer } from '@/lib/analyzer'
import { UniversalFileParser } from '@/lib/fileParser'

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
      // Обработка FormData (смешанный ввод: файл резюме + текст вакансии)
      const formData = await request.formData()
      const resumeFile = formData.get('resume') as File
      const vacancyTextFromForm = formData.get('vacancyText') as string
      
      // Валидация: нужно либо файл резюме, либо текст резюме
      if (!resumeFile) {
        return NextResponse.json(
          { error: 'Необходимо загрузить файл резюме' },
          { status: 400 }
        )
      }

      // Валидация: нужен текст вакансии
      if (!vacancyTextFromForm || !vacancyTextFromForm.trim()) {
        return NextResponse.json(
          { error: 'Необходимо указать текст вакансии' },
          { status: 400 }
        )
      }
    
      // Проверка размера файла резюме
      if (resumeFile.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `Файл резюме слишком большой. Максимальный размер: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
          { status: 400 }
        )
      }
      
      // Проверка типа файла резюме (поддерживаем TXT, PDF, DOC, DOCX)
      const allowedTypes = [
        'text/plain',
        'application/pdf', 
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]
      
      const allowedExtensions = ['.txt', '.pdf', '.doc', '.docx']
      
      const isResumeValid = allowedTypes.includes(resumeFile.type) || 
        allowedExtensions.some(ext => resumeFile.name.toLowerCase().endsWith(ext))
      
      if (!isResumeValid) {
        return NextResponse.json(
          { error: 'Поддерживаемые форматы файлов резюме: TXT, PDF, DOC, DOCX' },
          { status: 400 }
        )
      }
      
      // Парсинг файла резюме
      const parser = new UniversalFileParser()
      
      try {
        resumeText = await parser.parseFile(resumeFile)
        vacancyText = vacancyTextFromForm.trim()
        
      } catch (parseError) {
        console.error('File parsing error:', parseError)
        return NextResponse.json(
          { error: parseError instanceof Error ? parseError.message : 'Ошибка при обработке файла резюме' },
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
      supportedFormats: ['text/plain', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      supportedExtensions: ['.txt', '.pdf', '.doc', '.docx'],
      maxFileSize: '5MB',
      status: 'active'
    },
    { status: 200 }
  )
}
