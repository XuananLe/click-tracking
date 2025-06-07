"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag } from "lucide-react"
import { useCart } from "@/context/CartContext"
import { useAuth } from "@/context/AuthContext"
import { useTracker } from "@/lib/use-tracker"
import Header from "@/components/header"
import Footer from "@/components/footer"

export default function CartPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { cartItems, updateQuantity, removeFromCart, totalAmount, clearCart } = useCart()
  const { trackEvent } = useTracker()
  const [couponCode, setCouponCode] = useState("")
  const [couponError, setCouponError] = useState("")

  const handleQuantityChange = (productId: number, newQuantity: number) => {
    if (newQuantity < 1) return

    updateQuantity(productId, newQuantity)
    trackEvent({
      type: "CART_UPDATE_QUANTITY",
      data: {
        productId,
        quantity: newQuantity,
        timestamp: new Date().toISOString(),
      },
    })
  }

  const handleRemoveItem = (productId: number, productName: string) => {
    removeFromCart(productId)
    trackEvent({
      type: "CART_REMOVE_ITEM",
      data: {
        productId,
        productName,
        timestamp: new Date().toISOString(),
      },
    })
  }

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code")
      return
    }

    // In a real app, you would validate the coupon code with the server
    setCouponError("Invalid or expired coupon code")

    trackEvent({
      type: "COUPON_ATTEMPT",
      data: {
        code: couponCode,
        success: false,
        timestamp: new Date().toISOString(),
      },
    })
  }

  const handleCheckout = () => {
    if (user) {
      router.push("/checkout")
    } else {
      router.push("/login?redirect=checkout")
    }

    trackEvent({
      type: "CHECKOUT_CLICK",
      data: {
        itemCount: cartItems.length,
        totalAmount,
        timestamp: new Date().toISOString(),
      },
    })
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 p-6">
        <div className="container mx-auto max-w-6xl">
          <h1 className="mb-6 text-3xl font-bold">Shopping Cart</h1>

          {cartItems.length === 0 ? (
            <Card className="text-center">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ShoppingBag className="mb-4 h-16 w-16 text-muted-foreground" />
                <h2 className="mb-2 text-2xl font-semibold">Your cart is empty</h2>
                <p className="mb-6 text-muted-foreground">
                  Looks like you haven't added any products to your cart yet.
                </p>
                <Button size="lg" onClick={() => router.push("/products")}>
                  Continue Shopping
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              <div className="md:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Cart Items ({cartItems.length})</CardTitle>
                    <CardDescription>Review and modify your selected items</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex items-center space-x-4">
                        <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border">
                          <Image
                            src={item.image || "/placeholder.svg?height=80&width=80"}
                            alt={item.productName}
                            width={80}
                            height={80}
                            className="h-full w-full object-cover object-center"
                          />
                        </div>
                        <div className="flex flex-1 flex-col">
                          <div className="flex justify-between">
                            <Link href={`/product/${item.productId}`} className="text-lg font-medium hover:underline">
                              {item.productName}
                            </Link>
                            <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                          </div>
                          <p className="text-sm text-muted-foreground">${item.price.toFixed(2)} each</p>
                          <div className="mt-2 flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-600"
                              onClick={() => handleRemoveItem(item.productId, item.productName)}
                            >
                              <Trash2 className="mr-1 h-4 w-4" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={() => router.push("/products")}>
                      Continue Shopping
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        clearCart()
                        trackEvent({
                          type: "CART_CLEAR",
                          data: {
                            itemCount: cartItems.length,
                            timestamp: new Date().toISOString(),
                          },
                        })
                      }}
                    >
                      Clear Cart
                    </Button>
                  </CardFooter>
                </Card>
              </div>

              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                    <CardDescription>Review your order details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>${totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>Free</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax</span>
                      <span>${(totalAmount * 0.1).toFixed(2)}</span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Input
                          placeholder="Coupon code"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                        />
                        <Button variant="outline" onClick={handleApplyCoupon}>
                          Apply
                        </Button>
                      </div>
                      {couponError && <p className="text-sm text-red-500">{couponError}</p>}
                    </div>

                    <Separator />

                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span>${(totalAmount + totalAmount * 0.1).toFixed(2)}</span>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" size="lg" onClick={handleCheckout}>
                      Checkout
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
