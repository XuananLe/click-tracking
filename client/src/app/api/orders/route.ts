import { type NextRequest, NextResponse } from "next/server"
import { OrderModel } from "@/lib/models/Order"
import { CartModel } from "@/lib/models/Cart"
import { authenticateToken } from "@/lib/auth/middleware"

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateToken(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const orders = await OrderModel.findByUserId(user.id)
    return NextResponse.json({ orders })
  } catch (error) {
    console.error("Orders fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateToken(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { shipping_address, payment_method, items } = await request.json()

    if (!shipping_address || !payment_method || !items || items.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Calculate total amount
    const total_amount = items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0)

    const order = await OrderModel.create({
      user_id: user.id,
      total_amount,
      shipping_address,
      payment_method,
      items,
    })

    // Clear cart after successful order
    await CartModel.clearCart(user.id)

    return NextResponse.json({ order }, { status: 201 })
  } catch (error) {
    console.error("Order creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
