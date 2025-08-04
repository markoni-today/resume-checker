import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

export const metadata: Metadata = {
  title: 'Resume Checker 1.0 (alpha)',
  description: 'Проверьте совместимость вашего резюме с российскими ATS системами',
  keywords: ['резюме', 'ATS', 'работа', 'карьера', 'анализ резюме'],
  authors: [{ name: 'Resume Checker Team' }],
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          {children}
        </div>
      </body>
    </html>
  )
}