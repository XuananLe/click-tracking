import pool from "@/lib/db/connection"

export interface Product {
  id: number
  name: string
  description: string
  price: number
  image_url: string
  category: string
  stock: number
  rating: number
  is_new: boolean
  discount: number
  features: string[]
  specifications: Record<string, any>
  created_at: Date
  updated_at: Date
}

export interface CreateProductData {
  name: string
  description: string
  price: number
  image_url: string
  category: string
  stock: number
  is_new?: boolean
  discount?: number
  features?: string[]
  specifications?: Record<string, any>
}

export class ProductModel {
  static async findAll(category?: string, limit?: number, offset?: number): Promise<Product[]> {
    let query = "SELECT * FROM products"
    const params: any[] = []

    if (category) {
      query += " WHERE category = $1"
      params.push(category)
    }

    query += " ORDER BY created_at DESC"

    if (limit) {
      query += ` LIMIT $${params.length + 1}`
      params.push(limit)
    }

    if (offset) {
      query += ` OFFSET $${params.length + 1}`
      params.push(offset)
    }

    const result = await pool.query(query, params)
    return result.rows
  }

  static async findById(id: number): Promise<Product | null> {
    const query = "SELECT * FROM products WHERE id = $1"
    const result = await pool.query(query, [id])
    return result.rows[0] || null
  }

  static async create(productData: CreateProductData): Promise<Product> {
    const {
      name,
      description,
      price,
      image_url,
      category,
      stock,
      is_new = false,
      discount = 0,
      features = [],
      specifications = {},
    } = productData

    const query = `
      INSERT INTO products (name, description, price, image_url, category, stock, is_new, discount, features, specifications)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `

    const result = await pool.query(query, [
      name,
      description,
      price,
      image_url,
      category,
      stock,
      is_new,
      discount,
      features,
      specifications,
    ])
    return result.rows[0]
  }

  static async update(id: number, productData: Partial<CreateProductData>): Promise<Product> {
    const fields = Object.keys(productData).filter((key) => productData[key as keyof CreateProductData] !== undefined)
    const values = fields.map((field) => productData[field as keyof CreateProductData])

    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(", ")

    const query = `
      UPDATE products 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `

    const result = await pool.query(query, [id, ...values])
    return result.rows[0]
  }

  static async updateStock(id: number, quantity: number): Promise<Product> {
    const query = `
      UPDATE products 
      SET stock = stock - $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND stock >= $2
      RETURNING *
    `

    const result = await pool.query(query, [id, quantity])
    if (result.rows.length === 0) {
      throw new Error("Insufficient stock")
    }
    return result.rows[0]
  }

  static async search(searchTerm: string): Promise<Product[]> {
    const query = `
      SELECT * FROM products 
      WHERE name ILIKE $1 OR description ILIKE $1 OR category ILIKE $1
      ORDER BY created_at DESC
    `

    const result = await pool.query(query, [`%${searchTerm}%`])
    return result.rows
  }
}
