import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AdminNavigation } from '@/components/layout/AdminNavigation'
import { ErrorBoundary } from '@/components/common'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Club Corra Admin',
  description: 'Admin portal for Club Corra loyalty and rewards system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <div className="min-h-screen bg-background">
            <AdminNavigation />
            <main className="flex-1 p-6">
              {children}
            </main>
          </div>
        </ErrorBoundary>
      </body>
    </html>
  )
}
