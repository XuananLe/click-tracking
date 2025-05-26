"use client"
import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { TrackingProvider } from "@/lib/use-tracker"
import ClickTracker from "@/components/click-tracker"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <TrackingProvider>
            <ClickTracker>{children}</ClickTracker>
          </TrackingProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
