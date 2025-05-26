import jwt from "jsonwebtoken"
import type { NextRequest } from "next/server"
import { UserModel } from "@/lib/models/User"

export interface AuthenticatedRequest extends NextRequest {
  user?: any
}

export async function authenticateToken(request: NextRequest): Promise<any> {
  const authHeader = request.headers.get("authorization")
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) {
    return null
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const user = await UserModel.findById(decoded.userId)
    return user
  } catch (error) {
    return null
  }
}

export function generateToken(userId: number): string {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: "7d" })
}
