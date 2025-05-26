"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { ShoppingCart, User, Search, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTracker } from "@/lib/use-tracker"

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { trackEvent } = useTracker()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const searchInput = form.elements.namedItem("search") as HTMLInputElement

    trackEvent({
      type: "SEARCH",
      data: {
        query: searchInput.value,
        timestamp: new Date().toISOString(),
      },
    })
  }

  const handleNavClick = (navItem: string) => {
    trackEvent({
      type: "NAVIGATION_CLICK",
      data: {
        item: navItem,
        timestamp: new Date().toISOString(),
      },
    })
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            className="md:hidden"
            size="icon"
            onClick={() => {
              setIsMenuOpen(!isMenuOpen)
              trackEvent({
                type: "UI_INTERACTION",
                data: {
                  element: "mobile_menu",
                  action: isMenuOpen ? "close" : "open",
                  timestamp: new Date().toISOString(),
                },
              })
            }}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            <span className="sr-only">Toggle menu</span>
          </Button>
          <Link href="/" className="flex items-center gap-2 text-xl font-bold" onClick={() => handleNavClick("logo")}>
            ShopTrack
          </Link>
        </div>
        <nav
          className={`${isMenuOpen ? "flex" : "hidden"} absolute left-0 top-16 w-full flex-col gap-4 border-b bg-background p-4 md:static md:flex md:w-auto md:flex-row md:border-0 md:p-0`}
        >
          <Link
            href="#"
            className="text-sm font-medium transition-colors hover:text-primary"
            onClick={() => handleNavClick("home")}
          >
            Home
          </Link>
          <Link
            href="#"
            className="text-sm font-medium transition-colors hover:text-primary"
            onClick={() => handleNavClick("products")}
          >
            Products
          </Link>
          <Link
            href="#"
            className="text-sm font-medium transition-colors hover:text-primary"
            onClick={() => handleNavClick("categories")}
          >
            Categories
          </Link>
          <Link
            href="#"
            className="text-sm font-medium transition-colors hover:text-primary"
            onClick={() => handleNavClick("deals")}
          >
            Deals
          </Link>
          <Link
            href="/analytics"
            className="text-sm font-medium transition-colors hover:text-primary"
            onClick={() => handleNavClick("analytics")}
          >
            Analytics
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <form className="hidden md:block" onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                name="search"
                placeholder="Search products..."
                className="w-full rounded-md pl-8 md:w-[200px] lg:w-[300px]"
              />
            </div>
          </form>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              trackEvent({
                type: "ICON_CLICK",
                data: {
                  icon: "user",
                  timestamp: new Date().toISOString(),
                },
              })
            }}
          >
            <User className="h-5 w-5" />
            <span className="sr-only">Account</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              trackEvent({
                type: "ICON_CLICK",
                data: {
                  icon: "cart",
                  timestamp: new Date().toISOString(),
                },
              })
            }}
          >
            <ShoppingCart className="h-5 w-5" />
            <span className="sr-only">Cart</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
