#!/usr/bin/env python3
"""
API Handler для Resume Checker
Обрабатывает запросы из Next.js API и возвращает результаты анализа
"""

import sys
import json
import traceback
from pathlib import Path
from typing import Dict, Any

# Добавляем путь к модулям Python
sys.path.append(str(Path(__file__).parent))

from file_parser import FileParser, validate_file_for_parsing
from ats_analyzer import RussianATSAnalyzer


def read_file_content(file_path: str) -> bytes:
    """Читает содержимое файла"""
    try:
        with open(file_path, 'rb') as f:
            return f.read()
    except Exception as e:
        raise ValueError(f"Ошибка чтения файла {file_path}: {str(e)}")


def process_files(
    resume_path: str,
    vacancy_path: str,
    resume_type: str,
    vacancy_type: str,
    resume_name: str,
    vacancy_name: str
) -> Dict[str, Any]:
    """
    Обрабатывает файлы резюме и вакансии
    
    Returns:
        Результат анализа в формате JSON
    """
    
    parser = FileParser()
    analyzer = RussianATSAnalyzer()
    
    try:
        # Чтение файлов
        resume_content = read_file_content(resume_path)
        vacancy_content = read_file_content(vacancy_path)
        
        # Валидация файлов
        resume_validation = validate_file_for_parsing(resume_content, resume_type, resume_name)
        if not resume_validation['valid']:
            return {
                'error': f"Ошибка в файле резюме: {resume_validation['error']}"
            }
        
        vacancy_validation = validate_file_for_parsing(vacancy_content, vacancy_type, vacancy_name)
        if not vacancy_validation['valid']:
            return {
                'error': f"Ошибка в файле вакансии: {vacancy_validation['error']}"
            }
        
        # Парсинг файлов
        try:
            resume_text = parser.parse_file(resume_content, resume_type, resume_name)
        except Exception as e:
            return {
                'error': f"Не удалось обработать файл резюме: {str(e)}"
            }
        
        try:
            vacancy_text = parser.parse_file(vacancy_content, vacancy_type, vacancy_name)
        except Exception as e:
            return {
                'error': f"Не удалось обработать файл вакансии: {str(e)}"
            }
        
        # Проверка на пустые файлы
        if not resume_text.strip():
            return {
                'error': "Файл резюме пустой или не содержит текста"
            }
        
        if not vacancy_text.strip():
            return {
                'error': "Файл вакансии пустой или не содержит текста"
            }
        
        # Анализ резюме
        try:
            analysis_result = analyzer.analyze_resume(resume_text, vacancy_text)
        except Exception as e:
            return {
                'error': f"Ошибка при анализе: {str(e)}"
            }
        
        # Преобразование результата в JSON-сериализуемый формат
        return format_analysis_result(analysis_result)
        
    except Exception as e:
        return {
            'error': f"Общая ошибка обработки: {str(e)}"
        }


def format_analysis_result(result) -> Dict[str, Any]:
    """Форматирует результат анализа для JSON"""
    
    return {
        'score': result.score,
        'breakdown': result.breakdown,
        'recommendations': [
            {
                'type': rec.type,
                'title': rec.title,
                'description': rec.description,
                'example': rec.example
            }
            for rec in result.recommendations
        ],
        'parsedResume': {
            'name': result.parsed_resume.name,
            'email': result.parsed_resume.email,
            'phone': result.parsed_resume.phone,
            'position': result.parsed_resume.position,
            'skills': result.parsed_resume.skills,
            'experience': result.parsed_resume.experience[:500] if result.parsed_resume.experience else "",  # Ограничиваем длину
            'education': result.parsed_resume.education[:500] if result.parsed_resume.education else "",
            'sections': result.parsed_resume.sections
        },
        'matchedKeywords': result.matched_keywords,
        'missingKeywords': result.missing_keywords,
        'atsCompatibility': result.ats_compatibility
    }


def main():
    """Главная функция для обработки аргументов командной строки"""
    
    try:
        if len(sys.argv) != 7:
            raise ValueError("Неверное количество аргументов")
        
        resume_path = sys.argv[1]
        vacancy_path = sys.argv[2]
        resume_type = sys.argv[3]
        vacancy_type = sys.argv[4]
        resume_name = sys.argv[5]
        vacancy_name = sys.argv[6]
        
        # Проверка существования файлов
        if not Path(resume_path).exists():
            raise FileNotFoundError(f"Файл резюме не найден: {resume_path}")
        
        if not Path(vacancy_path).exists():
            raise FileNotFoundError(f"Файл вакансии не найден: {vacancy_path}")
        
        # Обработка файлов
        result = process_files(
            resume_path, vacancy_path,
            resume_type, vacancy_type,
            resume_name, vacancy_name
        )
        
        # Возвращаем результат в stdout для Next.js
        print(json.dumps(result, ensure_ascii=False, indent=None))
        
    except Exception as e:
        # В случае ошибки возвращаем JSON с описанием ошибки
        error_result = {
            'error': f"Критическая ошибка: {str(e)}",
            'traceback': traceback.format_exc() if '--debug' in sys.argv else None
        }
        print(json.dumps(error_result, ensure_ascii=False))
        sys.exit(1)


if __name__ == '__main__':
    main()