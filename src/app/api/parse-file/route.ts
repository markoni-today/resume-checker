import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { randomUUID } from 'crypto'

// Максимальный размер файла (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'Файл не найден' },
        { status: 400 }
      )
    }

    // Проверка размера файла
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `Файл слишком большой. Максимальный размер: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      )
    }

    const fileType = file.type.toLowerCase()
    const fileName = file.name.toLowerCase()
    
    try {
      let text: string = ''

      // Text files
      if (fileType.includes('text/plain') || fileName.endsWith('.txt')) {
        text = await file.text()
      }
      // PDF files  
      else if (fileType.includes('pdf') || fileName.endsWith('.pdf')) {
        const pdfParse = (await import('pdf-parse')).default
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const data = await pdfParse(buffer) as { text: string }
        text = data.text || ''
      }
      // Word documents
      else if (fileType.includes('msword') || 
               fileType.includes('wordprocessingml') ||
               fileName.endsWith('.doc') || 
               fileName.endsWith('.docx')) {
        const mammoth = await import('mammoth')
        const arrayBuffer = await file.arrayBuffer()
        const result = await mammoth.extractRawText({ arrayBuffer })
        text = result.value || ''
      }
      else {
        return NextResponse.json(
          { error: `Неподдерживаемый тип файла: ${fileType}` },
          { status: 400 }
        )
      }

      return NextResponse.json({ text })
      
    } catch (parseError) {
      console.error('File parsing error:', parseError)
      return NextResponse.json(
        { error: `Ошибка обработки файла: ${parseError instanceof Error ? parseError.message : 'Неизвестная ошибка'}` },
        { status: 400 }
      )
    }
    
  } catch (error) {
    console.error('Error in parse-file API:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { 
      message: 'File Parser API v1.0',
      supportedFormats: ['text/plain', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      maxFileSize: '5MB'
    },
    { status: 200 }
  )
}