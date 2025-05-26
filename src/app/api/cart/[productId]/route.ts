import { type NextRequest, NextResponse } from "next/server"
import { CartModel } from "@/lib/models/Cart"
import { authenticateToken } from "@/lib/auth/middleware"

export async function PUT(request: NextRequest) {
  try {
    const user = await authenticateToken(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const productId = Number.parseInt(request.nextUrl.pathname.split("/").pop()!)
    const { quantity } = await request.json()

    const cartItem = await CartModel.updateQuantity(user.id, productId, quantity)
    return NextResponse.json({ cartItem })
  } catch (error) {
    console.error("Cart update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await authenticateToken(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const productId = Number.parseInt(request.nextUrl.pathname.split("/").pop()!)
    await CartModel.removeItem(user.id, productId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Cart remove error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
