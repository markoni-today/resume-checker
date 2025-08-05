/**
 * Упрощенные парсеры для serverless окружения
 * Используют только базовые Node.js API без DOM зависимостей
 */

// Простой TXT парсер
export async function parseTextFile(file: File): Promise<string> {
  try {
    const text = await file.text();
    return text.trim();
  } catch (error) {
    throw new Error(`Ошибка чтения TXT файла: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
  }
}

// Упрощенный PDF парсер - извлекает базовый текст
export async function parseSimplePdf(file: File): Promise<string> {
  try {
    // Используем простое извлечение текста из PDF через строковый поиск
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Конвертируем в строку для поиска текстовых блоков
    let text = '';
    let buffer = '';
    
    // Ищем текстовые блоки в PDF
    for (let i = 0; i < uint8Array.length; i++) {
      const char = String.fromCharCode(uint8Array[i]);
      
      // Пропускаем непечатаемые символы, кроме пробелов и переносов
      if (char.charCodeAt(0) >= 32 && char.charCodeAt(0) <= 126) {
        buffer += char;
      } else if (char === ' ' || char === '\n' || char === '\r' || char === '\t') {
        buffer += char;
      } else {
        // Если накопили текст, добавляем его
        if (buffer.trim().length > 2) {
          text += buffer + ' ';
        }
        buffer = '';
      }
    }
    
    // Добавляем последний буфер
    if (buffer.trim().length > 2) {
      text += buffer;
    }
    
    // Очищаем текст от PDF артефактов
    text = text
      .replace(/\\[a-zA-Z]+/g, ' ') // Убираем PDF команды
      .replace(/[()]/g, ' ') // Убираем скобки
      .replace(/\s+/g, ' ') // Нормализуем пробелы
      .trim();
    
    if (!text || text.length < 10) {
      throw new Error('PDF файл не содержит извлекаемого текста или зашифрован');
    }
    
    return text;
    
  } catch (error) {
    throw new Error(`PDF парсинг не поддерживается в serverless окружении. Пожалуйста, скопируйте текст из PDF и вставьте в текстовое поле резюме.`);
  }
}

// Упрощенный DOCX парсер без mammoth
export async function parseSimpleDocx(file: File): Promise<string> {
  try {
    // DOCX это ZIP архив с XML файлами
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Конвертируем в строку для поиска XML контента
    let content = '';
    for (let i = 0; i < uint8Array.length; i++) {
      content += String.fromCharCode(uint8Array[i]);
    }
    
    // Ищем XML теги с текстом (<w:t>текст</w:t>)
    const textMatches = content.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
    if (!textMatches) {
      throw new Error('Не удалось найти текстовый контент в DOCX файле');
    }
    
    // Извлекаем текст из XML тегов
    let extractedText = '';
    for (const match of textMatches) {
      const textContent = match.replace(/<w:t[^>]*>([^<]+)<\/w:t>/, '$1');
      extractedText += textContent + ' ';
    }
    
    // Очищаем и нормализуем текст
    extractedText = extractedText
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (!extractedText || extractedText.length < 10) {
      throw new Error('DOCX файл не содержит извлекаемого текста');
    }
    
    return extractedText;
    
  } catch (error) {
    throw new Error(`DOCX парсинг не поддерживается в serverless окружении. Пожалуйста, скопируйте текст из документа и вставьте в текстовое поле резюме.`);
  }
}

// Универсальный парсер с fallback стратегией
export async function parseFileSimple(file: File): Promise<string> {
  const fileType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();
  
  console.log('Simple parsing file:', { name: file.name, type: file.type, size: file.size });
  
  try {
    // TXT файлы - надежно работают
    if (fileType.includes('text/plain') || fileName.endsWith('.txt')) {
      return await parseTextFile(file);
    }
    
    // PDF файлы - пробуем простое извлечение
    if (fileType.includes('pdf') || fileName.endsWith('.pdf')) {
      return await parseSimplePdf(file);
    }
    
    // DOCX файлы - пробуем простое извлечение
    if (fileType.includes('wordprocessingml') || fileName.endsWith('.docx')) {
      return await parseSimpleDocx(file);
    }
    
    // DOC файлы - не поддерживаются в простом режиме
    if (fileType.includes('msword') || fileName.endsWith('.doc')) {
      throw new Error('DOC файлы не поддерживаются в serverless окружении. Пожалуйста, сохраните документ в формате DOCX или скопируйте текст в текстовое поле.');
    }
    
    throw new Error(`Неподдерживаемый тип файла: ${fileType}`);
    
  } catch (error) {
    console.error('Simple file parsing error:', error);
    throw error instanceof Error ? error : new Error('Неизвестная ошибка обработки файла');
  }
}