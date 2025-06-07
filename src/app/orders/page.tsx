"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Package, Calendar, CreditCard, MapPin, Eye } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import Header from "@/components/header"
import Footer from "@/components/footer"

interface OrderItem {
  id: number
  product_name: string
  quantity: number
  price: number
  product_image?: string
}

interface Order {
  id: number
  total_amount: number
  status: string
  shipping_address: string
  payment_method: string
  payment_status: string
  created_at: string
  items?: OrderItem[]
}

export default function OrdersPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
      return
    }

    if (user) {
      fetchOrders()
    }
  }, [user, authLoading, router])

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("auth_token")
      const response = await fetch("/api/orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
      } else {
        setError("Failed to fetch orders")
      }
    } catch (error) {
      console.error("Error fetching orders:", error)
      setError("Failed to load orders")
    } finally {
      setLoading(false)
    }
  }

  const fetchOrderItems = async (orderId: number) => {
    try {
      const token = localStorage.getItem("auth_token")
      const response = await fetch(`/api/orders/${orderId}/items`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, items: data.items } : order)))
      }
    } catch (error) {
      console.error("Error fetching order items:", error)
    }
  }

  const toggleOrderDetails = (orderId: number) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null)
    } else {
      setExpandedOrder(orderId)
      const order = orders.find((o) => o.id === orderId)
      if (order && !order.items) {
        fetchOrderItems(orderId)
      }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "processing":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "shipped":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "delivered":
        return "bg-green-100 text-green-800 border-green-200"
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "bg-green-100 text-green-800 border-green-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "failed":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const formatPaymentMethod = (method: string) => {
    switch (method.toLowerCase()) {
      case "credit_card":
        return "Credit Card"
      case "debit_card":
        return "Debit Card"
      case "paypal":
        return "PayPal"
      case "bank_transfer":
        return "Bank Transfer"
      default:
        return method
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 p-6">
          <div className="container mx-auto">
            <div className="flex h-96 items-center justify-center">
              <p className="text-lg">Loading orders...</p>
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

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 p-6">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">My Orders</h1>
            <p className="text-muted-foreground">Track and manage your order history</p>
          </div>

          {error && (
            <Card className="mb-6 border-red-200">
              <CardContent className="pt-6">
                <p className="text-red-600">{error}</p>
              </CardContent>
            </Card>
          )}

          {orders.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  You haven't placed any orders yet. Start shopping to see your orders here.
                </p>
                <Button onClick={() => router.push("/products")}>Start Shopping</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <Card key={order.id} className="overflow-hidden">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Package className="h-5 w-5" />
                          Order #{order.id}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-4 mt-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(order.created_at).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            <CreditCard className="h-4 w-4" />
                            {formatPaymentMethod(order.payment_method)}
                          </span>
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">${Number(order.total_amount).toFixed(2)}</div>
                        <div className="flex gap-2 mt-2">
                          <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                          <Badge className={getPaymentStatusColor(order.payment_status)}>{order.payment_status}</Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Shipping Address</p>
                          <p className="text-sm text-muted-foreground">{order.shipping_address}</p>
                        </div>
                      </div>

                      <Separator />

                      <div className="flex justify-between items-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleOrderDetails(order.id)}
                          className="flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          {expandedOrder === order.id ? "Hide Details" : "View Details"}
                        </Button>
                      </div>

                      {expandedOrder === order.id && (
                        <div className="space-y-4 pt-4 border-t">
                          <h4 className="font-medium">Order Items</h4>
                          {order.items ? (
                            <div className="space-y-3">
                              {order.items.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-background rounded border flex items-center justify-center">
                                      <Package className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                    <div>
                                      <p className="font-medium">{item.product_name}</p>
                                      <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-medium">${Number(item.price).toFixed(2)}</p>
                                    <p className="text-sm text-muted-foreground">
                                      Total: ${(Number(item.price) * item.quantity).toFixed(2)}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="flex items-center justify-center py-4">
                              <p className="text-muted-foreground">Loading order details...</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
