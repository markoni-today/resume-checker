'use client'

import React, { useState } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import FileUpload from '@/components/FileUpload'
import AnalysisReport from '@/components/AnalysisReport'
import { ATSAnalysisResult } from '@/lib/utils'

export default function HomePage() {
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [vacancyFile, setVacancyFile] = useState<File | null>(null)
  const [resumeText, setResumeText] = useState<string>('')
  const [vacancyText, setVacancyText] = useState<string>('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<ATSAnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleAnalyze = async () => {
    // Проверяем что есть данные для анализа
    const hasResumeData = resumeFile || resumeText.trim()
    const hasVacancyData = vacancyFile || vacancyText.trim()
    
    if (!hasResumeData || !hasVacancyData) {
      setError('Пожалуйста, добавьте резюме и вакансию (файлом или текстом)')
      return
    }

    setIsAnalyzing(true)
    setError(null)
    setAnalysisResult(null)

    try {
      if (resumeText.trim() && vacancyText.trim()) {
        // Анализ текста напрямую
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            resumeText: resumeText.trim(),
            vacancyText: vacancyText.trim(),
            type: 'text'
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Ошибка анализа')
        }

        const result = await response.json()
        setAnalysisResult(result)
      } else if (resumeFile && vacancyFile) {
        // Анализ файлов
        const formData = new FormData()
        formData.append('resume', resumeFile)
        formData.append('vacancy', vacancyFile)

        const response = await fetch('/api/analyze', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Ошибка анализа')
        }

        const result = await response.json()
        setAnalysisResult(result)
      } else {
        throw new Error('Используйте либо файлы, либо текст для обоих полей')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка при анализе')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const canAnalyze = (resumeFile || resumeText.trim()) && (vacancyFile || vacancyText.trim()) && !isAnalyzing

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Resume Checker 1.0 
          <span className="text-lg font-normal text-muted-foreground ml-2">(alpha)</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Проверьте совместимость вашего резюме с российскими ATS системами
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Загрузите резюме и описание вакансии в формате TXT для получения детального анализа
        </p>
        <p className="text-xs text-muted-foreground mt-1 opacity-75">
          PDF и DOCX форматы будут добавлены в следующих версиях
        </p>
      </div>

      {/* Upload Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <FileUpload
          label="Резюме"
          description="Загрузите файл резюме в формате TXT"
          onFileSelect={setResumeFile}
          selectedFile={resumeFile}
          onTextInput={setResumeText}
          textValue={resumeText}
        />
        
        <FileUpload
          label="Описание вакансии"
          description="Загрузите файл вакансии в формате TXT"
          onFileSelect={setVacancyFile}
          selectedFile={vacancyFile}
          onTextInput={setVacancyText}
          textValue={vacancyText}
        />
      </div>

      {/* Action Button */}
      <div className="text-center mb-8">
        <Button
          onClick={handleAnalyze}
          disabled={!canAnalyze}
          size="lg"
          className="px-8 py-3 text-lg"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Анализируем...
            </>
          ) : (
            <>
              <Search className="mr-2 h-5 w-5" />
              Проверить совместимость
            </>
          )}
        </Button>
        
        {!canAnalyze && !isAnalyzing && (
          <p className="text-sm text-muted-foreground mt-2">
            Добавьте резюме и вакансию (файлом или текстом) для начала анализа
          </p>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-destructive bg-destructive/5 mb-8">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-destructive">
              <Search className="h-4 w-4" />
              <span className="font-medium">Ошибка анализа</span>
            </div>
            <p className="text-destructive/80 mt-1">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Analysis Result */}
      {analysisResult && (
        <div className="space-y-6">
          <AnalysisReport result={analysisResult} />
        </div>
      )}

      {/* Info Section */}
      {!analysisResult && !isAnalyzing && (
        <div className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle>Как работает анализ?</CardTitle>
              <CardDescription>
                Наш алгоритм анализирует ваше резюме по критериям российских ATS систем
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4">
                  <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                    <span className="text-blue-600 font-bold">40%</span>
                  </div>
                  <h3 className="font-medium mb-1">Ключевые слова</h3>
                  <p className="text-sm text-muted-foreground">
                    Совпадение с требованиями вакансии
                  </p>
                </div>
                
                <div className="text-center p-4">
                  <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                    <span className="text-green-600 font-bold">30%</span>
                  </div>
                  <h3 className="font-medium mb-1">Структура</h3>
                  <p className="text-sm text-muted-foreground">
                    Стандартные разделы и форматирование
                  </p>
                </div>
                
                <div className="text-center p-4">
                  <div className="bg-yellow-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                    <span className="text-yellow-600 font-bold">15%</span>
                  </div>
                  <h3 className="font-medium mb-1">Контакты</h3>
                  <p className="text-sm text-muted-foreground">
                    Полнота контактных данных
                  </p>
                </div>
                
                <div className="text-center p-4">
                  <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                    <span className="text-purple-600 font-bold">15%</span>
                  </div>
                  <h3 className="font-medium mb-1">Опыт</h3>
                  <p className="text-sm text-muted-foreground">
                    Релевантность и детализация
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}