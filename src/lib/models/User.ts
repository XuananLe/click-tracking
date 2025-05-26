import pool from "@/lib/db/connection"
import bcrypt from "bcryptjs"

export interface User {
  id: number
  email: string
  name: string
  phone?: string
  address?: string
  created_at: Date
  updated_at: Date
}

export interface CreateUserData {
  email: string
  password: string
  name: string
  phone?: string
  address?: string
}

export class UserModel {
  static async create(userData: CreateUserData): Promise<User> {
    const { email, password, name, phone, address } = userData
    const passwordHash = await bcrypt.hash(password, 12)

    const query = `
      INSERT INTO users (email, password_hash, name, phone, address)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, name, phone, address, created_at, updated_at
    `

    const result = await pool.query(query, [email, passwordHash, name, phone, address])
    return result.rows[0]
  }

  static async findByEmail(email: string): Promise<User | null> {
    const query = "SELECT id, email, name, phone, address, created_at, updated_at FROM users WHERE email = $1"
    const result = await pool.query(query, [email])
    return result.rows[0] || null
  }

  static async findById(id: number): Promise<User | null> {
    const query = "SELECT id, email, name, phone, address, created_at, updated_at FROM users WHERE id = $1"
    const result = await pool.query(query, [id])
    return result.rows[0] || null
  }

  static async verifyPassword(email: string, password: string): Promise<User | null> {
    const query =
      "SELECT id, email, password_hash, name, phone, address, created_at, updated_at FROM users WHERE email = $1"
    const result = await pool.query(query, [email])

    if (result.rows.length === 0) {
      return null
    }

    const user = result.rows[0]
    const isValid = await bcrypt.compare(password, user.password_hash)

    if (!isValid) {
      return null
    }

    // Remove password_hash from returned user
    const { password_hash, ...userWithoutPassword } = user
    return userWithoutPassword
  }

  static async update(id: number, userData: Partial<CreateUserData>): Promise<User> {
    const { name, phone, address } = userData
    const query = `
      UPDATE users 
      SET name = COALESCE($2, name), 
          phone = COALESCE($3, phone), 
          address = COALESCE($4, address),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, email, name, phone, address, created_at, updated_at
    `

    const result = await pool.query(query, [id, name, phone, address])
    return result.rows[0]
  }
}
