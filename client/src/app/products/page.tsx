import ProductList from "@/components/product-list"
import Header from "@/components/header"
import Footer from "@/components/footer"

export default function ProductsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="bg-gradient-to-b from-muted/50 to-background py-8 md:py-10">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">All Products</h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  Browse our complete collection of quality products
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
