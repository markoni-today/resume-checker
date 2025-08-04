'use client'

import React from 'react'
import { CheckCircle, AlertTriangle, XCircle, TrendingUp, FileText, Mail, Phone, User } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { ATSAnalysisResult, Recommendation } from '@/lib/utils'

interface AnalysisReportProps {
  result: ATSAnalysisResult
}

export default function AnalysisReport({ result }: AnalysisReportProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { variant: 'default' as const, text: 'Отлично' }
    if (score >= 60) return { variant: 'secondary' as const, text: 'Хорошо' }
    return { variant: 'destructive' as const, text: 'Требует улучшения' }
  }

  const getRecommendationIcon = (type: Recommendation['type']) => {
    switch (type) {
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'improvement':
        return <TrendingUp className="h-5 w-5 text-blue-500" />
      default:
        return <CheckCircle className="h-5 w-5 text-green-500" />
    }
  }

  const scoreBadge = getScoreBadge(result.score)

  return (
    <div className="space-y-6">
      {/* Общий результат */}
      <Card className="border-2">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <span>Результат анализа ATS</span>
            <Badge variant={scoreBadge.variant}>{scoreBadge.text}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className={`text-4xl font-bold ${getScoreColor(result.score)}`}>
              {result.score}%
            </div>
            <p className="text-muted-foreground">
              Вероятность прохождения через российские ATS системы
            </p>
          </div>
          
          <Progress value={result.score} className="h-3" />
        </CardContent>
      </Card>

      {/* Детальная разбивка */}
      <Card>
        <CardHeader>
          <CardTitle>Детальный анализ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Ключевые слова
                </span>
                <span className={`font-medium ${getScoreColor(result.breakdown.keywords)}`}>
                  {result.breakdown.keywords}%
                </span>
              </div>
              <Progress value={result.breakdown.keywords} />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Структура резюме
                </span>
                <span className={`font-medium ${getScoreColor(result.breakdown.structure)}`}>
                  {result.breakdown.structure}%
                </span>
              </div>
              <Progress value={result.breakdown.structure} />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Контактные данные
                </span>
                <span className={`font-medium ${getScoreColor(result.breakdown.contacts)}`}>
                  {result.breakdown.contacts}%
                </span>
              </div>
              <Progress value={result.breakdown.contacts} />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Опыт работы
                </span>
                <span className={`font-medium ${getScoreColor(result.breakdown.experience)}`}>
                  {result.breakdown.experience}%
                </span>
              </div>
              <Progress value={result.breakdown.experience} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Что видит ATS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Как ATS видит ваше резюме
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/50 p-4 rounded-lg font-mono text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Имя:</span>
              <span className={result.parsedResume.name ? 'text-green-600' : 'text-red-600'}>
                {result.parsedResume.name || 'НЕ НАЙДЕНО'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email:</span>
              <span className={result.parsedResume.email ? 'text-green-600' : 'text-red-600'}>
                {result.parsedResume.email || 'НЕ НАЙДЕН'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Телефон:</span>
              <span className={result.parsedResume.phone ? 'text-green-600' : 'text-red-600'}>
                {result.parsedResume.phone || 'НЕ НАЙДЕН'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Желаемая должность:</span>
              <span className={result.parsedResume.position ? 'text-green-600' : 'text-red-600'}>
                {result.parsedResume.position || 'НЕ УКАЗАНА'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Найденные ключевые слова */}
      {result.matchedKeywords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">
              ✓ Найденные ключевые слова ({result.matchedKeywords.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {result.matchedKeywords.map((keyword, index) => (
                <Badge key={index} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  {keyword}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Отсутствующие ключевые слова */}
      {result.missingKeywords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">
              ✗ Отсутствующие ключевые слова ({result.missingKeywords.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {result.missingKeywords.map((keyword, index) => (
                <Badge key={index} variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  {keyword}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Рекомендации */}
      <Card>
        <CardHeader>
          <CardTitle>Рекомендации для улучшения</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {result.recommendations.map((rec, index) => (
              <div key={index} className="flex items-start gap-3 p-4 border rounded-lg">
                {getRecommendationIcon(rec.type)}
                <div className="flex-1">
                  <h4 className="font-medium">{rec.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{rec.description}</p>
                  {rec.example && (
                    <div className="mt-2 p-2 bg-muted/50 rounded text-sm">
                      <strong>Пример:</strong> {rec.example}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}