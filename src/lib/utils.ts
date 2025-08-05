import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Утилиты для работы с файлами
export const ALLOWED_FILE_TYPES = {
  'text/plain': ['.txt'],
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
}

export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export function validateFile(file: File): { valid: boolean; error?: string } {
  // Проверка размера
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `Файл слишком большой. Максимальный размер: ${MAX_FILE_SIZE / 1024 / 1024}MB`
    }
  }

  // Проверка типа файла
  const allowedTypes = Object.keys(ALLOWED_FILE_TYPES)
  const allowedExtensions = ['.txt', '.pdf', '.doc', '.docx']
  
  const isValidType = allowedTypes.includes(file.type)
  const isValidExtension = allowedExtensions.some(ext => 
    file.name.toLowerCase().endsWith(ext)
  )
  
  if (!isValidType && !isValidExtension) {
    return {
      valid: false,
      error: 'Поддерживаемые форматы файлов: TXT, PDF, DOC, DOCX'
    }
  }

  return { valid: true }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Утилиты для анализа ATS
export interface ATSAnalysisResult {
  score: number
  breakdown: {
    keywords: number
    structure: number
    contacts: number
    experience: number
  }
  recommendations: Recommendation[]
  parsedResume: ParsedResume
  matchedKeywords: string[]
  missingKeywords: string[]
}

export interface Recommendation {
  type: 'critical' | 'warning' | 'improvement'
  title: string
  description: string
  example?: string
}

export interface ParsedResume {
  name?: string
  email?: string
  phone?: string
  position?: string
  skills: string[]
  experience: string
  education: string
  sections: string[]
}