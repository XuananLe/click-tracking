import { type NextRequest, NextResponse } from "next/server"
import { UserModel } from "@/lib/models/User"
import { authenticateToken } from "@/lib/auth/middleware"

export async function PUT(request: NextRequest) {
  try {
    const user = await authenticateToken(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, phone, address } = await request.json()

    const updatedUser = await UserModel.update(user.id, {
      name,
      phone,
      address,
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
