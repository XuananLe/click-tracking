import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: Request) {
  try {
    // Get tracking data from request
    const data = await request.json()

    console.log("Received tracking data:", JSON.stringify(data, null, 2))

    // Extract the necessary fields with fallbacks
    const sessionId = data.sessionInfo?.sessionId || data.data?.sessionId || "anonymous"
    const eventType = data.type || "UNKNOWN"
    const eventData = data.data || {}
    const clientInfo = data.clientInfo || null

    // Insert into database using tagged template
    await sql`
      INSERT INTO tracking_events (session_id, event_type, event_data, client_info)
      VALUES (${sessionId}, ${eventType}, ${JSON.stringify(eventData)}, ${clientInfo ? JSON.stringify(clientInfo) : null})
    `

    return NextResponse.json({
      success: true,
      message: "Tracking data received and stored",
    })
  } catch (error) {
    console.error("Error processing tracking data:", error)

    // Return more detailed error information for debugging
    return NextResponse.json(
      {
        success: false,
        message: "Failed to process tracking data",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
