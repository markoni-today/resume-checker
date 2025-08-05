/**
 * Серверный парсер файлов для Node.js окружения (без FileReader)
 * Использует упрощенные парсеры для serverless совместимости
 */

import { parseFileSimple } from './simpleParsers'

export async function parseFileOnServer(file: File): Promise<string> {
  console.log('Parsing file on server:', { name: file.name, type: file.type, size: file.size })
  
  try {
    // Используем упрощенные парсеры для serverless совместимости
    const text = await parseFileSimple(file)
    
    console.log('File parsed successfully, text length:', text.length)
    return text
    
  } catch (error) {
    console.error('Server file parsing error:', error)
    throw error instanceof Error ? error : new Error('Неизвестная ошибка обработки файла')
  }
}