/**
 * Серверный парсер файлов для Node.js окружения (без FileReader)
 */

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
    // PDF files - экспериментальная поддержка
    else if (fileType.includes('pdf') || fileName.endsWith('.pdf')) {
      console.log('Attempting PDF parsing...')
      try {
        // Проверка доступности pdf-parse
        const pdfParse = (await import('pdf-parse')).default
        if (!pdfParse) {
          throw new Error('pdf-parse module not available')
        }
        
        const arrayBuffer = await file.arrayBuffer()
        console.log('PDF arrayBuffer size:', arrayBuffer.byteLength)
        
        const buffer = Buffer.from(arrayBuffer)
        console.log('PDF buffer created, size:', buffer.length)
        
        const data = await pdfParse(buffer)
        text = data.text || ''
        console.log('PDF parsed successfully, text length:', text.length)
        
        if (!text.trim()) {
          throw new Error('Пустой текст из PDF')
        }
      } catch (pdfError) {
        console.error('PDF parsing failed:', pdfError)
        throw new Error(`PDF парсинг не работает на данном сервере. Пожалуйста, скопируйте текст из PDF и вставьте в текстовое поле резюме.`)
      }
    }
    // Word documents - экспериментальная поддержка
    else if (fileType.includes('msword') || 
             fileType.includes('wordprocessingml') ||
             fileName.endsWith('.doc') || 
             fileName.endsWith('.docx')) {
      console.log('Attempting Word parsing...')
      try {
        const mammoth = await import('mammoth')
        if (!mammoth) {
          throw new Error('mammoth module not available')
        }
        
        const arrayBuffer = await file.arrayBuffer()
        console.log('Word arrayBuffer size:', arrayBuffer.byteLength)
        
        const result = await mammoth.extractRawText({ arrayBuffer })
        text = result.value || ''
        console.log('Word parsed successfully, text length:', text.length)
        
        if (!text.trim()) {
          throw new Error('Пустой текст из Word')
        }
      } catch (wordError) {
        console.error('Word parsing failed:', wordError)
        throw new Error(`Word парсинг не работает на данном сервере. Пожалуйста, скопируйте текст из документа и вставьте в текстовое поле резюме.`)
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