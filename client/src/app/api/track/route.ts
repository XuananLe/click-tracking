import { NextResponse } from "next/server"


const BACKEND_URL = process.env.BACKEND_URL
export async function POST(request: Request) {
  try {
    const data = await request.json()

    console.log("Received tracking data:", JSON.stringify(data, null, 2))

    const res = await fetch(`${BACKEND_URL}/event-track`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data)
    })

    console.log("Response from backend:", res.status, await res.text())

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
