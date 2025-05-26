import pool from "@/lib/db/connection"

export interface Order {
  id: number
  user_id: number
  total_amount: number
  status: string
  shipping_address: string
  payment_method: string
  payment_status: string
  created_at: Date
  updated_at: Date
}

export interface OrderItem {
  id: number
  order_id: number
  product_id: number
  quantity: number
  price: number
  created_at: Date
}

export interface CreateOrderData {
  user_id: number
  total_amount: number
  shipping_address: string
  payment_method: string
  items: {
    product_id: number
    quantity: number
    price: number
  }[]
}

export class OrderModel {
  static async create(orderData: CreateOrderData): Promise<Order> {
    const client = await pool.connect()

    try {
      await client.query("BEGIN")

      // Create order
      const orderQuery = `
        INSERT INTO orders (user_id, total_amount, shipping_address, payment_method)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `

      const orderResult = await client.query(orderQuery, [
        orderData.user_id,
        orderData.total_amount,
        orderData.shipping_address,
        orderData.payment_method,
      ])

      const order = orderResult.rows[0]

      // Create order items
      for (const item of orderData.items) {
        const itemQuery = `
          INSERT INTO order_items (order_id, product_id, quantity, price)
          VALUES ($1, $2, $3, $4)
        `

        await client.query(itemQuery, [order.id, item.product_id, item.quantity, item.price])

        // Update product stock
        await client.query("UPDATE products SET stock = stock - $1 WHERE id = $2", [item.quantity, item.product_id])
      }

      await client.query("COMMIT")
      return order
    } catch (error) {
      await client.query("ROLLBACK")
      throw error
    } finally {
      client.release()
    }
  }

  static async findByUserId(userId: number): Promise<Order[]> {
    const query = "SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC"
    const result = await pool.query(query, [userId])
    return result.rows
  }

  static async findById(id: number): Promise<Order | null> {
    const query = "SELECT * FROM orders WHERE id = $1"
    const result = await pool.query(query, [id])
    return result.rows[0] || null
  }

  static async findOrderItems(orderId: number): Promise<OrderItem[]> {
    const query = `
      SELECT oi.*, p.name as product_name, p.image_url as product_image
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = $1
    `
    const result = await pool.query(query, [orderId])
    return result.rows
  }

  static async updateStatus(id: number, status: string): Promise<Order> {
    const query = `
      UPDATE orders 
      SET status = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `

    const result = await pool.query(query, [id, status])
    return result.rows[0]
  }
}
