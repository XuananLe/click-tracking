"use client"

import Header from "@/components/header"
import Footer from "@/components/footer"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import Link from "next/link"
import { ShoppingCart } from "lucide-react"
import { useCart } from "@/context/CartContext"

export default function DealsPage() {
  const { addToCart } = useCart()

  const deals = [
    {
      id: 1,
      name: "Wireless Headphones",
      price: 129.99,
      discount: 10,
      image: "/placeholder.svg?height=300&width=300",
      category: "Electronics",
    },
    {
      id: 3,
      name: "Running Shoes",
      price: 89.99,
      discount: 15,
      image: "/placeholder.svg?height=300&width=300",
      category: "Fashion",
    },
    {
      id: 5,
      name: "Laptop",
      price: 1299.99,
      discount: 5,
      image: "/placeholder.svg?height=300&width=300",
      category: "Electronics",
    },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="bg-gradient-to-b from-muted/50 to-background py-8 md:py-10">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Special Deals</h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  Limited time offers on our best products
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-8 md:py-12">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {deals.map((deal) => (
                <Card key={deal.id} className="overflow-hidden">
                  <div className="relative">
                    <Link href={`/product/${deal.id}`}>
                      <Image
                        src={deal.image || "/placeholder.svg"}
                        alt={deal.name}
                        width={300}
                        height={300}
                        className="h-[200px] w-full object-cover transition-transform hover:scale-105"
                      />
                    </Link>
                    <Badge className="absolute right-2 top-2" variant="destructive">
                      -{deal.discount}%
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <Link href={`/product/${deal.id}`} className="font-semibold hover:underline">
                      {deal.name}
                    </Link>
                    <p className="text-sm text-muted-foreground">{deal.category}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="font-bold">${(deal.price * (1 - deal.discount / 100)).toFixed(2)}</span>
                      <span className="text-sm text-muted-foreground line-through">${deal.price.toFixed(2)}</span>
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                    <Button
                      className="w-full"
                      onClick={() => addToCart(deal.id, deal.name, deal.price * (1 - deal.discount / 100), 1)}
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Add to Cart
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
