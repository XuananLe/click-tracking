import pool from "@/lib/db/connection"

export interface TrackingEvent {
  id: number
  session_id: string
  user_id?: number
  event_type: string
  event_data: Record<string, any>
  client_info?: Record<string, any>
  created_at: Date
}

export interface CreateTrackingEventData {
  session_id: string
  user_id?: number
  event_type: string
  event_data: Record<string, any>
  client_info?: Record<string, any>
}

export class TrackingEventModel {
  static async create(eventData: CreateTrackingEventData): Promise<TrackingEvent> {
    const query = `
      INSERT INTO tracking_events (session_id, user_id, event_type, event_data, client_info)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `

    const result = await pool.query(query, [
      eventData.session_id,
      eventData.user_id,
      eventData.event_type,
      JSON.stringify(eventData.event_data),
      eventData.client_info ? JSON.stringify(eventData.client_info) : null,
    ])

    return result.rows[0]
  }

  static async findBySessionId(sessionId: string): Promise<TrackingEvent[]> {
    const query = "SELECT * FROM tracking_events WHERE session_id = $1 ORDER BY created_at ASC"
    const result = await pool.query(query, [sessionId])
    return result.rows
  }

  static async findByUserId(userId: number, limit?: number): Promise<TrackingEvent[]> {
    let query = "SELECT * FROM tracking_events WHERE user_id = $1 ORDER BY created_at DESC"
    const params = [userId]

    if (limit) {
      query += " LIMIT $2"
      params.push(limit)
    }

    const result = await pool.query(query, params)
    return result.rows
  }

  static async getAnalytics(startDate?: Date, endDate?: Date): Promise<any> {
    let query = `
      SELECT 
        event_type,
        COUNT(*) as count,
        DATE_TRUNC('day', created_at) as date
      FROM tracking_events
    `

    const params: any[] = []
    const conditions: string[] = []

    if (startDate) {
      conditions.push(`created_at >= $${params.length + 1}`)
      params.push(startDate)
    }

    if (endDate) {
      conditions.push(`created_at <= $${params.length + 1}`)
      params.push(endDate)
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`
    }

    query += " GROUP BY event_type, DATE_TRUNC('day', created_at) ORDER BY date DESC"

    const result = await pool.query(query, params)
    return result.rows
  }
}
