import { type NextRequest, NextResponse } from "next/server"
import { CartModel } from "@/lib/models/Cart"
import { authenticateToken } from "@/lib/auth/middleware"

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateToken(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const cartItems = await CartModel.getItems(user.id)
    return NextResponse.json({ cartItems })
  } catch (error) {
    console.error("Cart fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateToken(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { productId, quantity } = await request.json()

    if (!productId || !quantity) {
      return NextResponse.json({ error: "Product ID and quantity are required" }, { status: 400 })
    }

    const cartItem = await CartModel.addItem(user.id, productId, quantity)
    return NextResponse.json({ cartItem }, { status: 201 })
  } catch (error) {
    console.error("Cart add error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
