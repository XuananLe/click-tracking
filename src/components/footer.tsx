"use client"

import Link from "next/link"
import { Facebook, Instagram, Twitter } from "lucide-react"
import { useTracker } from "@/lib/use-tracker"

export default function Footer() {
  const { trackEvent } = useTracker()

  const handleFooterLinkClick = (section: string, link: string) => {
    trackEvent({
      type: "FOOTER_CLICK",
      data: {
        section,
        link,
        timestamp: new Date().toISOString(),
      },
    })
  }

  return (
    <footer className="border-t bg-muted/40">
      <div className="container px-4 py-8 md:px-6 md:py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="mb-4 text-lg font-semibold">ShopTrack</h3>
            <p className="text-sm text-muted-foreground">
              Your one-stop shop for all your needs with advanced behavior tracking.
            </p>
          </div>
          <div>
            <h3 className="mb-4 text-lg font-semibold">Shop</h3>
            <ul className="grid gap-2 text-sm">
              <li>
                <Link
                  href="#"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                  onClick={() => handleFooterLinkClick("shop", "all_products")}
                >
                  All Products
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                  onClick={() => handleFooterLinkClick("shop", "new_arrivals")}
                >
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                  onClick={() => handleFooterLinkClick("shop", "best_sellers")}
                >
                  Best Sellers
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                  onClick={() => handleFooterLinkClick("shop", "discounts")}
                >
                  Discounts
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-lg font-semibold">Company</h3>
            <ul className="grid gap-2 text-sm">
              <li>
                <Link
                  href="#"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                  onClick={() => handleFooterLinkClick("company", "about_us")}
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                  onClick={() => handleFooterLinkClick("company", "careers")}
                >
                  Careers
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                  onClick={() => handleFooterLinkClick("company", "contact")}
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                  onClick={() => handleFooterLinkClick("company", "privacy_policy")}
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-lg font-semibold">Connect</h3>
            <div className="flex gap-4">
              <Link
                href="#"
                className="text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => handleFooterLinkClick("social", "facebook")}
              >
                <Facebook className="h-5 w-5" />
                <span className="sr-only">Facebook</span>
              </Link>
              <Link
                href="#"
                className="text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => handleFooterLinkClick("social", "twitter")}
              >
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </Link>
              <Link
                href="#"
                className="text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => handleFooterLinkClick("social", "instagram")}
              >
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} ShopTrack. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
