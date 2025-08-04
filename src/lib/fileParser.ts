/**
 * Парсер файлов для браузера с поддержкой PDF, DOC, DOCX, TXT
 */

// Import types only, actual imports will be done dynamically
type MammothResult = { value: string }
type PdfParseResult = { text: string }

export interface BrowserFileParser {
  parseFile(file: File): Promise<string>
}

export class UniversalFileParser implements BrowserFileParser {
  private maxFileSize = 5 * 1024 * 1024 // 5MB

  async parseFile(file: File): Promise<string> {
    // Проверка размера файла
    if (file.size > this.maxFileSize) {
      throw new Error(`Файл слишком большой. Максимальный размер: ${this.maxFileSize / 1024 / 1024}MB`)
    }

    const fileType = file.type.toLowerCase()
    const fileName = file.name.toLowerCase()
    
    try {
      // Text files
      if (fileType.includes('text/plain') || fileName.endsWith('.txt')) {
        return this.parseTextFile(file)
      }
      
      // PDF files  
      if (fileType.includes('pdf') || fileName.endsWith('.pdf')) {
        return this.parsePdfFile(file)
      }
      
      // Word documents
      if (fileType.includes('msword') || 
          fileType.includes('wordprocessingml') ||
          fileName.endsWith('.doc') || 
          fileName.endsWith('.docx')) {
        return this.parseWordFile(file)
      }
      
      throw new Error(`Неподдерживаемый тип файла: ${fileType}`)
    } catch (error) {
      console.error('Error parsing file:', error)
      throw new Error(`Ошибка обработки файла: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
    }
  }
  
  private async parseTextFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        resolve(text || '')
      }
      reader.onerror = () => reject(new Error('Ошибка чтения текстового файла'))
      reader.readAsText(file)
    })
  }
  
  private async parsePdfFile(file: File): Promise<string> {
    try {
      const pdfParse = (await import('pdf-parse')).default
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = async (e) => {
          try {
            const arrayBuffer = e.target?.result as ArrayBuffer
            if (!arrayBuffer) {
              reject(new Error('Не удалось прочитать PDF файл'))
              return
            }
            
            const buffer = new Uint8Array(arrayBuffer)
            const data: PdfParseResult = await pdfParse(buffer)
            resolve(data.text || '')
          } catch (error) {
            reject(new Error(`Ошибка обработки PDF: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`))
          }
        }
        reader.onerror = () => reject(new Error('Ошибка чтения PDF файла'))
        reader.readAsArrayBuffer(file)
      })
    } catch (importError) {
      throw new Error('PDF парсер недоступен. Попробуйте преобразовать файл в TXT формат.')
    }
  }
  
  private async parseWordFile(file: File): Promise<string> {
    try {
      const mammoth = await import('mammoth')
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = async (e) => {
          try {
            const arrayBuffer = e.target?.result as ArrayBuffer
            if (!arrayBuffer) {
              reject(new Error('Не удалось прочитать Word файл'))
              return
            }
            
            const result: MammothResult = await mammoth.extractRawText({ arrayBuffer })
            resolve(result.value || '')
          } catch (error) {
            reject(new Error(`Ошибка обработки Word документа: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`))
          }
        }
        reader.onerror = () => reject(new Error('Ошибка чтения Word файла'))
        reader.readAsArrayBuffer(file)
      })
    } catch (importError) {
      throw new Error('Word парсер недоступен. Попробуйте преобразовать файл в TXT формат.')
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
}

export const parseFile = async (file: File): Promise<string> => {
  const parser = new UniversalFileParser()
  return parser.parseFile(file)
}