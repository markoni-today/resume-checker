'use client'

import React, { useState } from 'react'
import { Search, Loader2, FileText, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import FileUpload from '@/components/FileUpload'
import AnalysisReport from '@/components/AnalysisReport'
import { ATSAnalysisResult } from '@/lib/utils'

export default function HomePage() {
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [resumeText, setResumeText] = useState<string>('')
  const [vacancyText, setVacancyText] = useState<string>('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<ATSAnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleAnalyze = async () => {
    // Проверяем что есть данные для анализа
    const hasResumeData = resumeFile || resumeText.trim()
    const hasVacancyData = vacancyText.trim()
    
    if (!hasResumeData || !hasVacancyData) {
      setError('Пожалуйста, добавьте резюме (файлом или текстом) и описание вакансии')
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
      } else if (resumeFile && vacancyText.trim()) {
        // Анализ файла резюме + текста вакансии
        const formData = new FormData()
        formData.append('resume', resumeFile)
        formData.append('vacancyText', vacancyText.trim())

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
        throw new Error('Необходимо указать резюме (файлом или текстом) и вакансию (текстом)')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка при анализе')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const canAnalyze = (resumeFile || resumeText.trim()) && vacancyText.trim() && !isAnalyzing

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="border-b">
        <div className="container mx-auto py-16 px-4 max-w-4xl text-center">
          <h1 className="text-5xl font-bold mb-6">
            Проверь свое резюме
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Проверь свое резюме на совместимость с вакансией
          </p>
        </div>
      </div>

      {/* Upload Section */}
      <div className="container mx-auto py-12 px-4 max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Resume Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Резюме
              </CardTitle>
              <CardDescription>
                Загрузите файл резюме или вставьте текст
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FileUpload
                label=""
                description="Поддерживаемые форматы: PDF, DOC, DOCX, TXT"
                onFileSelect={setResumeFile}
                selectedFile={resumeFile}
                acceptedTypes=".pdf,.doc,.docx,.txt"
                showTextInput={true}
                onTextInput={setResumeText}
                textValue={resumeText}
              />
            </CardContent>
          </Card>

          {/* Vacancy Text Input Only */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Описание вакансии
              </CardTitle>
              <CardDescription>
                Вставьте текст вакансии
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Вставьте описание вакансии сюда..."
                value={vacancyText}
                onChange={(e) => setVacancyText(e.target.value)}
                className="min-h-[200px] resize-none"
              />
              {vacancyText.trim() && (
                <p className="text-xs text-muted-foreground mt-2">
                  {vacancyText.length} символов
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Action Button */}
        <div className="text-center mt-8">
          <Button
            onClick={handleAnalyze}
            disabled={!canAnalyze}
            size="lg"
            className="px-8 py-6 text-lg"
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
            <p className="text-sm text-muted-foreground mt-3">
              Добавьте резюме и вакансию для начала анализа
            </p>
          )}
        </div>
      </div>

      {/* Results Section */}
      {(error || analysisResult) && (
        <div className="border-t bg-muted/20">
          <div className="container mx-auto py-12 px-4 max-w-4xl">
            {/* Error Display */}
            {error && (
              <Card className="border-destructive bg-destructive/5 mb-8">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 text-destructive">
                    <Search className="h-4 w-4" />
                    <span className="font-medium">Ошибка анализа</span>
                  </div>
                  <p className="text-destructive/80 mt-2">{error}</p>
                </CardContent>
              </Card>
            )}

            {/* Analysis Result */}
            {analysisResult && (
              <div className="space-y-6">
                <AnalysisReport result={analysisResult} />
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
