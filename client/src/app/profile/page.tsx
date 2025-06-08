"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { useCart } from "@/context/CartContext"
import { CheckoutForm } from "@/components/CheckoutForm"
import { OrderHistory } from "@/components/OrderHistory"
import { UserProfile } from "@/components/UserProfile"
import { Button } from "@/components/ui/button"
import Header from "@/components/header"
import Footer from "@/components/footer"

const ProfilePage = () => {
  const router = useRouter()
  const { user, logout, loading } = useAuth()
  const { cartItems, totalAmount } = useCart()

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 p-6">
          <div className="container mx-auto">
            <div className="flex h-96 items-center justify-center">
              <p className="text-lg">Loading...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!user) {
    router.push("/login")
    return null
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 p-6">
        <div className="container mx-auto max-w-4xl space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Profile</h1>
            <Button onClick={handleLogout} variant="outline">
              Logout
            </Button>
          </div>

          <UserProfile user={user} />

          <OrderHistory />

          <CheckoutForm cartItems={cartItems} totalAmount={totalAmount} />
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default ProfilePage
