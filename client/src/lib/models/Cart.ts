import pool from "@/lib/db/connection"

export interface CartItem {
  id: number
  user_id: number
  product_id: number
  quantity: number
  created_at: Date
  updated_at: Date
  product_name?: string
  product_price?: number
  product_image?: string
}

export class CartModel {
  static async addItem(userId: number, productId: number, quantity: number): Promise<CartItem> {
    const query = `
      INSERT INTO cart_items (user_id, product_id, quantity)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, product_id)
      DO UPDATE SET quantity = cart_items.quantity + $3, updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `

    const result = await pool.query(query, [userId, productId, quantity])
    return result.rows[0]
  }

  static async getItems(userId: number): Promise<CartItem[]> {
    const query = `
      SELECT ci.*, p.name as product_name, p.price as product_price, p.image_url as product_image
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = $1
      ORDER BY ci.created_at DESC
    `

    const result = await pool.query(query, [userId])
    return result.rows
  }

  static async updateQuantity(userId: number, productId: number, quantity: number): Promise<CartItem> {
    const query = `
      UPDATE cart_items 
      SET quantity = $3, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1 AND product_id = $2
      RETURNING *
    `

    const result = await pool.query(query, [userId, productId, quantity])
    return result.rows[0]
  }

  static async removeItem(userId: number, productId: number): Promise<void> {
    const query = "DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2"
    await pool.query(query, [userId, productId])
  }

  static async clearCart(userId: number): Promise<void> {
    const query = "DELETE FROM cart_items WHERE user_id = $1"
    await pool.query(query, [userId])
  }
}
