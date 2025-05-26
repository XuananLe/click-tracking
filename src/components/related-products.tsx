"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Eye } from "lucide-react"
import { useTracker } from "@/lib/use-tracker"
import { Product } from "@/lib/models/Product"

export default function RelatedProducts({
  currentProductId,
  category,
}: {
  currentProductId: number
  category: string
}) {
  const { trackEvent } = useTracker()
  const hasTrackedImpressionRef = useRef(false)
  const [products, setProducts] = useState<any[]>([])

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`/api/products?category=${category}`)
        if (response.ok) {
          const data = await response.json()
          setProducts(data.products || [])
        }
      } catch (error) {
        console.error("Error fetching related products:", error)
      }
    }

    fetchProducts()
  }, [category])

  // Track impression of related products
  useEffect(() => {
    // Only track once per component mount
    if (!hasTrackedImpressionRef.current) {
      // Use setTimeout to avoid render loops
      const timerId = setTimeout(() => {
        trackEvent({
          type: "RELATED_PRODUCTS_IMPRESSION",
          data: {
            sourceProductId: currentProductId,
            category: category,
            timestamp: new Date().toISOString(),
          },
        })
        hasTrackedImpressionRef.current = true
      }, 1000)

      return () => clearTimeout(timerId)
    }
  }, [currentProductId, category, trackEvent])

  // Filter related products (same category, excluding current product)
  const relatedProducts = products
    .filter((product) => product.category === category && product.id !== currentProductId)
    .slice(0, 4)

  const handleRelatedProductClick = (productId: number) => {
    trackEvent({
      type: "RELATED_PRODUCT_CLICK",
      data: {
        sourceProductId: currentProductId,
        targetProductId: productId,
        timestamp: new Date().toISOString(),
      },
    })
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {relatedProducts.map((product : Product) => (
        <Card key={product.id} className="overflow-hidden">
          <div className="relative">
            <Link href={`/product/${product.id}`} onClick={() => handleRelatedProductClick(product.id)}>
              <Image
                src={product.image || "https://placehold.co/300x300"}
                alt={product.name}
                width={300}
                height={300}
                className="h-[200px] w-full object-cover transition-transform hover:scale-105"
              />
            </Link>
            {product.isNew && <Badge className="absolute left-2 top-2">Mới</Badge>}
          </div>
          <CardContent className="p-4">
            <Link
              href={`/product/${product.id}`}
              className="hover:underline"
              onClick={() => handleRelatedProductClick(product.id)}
            >
              <h3 className="font-semibold">{product.name}</h3>
            </Link>
            <p className="text-sm text-muted-foreground">{product.category}</p>
            <div className="mt-2 flex items-center justify-between">
              <span className="font-bold">${Number(product.price).toFixed(2)}</span>
              <div className="flex items-center">
                <span className="text-sm text-yellow-500">★</span>
                <span className="ml-1 text-sm">{Number(product.rating).toFixed(1)}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="p-4 pt-0">
            <div className="flex w-full gap-2">
              <Button
                variant="outline"
                size="icon"
                className="flex-grow"
                onClick={() => {
                  trackEvent({
                    type: "QUICK_VIEW",
                    data: {
                      productId: product.id,
                      productName: product.name,
                      fromRelated: true,
                      sourceProductId: currentProductId,
                      timestamp: new Date().toISOString(),
                    },
                  })
                }}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                className="flex-grow"
                onClick={() => {
                  trackEvent({
                    type: "ADD_TO_CART",
                    data: {
                      productId: product.id,
                      productName: product.name,
                      price: Number(product.price),
                      quantity: 1,
                      fromRelated: true,
                      sourceProductId: currentProductId,
                      timestamp: new Date().toISOString(),
                    },
                  })
                }}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Thêm
              </Button>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
