"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function SetupPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSetup = async () => {
    setIsLoading(true)
    setMessage("")

    try {
      const response = await fetch("/api/setup", {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok) {
        setMessage("Database setup completed successfully!")
        setIsSuccess(true)
      } else {
        setMessage(`Setup failed: ${data.message || data.error}`)
        setIsSuccess(false)
      }
    } catch (error) {
      setMessage(`Setup failed: ${error instanceof Error ? error.message : "Unknown error"}`)
      setIsSuccess(false)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Database Setup</CardTitle>
          <CardDescription>Initialize your database with the required tables and sample data.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleSetup} disabled={isLoading} className="w-full">
            {isLoading ? "Setting up..." : "Setup Database"}
          </Button>

          {message && (
            <div className={`p-4 rounded-md ${isSuccess ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
              {message}
            </div>
          )}

          {isSuccess && (
            <div className="text-center">
              <Button asChild>
                <Link href="/">Go to Home Page</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
