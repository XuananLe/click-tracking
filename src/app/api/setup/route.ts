import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST() {
  try {
    // Create tracking_events table
    await sql`
      CREATE TABLE IF NOT EXISTS tracking_events (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(255) NOT NULL,
        user_id INTEGER,
        event_type VARCHAR(100) NOT NULL,
        event_data JSONB NOT NULL,
        client_info JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create indexes for better performance
    await sql`
      CREATE INDEX IF NOT EXISTS idx_tracking_events_session_id ON tracking_events(session_id)
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_tracking_events_created_at ON tracking_events(created_at)
    `

    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create products table
    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        image_url VARCHAR(500),
        category VARCHAR(100) NOT NULL,
        stock INTEGER DEFAULT 0,
        rating DECIMAL(3,2) DEFAULT 0,
        is_new BOOLEAN DEFAULT false,
        discount INTEGER DEFAULT 0,
        features TEXT[],
        specifications JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Check if products already exist
    const existingProducts = await sql`SELECT COUNT(*) as count FROM products`
    const productCount = Number(existingProducts[0].count)

    if (productCount === 0) {
      // Insert sample products one by one
      await sql`
        INSERT INTO products (name, description, price, image_url, category, stock, rating, is_new, discount, features, specifications)
        VALUES (
          'Wireless Headphones', 
          'Experience premium sound quality with these wireless headphones.', 
          129.99, 
          '/placeholder.svg', 
          'Electronics', 
          15, 
          4.5, 
          true, 
          10, 
          ARRAY['Active Noise Cancellation', '40-hour Battery Life', 'Bluetooth 5.0'], 
          '{"Brand": "AudioTech", "Model": "WH-1000", "Color": "Black"}'::jsonb
        )
      `

      await sql`
        INSERT INTO products (name, description, price, image_url, category, stock, rating, is_new, discount, features, specifications)
        VALUES (
          'Smart Watch', 
          'Stay connected and track your fitness with this advanced smartwatch.', 
          199.99, 
          '/placeholder.svg', 
          'Electronics', 
          8, 
          4.2, 
          true, 
          0, 
          ARRAY['Heart Rate Monitor', 'GPS Tracking', 'Water Resistant'], 
          '{"Brand": "TechFit", "Model": "SW-200", "Color": "Silver"}'::jsonb
        )
      `

      await sql`
        INSERT INTO products (name, description, price, image_url, category, stock, rating, is_new, discount, features, specifications)
        VALUES (
          'Running Shoes', 
          'Engineered for performance and comfort, these running shoes feature responsive cushioning.', 
          89.99, 
          '/placeholder.svg', 
          'Fashion', 
          22, 
          4.7, 
          false, 
          15, 
          ARRAY['Breathable Mesh Upper', 'Responsive Cushioning'], 
          '{"Brand": "SpeedRun", "Model": "Boost 3.0", "Color": "Blue/White"}'::jsonb
        )
      `

      await sql`
        INSERT INTO products (name, description, price, image_url, category, stock, rating, is_new, discount, features, specifications)
        VALUES (
          'Smartphone', 
          'The latest flagship smartphone with cutting-edge features.', 
          699.99, 
          '/placeholder.svg', 
          'Electronics', 
          5, 
          4.8, 
          false, 
          0, 
          ARRAY['6.5-inch OLED Display', 'Triple Camera System', '5G Connectivity'], 
          '{"Brand": "TechPro", "Model": "Galaxy X", "Color": "Midnight Blue"}'::jsonb
        )
      `

      await sql`
        INSERT INTO products (name, description, price, image_url, category, stock, rating, is_new, discount, features, specifications)
        VALUES (
          'Laptop', 
          'Powerful and portable laptop for professionals and creatives.', 
          1299.99, 
          '/placeholder.svg', 
          'Electronics', 
          3, 
          4.6, 
          false, 
          5, 
          ARRAY['15.6-inch 4K Display', 'Intel Core i7 Processor', '16GB RAM'], 
          '{"Brand": "TechBook", "Model": "Pro X15", "Color": "Silver"}'::jsonb
        )
      `

      await sql`
        INSERT INTO products (name, description, price, image_url, category, stock, rating, is_new, discount, features, specifications)
        VALUES (
          'Backpack', 
          'Durable and stylish backpack for everyday use.', 
          59.99, 
          '/placeholder.svg', 
          'Fashion', 
          30, 
          4.3, 
          false, 
          0, 
          ARRAY['Water Resistant', 'Multiple Compartments', 'Ergonomic Design'], 
          '{"Brand": "AdventurePack", "Model": "Explorer", "Color": "Black"}'::jsonb
        )
      `

      await sql`
        INSERT INTO products (name, description, price, image_url, category, stock, rating, is_new, discount, features, specifications)
        VALUES (
          'Coffee Maker', 
          'Brew the perfect cup of coffee every morning.', 
          79.99, 
          '/placeholder.svg', 
          'Home', 
          12, 
          4.4, 
          false, 
          0, 
          ARRAY['Programmable Timer', 'Auto Shut-off', '12-cup Capacity'], 
          '{"Brand": "BrewMaster", "Model": "Pro", "Color": "Stainless Steel"}'::jsonb
        )
      `

      await sql`
        INSERT INTO products (name, description, price, image_url, category, stock, rating, is_new, discount, features, specifications)
        VALUES (
          'Fitness Tracker', 
          'Track your daily activities and health metrics.', 
          49.99, 
          '/placeholder.svg', 
          'Electronics', 
          25, 
          4.1, 
          true, 
          0, 
          ARRAY['Step Counter', 'Sleep Tracking', 'Heart Rate Monitor'], 
          '{"Brand": "FitLife", "Model": "Active", "Color": "Black"}'::jsonb
        )
      `
    }

    return NextResponse.json({
      success: true,
      message: "Database setup completed successfully",
      productsCreated: productCount === 0 ? 8 : 0,
    })
  } catch (error) {
    console.error("Database setup error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Database setup failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
