"use client"

import { useEffect, useRef } from "react"
import { useTracker } from "@/lib/use-tracker"

export default function AdvancedTracker() {
  const { trackEvent, trackScrollDepth, trackTimeOnPage } = useTracker()
  const pageStartTime = useRef<number>(Date.now())
  const scrollMilestones = useRef<Set<number>>(new Set())
  const heatmapData = useRef<Array<{ x: number; y: number; timestamp: number; element: string }>>([])
  const formInteractions = useRef<Record<string, any>>({})

  useEffect(() => {
    // Track form interactions
    const trackFormInteraction = (e: Event) => {
      const target = e.target as HTMLInputElement
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT") {
        const formId = target.form?.id || "unknown"
        const fieldName = target.name || target.id || "unknown"

        if (!formInteractions.current[formId]) {
          formInteractions.current[formId] = {}
        }

        if (!formInteractions.current[formId][fieldName]) {
          formInteractions.current[formId][fieldName] = {
            firstInteraction: Date.now(),
            interactions: 0,
            timeSpent: 0,
            changes: 0,
          }
        }

        formInteractions.current[formId][fieldName].interactions++

        if (e.type === "change") {
          formInteractions.current[formId][fieldName].changes++
        }

        trackEvent({
          type: "FORM_INTERACTION",
          data: {
            formId,
            fieldName,
            eventType: e.type,
            fieldType: target.type,
            value: target.type === "password" ? "[HIDDEN]" : target.value?.substring(0, 50),
            timestamp: new Date().toISOString(),
          },
        })
      }
    }

    // Track rage clicks (multiple clicks in same area quickly)
    let clickCount = 0
    let lastClickTime = 0
    let lastClickPosition = { x: 0, y: 0 }

    const trackRageClicks = (e: MouseEvent) => {
      const now = Date.now()
      const timeDiff = now - lastClickTime
      const distance = Math.sqrt(
        Math.pow(e.clientX - lastClickPosition.x, 2) + Math.pow(e.clientY - lastClickPosition.y, 2),
      )

      if (timeDiff < 1000 && distance < 50) {
        // Within 1 second and 50px
        clickCount++
        if (clickCount >= 3) {
          trackEvent({
            type: "RAGE_CLICK",
            data: {
              clickCount,
              position: { x: e.clientX, y: e.clientY },
              element: (e.target as HTMLElement).tagName,
              timestamp: new Date().toISOString(),
            },
          })
          clickCount = 0 // Reset after tracking
        }
      } else {
        clickCount = 1
      }

      lastClickTime = now
      lastClickPosition = { x: e.clientX, y: e.clientY }
    }

    // Track dead clicks (clicks that don't result in any action)
    const trackDeadClicks = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const isInteractive =
        target.tagName === "A" ||
        target.tagName === "BUTTON" ||
        target.onclick !== null ||
        target.getAttribute("role") === "button" ||
        target.style.cursor === "pointer"

      if (!isInteractive && target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
        trackEvent({
          type: "DEAD_CLICK",
          data: {
            position: { x: e.clientX, y: e.clientY },
            element: target.tagName,
            className: target.className,
            text: target.textContent?.substring(0, 50),
            timestamp: new Date().toISOString(),
          },
        })
      }
    }

    // Track error events
    const trackJavaScriptErrors = (e: ErrorEvent) => {
      trackEvent({
        type: "JAVASCRIPT_ERROR",
        data: {
          message: e.message,
          filename: e.filename,
          lineno: e.lineno,
          colno: e.colno,
          stack: e.error?.stack?.substring(0, 500),
          timestamp: new Date().toISOString(),
        },
      })
    }

    // Track unhandled promise rejections
    const trackUnhandledRejections = (e: PromiseRejectionEvent) => {
      trackEvent({
        type: "UNHANDLED_PROMISE_REJECTION",
        data: {
          reason: e.reason?.toString?.()?.substring(0, 500) || "Unknown reason",
          timestamp: new Date().toISOString(),
        },
      })
    }

    // Track network failures
    const trackNetworkFailures = () => {
      const originalFetch = window.fetch
      window.fetch = async (...args) => {
        try {
          const response = await originalFetch(...args)
          if (!response.ok) {
            trackEvent({
              type: "NETWORK_ERROR",
              data: {
                url: args[0]?.toString(),
                status: response.status,
                statusText: response.statusText,
                timestamp: new Date().toISOString(),
              },
            })
          }
          return response
        } catch (error) {
          trackEvent({
            type: "NETWORK_FAILURE",
            data: {
              url: args[0]?.toString(),
              error: error instanceof Error ? error.message : "Unknown error",
              timestamp: new Date().toISOString(),
            },
          })
          throw error
        }
      }
    }

    // Track page visibility changes for engagement
    const trackEngagement = () => {
      let isVisible = !document.hidden
      let visibilityStart = Date.now()

      const handleVisibilityChange = () => {
        const now = Date.now()
        if (document.hidden && isVisible) {
          // Page became hidden
          trackEvent({
            type: "ENGAGEMENT_PAUSE",
            data: {
              visibleDuration: now - visibilityStart,
              timestamp: new Date().toISOString(),
            },
          })
          isVisible = false
        } else if (!document.hidden && !isVisible) {
          // Page became visible
          trackEvent({
            type: "ENGAGEMENT_RESUME",
            data: {
              hiddenDuration: now - visibilityStart,
              timestamp: new Date().toISOString(),
            },
          })
          isVisible = true
          visibilityStart = now
        }
      }

      document.addEventListener("visibilitychange", handleVisibilityChange)
      return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
    }

    // Track copy/paste events
    const trackCopyPaste = (e: ClipboardEvent) => {
      trackEvent({
        type: "CLIPBOARD_EVENT",
        data: {
          action: e.type,
          element: (e.target as HTMLElement)?.tagName,
          timestamp: new Date().toISOString(),
        },
      })
    }

    // Track right-click events
    const trackRightClick = (e: MouseEvent) => {
      if (e.button === 2) {
        // Right click
        trackEvent({
          type: "RIGHT_CLICK",
          data: {
            position: { x: e.clientX, y: e.clientY },
            element: (e.target as HTMLElement).tagName,
            timestamp: new Date().toISOString(),
          },
        })
      }
    }

    // Set up event listeners
    document.addEventListener("focus", trackFormInteraction, true)
    document.addEventListener("blur", trackFormInteraction, true)
    document.addEventListener("change", trackFormInteraction, true)
    document.addEventListener("input", trackFormInteraction, true)
    document.addEventListener("click", trackRageClicks)
    document.addEventListener("click", trackDeadClicks)
    document.addEventListener("copy", trackCopyPaste)
    document.addEventListener("paste", trackCopyPaste)
    document.addEventListener("contextmenu", trackRightClick)
    window.addEventListener("error", trackJavaScriptErrors)
    window.addEventListener("unhandledrejection", trackUnhandledRejections)

    trackNetworkFailures()
    const cleanupEngagement = trackEngagement()

    // Track time on page when component unmounts
    return () => {
      const timeOnPage = Date.now() - pageStartTime.current
      trackTimeOnPage(timeOnPage)

      // Cleanup event listeners
      document.removeEventListener("focus", trackFormInteraction, true)
      document.removeEventListener("blur", trackFormInteraction, true)
      document.removeEventListener("change", trackFormInteraction, true)
      document.removeEventListener("input", trackFormInteraction, true)
      document.removeEventListener("click", trackRageClicks)
      document.removeEventListener("click", trackDeadClicks)
      document.removeEventListener("copy", trackCopyPaste)
      document.removeEventListener("paste", trackCopyPaste)
      document.removeEventListener("contextmenu", trackRightClick)
      window.removeEventListener("error", trackJavaScriptErrors)
      window.removeEventListener("unhandledrejection", trackUnhandledRejections)
      cleanupEngagement()
    }
  }, [trackEvent, trackTimeOnPage])

  return null // This component doesn't render anything
}
