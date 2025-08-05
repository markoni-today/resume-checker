/**
 * PDF парсер используя pdfjs-dist (более совместим с Vercel)
 */

export async function parsePdfWithPdfjs(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    // Динамический импорт pdfjs-dist
    const pdfjsLib = await import('pdfjs-dist');
    
    // Устанавливаем worker path для serverless окружения
    if (typeof window === 'undefined') {
      // Server-side: отключаем worker для совместимости
      pdfjsLib.GlobalWorkerOptions.workerSrc = '';
    }

    // Загружаем PDF документ
    const pdf = await pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      verbosity: 0, // Отключаем логи
      useWorkerFetch: false, // Отключаем worker для serverless
      isEvalSupported: false, // Отключаем eval для безопасности
    }).promise;

    let fullText = '';

    // Обрабатываем каждую страницу
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Извлекаемый текст из страницы
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      fullText += pageText + '\n';
    }

    return fullText.trim();

  } catch (error) {
    console.error('PDF parsing with pdfjs failed:', error);
    throw new Error(`Ошибка парсинга PDF: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
  }
}

export async function parseWordWithMammoth(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ arrayBuffer });
    
    if (!result.value || !result.value.trim()) {
      throw new Error('Документ пуст или не содержит текста');
    }
    
    return result.value.trim();
  } catch (error) {
    console.error('Word parsing with mammoth failed:', error);
    throw new Error(`Ошибка парсинга Word документа: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
  }
}