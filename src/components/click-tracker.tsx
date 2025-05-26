"use client"

import type React from "react"

import { useEffect, useRef } from "react"
import { useTracker } from "@/lib/use-tracker"

export default function ClickTracker({ children }: { children: React.ReactNode }) {
  const { trackEvent } = useTracker()
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Lấy phần tử được click
      const target = e.target as HTMLElement

      // Tạo đường dẫn DOM để xác định chính xác phần tử được click
      const domPath = getDomPath(target)

      // Lấy thông tin về phần tử được click
      const elementInfo = {
        tagName: target.tagName.toLowerCase(),
        id: target.id || undefined,
        className: target.className || undefined,
        text: target.textContent?.trim().substring(0, 50) || undefined,
        domPath,
        href: target.tagName === "A" ? (target as HTMLAnchorElement).href : undefined,
        coordinates: {
          x: e.clientX,
          y: e.clientY,
          relativeX: e.pageX,
          relativeY: e.pageY,
        },
      }

      // Theo dõi sự kiện click
      trackEvent({
        type: "ELEMENT_CLICK",
        data: {
          element: elementInfo,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          path: window.location.pathname,
        },
      })
    }

    // Thêm event listener cho toàn bộ container
    const rootElement = rootRef.current
    if (rootElement) {
      rootElement.addEventListener("click", handleClick)
    }

    // Cleanup
    return () => {
      if (rootElement) {
        rootElement.removeEventListener("click", handleClick)
      }
    }
  }, [trackEvent])

  // Hàm tạo đường dẫn DOM để xác định chính xác phần tử được click
  const getDomPath = (element: HTMLElement): string => {
    const path = []
    let currentElement: HTMLElement | null = element

    while (currentElement && currentElement !== document.body) {
      let selector = currentElement.tagName.toLowerCase()

      if (currentElement.id) {
        selector += `#${currentElement.id}`
      } else if (currentElement.className) {
        const classes = Array.from(currentElement.classList).join(".")
        if (classes) {
          selector += `.${classes}`
        }
      }

      // Thêm vị trí của phần tử trong số các phần tử cùng loại
      const siblings = currentElement.parentElement ? Array.from(currentElement.parentElement.children) : []

      if (siblings.length > 1) {
        const index = siblings.indexOf(currentElement) + 1
        selector += `:nth-child(${index})`
      }

      path.unshift(selector)
      currentElement = currentElement.parentElement
    }

    return path.join(" > ")
  }

  return (
    <div ref={rootRef} className="w-full h-full">
      {children}
    </div>
  )
}
