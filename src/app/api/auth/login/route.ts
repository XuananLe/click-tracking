import { type NextRequest, NextResponse } from "next/server"
import { UserModel } from "@/lib/models/User"
import { generateToken } from "@/lib/auth/middleware"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Verify user credentials
    const user = await UserModel.verifyPassword(email, password)
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Generate token
    const token = generateToken(user.id)

    return NextResponse.json({
      user,
      token,
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
