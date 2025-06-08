import ProductList from "@/components/product-list"
import Header from "@/components/header"
import Footer from "@/components/footer"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "ShopTrack - E-commerce with User Behavior Tracking",
  description: "An e-commerce store with advanced user behavior tracking",
}

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="bg-gradient-to-b from-muted/50 to-background py-12 md:py-16">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">ShopTrack E-commerce</h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  Discover amazing products with real-time behavior tracking
                </p>
              </div>
            </div>
          </div>
        </section>
        <ProductList />
      </main>
      <Footer />
    </div>
  )
}
