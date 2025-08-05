/**
 * Клиентский парсер файлов - работает в браузере
 * Обходит ограничения serverless, парсит файлы на стороне клиента
 */

// Парсинг PDF на клиенте через pdfjs-dist
export async function parseClientPdf(file: File): Promise<string> {
  try {
    // Динамический импорт только в браузере
    if (typeof window === 'undefined') {
      throw new Error('PDF parsing only available in browser');
    }

    const pdfjsLib = await import('pdfjs-dist');
    
    // Устанавливаем worker для браузера
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ 
      data: new Uint8Array(arrayBuffer),
      verbosity: 0 
    }).promise;

    let fullText = '';
    
    // Обрабатываем все страницы
    for (let pageNum = 1; pageNum <= Math.min(pdf.numPages, 20); pageNum++) { // Лимит 20 страниц
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      fullText += pageText + '\n';
    }

    return fullText.trim();

  } catch (error) {
    console.error('Client PDF parsing failed:', error);
    throw new Error('Не удалось извлечь текст из PDF. Попробуйте скопировать текст вручную.');
  }
}

// Парсинг DOCX на клиенте через mammoth
export async function parseClientDocx(file: File): Promise<string> {
  try {
    // Динамический импорт только в браузере
    if (typeof window === 'undefined') {
      throw new Error('DOCX parsing only available in browser');
    }

    const mammoth = await import('mammoth');
    const arrayBuffer = await file.arrayBuffer();
    
    const result = await mammoth.extractRawText({ arrayBuffer });
    
    if (!result.value || result.value.length < 10) {
      throw new Error('Документ пуст или содержит только изображения');
    }
    
    return result.value.trim();

  } catch (error) {
    console.error('Client DOCX parsing failed:', error);
    throw new Error('Не удалось извлечь текст из DOCX. Попробуйте скопировать текст вручную.');
  }
}

// Универсальный клиентский парсер
export async function parseFileOnClient(file: File): Promise<string> {
  const fileType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();
  
  console.log('Parsing file on client:', { name: file.name, type: file.type, size: file.size });
  
  try {
    // TXT файлы
    if (fileType.includes('text/plain') || fileName.endsWith('.txt')) {
      return await file.text();
    }
    
    // PDF файлы - парсим в браузере
    if (fileType.includes('pdf') || fileName.endsWith('.pdf')) {
      return await parseClientPdf(file);
    }
    
    // DOCX файлы - парсим в браузере
    if (fileType.includes('wordprocessingml') || fileName.endsWith('.docx')) {
      return await parseClientDocx(file);
    }
    
    // DOC файлы не поддерживаются
    if (fileType.includes('msword') || fileName.endsWith('.doc')) {
      throw new Error('DOC файлы не поддерживаются. Сохраните документ в формате DOCX или скопируйте текст.');
    }
    
    throw new Error(`Неподдерживаемый тип файла: ${file.type}`);
    
  } catch (error) {
    console.error('Client file parsing error:', error);
    throw error instanceof Error ? error : new Error('Ошибка обработки файла');
  }
}