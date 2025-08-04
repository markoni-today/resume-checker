'use client'

import React, { useCallback, useState } from 'react'
import { Upload, FileText, AlertCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { validateFile, formatFileSize } from '@/lib/utils'

interface FileUploadProps {
  label: string
  description: string
  onFileSelect: (file: File | null) => void
  selectedFile: File | null
  error?: string
  onTextInput?: (text: string) => void
  textValue?: string
}

export default function FileUpload({ 
  label, 
  description, 
  onFileSelect, 
  selectedFile, 
  error,
  onTextInput,
  textValue
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0])
    }
  }, [])

  const handleFileSelection = (file: File) => {
    const validation = validateFile(file)
    
    if (!validation.valid) {
      setValidationError(validation.error || 'Ошибка файла')
      onFileSelect(null)
      return
    }

    setValidationError(null)
    onFileSelect(file)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0])
    }
  }

  const removeFile = () => {
    onFileSelect(null)
    setValidationError(null)
  }

  const displayError = error || validationError

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">{label}</h3>
        {selectedFile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={removeFile}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <p className="text-sm text-muted-foreground mb-4">{description}</p>

      {selectedFile ? (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8 text-green-600" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-green-900 truncate">
                  {selectedFile.name}
                </p>
                <p className="text-sm text-green-700">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {selectedFile.type.split('/')[1].toUpperCase()}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card 
          className={`border-2 border-dashed transition-colors ${
            dragActive 
              ? 'border-primary bg-primary/5' 
              : displayError 
                ? 'border-destructive bg-destructive/5'
                : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center space-y-4">
              {displayError ? (
                <AlertCircle className="h-12 w-12 text-destructive" />
              ) : (
                <Upload className={`h-12 w-12 ${dragActive ? 'text-primary' : 'text-muted-foreground'}`} />
              )}
              
              <div className="text-center space-y-2">
                {displayError ? (
                  <div>
                    <p className="text-sm font-medium text-destructive">Ошибка загрузки</p>
                    <p className="text-sm text-destructive/80">{displayError}</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium">
                      {dragActive ? 'Отпустите файл здесь' : 'Перетащите файл сюда'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      или нажмите для выбора
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline">TXT</Badge>
                <Badge variant="outline" className="opacity-50">PDF (скоро)</Badge>
                <Badge variant="outline" className="opacity-50">DOCX (скоро)</Badge>
              </div>

              <p className="text-xs text-muted-foreground">
                Максимальный размер: 5MB
              </p>

              <input
                type="file"
                className="hidden"
                accept=".txt"
                onChange={handleFileInput}
                id={`file-input-${label.replace(/\s+/g, '-').toLowerCase()}`}
              />
              
              <Button
                variant="outline"
                onClick={() => {
                  const input = document.getElementById(`file-input-${label.replace(/\s+/g, '-').toLowerCase()}`) as HTMLInputElement
                  input?.click()
                }}
                disabled={dragActive}
              >
                Выбрать файл
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Альтернативный ввод текста */}
      <div className="mt-4">
        <p className="text-sm font-medium mb-2">Или вставьте текст напрямую:</p>
        <textarea
          className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder={`Вставьте текст ${label.toLowerCase()} сюда...`}
          value={textValue || ''}
          onChange={(e) => {
            if (onTextInput) {
              onTextInput(e.target.value)
              // Если есть текст, убираем выбранный файл
              if (e.target.value.trim() && selectedFile) {
                onFileSelect(null)
              }
            }
          }}
        />
        {textValue && textValue.trim() && (
          <p className="text-xs text-green-600 mt-1">
            ✓ Текст введен ({textValue.length} символов)
          </p>
        )}
      </div>
    </div>
  )
}
