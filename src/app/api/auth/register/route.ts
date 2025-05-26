import { type NextRequest, NextResponse } from "next/server"
import { UserModel } from "@/lib/models/User"
import { generateToken } from "@/lib/auth/middleware"

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, phone, address } = await request.json()

    // Validate input
    if (!email || !password || !name) {
      return NextResponse.json({ error: "Email, password, and name are required" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await UserModel.findByEmail(email)
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 })
    }

    // Create user
    const user = await UserModel.create({
      email,
      password,
      name,
      phone,
      address,
    })

    // Generate token
    const token = generateToken(user.id)

    return NextResponse.json(
      {
        user,
        token,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
