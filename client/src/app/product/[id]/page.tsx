"use client"

import type React from "react"

import { useEffect, useState, useRef, useCallback } from "react"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Heart, Share2, ShoppingCart, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useTracker } from "@/lib/use-tracker"
import Header from "@/components/header"
import Footer from "@/components/footer"
import RelatedProducts from "@/components/related-products"
import { useCart } from "@/context/CartContext"

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { trackEvent } = useTracker()
  const { addToCart } = useCart()
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const viewStartTimeRef = useRef<number>(0)
  const viewedSectionsRef = useRef<Set<string>>(new Set())
  const hasTrackedProductViewRef = useRef(false)
  const productIdRef = useRef<number | null>(null)

  // Memoize the trackSectionView function to avoid recreating it on each render
  const trackSectionView = useCallback(
    (sectionName: string) => {
      if (!product || viewedSectionsRef.current.has(sectionName)) {
        return
      }

      viewedSectionsRef.current.add(sectionName)

      trackEvent({
        type: "SECTION_VIEW",
        data: {
          pageType: "product",
          productId: product.id,
          sectionName: sectionName,
          timestamp: new Date().toISOString(),
        },
      })
    },
    [product, trackEvent],
  )

  // Load product data
  useEffect(() => {
    const loadProduct = async () => {
      try {
        const productId = Number(params.id)
        productIdRef.current = productId

        const response = await fetch(`/api/products/${productId}`)
        if (!response.ok) {
          if (response.status === 404) {
            router.push("/")
            return
          }
          throw new Error("Failed to fetch product")
        }

        const data = await response.json()
        setProduct(data.product)
        viewStartTimeRef.current = Date.now()

        // Reset viewed sections when product changes
        viewedSectionsRef.current = new Set()
        hasTrackedProductViewRef.current = false
      } catch (error) {
        console.error("Error loading product:", error)
        router.push("/")
      } finally {
        setLoading(false)
      }
    }

    loadProduct()
  }, [params.id, router])

  // Track product view (separate from product loading to avoid render loops)
  useEffect(() => {
    if (product && !hasTrackedProductViewRef.current) {
      // Use setTimeout to delay tracking and avoid render loops
      const timerId = setTimeout(() => {
        trackEvent({
          type: "PRODUCT_VIEW",
          data: {
            productId: product.id,
            productName: product.name,
            category: product.category,
            price: product.price,
            timestamp: new Date().toISOString(),
          },
        })
        hasTrackedProductViewRef.current = true
      }, 500)

      return () => clearTimeout(timerId)
    }
  }, [product, trackEvent])

  // Track time spent on page when user leaves
  useEffect(() => {
    return () => {
      if (viewStartTimeRef.current > 0 && productIdRef.current !== null && product) {
        const duration = Math.floor((Date.now() - viewStartTimeRef.current) / 1000) // duration in seconds
        trackEvent({
          type: "PAGE_DURATION",
          data: {
            pageType: "product",
            productId: productIdRef.current,
            productName: product.name,
            durationSeconds: duration,
            timestamp: new Date().toISOString(),
          },
        })
      }
    }
  }, [trackEvent, product])

  const handleAddToCart = () => {
    if (product) {
      trackEvent({
        type: "ADD_TO_CART",
        data: {
          productId: product.id,
          productName: product.name,
          price: Number(product.price),
          quantity: quantity,
          totalValue: Number(product.price) * quantity,
          timestamp: new Date().toISOString(),
        },
      })

      addToCart(product.id, product.name, Number(product.price), quantity)
    }
  }

  const handleTabChange = (value: string) => {
    if (product) {
      trackEvent({
        type: "PRODUCT_TAB_VIEW",
        data: {
          productId: product.id,
          productName: product.name,
          tabName: value,
          timestamp: new Date().toISOString(),
        },
      })
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 p-6">
          <div className="container mx-auto">
            <div className="flex h-96 items-center justify-center">
              <p className="text-lg">Đang tải sản phẩm...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 p-6">
          <div className="container mx-auto">
            <div className="flex h-96 items-center justify-center">
              <p className="text-lg">Không tìm thấy sản phẩm</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const originalPrice = Number(product.price)
  const discountedPrice = product.discount
    ? Number(product.price) * (1 - product.discount / 100)
    : Number(product.price)

  // Use data attributes for section tracking instead of onMouseEnter
  const handleSectionMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    const sectionName = e.currentTarget.dataset.section
    if (sectionName) {
      setTimeout(() => trackSectionView(sectionName), 300)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 p-4 md:p-6">
        <div className="container mx-auto">
          <Button
            variant="ghost"
            className="mb-4 flex items-center gap-1"
            onClick={() => {
              trackEvent({
                type: "NAVIGATION",
                data: {
                  from: `product/${product.id}`,
                  to: "/",
                  timestamp: new Date().toISOString(),
                },
              })
              router.push("/")
            }}
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Button>

          <div className="grid gap-8 md:grid-cols-2">
            <div
              className="relative"
              data-section="product_image"
              onMouseEnter={handleSectionMouseEnter}
              onClick={() =>
                trackEvent({
                  type: "PRODUCT_IMAGE_CLICK",
                  data: {
                    productId: product.id,
                    productName: product.name,
                    timestamp: new Date().toISOString(),
                  },
                })
              }
            >
              <div className="overflow-hidden rounded-lg border bg-white">
                <Image
                  src={product.image || "/placeholder.svg"}
                  alt={product.name}
                  width={500}
                  height={500}
                  className="h-auto w-full object-contain p-4"
                />
              </div>
              {product.isNew && (
                <Badge className="absolute left-2 top-2" variant="default">
                  Mới
                </Badge>
              )}
              {product.discount > 0 && (
                <Badge className="absolute right-2 top-2" variant="destructive">
                  -{product.discount}%
                </Badge>
              )}
            </div>

            <div className="space-y-6" data-section="product_info" onMouseEnter={handleSectionMouseEnter}>
              <div>
                <h1 className="text-3xl font-bold">{product.name}</h1>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex items-center">
                    {Array(5)
                      .fill(0)
                      .map((_, i) => (
                        <Star
                          key={i}
                          className={`h-5 w-5 ${i < Math.floor(product.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                        />
                      ))}
                  </div>
                  <span className="text-sm text-muted-foreground">({Number(product.rating).toFixed(1)})</span>
                  {/* <span className="text-sm text-muted-foreground">{product.reviews.length} đánh giá</span> */}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  {product.discount > 0 ? (
                    <>
                      <span className="text-3xl font-bold">${discountedPrice.toFixed(2)}</span>
                      <span className="text-xl text-muted-foreground line-through">${originalPrice.toFixed(2)}</span>
                    </>
                  ) : (
                    <span className="text-3xl font-bold">${Number(product.price).toFixed(2)}</span>
                  )}
                </div>
                <p className="text-sm text-green-600">
                  {product.stock > 0 ? `Còn ${product.stock} sản phẩm` : "Hết hàng"}
                </p>
              </div>

              <div>
                <p className="text-muted-foreground">{product.description}</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center">
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-r-none"
                      onClick={() => {
                        if (quantity > 1) setQuantity(quantity - 1)
                        trackEvent({
                          type: "QUANTITY_CHANGE",
                          data: {
                            productId: product.id,
                            productName: product.name,
                            newQuantity: quantity > 1 ? quantity - 1 : 1,
                            timestamp: new Date().toISOString(),
                          },
                        })
                      }}
                      disabled={quantity <= 1}
                    >
                      -
                    </Button>
                    <div className="flex h-10 w-14 items-center justify-center border-y bg-background">{quantity}</div>
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-l-none"
                      onClick={() => {
                        setQuantity(quantity + 1)
                        trackEvent({
                          type: "QUANTITY_CHANGE",
                          data: {
                            productId: product.id,
                            productName: product.name,
                            newQuantity: quantity + 1,
                            timestamp: new Date().toISOString(),
                          },
                        })
                      }}
                      disabled={quantity >= product.stock}
                    >
                      +
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4">
                  <Button className="flex-1" size="lg" onClick={handleAddToCart} disabled={product.stock <= 0}>
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Thêm vào giỏ hàng
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-11 w-11"
                    onClick={() =>
                      trackEvent({
                        type: "WISHLIST_ADD",
                        data: {
                          productId: product.id,
                          productName: product.name,
                          timestamp: new Date().toISOString(),
                        },
                      })
                    }
                  >
                    <Heart className="h-5 w-5" />
                    <span className="sr-only">Thêm vào danh sách yêu thích</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-11 w-11"
                    onClick={() =>
                      trackEvent({
                        type: "PRODUCT_SHARE",
                        data: {
                          productId: product.id,
                          productName: product.name,
                          timestamp: new Date().toISOString(),
                        },
                      })
                    }
                  >
                    <Share2 className="h-5 w-5" />
                    <span className="sr-only">Chia sẻ sản phẩm</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-8" />

          <Tabs defaultValue="features" className="mt-8" onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-3 md:w-auto">
              <TabsTrigger value="features">Tính năng</TabsTrigger>
              <TabsTrigger value="specifications">Thông số kỹ thuật</TabsTrigger>
              <TabsTrigger value="reviews">Đánh giá</TabsTrigger>
            </TabsList>
            <TabsContent
              value="features"
              className="mt-4 space-y-4"
              data-section="features"
              onMouseEnter={handleSectionMouseEnter}
            >
              <div className="rounded-lg border p-6">
                <h3 className="mb-4 text-lg font-semibold">Tính năng nổi bật</h3>
                <ul className="space-y-2">
                  {product.features.map((feature: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2 text-green-500">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </TabsContent>
            <TabsContent
              value="specifications"
              className="mt-4 space-y-4"
              data-section="specifications"
              onMouseEnter={handleSectionMouseEnter}
            >
              <div className="rounded-lg border p-6">
                <h3 className="mb-4 text-lg font-semibold">Thông số kỹ thuật</h3>
                <div className="space-y-2">
                  {Object.entries(product.specifications).map(([key, value]: [string, any], index: number) => (
                    <div key={index} className="grid grid-cols-2 gap-4 border-b py-2 last:border-0">
                      <span className="font-medium">{key}</span>
                      <span>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
            <TabsContent
              value="reviews"
              className="mt-4 space-y-4"
              data-section="reviews"
              onMouseEnter={handleSectionMouseEnter}
            >
              {/* <div className="rounded-lg border p-6">
                <h3 className="mb-4 text-lg font-semibold">Đánh giá từ khách hàng</h3>
                {product.reviews.length > 0 ? (
                  <div className="space-y-4">
                    {product.reviews.map((review: any) => (
                      <div key={review.id} className="space-y-2 border-b pb-4 last:border-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{review.user}</span>
                          <span className="text-sm text-muted-foreground">{review.date}</span>
                        </div>
                        <div className="flex items-center">
                          {Array(5)
                            .fill(0)
                            .map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                              />
                            ))}
                        </div>
                        <p className="text-sm">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Chưa có đánh giá nào cho sản phẩm này.</p>
                )}
              </div> */}
            </TabsContent>
          </Tabs>

          <div className="mt-12" data-section="related_products" onMouseEnter={handleSectionMouseEnter}>
            <h2 className="mb-6 text-2xl font-bold">Sản phẩm liên quan</h2>
            <RelatedProducts currentProductId={product.id} category={product.category} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
