/**
 * TypeScript версия ATS анализатора для работы в Vercel
 * Упрощенная версия для MVP без Python зависимостей
 */

export interface ParsedResume {
  name?: string
  email?: string
  phone?: string
  position?: string
  skills: string[]
  experience: string
  education: string
  sections: string[]
  rawText: string
}

export interface Recommendation {
  type: 'critical' | 'warning' | 'improvement'
  title: string
  description: string
  example?: string
}

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

export class SimpleATSAnalyzer {
  private weights = {
    keywords: 0.40,
    structure: 0.30,
    contacts: 0.15,
    experience: 0.15
  }

  private standardSections = {
    experience: ['опыт работы', 'опыт', 'карьера', 'работа', 'трудовая деятельность', 'профессиональный опыт'],
    education: ['образование', 'учеба', 'обучение', 'квалификация'],
    skills: ['навыки', 'ключевые навыки', 'технологии', 'компетенции', 'умения', 'профессиональные навыки'],
    contacts: ['контакты', 'контактная информация', 'связь', 'контактные данные'],
    about: ['о себе', 'обо мне', 'личная информация', 'краткая информация', 'резюме']
  }

  private itSkills = [
    'python', 'java', 'javascript', 'react', 'angular', 'vue', 'node.js', 'express',
    'django', 'flask', 'spring', 'hibernate', 'sql', 'postgresql', 'mysql', 'mongodb',
    'redis', 'docker', 'kubernetes', 'aws', 'azure', 'git', 'jenkins', 'ci/cd',
    'html', 'css', 'typescript', 'php', 'laravel', 'symfony', 'c++', 'c#', '.net',
    'go', 'rust', 'scala', 'kotlin', 'swift', 'flutter', 'react native', 'android',
    'ios', 'linux', 'windows', 'macos', 'nginx', 'apache', 'elasticsearch', 'kafka'
  ]

  private softSkills = [
    'коммуникация', 'командная работа', 'лидерство', 'управление проектами',
    'аналитическое мышление', 'решение проблем', 'креативность', 'инициативность',
    'адаптивность', 'обучаемость', 'стрессоустойчивость', 'внимательность к деталям'
  ]

  analyzeResume(resumeText: string, vacancyText: string): ATSAnalysisResult {
    // 1. Парсинг резюме
    const parsedResume = this.parseResume(resumeText)
    
    // 2. Извлечение требований из вакансии
    const vacancyRequirements = this.extractVacancyRequirements(vacancyText)
    
    // 3. Анализ ключевых слов
    const [keywordsScore, matchedKeywords, missingKeywords] = this.analyzeKeywords(
      parsedResume, vacancyRequirements
    )
    
    // 4. Анализ структуры
    const structureScore = this.analyzeStructure(parsedResume)
    
    // 5. Анализ контактных данных
    const contactsScore = this.analyzeContacts(parsedResume)
    
    // 6. Анализ описания опыта
    const experienceScore = this.analyzeExperience(parsedResume, vacancyRequirements)
    
    // 7. Расчет общего скора
    const breakdown = {
      keywords: keywordsScore,
      structure: structureScore,
      contacts: contactsScore,
      experience: experienceScore
    }
    
    const totalScore = Math.round(
      breakdown.keywords * this.weights.keywords +
      breakdown.structure * this.weights.structure +
      breakdown.contacts * this.weights.contacts +
      breakdown.experience * this.weights.experience
    )
    
    // 8. Генерация рекомендаций
    const recommendations = this.generateRecommendations(
      breakdown, parsedResume, vacancyRequirements, matchedKeywords, missingKeywords
    )
    
    return {
      score: totalScore,
      breakdown,
      recommendations,
      parsedResume,
      matchedKeywords,
      missingKeywords
    }
  }

  private parseResume(text: string): ParsedResume {
    const normalizedText = this.normalizeText(text)
    
    return {
      name: this.extractName(normalizedText),
      email: this.extractEmail(normalizedText),
      phone: this.extractPhone(normalizedText),
      position: this.extractPosition(normalizedText),
      skills: this.extractSkills(normalizedText),
      experience: this.extractExperienceSection(normalizedText),
      education: this.extractEducationSection(normalizedText),
      sections: this.detectSections(normalizedText),
      rawText: normalizedText
    }
  }

  private normalizeText(text: string): string {
    return text.replace(/\s+/g, ' ').trim()
  }

  private extractName(text: string): string | undefined {
    const lines = text.split('\n').slice(0, 5)
    
    for (const line of lines) {
      const trimmed = line.trim()
      // Паттерн для ФИО (2-3 слова, начинающиеся с заглавной буквы)
      const nameMatch = trimmed.match(/^([А-ЯЁ][а-яё]+(?:\s+[А-ЯЁ][а-яё]+){1,2})(?:\s|$)/)
      if (nameMatch) {
        return nameMatch[1]
      }
    }
    
    return undefined
  }

  private extractEmail(text: string): string | undefined {
    const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/)
    return emailMatch ? emailMatch[0] : undefined
  }

  private extractPhone(text: string): string | undefined {
    const phonePatterns = [
      /\+7[\s\-\(\)]*\d{3}[\s\-\(\)]*\d{3}[\s\-]*\d{2}[\s\-]*\d{2}/,
      /8[\s\-\(\)]*\d{3}[\s\-\(\)]*\d{3}[\s\-]*\d{2}[\s\-]*\d{2}/,
      /\d{3}[\s\-\(\)]*\d{3}[\s\-]*\d{2}[\s\-]*\d{2}/
    ]
    
    for (const pattern of phonePatterns) {
      const match = text.match(pattern)
      if (match) {
        return match[0]
      }
    }
    
    return undefined
  }

  private extractPosition(text: string): string | undefined {
    const lines = text.split('\n').slice(0, 10)
    const positionKeywords = ['должность', 'позиция', 'специальность', 'профессия', 'цель']
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase().trim()
      for (const keyword of positionKeywords) {
        if (lowerLine.includes(keyword)) {
          const parts = line.split(':', 1)
          if (parts.length > 1) {
            return parts[1].trim()
          }
        }
      }
    }
    
    return undefined
  }

  private extractSkills(text: string): string[] {
    const textLower = text.toLowerCase()
    const foundSkills: string[] = []
    
    // Поиск IT навыков
    for (const skill of this.itSkills) {
      if (textLower.includes(skill.toLowerCase())) {
        foundSkills.push(skill)
      }
    }
    
    // Поиск мягких навыков
    for (const skill of this.softSkills) {
      if (textLower.includes(skill.toLowerCase())) {
        foundSkills.push(skill)
      }
    }
    
    return Array.from(new Set(foundSkills)) // Удаляем дубликаты
  }

  private detectSections(text: string): string[] {
    const textLower = text.toLowerCase()
    const foundSections: string[] = []
    
    for (const [sectionType, keywords] of Object.entries(this.standardSections)) {
      for (const keyword of keywords) {
        if (textLower.includes(keyword)) {
          foundSections.push(sectionType)
          break
        }
      }
    }
    
    return Array.from(new Set(foundSections))
  }

  private extractExperienceSection(text: string): string {
    const lines = text.split('\n')
    const experienceLines: string[] = []
    let inExperienceSection = false
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase().trim()
      
      // Проверяем начало раздела опыта
      if (this.standardSections.experience.some(keyword => lowerLine.includes(keyword))) {
        inExperienceSection = true
        continue
      }
      
      // Проверяем конец раздела опыта
      if (inExperienceSection && Object.values(this.standardSections)
          .flat()
          .filter(keyword => !this.standardSections.experience.includes(keyword))
          .some(keyword => lowerLine.includes(keyword))) {
        break
      }
      
      if (inExperienceSection && line.trim()) {
        experienceLines.push(line)
      }
    }
    
    return experienceLines.join('\n')
  }

  private extractEducationSection(text: string): string {
    const lines = text.split('\n')
    const educationLines: string[] = []
    let inEducationSection = false
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase().trim()
      
      if (this.standardSections.education.some(keyword => lowerLine.includes(keyword))) {
        inEducationSection = true
        continue
      }
      
      if (inEducationSection && Object.values(this.standardSections)
          .flat()
          .filter(keyword => !this.standardSections.education.includes(keyword))
          .some(keyword => lowerLine.includes(keyword))) {
        break
      }
      
      if (inEducationSection && line.trim()) {
        educationLines.push(line)
      }
    }
    
    return educationLines.join('\n')
  }

  private extractVacancyRequirements(vacancyText: string): {
    technicalSkills: string[]
    softSkills: string[]
    keywords: string[]
  } {
    const textLower = vacancyText.toLowerCase()
    
    const techRequirements = this.itSkills.filter(
      skill => textLower.includes(skill.toLowerCase())
    )
    
    const softRequirements = this.softSkills.filter(
      skill => textLower.includes(skill.toLowerCase())
    )
    
    // Простое извлечение ключевых слов
    const words = textLower.match(/[а-яё]{3,}/g) || []
    const wordFreq = words.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const keywords = Object.entries(wordFreq)
      .filter(([, freq]) => freq > 1)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([word]) => word)
    
    return {
      technicalSkills: techRequirements,
      softSkills: softRequirements,
      keywords
    }
  }

  private analyzeKeywords(
    resume: ParsedResume, 
    requirements: ReturnType<typeof this.extractVacancyRequirements>
  ): [number, string[], string[]] {
    const resumeTextLower = resume.rawText.toLowerCase()
    
    const allRequirements = [
      ...requirements.technicalSkills,
      ...requirements.softSkills,
      ...requirements.keywords
    ]
    
    const matched: string[] = []
    const missing: string[] = []
    
    for (const requirement of allRequirements) {
      if (resumeTextLower.includes(requirement.toLowerCase())) {
        matched.push(requirement)
      } else {
        missing.push(requirement)
      }
    }
    
    if (allRequirements.length === 0) {
      return [100, [], []]
    }
    
    const score = Math.min(Math.round((matched.length / allRequirements.length) * 100), 100)
    return [score, matched, missing.slice(0, 10)]
  }

  private analyzeStructure(resume: ParsedResume): number {
    let score = 0
    
    // Проверка наличия стандартных разделов
    const expectedSections = ['experience', 'education', 'skills']
    const foundSections = expectedSections.filter(s => resume.sections.includes(s)).length
    
    score += (foundSections / expectedSections.length) * 70
    
    // Бонус за дополнительные разделы
    if (resume.sections.includes('contacts')) {
      score += 15
    }
    
    // Бонус за структурированность текста
    if (resume.rawText.split('\n').length > 5) {
      score += 15
    }
    
    return Math.min(Math.round(score), 100)
  }

  private analyzeContacts(resume: ParsedResume): number {
    let score = 0
    
    if (resume.email) score += 40
    if (resume.phone) score += 40
    if (resume.name) score += 20
    
    return Math.min(score, 100)
  }

  private analyzeExperience(
    resume: ParsedResume, 
    requirements: ReturnType<typeof this.extractVacancyRequirements>
  ): number {
    let score = 0
    
    if (!resume.experience) {
      return 0
    }
    
    // Базовая оценка за наличие раздела опыта
    score += 40
    
    // Оценка детальности описания
    if (resume.experience.length > 200) {
      score += 30
    } else if (resume.experience.length > 100) {
      score += 20
    } else if (resume.experience.length > 50) {
      score += 10
    }
    
    // Проверка релевантности опыта
    const experienceLower = resume.experience.toLowerCase()
    const relevantSkills = requirements.technicalSkills.filter(
      skill => experienceLower.includes(skill.toLowerCase())
    )
    
    if (relevantSkills.length > 0) {
      score += Math.min(relevantSkills.length * 5, 30)
    }
    
    return Math.min(score, 100)
  }

  private generateRecommendations(
    breakdown: ATSAnalysisResult['breakdown'],
    resume: ParsedResume,
    requirements: ReturnType<typeof this.extractVacancyRequirements>,
    matchedKeywords: string[],
    missingKeywords: string[]
  ): Recommendation[] {
    const recommendations: Recommendation[] = []
    
    // Рекомендации по ключевым словам
    if (breakdown.keywords < 70) {
      if (missingKeywords.length > 0) {
        recommendations.push({
          type: 'critical',
          title: 'Добавьте ключевые слова из вакансии',
          description: `Ваше резюме не содержит ${missingKeywords.length} важных ключевых слов. ATS системы ищут точные совпадения.`,
          example: `Добавьте: ${missingKeywords.slice(0, 5).join(', ')}`
        })
      }
    }
    
    // Рекомендации по структуре
    if (breakdown.structure < 70) {
      const missingSections: string[] = []
      if (!resume.sections.includes('experience')) missingSections.push('опыт работы')
      if (!resume.sections.includes('education')) missingSections.push('образование')
      if (!resume.sections.includes('skills')) missingSections.push('навыки')
      
      if (missingSections.length > 0) {
        recommendations.push({
          type: 'warning',
          title: 'Добавьте стандартные разделы',
          description: `ATS системы ожидают стандартную структуру резюме. Отсутствуют разделы: ${missingSections.join(', ')}`,
          example: 'Используйте заголовки: "Опыт работы", "Образование", "Ключевые навыки"'
        })
      }
    }
    
    // Рекомендации по контактам
    if (breakdown.contacts < 80) {
      const missingContacts: string[] = []
      if (!resume.email) missingContacts.push('email')
      if (!resume.phone) missingContacts.push('телефон')
      if (!resume.name) missingContacts.push('ФИО')
      
      if (missingContacts.length > 0) {
        recommendations.push({
          type: 'critical',
          title: 'Добавьте контактную информацию',
          description: `Отсутствуют важные контактные данные: ${missingContacts.join(', ')}`,
          example: 'Укажите ФИО, телефон и email в начале резюме'
        })
      }
    }
    
    // Рекомендации по опыту
    if (breakdown.experience < 60) {
      if (!resume.experience) {
        recommendations.push({
          type: 'warning',
          title: 'Детально опишите опыт работы',
          description: 'Раздел опыта работы отсутствует или слишком краткий',
          example: 'Укажите компании, должности, период работы и основные обязанности'
        })
      } else if (resume.experience.length < 100) {
        recommendations.push({
          type: 'improvement',
          title: 'Расширьте описание опыта',
          description: 'Описание опыта работы слишком краткое для эффективного анализа ATS',
          example: 'Добавьте конкретные достижения, проекты и используемые технологии'
        })
      }
    }
    
    // Общие рекомендации
    if (recommendations.length === 0) {
      recommendations.push({
        type: 'improvement',
        title: 'Отличная работа!',
        description: 'Ваше резюме хорошо оптимизировано для ATS систем',
        example: 'Продолжайте обновлять резюме актуальными навыками и достижениями'
      })
    }
    
    return recommendations
  }
}