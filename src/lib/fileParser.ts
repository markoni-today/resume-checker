/**
 * Парсер файлов для браузера (без Python зависимостей)
 * Упрощенная версия для Vercel deployment
 */

export class BrowserFileParser {
  private maxFileSize = 5 * 1024 * 1024 // 5MB

  async parseFile(file: File): Promise<string> {
    // Проверка размера файла
    if (file.size > this.maxFileSize) {
      throw new Error(`Файл слишком большой. Максимальный размер: ${this.maxFileSize / 1024 / 1024}MB`)
    }

    const fileType = this.detectFileType(file)
    
    switch (fileType) {
      case 'txt':
        return await this.parseTxt(file)
      case 'pdf':
        return await this.parsePdf(file)
      case 'docx':
        return await this.parseDocx(file)
      default:
        throw new Error(`Неподдерживаемый тип файла: ${file.type}`)
    }
  }

  private detectFileType(file: File): string {
    const supportedTypes: Record<string, string> = {
      'text/plain': 'txt',
      'application/pdf': 'pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'application/msword': 'doc'
    }

    if (supportedTypes[file.type]) {
      return supportedTypes[file.type]
    }

    // Проверка по расширению файла
    const extension = file.name.split('.').pop()?.toLowerCase()
    const extensionMap: Record<string, string> = {
      'txt': 'txt',
      'pdf': 'pdf',
      'docx': 'docx',
      'doc': 'doc'
    }

    if (extension && extensionMap[extension]) {
      return extensionMap[extension]
    }

    throw new Error(`Неподдерживаемый формат файла: ${file.name}`)
  }

  private async parseTxt(file: File): Promise<string> {
    const text = await file.text()
    return text
  }

  private async parsePdf(file: File): Promise<string> {
    // Для MVP возвращаем сообщение о необходимости конвертации
    // В production можно использовать pdf-parse или PDF.js
    throw new Error('PDF файлы пока не поддерживаются в браузерной версии. Пожалуйста, конвертируйте в TXT или DOCX.')
  }

  private async parseDocx(file: File): Promise<string> {
    // Для MVP возвращаем сообщение о необходимости конвертации
    // В production можно использовать mammoth.js или docx-preview
    throw new Error('DOCX файлы пока не поддерживаются в браузерной версии. Пожалуйста, конвертируйте в TXT.')
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
}