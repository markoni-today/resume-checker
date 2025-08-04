"""
Тесты для ATS анализатора
"""

import pytest
import sys
from pathlib import Path

# Добавляем путь к модулям Python
sys.path.append(str(Path(__file__).parent.parent.parent / 'python'))

from ats_analyzer import RussianATSAnalyzer, ParsedResume
from file_parser import FileParser


class TestRussianATSAnalyzer:
    """Тесты для анализатора резюме"""
    
    def setup_method(self):
        """Настройка перед каждым тестом"""
        self.analyzer = RussianATSAnalyzer()
    
    def test_analyzer_initialization(self):
        """Тест инициализации анализатора"""
        assert self.analyzer is not None
        assert 'keywords' in self.analyzer.weights
        assert 'structure' in self.analyzer.weights
        assert 'contacts' in self.analyzer.weights
        assert 'experience' in self.analyzer.weights
        
        # Проверка сумма весов равна 1.0
        total_weight = sum(self.analyzer.weights.values())
        assert abs(total_weight - 1.0) < 0.01
    
    def test_normalize_text(self):
        """Тест нормализации текста"""
        test_text = "  Тест   текст\n\n  с   пробелами  "
        normalized = self.analyzer._normalize_text(test_text)
        assert normalized == "Тест текст с пробелами"
    
    def test_extract_email(self):
        """Тест извлечения email"""
        text_with_email = "Иван Иванов\nТелефон: +7 123 456 78 90\nEmail: ivan.ivanov@example.com"
        email = self.analyzer._extract_email(text_with_email)
        assert email == "ivan.ivanov@example.com"
    
    def test_extract_phone(self):
        """Тест извлечения телефона"""
        text_with_phone = "Контакты:\n+7 (123) 456-78-90"
        phone = self.analyzer._extract_phone(text_with_phone)
        assert phone is not None
        assert "123" in phone
    
    def test_extract_skills(self):
        """Тест извлечения навыков"""
        text_with_skills = "Навыки: Python, JavaScript, React, коммуникация"
        skills = self.analyzer._extract_skills(text_with_skills)
        
        assert 'python' in skills
        assert 'javascript' in skills
        assert 'react' in skills
        assert 'коммуникация' in skills
    
    def test_detect_sections(self):
        """Тест определения разделов"""
        resume_text = """
        Иван Иванов
        
        Опыт работы:
        2020-2023 Разработчик Python
        
        Образование:
        2016-2020 МГУ, программист
        
        Ключевые навыки:
        Python, Django, PostgreSQL
        """
        
        sections = self.analyzer._detect_sections(resume_text)
        assert 'experience' in sections
        assert 'education' in sections
        assert 'skills' in sections
    
    def test_analyze_contacts_full(self):
        """Тест анализа полных контактных данных"""
        resume = ParsedResume(
            name="Иван Иванов",
            email="ivan@example.com",
            phone="+7 123 456 78 90"
        )
        
        score = self.analyzer._analyze_contacts(resume)
        assert score == 100
    
    def test_analyze_contacts_partial(self):
        """Тест анализа частичных контактных данных"""
        resume = ParsedResume(
            name="Иван Иванов",
            email="ivan@example.com"
        )
        
        score = self.analyzer._analyze_contacts(resume)
        assert score == 60  # name(20) + email(40)
    
    def test_analyze_structure_good(self):
        """Тест анализа хорошей структуры"""
        resume = ParsedResume(
            sections=['experience', 'education', 'skills', 'contacts'],
            raw_text="Строка 1\nСтрока 2\nСтрока 3\nСтрока 4\nСтрока 5\nСтрока 6"
        )
        
        score = self.analyzer._analyze_structure(resume)
        assert score == 100  # Все разделы + структурированность
    
    def test_full_analysis(self):
        """Тест полного анализа резюме"""
        resume_text = """
        Иван Иванов
        Разработчик Python
        Email: ivan.ivanov@example.com
        Телефон: +7 (123) 456-78-90
        
        Опыт работы:
        2020-2023 ООО "Компания"
        Разработчик Python
        - Разработка веб-приложений на Django
        - Работа с PostgreSQL
        - Интеграция с внешними API
        
        Образование:
        2016-2020 МГУ
        Факультет ВМК, Программист
        
        Ключевые навыки:
        Python, Django, Flask, PostgreSQL, Git, Linux
        """
        
        vacancy_text = """
        Требования:
        - Опыт работы с Python от 2 лет
        - Знание Django
        - Опыт работы с PostgreSQL
        - Знание Git
        """
        
        result = self.analyzer.analyze_resume(resume_text, vacancy_text)
        
        # Проверяем базовую структуру результата
        assert result.score >= 0
        assert result.score <= 100
        assert 'keywords' in result.breakdown
        assert 'structure' in result.breakdown
        assert 'contacts' in result.breakdown
        assert 'experience' in result.breakdown
        
        # Проверяем что найдены ключевые слова
        assert len(result.matched_keywords) > 0
        assert 'python' in [kw.lower() for kw in result.matched_keywords]
        
        # Проверяем что есть рекомендации
        assert len(result.recommendations) > 0


class TestFileParser:
    """Тесты для парсера файлов"""
    
    def setup_method(self):
        """Настройка перед каждым тестом"""
        self.parser = FileParser()
    
    def test_parser_initialization(self):
        """Тест инициализации парсера"""
        assert self.parser is not None
        assert self.parser.max_file_size == 5 * 1024 * 1024
    
    def test_detect_file_type_by_mime(self):
        """Тест определения типа файла по MIME"""
        file_type = self.parser._detect_file_type('text/plain', 'test.txt')
        assert file_type == 'txt'
        
        file_type = self.parser._detect_file_type('application/pdf', 'test.pdf')
        assert file_type == 'pdf'
    
    def test_detect_file_type_by_extension(self):
        """Тест определения типа файла по расширению"""
        file_type = self.parser._detect_file_type('', 'test.docx')
        assert file_type == 'docx'
    
    def test_parse_txt_utf8(self):
        """Тест парсинга UTF-8 текста"""
        content = "Тестовый текст в UTF-8".encode('utf-8')
        result = self.parser._parse_txt(content)
        assert result == "Тестовый текст в UTF-8"
    
    def test_parse_txt_windows1251(self):
        """Тест парсинга Windows-1251 текста"""
        content = "Тестовый текст".encode('windows-1251')
        result = self.parser._parse_txt(content)
        assert "Тестовый текст" in result
    
    def test_format_file_size(self):
        """Тест форматирования размера файла"""
        assert self.parser._format_file_size(1024) == "1.0 KB"
        assert self.parser._format_file_size(1024 * 1024) == "1.0 MB"
        assert self.parser._format_file_size(500) == "500.0 B"


# Интеграционные тесты
class TestIntegration:
    """Интеграционные тесты"""
    
    def test_txt_file_analysis(self):
        """Тест анализа TXT файла"""
        parser = FileParser()
        analyzer = RussianATSAnalyzer()
        
        # Создаем тестовый TXT файл
        test_resume = """
        Петр Петров
        Веб-разработчик
        Email: petr@example.com
        Телефон: +7 999 888 77 66
        
        Опыт работы:
        2021-2023 Frontend разработчик
        Компания ABC
        - Разработка на React
        - Работа с JavaScript
        - Верстка HTML/CSS
        
        Образование:
        2017-2021 МГТУ им. Баумана
        
        Навыки:
        JavaScript, React, HTML, CSS, Git
        """.encode('utf-8')
        
        test_vacancy = """
        Требования к кандидату:
        - Опыт работы с JavaScript от 2 лет
        - Знание React
        - Опыт верстки HTML/CSS
        - Умение работать с Git
        """.encode('utf-8')
        
        # Парсим файлы
        resume_text = parser._parse_txt(test_resume)
        vacancy_text = parser._parse_txt(test_vacancy)
        
        # Анализируем
        result = analyzer.analyze_resume(resume_text, vacancy_text)
        
        # Проверяем результат
        assert result.score > 50  # Должен быть приличный скор
        assert result.parsed_resume.name == "Петр Петров"
        assert result.parsed_resume.email == "petr@example.com"
        assert len(result.matched_keywords) > 0


# Фикстуры для тестов
@pytest.fixture
def sample_resume_text():
    """Пример текста резюме для тестов"""
    return """
    Анна Смирнова
    Python разработчик
    Email: anna.smirnova@email.com
    Телефон: +7 (901) 234-56-78
    
    Опыт работы:
    2019-2023 Старший Python разработчик
    ООО "ТехКомпания"
    - Разработка backend приложений на Django
    - Проектирование REST API
    - Работа с PostgreSQL и Redis
    - Настройка CI/CD процессов
    
    2017-2019 Junior Python разработчик
    Стартап "Инновации"
    - Веб-разработка на Flask
    - Интеграция с внешними сервисами
    - Написание unit тестов
    
    Образование:
    2013-2017 СПбГУ
    Факультет математики и механики
    Прикладная математика и информатика
    
    Ключевые навыки:
    Python, Django, Flask, PostgreSQL, Redis, Git, Docker, Linux
    REST API, unit testing, agile
    
    Дополнительная информация:
    - Активное изучение новых технологий
    - Опыт менторства junior разработчиков
    - Участие в open source проектах
    """


@pytest.fixture  
def sample_vacancy_text():
    """Пример текста вакансии для тестов"""
    return """
    Вакансия: Senior Python Developer
    
    Мы ищем опытного Python разработчика для работы над крупными проектами.
    
    Требования:
    - Опыт работы с Python от 3 лет
    - Глубокие знания Django или Flask
    - Опыт работы с реляционными БД (PostgreSQL, MySQL)
    - Знание принципов REST API
    - Опыт работы с Git
    - Понимание принципов SOLID
    - Опыт unit тестирования
    
    Будет плюсом:
    - Знание Docker
    - Опыт работы с Redis
    - Знание Linux
    - Опыт CI/CD
    - Agile/Scrum опыт
    
    Обязанности:
    - Разработка и поддержка backend сервисов
    - Проектирование архитектуры приложений
    - Code review
    - Менторство junior разработчиков
    """


def test_complete_analysis_flow(sample_resume_text, sample_vacancy_text):
    """Тест полного цикла анализа с реальными данными"""
    analyzer = RussianATSAnalyzer()
    
    result = analyzer.analyze_resume(sample_resume_text, sample_vacancy_text)
    
    # Базовые проверки
    assert 0 <= result.score <= 100
    assert len(result.breakdown) == 4
    
    # Проверяем что парсинг прошел успешно
    assert result.parsed_resume.name == "Анна Смирнова"
    assert result.parsed_resume.email == "anna.smirnova@email.com"
    assert "+7 (901) 234-56-78" in result.parsed_resume.phone
    
    # Проверяем найденные навыки
    skills_found = [skill.lower() for skill in result.parsed_resume.skills]
    assert 'python' in skills_found
    assert 'django' in skills_found
    
    # Проверяем совпадающие ключевые слова
    matched_lower = [kw.lower() for kw in result.matched_keywords]
    assert 'python' in matched_lower
    assert 'django' in matched_lower or 'flask' in matched_lower
    
    # Проверяем что есть рекомендации
    assert len(result.recommendations) > 0
    
    # Проверяем высокие скоры для качественного резюме
    assert result.breakdown['contacts'] >= 80  # Все контакты есть
    assert result.breakdown['structure'] >= 70  # Хорошая структура
    assert result.breakdown['keywords'] >= 60   # Много совпадений
    
    print(f"Общий скор: {result.score}")
    print(f"Breakdown: {result.breakdown}")
    print(f"Найдено ключевых слов: {len(result.matched_keywords)}")
    print(f"Отсутствует ключевых слов: {len(result.missing_keywords)}")


if __name__ == '__main__':
    # Запуск тестов
    pytest.main([__file__, '-v'])