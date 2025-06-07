import { type NextRequest, NextResponse } from "next/server"
import { OrderModel } from "@/lib/models/Order"
import { authenticateToken } from "@/lib/auth/middleware"

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateToken(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Lấy id từ URL
    const url = new URL(request.url)
    const segments = url.pathname.split("/")
    // Đường dẫn: /api/orders/[id]
    const idParam = segments[segments.length - 1]

    const orderId = Number.parseInt(idParam)
    if (isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 })
    }

    const order = await OrderModel.findById(orderId)
    if (!order || order.user_id !== user.id) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error("Order fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
