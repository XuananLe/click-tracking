"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface OrderItem {
  id: number
  product_name: string
  quantity: number
  price: number
}

interface Order {
  id: number
  total_amount: number
  status: string
  created_at: string
  items?: OrderItem[]
}

export function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null)

  useEffect(() => {
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
          console.error("Failed to fetch orders")
        }
      } catch (error) {
        console.error("Error fetching orders:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

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
        return "bg-yellow-100 text-yellow-800"
      case "processing":
        return "bg-blue-100 text-blue-800"
      case "shipped":
        return "bg-purple-100 text-purple-800"
      case "delivered":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p>Loading order history...</p>
        </CardContent>
      </Card>
    )
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
          <CardDescription>Your past orders will appear here</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No orders found.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order History</CardTitle>
        <CardDescription>View your past orders and their status</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Order #{order.id}</h3>
                <p className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">${Number(order.total_amount).toFixed(2)}</p>
                <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
              </div>
            </div>

            <div className="mt-2">
              <Button variant="outline" size="sm" onClick={() => toggleOrderDetails(order.id)}>
                {expandedOrder === order.id ? "Hide Details" : "View Details"}
              </Button>
            </div>

            {expandedOrder === order.id && order.items && (
              <div className="mt-4 space-y-2">
                <h4 className="font-medium">Order Items:</h4>
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>
                      {item.product_name} x {item.quantity}
                    </span>
                    <span>${Number(item.price).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
