import { type NextRequest, NextResponse } from "next/server"
import { OrderModel } from "@/lib/models/Order"
import { authenticateToken } from "@/lib/auth/middleware"

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateToken(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Lấy id từ URL param
    const url = new URL(request.url)
    // Cách lấy param "id" từ url.pathname
    // Ví dụ đường dẫn: /api/orders/123/items
    // Bạn có thể tách chuỗi pathname ra để lấy id
    const pathSegments = url.pathname.split("/")
    const idParam = pathSegments[pathSegments.length - 2]  // lấy phần id trước "items"

    const orderId = Number.parseInt(idParam)
    if (isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 })
    }

    // Kiểm tra order có thuộc user không
    const order = await OrderModel.findById(orderId)
    if (!order || order.user_id !== user.id) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const items = await OrderModel.findOrderItems(orderId)
    return NextResponse.json({ items })
  } catch (error) {
    console.error("Order items fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
