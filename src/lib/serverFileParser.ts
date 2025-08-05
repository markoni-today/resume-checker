/**
 * Серверный парсер файлов для Node.js окружения (без FileReader)
 * Использует pdfjs-dist для PDF и mammoth для Word
 */

import { parsePdfWithPdfjs, parseWordWithMammoth } from './pdfParser'

export async function parseFileOnServer(file: File): Promise<string> {
  const fileType = file.type.toLowerCase()
  const fileName = file.name.toLowerCase()
  
  console.log('Parsing file:', { name: file.name, type: file.type, size: file.size })
  
  try {
    let text: string = ''

    // Text files - основной поддерживаемый формат
    if (fileType.includes('text/plain') || fileName.endsWith('.txt')) {
      text = await file.text()
      console.log('TXT parsed successfully, length:', text.length)
    }
    // PDF files - используем pdfjs-dist для лучшей совместимости
    else if (fileType.includes('pdf') || fileName.endsWith('.pdf')) {
      console.log('Attempting PDF parsing with pdfjs-dist...')
      try {
        const arrayBuffer = await file.arrayBuffer()
        console.log('PDF arrayBuffer size:', arrayBuffer.byteLength)
        
        text = await parsePdfWithPdfjs(arrayBuffer)
        console.log('PDF parsed successfully with pdfjs, text length:', text.length)
        
        if (!text.trim()) {
          throw new Error('Пустой текст из PDF')
        }
      } catch (pdfError) {
        console.error('PDF parsing failed:', pdfError)
        throw new Error(`Ошибка обработки PDF: ${pdfError instanceof Error ? pdfError.message : 'Неизвестная ошибка'}`)
      }
    }
    // Word documents - используем mammoth с оптимизациями
    else if (fileType.includes('msword') || 
             fileType.includes('wordprocessingml') ||
             fileName.endsWith('.doc') || 
             fileName.endsWith('.docx')) {
      console.log('Attempting Word parsing with mammoth...')
      try {
        const arrayBuffer = await file.arrayBuffer()
        console.log('Word arrayBuffer size:', arrayBuffer.byteLength)
        
        text = await parseWordWithMammoth(arrayBuffer)
        console.log('Word parsed successfully with mammoth, text length:', text.length)
        
        if (!text.trim()) {
          throw new Error('Пустой текст из Word')
        }
      } catch (wordError) {
        console.error('Word parsing failed:', wordError)
        throw new Error(`Ошибка обработки Word: ${wordError instanceof Error ? wordError.message : 'Неизвестная ошибка'}`)
      }
    }
    else {
      throw new Error(`Неподдерживаемый тип файла: ${fileType}. Поддерживаемые форматы: TXT`)
    }

    if (!text || !text.trim()) {
      throw new Error('Файл пуст или не содержит читаемого текста')
    }

    return text.trim()

  } catch (error) {
    console.error('Server file parsing error:', error)
    throw error instanceof Error ? error : new Error('Неизвестная ошибка обработки файла')
  }
}