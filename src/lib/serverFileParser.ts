/**
 * Серверный парсер файлов для Node.js окружения (без FileReader)
 */

export async function parseFileOnServer(file: File): Promise<string> {
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
      try {
        const pdfParse = (await import('pdf-parse')).default
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const data = await pdfParse(buffer) as { text: string }
        text = data.text || ''
      } catch (pdfError) {
        throw new Error('PDF парсер недоступен. Попробуйте преобразовать файл в TXT формат.')
      }
    }
    // Word documents
    else if (fileType.includes('msword') || 
             fileType.includes('wordprocessingml') ||
             fileName.endsWith('.doc') || 
             fileName.endsWith('.docx')) {
      try {
        const mammoth = await import('mammoth')
        const arrayBuffer = await file.arrayBuffer()
        const result = await mammoth.extractRawText({ arrayBuffer })
        text = result.value || ''
      } catch (wordError) {
        throw new Error('Word парсер недоступен. Попробуйте преобразовать файл в TXT формат.')
      }
    }
    else {
      throw new Error(`Неподдерживаемый тип файла: ${fileType}`)
    }

    return text

  } catch (error) {
    console.error('Server file parsing error:', error)
    throw new Error(`Ошибка обработки файла: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
  }
}