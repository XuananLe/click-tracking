"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import Header from "@/components/header"
import Footer from "@/components/footer"

interface Order {
  id: number
  total_amount: number
  status: string
  created_at: string
}

export default function OrderConfirmationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const orderId = searchParams.get("id")

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
      return
    }

    if (user && orderId) {
      fetchOrder(orderId)
    }
  }, [user, authLoading, orderId, router])

  const fetchOrder = async (id: string) => {
    try {
      const token = localStorage.getItem("auth_token")
      const response = await fetch(`/api/orders/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setOrder(data.order)
      } else {
        setError("Failed to fetch order details")
      }
    } catch (error) {
      console.error("Error fetching order:", error)
      setError("Failed to load order details")
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 p-6">
          <div className="container mx-auto">
            <div className="flex h-96 items-center justify-center">
              <p className="text-lg">Loading order details...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (error || !order) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 p-6">
          <div className="container mx-auto max-w-2xl">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <h2 className="mb-2 text-2xl font-semibold">Order Not Found</h2>
                <p className="mb-6 text-muted-foreground">
                  {error || "We couldn't find the order you're looking for."}
                </p>
                <Button onClick={() => router.push("/orders")}>View All Orders</Button>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 p-6">
        <div className="container mx-auto max-w-2xl">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Order Confirmed!</CardTitle>
              <CardDescription>Your order has been placed successfully</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg bg-muted p-4">
                <div className="mb-2 text-sm font-medium text-muted-foreground">Order Number</div>
                <div className="text-lg font-bold">#{order.id}</div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Date</span>
                  <span>
                    {new Date(order.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Status</span>
                  <span className="capitalize">{order.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Total Amount</span>
                  <span>${Number(order.total_amount).toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-2 rounded-lg bg-muted p-4">
                <p className="font-medium">What happens next?</p>
                <ol className="ml-4 list-decimal space-y-1 text-sm">
                  <li>Your order will be processed and prepared for shipping.</li>
                  <li>You'll receive an email confirmation with your order details.</li>
                  <li>Once your order ships, we'll send you tracking information.</li>
                  <li>Your items will arrive within 3-5 business days.</li>
                </ol>
              </div>

              <div className="flex justify-center space-x-4">
                <Button variant="outline" onClick={() => router.push("/orders")}>
                  View All Orders
                </Button>
                <Button onClick={() => router.push("/products")}>Continue Shopping</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
