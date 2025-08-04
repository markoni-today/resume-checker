import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs'
import { promisify } from 'util'

const writeFile = promisify(fs.writeFile)
const unlink = promisify(fs.unlink)

// Максимальный размер файла (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024

export async function POST(request: NextRequest) {
  let tempFiles: string[] = []
  
  try {
    const formData = await request.formData()
    const resumeFile = formData.get('resume') as File
    const vacancyFile = formData.get('vacancy') as File
    
    // Валидация файлов
    if (!resumeFile || !vacancyFile) {
      return NextResponse.json(
        { error: 'Необходимо загрузить оба файла' },
        { status: 400 }
      )
    }
    
    // Проверка размеров файлов
    if (resumeFile.size > MAX_FILE_SIZE || vacancyFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `Файл слишком большой. Максимальный размер: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      )
    }
    
    // Проверка типов файлов
    const allowedTypes = [
      'text/plain',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ]
    
    if (!allowedTypes.includes(resumeFile.type) || !allowedTypes.includes(vacancyFile.type)) {
      return NextResponse.json(
        { error: 'Неподдерживаемый формат файла. Разрешены: TXT, PDF, DOCX, DOC' },
        { status: 400 }
      )
    }
    
    // Создание временных файлов
    const tempDir = path.join(process.cwd(), 'temp')
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }
    
    const resumeTempPath = path.join(tempDir, `resume_${Date.now()}_${resumeFile.name}`)
    const vacancyTempPath = path.join(tempDir, `vacancy_${Date.now()}_${vacancyFile.name}`)
    
    tempFiles = [resumeTempPath, vacancyTempPath]
    
    // Сохранение файлов
    const resumeBuffer = Buffer.from(await resumeFile.arrayBuffer())
    const vacancyBuffer = Buffer.from(await vacancyFile.arrayBuffer())
    
    await writeFile(resumeTempPath, resumeBuffer)
    await writeFile(vacancyTempPath, vacancyBuffer)
    
    // Вызов Python анализатора
    const result = await runPythonAnalyzer(resumeTempPath, vacancyTempPath, {
      resumeType: resumeFile.type,
      vacancyType: vacancyFile.type,
      resumeName: resumeFile.name,
      vacancyName: vacancyFile.name
    })
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('Error in analyze API:', error)
    return NextResponse.json(
      { error: 'Ошибка при анализе файлов. Попробуйте позже.' },
      { status: 500 }
    )
  } finally {
    // Очистка временных файлов
    for (const tempFile of tempFiles) {
      try {
        if (fs.existsSync(tempFile)) {
          await unlink(tempFile)
        }
      } catch (error) {
        console.error('Error cleaning up temp file:', error)
      }
    }
  }
}

async function runPythonAnalyzer(
  resumePath: string, 
  vacancyPath: string, 
  metadata: {
    resumeType: string
    vacancyType: string
    resumeName: string
    vacancyName: string
  }
): Promise<any> {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(process.cwd(), 'python', 'api_handler.py')
    
    const args = [
      pythonScript,
      resumePath,
      vacancyPath,
      metadata.resumeType,
      metadata.vacancyType,
      metadata.resumeName,
      metadata.vacancyName
    ]
    
    const pythonProcess = spawn('python', args, {
      stdio: ['pipe', 'pipe', 'pipe']
    })
    
    let stdout = ''
    let stderr = ''
    
    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString()
    })
    
    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString()
    })
    
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('Python script error:', stderr)
        reject(new Error(`Python script failed with code ${code}: ${stderr}`))
        return
      }
      
      try {
        const result = JSON.parse(stdout)
        resolve(result)
      } catch (error) {
        console.error('Error parsing Python output:', error)
        console.error('Python stdout:', stdout)
        reject(new Error('Failed to parse analysis result'))
      }
    })
    
    pythonProcess.on('error', (error) => {
      console.error('Failed to start Python process:', error)
      reject(new Error('Failed to start analysis process'))
    })
    
    // Таймаут для предотвращения зависания
    setTimeout(() => {
      pythonProcess.kill()
      reject(new Error('Analysis timeout'))
    }, 30000) // 30 секунд
  })
}

export async function GET() {
  return NextResponse.json(
    { message: 'Resume Checker API. Use POST method to analyze files.' },
    { status: 200 }
  )
}