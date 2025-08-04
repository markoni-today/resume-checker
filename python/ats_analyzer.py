"""
ATS Анализатор для российского рынка
Единый алгоритм анализа совместимости резюме с ATS системами
"""

import re
import json
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass
from collections import Counter
import unicodedata


@dataclass
class ParsedResume:
    """Структура распарсенного резюме"""
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    position: Optional[str] = None
    skills: List[str] = None
    experience: str = ""
    education: str = ""
    sections: List[str] = None
    raw_text: str = ""
    
    def __post_init__(self):
        if self.skills is None:
            self.skills = []
        if self.sections is None:
            self.sections = []


@dataclass
class Recommendation:
    """Рекомендация для улучшения резюме"""
    type: str  # 'critical', 'warning', 'improvement'
    title: str
    description: str
    example: Optional[str] = None


@dataclass
class ATSAnalysisResult:
    """Результат анализа ATS"""
    score: int
    breakdown: Dict[str, int]
    recommendations: List[Recommendation]
    parsed_resume: ParsedResume
    matched_keywords: List[str]
    missing_keywords: List[str]
    ats_compatibility: Dict[str, Any]


class RussianATSAnalyzer:
    """Анализатор совместимости с российскими ATS системами"""
    
    def __init__(self):
        self.weights = {
            'keywords': 0.40,      # 40% - ключевые слова
            'structure': 0.30,     # 30% - структура резюме
            'contacts': 0.15,      # 15% - контактные данные
            'experience': 0.15     # 15% - описание опыта
        }
        
        # Стандартные разделы резюме на русском языке
        self.standard_sections = {
            'experience': ['опыт работы', 'опыт', 'карьера', 'работа', 'трудовая деятельность', 'профессиональный опыт'],
            'education': ['образование', 'учеба', 'обучение', 'квалификация'],
            'skills': ['навыки', 'ключевые навыки', 'технологии', 'компетенции', 'умения', 'профессиональные навыки'],
            'contacts': ['контакты', 'контактная информация', 'связь', 'контактные данные'],
            'about': ['о себе', 'обо мне', 'личная информация', 'краткая информация', 'резюме']
        }
        
        # Популярные IT навыки для российского рынка
        self.it_skills = [
            'python', 'java', 'javascript', 'react', 'angular', 'vue', 'node.js', 'express',
            'django', 'flask', 'spring', 'hibernate', 'sql', 'postgresql', 'mysql', 'mongodb',
            'redis', 'docker', 'kubernetes', 'aws', 'azure', 'git', 'jenkins', 'ci/cd',
            'html', 'css', 'typescript', 'php', 'laravel', 'symfony', 'c++', 'c#', '.net',
            'go', 'rust', 'scala', 'kotlin', 'swift', 'flutter', 'react native', 'android',
            'ios', 'linux', 'windows', 'macos', 'nginx', 'apache', 'elasticsearch', 'kafka'
        ]
        
        # Мягкие навыки
        self.soft_skills = [
            'коммуникация', 'командная работа', 'лидерство', 'управление проектами',
            'аналитическое мышление', 'решение проблем', 'креативность', 'инициативность',
            'адаптивность', 'обучаемость', 'стрессоустойчивость', 'внимательность к деталям'
        ]
    
    def analyze_resume(self, resume_text: str, vacancy_text: str) -> ATSAnalysisResult:
        """
        Основной метод анализа резюме
        
        Args:
            resume_text: Текст резюме
            vacancy_text: Текст вакансии
            
        Returns:
            ATSAnalysisResult: Результат анализа
        """
        
        # 1. Парсинг резюме
        parsed_resume = self._parse_resume(resume_text)
        
        # 2. Извлечение требований из вакансии
        vacancy_requirements = self._extract_vacancy_requirements(vacancy_text)
        
        # 3. Анализ ключевых слов
        keywords_score, matched_keywords, missing_keywords = self._analyze_keywords(
            parsed_resume, vacancy_requirements
        )
        
        # 4. Анализ структуры
        structure_score = self._analyze_structure(parsed_resume)
        
        # 5. Анализ контактных данных
        contacts_score = self._analyze_contacts(parsed_resume)
        
        # 6. Анализ описания опыта
        experience_score = self._analyze_experience(parsed_resume, vacancy_requirements)
        
        # 7. Расчет общего скора
        breakdown = {
            'keywords': keywords_score,
            'structure': structure_score,
            'contacts': contacts_score,
            'experience': experience_score
        }
        
        total_score = int(sum(
            score * self.weights[category] 
            for category, score in breakdown.items()
        ))
        
        # 8. Генерация рекомендаций
        recommendations = self._generate_recommendations(
            breakdown, parsed_resume, vacancy_requirements, matched_keywords, missing_keywords
        )
        
        return ATSAnalysisResult(
            score=total_score,
            breakdown=breakdown,
            recommendations=recommendations,
            parsed_resume=parsed_resume,
            matched_keywords=matched_keywords,
            missing_keywords=missing_keywords,
            ats_compatibility={
                'parsing_success': True,
                'standard_sections_found': len(parsed_resume.sections),
                'total_sections_expected': 4,
                'russian_ats_friendly': total_score >= 60
            }
        )
    
    def _parse_resume(self, text: str) -> ParsedResume:
        """Парсит резюме и извлекает основную информацию"""
        
        # Нормализация текста
        text = self._normalize_text(text)
        
        resume = ParsedResume(raw_text=text)
        
        # Извлечение имени (обычно в начале резюме)
        resume.name = self._extract_name(text)
        
        # Извлечение email
        resume.email = self._extract_email(text)
        
        # Извлечение телефона
        resume.phone = self._extract_phone(text)
        
        # Извлечение желаемой должности
        resume.position = self._extract_position(text)
        
        # Извлечение навыков
        resume.skills = self._extract_skills(text)
        
        # Определение разделов
        resume.sections = self._detect_sections(text)
        
        # Извлечение опыта работы
        resume.experience = self._extract_experience_section(text)
        
        # Извлечение образования
        resume.education = self._extract_education_section(text)
        
        return resume
    
    def _normalize_text(self, text: str) -> str:
        """Нормализует текст для анализа"""
        # Удаление лишних пробелов и переносов
        text = re.sub(r'\s+', ' ', text)
        text = text.strip()
        
        # Нормализация unicode символов
        text = unicodedata.normalize('NFKC', text)
        
        return text
    
    def _extract_name(self, text: str) -> Optional[str]:
        """Извлекает имя из резюме"""
        lines = text.split('\n')[:5]  # Ищем в первых 5 строках
        
        for line in lines:
            line = line.strip()
            # Паттерн для ФИО (2-3 слова, начинающиеся с заглавной буквы)
            name_pattern = r'^([А-ЯЁ][а-яё]+(?:\s+[А-ЯЁ][а-яё]+){1,2})(?:\s|$)'
            match = re.search(name_pattern, line)
            if match:
                return match.group(1)
        
        return None
    
    def _extract_email(self, text: str) -> Optional[str]:
        """Извлекает email из резюме"""
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        match = re.search(email_pattern, text)
        return match.group() if match else None
    
    def _extract_phone(self, text: str) -> Optional[str]:
        """Извлекает телефон из резюме"""
        # Паттерны для российских номеров телефонов
        phone_patterns = [
            r'\+7[\s\-\(\)]*\d{3}[\s\-\(\)]*\d{3}[\s\-]*\d{2}[\s\-]*\d{2}',
            r'8[\s\-\(\)]*\d{3}[\s\-\(\)]*\d{3}[\s\-]*\d{2}[\s\-]*\d{2}',
            r'\d{3}[\s\-\(\)]*\d{3}[\s\-]*\d{2}[\s\-]*\d{2}'
        ]
        
        for pattern in phone_patterns:
            match = re.search(pattern, text)
            if match:
                return match.group()
        
        return None
    
    def _extract_position(self, text: str) -> Optional[str]:
        """Извлекает желаемую должность"""
        lines = text.split('\n')
        
        # Ключевые слова для поиска должности
        position_keywords = ['должность', 'позиция', 'специальность', 'профессия', 'цель']
        
        for line in lines[:10]:  # Ищем в первых 10 строках
            line_lower = line.lower().strip()
            for keyword in position_keywords:
                if keyword in line_lower:
                    # Извлекаем текст после ключевого слова
                    parts = line.split(':', 1)
                    if len(parts) > 1:
                        return parts[1].strip()
        
        return None
    
    def _extract_skills(self, text: str) -> List[str]:
        """Извлекает навыки из резюме"""
        text_lower = text.lower()
        found_skills = []
        
        # Поиск IT навыков
        for skill in self.it_skills:
            if skill.lower() in text_lower:
                found_skills.append(skill)
        
        # Поиск мягких навыков
        for skill in self.soft_skills:
            if skill.lower() in text_lower:
                found_skills.append(skill)
        
        return list(set(found_skills))  # Удаляем дубликаты
    
    def _detect_sections(self, text: str) -> List[str]:
        """Определяет наличие стандартных разделов в резюме"""
        text_lower = text.lower()
        found_sections = []
        
        for section_type, keywords in self.standard_sections.items():
            for keyword in keywords:
                if keyword in text_lower:
                    found_sections.append(section_type)
                    break
        
        return list(set(found_sections))
    
    def _extract_experience_section(self, text: str) -> str:
        """Извлекает раздел с опытом работы"""
        lines = text.split('\n')
        experience_lines = []
        in_experience_section = False
        
        for line in lines:
            line_lower = line.lower().strip()
            
            # Проверяем начало раздела опыта
            if any(keyword in line_lower for keyword in self.standard_sections['experience']):
                in_experience_section = True
                continue
            
            # Проверяем конец раздела опыта (начало нового раздела)
            if in_experience_section and any(
                any(keyword in line_lower for keyword in keywords)
                for section, keywords in self.standard_sections.items()
                if section != 'experience'
            ):
                break
            
            if in_experience_section and line.strip():
                experience_lines.append(line)
        
        return '\n'.join(experience_lines)
    
    def _extract_education_section(self, text: str) -> str:
        """Извлекает раздел с образованием"""
        lines = text.split('\n')
        education_lines = []
        in_education_section = False
        
        for line in lines:
            line_lower = line.lower().strip()
            
            if any(keyword in line_lower for keyword in self.standard_sections['education']):
                in_education_section = True
                continue
            
            if in_education_section and any(
                any(keyword in line_lower for keyword in keywords)
                for section, keywords in self.standard_sections.items()
                if section != 'education'
            ):
                break
            
            if in_education_section and line.strip():
                education_lines.append(line)
        
        return '\n'.join(education_lines)
    
    def _extract_vacancy_requirements(self, vacancy_text: str) -> Dict[str, List[str]]:
        """Извлекает требования из текста вакансии"""
        text_lower = vacancy_text.lower()
        
        # Извлечение технических навыков
        tech_requirements = [
            skill for skill in self.it_skills 
            if skill.lower() in text_lower
        ]
        
        # Извлечение мягких навыков
        soft_requirements = [
            skill for skill in self.soft_skills 
            if skill.lower() in text_lower
        ]
        
        # Извлечение ключевых слов (простой подход)
        keywords = []
        words = re.findall(r'\b[а-яё]{3,}\b', text_lower)
        word_freq = Counter(words)
        
        # Берем наиболее частые слова как ключевые
        keywords = [word for word, freq in word_freq.most_common(20) if freq > 1]
        
        return {
            'technical_skills': tech_requirements,
            'soft_skills': soft_requirements,
            'keywords': keywords
        }
    
    def _analyze_keywords(self, resume: ParsedResume, requirements: Dict[str, List[str]]) -> Tuple[int, List[str], List[str]]:
        """Анализирует совпадение ключевых слов"""
        resume_text_lower = resume.raw_text.lower()
        
        all_requirements = (
            requirements['technical_skills'] + 
            requirements['soft_skills'] + 
            requirements['keywords']
        )
        
        matched = []
        missing = []
        
        for requirement in all_requirements:
            if requirement.lower() in resume_text_lower:
                matched.append(requirement)
            else:
                missing.append(requirement)
        
        if not all_requirements:
            return 100, [], []
        
        score = int((len(matched) / len(all_requirements)) * 100)
        return min(score, 100), matched, missing[:10]  # Ограничиваем количество отсутствующих
    
    def _analyze_structure(self, resume: ParsedResume) -> int:
        """Анализирует структуру резюме"""
        score = 0
        
        # Проверка наличия стандартных разделов
        expected_sections = ['experience', 'education', 'skills']
        found_sections = len([s for s in expected_sections if s in resume.sections])
        
        score += (found_sections / len(expected_sections)) * 70
        
        # Бонус за дополнительные разделы
        if 'contacts' in resume.sections:
            score += 15
        
        # Бонус за структурированность текста
        if len(resume.raw_text.split('\n')) > 5:  # Резюме разбито на строки
            score += 15
        
        return min(int(score), 100)
    
    def _analyze_contacts(self, resume: ParsedResume) -> int:
        """Анализирует полноту контактных данных"""
        score = 0
        
        if resume.email:
            score += 40
        if resume.phone:
            score += 40
        if resume.name:
            score += 20
        
        return min(score, 100)
    
    def _analyze_experience(self, resume: ParsedResume, requirements: Dict[str, List[str]]) -> int:
        """Анализирует описание опыта работы"""
        score = 0
        
        if not resume.experience:
            return 0
        
        # Базовая оценка за наличие раздела опыта
        score += 40
        
        # Оценка детальности описания
        if len(resume.experience) > 200:  # Детальное описание
            score += 30
        elif len(resume.experience) > 100:
            score += 20
        elif len(resume.experience) > 50:
            score += 10
        
        # Проверка релевантности опыта
        experience_lower = resume.experience.lower()
        relevant_skills = [
            skill for skill in requirements.get('technical_skills', [])
            if skill.lower() in experience_lower
        ]
        
        if relevant_skills:
            score += min(len(relevant_skills) * 5, 30)
        
        return min(score, 100)
    
    def _generate_recommendations(
        self, 
        breakdown: Dict[str, int], 
        resume: ParsedResume, 
        requirements: Dict[str, List[str]],
        matched_keywords: List[str],
        missing_keywords: List[str]
    ) -> List[Recommendation]:
        """Генерирует рекомендации для улучшения резюме"""
        
        recommendations = []
        
        # Рекомендации по ключевым словам
        if breakdown['keywords'] < 70:
            if missing_keywords:
                recommendations.append(Recommendation(
                    type='critical',
                    title='Добавьте ключевые слова из вакансии',
                    description=f'Ваше резюме не содержит {len(missing_keywords)} важных ключевых слов. ATS системы ищут точные совпадения.',
                    example=f'Добавьте: {", ".join(missing_keywords[:5])}'
                ))
        
        # Рекомендации по структуре
        if breakdown['structure'] < 70:
            missing_sections = []
            if 'experience' not in resume.sections:
                missing_sections.append('опыт работы')
            if 'education' not in resume.sections:
                missing_sections.append('образование')
            if 'skills' not in resume.sections:
                missing_sections.append('навыки')
            
            if missing_sections:
                recommendations.append(Recommendation(
                    type='warning',
                    title='Добавьте стандартные разделы',
                    description=f'ATS системы ожидают стандартную структуру резюме. Отсутствуют разделы: {", ".join(missing_sections)}',
                    example='Используйте заголовки: "Опыт работы", "Образование", "Ключевые навыки"'
                ))
        
        # Рекомендации по контактам
        if breakdown['contacts'] < 80:
            missing_contacts = []
            if not resume.email:
                missing_contacts.append('email')
            if not resume.phone:
                missing_contacts.append('телефон')
            if not resume.name:
                missing_contacts.append('ФИО')
            
            if missing_contacts:
                recommendations.append(Recommendation(
                    type='critical',
                    title='Добавьте контактную информацию',
                    description=f'Отсутствуют важные контактные данные: {", ".join(missing_contacts)}',
                    example='Укажите ФИО, телефон и email в начале резюме'
                ))
        
        # Рекомендации по опыту
        if breakdown['experience'] < 60:
            if not resume.experience:
                recommendations.append(Recommendation(
                    type='warning',
                    title='Детально опишите опыт работы',
                    description='Раздел опыта работы отсутствует или слишком краткий',
                    example='Укажите компании, должности, период работы и основные обязанности'
                ))
            elif len(resume.experience) < 100:
                recommendations.append(Recommendation(
                    type='improvement',
                    title='Расширьте описание опыта',
                    description='Описание опыта работы слишком краткое для эффективного анализа ATS',
                    example='Добавьте конкретные достижения, проекты и используемые технологии'
                ))
        
        # Общие рекомендации
        if not recommendations:
            recommendations.append(Recommendation(
                type='improvement',
                title='Отличная работа!',
                description='Ваше резюме хорошо оптимизировано для ATS систем',
                example='Продолжайте обновлять резюме актуальными навыками и достижениями'
            ))
        
        return recommendations