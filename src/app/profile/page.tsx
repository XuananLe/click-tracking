"use client"
import { useRouter } from "next/router"
// import { useAuth } from "@/context/AuthContext"
// import { useCart } from "@/context/CartContext"
// import { CheckoutForm } from "@/components/CheckoutForm"
// import { OrderHistory } from "@/components/OrderHistory"
// import { UserProfile } from "@/components/UserProfile"

const ProfilePage = () => {
  const router = useRouter()
  // const { user, logout } = useAuth()
  // const { cartItems, totalAmount } = useCart()

  // if (!user) {
  //   router.push("/login")
  //   return null
  // }

  return (
    <div>
      <h1>Profile</h1>
      {/* <UserProfile user={user} />
      <button onClick={logout}>Logout</button> */}

      <h2>Order History</h2>
      {/* <OrderHistory /> */}

      <h2>Checkout</h2>
      {/* <CheckoutForm cartItems={cartItems} totalAmount={totalAmount} /> */}
    </div>
  )
}

export default ProfilePage
