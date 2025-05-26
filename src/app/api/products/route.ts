import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const limit = searchParams.get("limit") ? Number.parseInt(searchParams.get("limit")!) : undefined
    const offset = searchParams.get("offset") ? Number.parseInt(searchParams.get("offset")!) : undefined
    const search = searchParams.get("search")

    let products

    if (search && category) {
      // Search within category
      products = await sql`
        SELECT * FROM products 
        WHERE category = ${category} 
        AND (name ILIKE ${`%${search}%`} OR description ILIKE ${`%${search}%`})
        ORDER BY created_at DESC
        ${limit ? sql`LIMIT ${limit}` : sql``}
        ${offset ? sql`OFFSET ${offset}` : sql``}
      `
    } else if (search) {
      // Search all products
      products = await sql`
        SELECT * FROM products 
        WHERE name ILIKE ${`%${search}%`} OR description ILIKE ${`%${search}%`} OR category ILIKE ${`%${search}%`}
        ORDER BY created_at DESC
        ${limit ? sql`LIMIT ${limit}` : sql``}
        ${offset ? sql`OFFSET ${offset}` : sql``}
      `
    } else if (category) {
      // Filter by category
      products = await sql`
        SELECT * FROM products 
        WHERE category = ${category}
        ORDER BY created_at DESC
        ${limit ? sql`LIMIT ${limit}` : sql``}
        ${offset ? sql`OFFSET ${offset}` : sql``}
      `
    } else {
      // Get all products
      if (limit && offset) {
        products = await sql`
          SELECT * FROM products 
          ORDER BY created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `
      } else if (limit) {
        products = await sql`
          SELECT * FROM products 
          ORDER BY created_at DESC
          LIMIT ${limit}
        `
      } else {
        products = await sql`
          SELECT * FROM products 
          ORDER BY created_at DESC
        `
      }
    }

    return NextResponse.json({ products })
  } catch (error) {
    console.error("Products fetch error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
