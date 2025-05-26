"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, ShoppingCart, Eye } from "lucide-react"
import { useTracker } from "@/lib/use-tracker"

interface Product {
  id: number
  name: string
  price: string | number // Can be string from DB or number
  image_url: string
  category: string
  rating: string | number // Can be string from DB or number
  is_new: boolean
  stock: number
  discount: number
}

export default function ProductList() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { trackEvent } = useTracker()

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/products")
        if (!response.ok) {
          throw new Error("Failed to fetch products")
        }
        const data = await response.json()
        setProducts(data.products || [])
      } catch (err) {
        console.error("Error fetching products:", err)
        setError("Failed to load products")
        // Fallback to sample data
        setProducts([
          {
            id: 1,
            name: "Wireless Headphones",
            price: 129.99,
            image_url: "https://placehold.co/300x300",
            category: "Electronics",
            rating: 4.5,
            is_new: true,
            stock: 15,
            discount: 10,
          },
          {
            id: 2,
            name: "Smart Watch",
            price: 199.99,
            image_url: "https://placehold.co/300x300",
            category: "Electronics",
            rating: 4.2,
            is_new: true,
            stock: 8,
            discount: 0,
          },
          // Add more fallback products as needed
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  const filteredProducts = activeCategory ? products.filter((product) => product.category === activeCategory) : products

  const handleCategoryClick = (category: string) => {
    setActiveCategory(category === activeCategory ? null : category)
    trackEvent({
      type: "FILTER_CLICK",
      data: {
        category,
        timestamp: new Date().toISOString(),
      },
    })
  }

  const handleProductClick = (productId: number, action: string) => {
    trackEvent({
      type: "PRODUCT_INTERACTION",
      data: {
        productId,
        action,
        timestamp: new Date().toISOString(),
      },
    })
  }

  const categories = Array.from(new Set(products.map((product) => product.category)))

  if (loading) {
    return (
      <section className="py-8 md:py-12">
        <div className="container px-4 md:px-6">
          <div className="flex items-center justify-center h-64">
            <p className="text-lg">Loading products...</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-8 md:py-12">
      <div className="container px-4 md:px-6">
        {error && (
          <div className="mb-4 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
            {error} - Showing sample data
          </div>
        )}

        <div className="mb-8 flex flex-wrap gap-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={activeCategory === category ? "default" : "outline"}
              onClick={() => handleCategoryClick(category)}
              className="rounded-full"
            >
              {category}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <div className="relative">
                <Link
                  href={`/product/${product.id}`}
                  className="cursor-pointer overflow-hidden"
                  onClick={() => handleProductClick(product.id, "view_details")}
                >
                  <Image
                    src={product.image_url || "https://placehold.co/300x300"}
                    alt={product.name}
                    width={300}
                    height={300}
                    className="h-[200px] w-full object-cover transition-transform hover:scale-105"
                  />
                </Link>
                {product.is_new && <Badge className="absolute left-2 top-2">New</Badge>}
                {product.discount > 0 && (
                  <Badge className="absolute right-2 top-2" variant="destructive">
                    -{product.discount}%
                  </Badge>
                )}
                <div className="absolute right-2 top-2 flex flex-col gap-2">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="rounded-full"
                    onClick={() => handleProductClick(product.id, "favorite")}
                  >
                    <Heart className="h-4 w-4" />
                    <span className="sr-only">Add to favorites</span>
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="rounded-full"
                    onClick={() => handleProductClick(product.id, "quick_view")}
                  >
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">Quick view</span>
                  </Button>
                </div>
              </div>
              <CardContent className="p-4">
                <div className="space-y-1">
                  <Link
                    href={`/product/${product.id}`}
                    className="font-semibold hover:underline"
                    onClick={() => handleProductClick(product.id, "view_details")}
                  >
                    {product.name}
                  </Link>
                  <p className="text-sm text-muted-foreground">{product.category}</p>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {product.discount > 0 ? (
                      <>
                        <span className="font-bold">
                          ${(Number(product.price) * (1 - product.discount / 100)).toFixed(2)}
                        </span>
                        <span className="text-sm text-muted-foreground line-through">
                          ${Number(product.price).toFixed(2)}
                        </span>
                      </>
                    ) : (
                      <span className="font-bold">${Number(product.price).toFixed(2)}</span>
                    )}
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-yellow-500">★</span>
                    <span className="ml-1 text-sm">{Number(product.rating).toFixed(1)}</span>
                  </div>
                </div>
                <p className="text-xs text-green-600 mt-1">
                  {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                </p>
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <Button
                  className="w-full"
                  onClick={() => handleProductClick(product.id, "add_to_cart")}
                  disabled={product.stock === 0}
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
