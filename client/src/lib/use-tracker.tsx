"use client"

import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from "react"

type TrackingEvent = {
  type: string
  data: Record<any, any>
}

type SessionData = {
  sessionId: string
  startTime: number
  lastActivityTime: number
  pageViews: number
  events: number
  referrer: string
  entryPage: string
  userAgent: string
  language: string
  timezone: string
  screenResolution: string
  viewportSize: string
  deviceType: string
  browser: string
  os: string
  connectionType?: string
  isReturningUser: boolean
}

type TrackingContextType = {
  events: TrackingEvent[]
  trackEvent: (event: TrackingEvent) => void
  clearEvents: () => void
  sessionData: SessionData | null
  trackPageView: (additionalData?: Record<string, any>) => void
  trackScrollDepth: (depth: number) => void
  trackTimeOnPage: (duration: number) => void
  trackUserInteraction: (interaction: string, element: string, data?: Record<string, any>) => void
}

const TrackingContext = createContext<TrackingContextType | undefined>(undefined)

// Generate a unique session ID
const generateSessionId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2)
}

// Detect device type
const getDeviceType = () => {
  const userAgent = navigator.userAgent.toLowerCase()
  if (/tablet|ipad|playbook|silk/.test(userAgent)) {
    return "tablet"
  }
  if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/.test(userAgent)) {
    return "mobile"
  }
  return "desktop"
}

// Detect browser
const getBrowser = () => {
  const userAgent = navigator.userAgent
  if (userAgent.includes("Chrome")) return "Chrome"
  if (userAgent.includes("Firefox")) return "Firefox"
  if (userAgent.includes("Safari")) return "Safari"
  if (userAgent.includes("Edge")) return "Edge"
  if (userAgent.includes("Opera")) return "Opera"
  return "Unknown"
}

// Detect OS
const getOS = () => {
  const userAgent = navigator.userAgent
  if (userAgent.includes("Windows")) return "Windows"
  if (userAgent.includes("Mac")) return "macOS"
  if (userAgent.includes("Linux")) return "Linux"
  if (userAgent.includes("Android")) return "Android"
  if (userAgent.includes("iOS")) return "iOS"
  return "Unknown"
}

// Get connection type
const getConnectionType = () => {
  const connection =
    (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
  return connection ? connection.effectiveType : "unknown"
}

// Check if returning user
const isReturningUser = () => {
  const hasVisited = localStorage.getItem("has_visited")
  if (!hasVisited) {
    localStorage.setItem("has_visited", "true")
    return false
  }
  return true
}

export function TrackingProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<TrackingEvent[]>([])
  const [sessionData, setSessionData] = useState<SessionData | null>(null)
  const activityTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const sessionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const idleTimeoutDuration = 30 * 60 * 1000 // 30 minutes of inactivity ends a session
  const recentEventsRef = useRef<Record<string, number>>({})
  const eventsQueueRef = useRef<TrackingEvent[]>([])
  const isProcessingQueueRef = useRef(false)
  const pageStartTimeRef = useRef<number>(0)
  const maxScrollDepthRef = useRef<number>(0)
  const mouseMovementsRef = useRef<Array<{ x: number; y: number; timestamp: number }>>([])
  const clickHeatmapRef = useRef<Array<{ x: number; y: number; timestamp: number; element: string }>>([])

  // Initialize or restore session
  useEffect(() => {
    const initializeSession = () => {
      try {
        // Try to restore existing session
        const savedSession = localStorage.getItem("user_session")
        const savedEvents = localStorage.getItem("user_tracking_events")

        if (savedSession) {
          const parsedSession = JSON.parse(savedSession) as SessionData
          // Check if session is still valid (less than 30 minutes of inactivity)
          const now = Date.now()
          if (now - parsedSession.lastActivityTime < idleTimeoutDuration) {
            setSessionData({
              ...parsedSession,
              lastActivityTime: now,
              pageViews: parsedSession.pageViews + 1,
            })
          } else {
            // Session expired, create new one
            createNewSession()
          }
        } else {
          // No existing session, create new one
          createNewSession()
        }

        // Restore saved events
        if (savedEvents) {
          setEvents(JSON.parse(savedEvents))
        }
      } catch (error) {
        console.error("Failed to initialize session:", error)
        createNewSession()
      }

      // Track page view
      setTimeout(() => {
        trackPageView()
      }, 100)
    }

    const createNewSession = () => {
      const newSession: SessionData = {
        sessionId: generateSessionId(),
        startTime: Date.now(),
        lastActivityTime: Date.now(),
        pageViews: 1,
        events: 0,
        referrer: document.referrer,
        entryPage: window.location.pathname,
        userAgent: navigator.userAgent,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        screenResolution: `${screen.width}x${screen.height}`,
        viewportSize: `${window.innerWidth}x${window.innerHeight}`,
        deviceType: getDeviceType(),
        browser: getBrowser(),
        os: getOS(),
        connectionType: getConnectionType(),
        isReturningUser: isReturningUser(),
      }
      setSessionData(newSession)
      localStorage.setItem("user_session", JSON.stringify(newSession))
    }

    initializeSession()
    pageStartTimeRef.current = Date.now()

    // Set up activity tracking
    const resetActivityTimeout = () => {
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current)
      }

      activityTimeoutRef.current = setTimeout(() => {
        // User has been inactive for the timeout period
        if (sessionData) {
          const sessionEndEvent = {
            type: "SESSION_END",
            data: {
              sessionId: sessionData.sessionId,
              duration: Math.floor((Date.now() - sessionData.startTime) / 1000),
              pageViews: sessionData.pageViews,
              events: sessionData.events,
              reason: "inactivity",
              maxScrollDepth: maxScrollDepthRef.current,
              mouseMovements: mouseMovementsRef.current.length,
              clickHeatmap: clickHeatmapRef.current,
              timestamp: new Date().toISOString(),
            },
          }

          // Add to queue instead of directly tracking
          eventsQueueRef.current.push(sessionEndEvent)
          processEventQueue()
        }
        // Create a new session when user becomes active again
        createNewSession()
      }, idleTimeoutDuration)
    }

    // Track user activity with more detailed information
    const trackActivity = (eventType: string, data?: Record<string, any>) => {
      if (sessionData) {
        const updatedSession = {
          ...sessionData,
          lastActivityTime: Date.now(),
        }
        setSessionData(updatedSession)
        localStorage.setItem("user_session", JSON.stringify(updatedSession))
        resetActivityTimeout()

        // Track specific activity
        if (eventType && data) {
          trackEvent({
            type: eventType,
            data: {
              ...data,
              timestamp: new Date().toISOString(),
              sessionId: sessionData.sessionId,
            },
          })
        }
      }
    }

    // Mouse movement tracking
    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now()
      mouseMovementsRef.current.push({
        x: e.clientX,
        y: e.clientY,
        timestamp: now,
      })

      // Keep only last 100 movements to avoid memory issues
      if (mouseMovementsRef.current.length > 100) {
        mouseMovementsRef.current = mouseMovementsRef.current.slice(-100)
      }

      // Track mouse movement patterns every 5 seconds
      if (mouseMovementsRef.current.length % 50 === 0) {
        trackActivity("MOUSE_MOVEMENT_PATTERN", {
          movementCount: mouseMovementsRef.current.length,
          averageSpeed: calculateMouseSpeed(),
        })
      }
    }

    // Click tracking with heatmap data
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const clickData = {
        x: e.clientX,
        y: e.clientY,
        timestamp: Date.now(),
        element: target.tagName.toLowerCase(),
      }

      clickHeatmapRef.current.push(clickData)

      trackActivity("DETAILED_CLICK", {
        coordinates: { x: e.clientX, y: e.clientY },
        element: {
          tagName: target.tagName,
          id: target.id,
          className: target.className,
          text: target.textContent?.substring(0, 50),
        },
        pageX: e.pageX,
        pageY: e.pageY,
        button: e.button,
        ctrlKey: e.ctrlKey,
        shiftKey: e.shiftKey,
        altKey: e.altKey,
      })
    }

    // Scroll tracking
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      const scrollDepth = Math.round(((scrollTop + windowHeight) / documentHeight) * 100)

      if (scrollDepth > maxScrollDepthRef.current) {
        maxScrollDepthRef.current = scrollDepth
        trackScrollDepth(scrollDepth)
      }

      trackActivity("SCROLL", {
        scrollTop,
        scrollDepth,
        direction: scrollTop > (handleScroll as any).lastScrollTop ? "down" : "up",
      })
      ;(handleScroll as any).lastScrollTop = scrollTop
    }

    // Keyboard tracking
    const handleKeyDown = (e: KeyboardEvent) => {
      trackActivity("KEYBOARD_INPUT", {
        key: e.key,
        code: e.code,
        ctrlKey: e.ctrlKey,
        shiftKey: e.shiftKey,
        altKey: e.altKey,
        metaKey: e.metaKey,
      })
    }

    // Visibility change tracking
    const handleVisibilityChange = () => {
      if (document.hidden) {
        trackActivity("PAGE_HIDDEN", {
          timeOnPage: Date.now() - pageStartTimeRef.current,
        })
      } else {
        trackActivity("PAGE_VISIBLE", {
          returnTime: Date.now(),
        })
        pageStartTimeRef.current = Date.now()
      }
    }

    // Performance tracking
    const trackPerformance = () => {
      if ("performance" in window) {
        const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming
        if (navigation) {
          trackEvent({
            type: "PERFORMANCE_METRICS",
            data: {
              loadTime: navigation.loadEventEnd - navigation.loadEventStart,
              domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
              firstPaint: performance.getEntriesByName("first-paint")[0]?.startTime || 0,
              firstContentfulPaint: performance.getEntriesByName("first-contentful-paint")[0]?.startTime || 0,
              timestamp: new Date().toISOString(),
            },
          })
        }
      }
    }

    // Throttled version of trackActivity
    let lastActivityTime = 0
    const throttledTrackActivity = (eventType: string, data?: Record<string, any>) => {
      const now = Date.now()
      if (now - lastActivityTime > 1000) {
        // Throttle to once per second
        lastActivityTime = now
        trackActivity(eventType, data)
      }
    }

    // Set up event listeners
    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("click", handleClick)
    window.addEventListener("scroll", handleScroll)
    window.addEventListener("keydown", handleKeyDown)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    // Initialize activity timeout
    resetActivityTimeout()

    // Track performance after page load
    if (document.readyState === "complete") {
      trackPerformance()
    } else {
      window.addEventListener("load", trackPerformance)
    }

    // Track session end when user leaves the page
    const handleBeforeUnload = () => {
      if (sessionData) {
        const sessionEndEvent = {
          type: "SESSION_END",
          data: {
            sessionId: sessionData.sessionId,
            duration: Math.floor((Date.now() - sessionData.startTime) / 1000),
            pageViews: sessionData.pageViews,
            events: sessionData.events,
            reason: "page_exit",
            timeOnCurrentPage: Date.now() - pageStartTimeRef.current,
            maxScrollDepth: maxScrollDepthRef.current,
            mouseMovements: mouseMovementsRef.current.length,
            clickHeatmap: clickHeatmapRef.current,
            timestamp: new Date().toISOString(),
          },
        }

        // In a real implementation, use navigator.sendBeacon() here
        console.log("Session end event:", sessionEndEvent)

        // Update session data in localStorage
        localStorage.setItem(
          "user_session",
          JSON.stringify({
            ...sessionData,
            lastActivityTime: Date.now(),
          }),
        )
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    // Set up event queue processor
    const intervalId = setInterval(() => {
      processEventQueue()
    }, 1000)

    // Retry failed events periodically
    const retryFailedEvents = async () => {
      try {
        const failedEventsJson = localStorage.getItem("failed_tracking_events")
        if (!failedEventsJson) return

        const failedEvents = JSON.parse(failedEventsJson)
        if (failedEvents.length === 0) return

        console.log(`Retrying ${failedEvents.length} failed tracking events`)

        const retryPromises = failedEvents
          .filter((item: any) => item.retryCount < 3) // Only retry up to 3 times
          .map(async (item: any) => {
            try {
              const result = await sendToServer(item.event)
              if (result) {
                // Success - remove from failed events
                return { success: true, item }
              }
            } catch (error) {
              // Still failing - increment retry count
              item.retryCount = (item.retryCount || 0) + 1
              return { success: false, item }
            }
            return { success: false, item }
          })

        const results = await Promise.allSettled(retryPromises)

        // Update failed events list
        const stillFailedEvents = results
          .filter((result, index) => {
            if (result.status === "fulfilled") {
              return !result.value.success && result.value.item.retryCount < 3
            }
            return true
          })
          .map((result, index) => {
            if (result.status === "fulfilled" && !result.value.success) {
              return result.value.item
            }
            return failedEvents[index]
          })

        localStorage.setItem("failed_tracking_events", JSON.stringify(stillFailedEvents))

        if (stillFailedEvents.length < failedEvents.length) {
          console.log(`Successfully retried ${failedEvents.length - stillFailedEvents.length} events`)
        }
      } catch (error) {
        console.error("Error retrying failed events:", error)
      }
    }

    // Set up retry interval (every 30 seconds)
    const retryInterval = setInterval(retryFailedEvents, 30000)

    // Cleanup
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("click", handleClick)
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("beforeunload", handleBeforeUnload)
      window.removeEventListener("load", trackPerformance)

      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current)
      }
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current)
      }
      clearInterval(intervalId)
      clearInterval(retryInterval)
    }
  }, [])

  // Calculate mouse speed
  const calculateMouseSpeed = () => {
    if (mouseMovementsRef.current.length < 2) return 0

    const movements = mouseMovementsRef.current.slice(-10) // Last 10 movements
    let totalDistance = 0
    let totalTime = 0

    for (let i = 1; i < movements.length; i++) {
      const prev = movements[i - 1]
      const curr = movements[i]
      const distance = Math.sqrt(Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2))
      const time = curr.timestamp - prev.timestamp
      totalDistance += distance
      totalTime += time
    }

    return totalTime > 0 ? totalDistance / totalTime : 0
  }

  // Save events to localStorage periodically
  useEffect(() => {
    const saveEventsInterval = setInterval(() => {
      try {
        localStorage.setItem("user_tracking_events", JSON.stringify(events))
      } catch (error) {
        console.error("Failed to save tracking events:", error)
      }
    }, 10000) // Save every 10 seconds

    return () => clearInterval(saveEventsInterval)
  }, [events])

  // Process event queue
  const processEventQueue = () => {
    if (isProcessingQueueRef.current || eventsQueueRef.current.length === 0) {
      return
    }

    isProcessingQueueRef.current = true

    try {
      // Take a batch of events from the queue
      const batch = eventsQueueRef.current.splice(0, 10)

      // Add session ID to events
      const eventsWithSession = batch.map((event) => ({
        ...event,
        data: {
          ...event.data,
          sessionId: sessionData?.sessionId,
        },
      }))

      // Update local state
      setEvents((prev) => [...prev, ...eventsWithSession])

      // Send to server
      eventsWithSession.forEach((event) => {
        sendToServer(event)
      })

      // Update session data if needed
      if (sessionData) {
        const updatedSession = {
          ...sessionData,
          events: sessionData.events + batch.length,
        }

        // Only update session data occasionally to avoid render loops
        if (batch.length >= 5) {
          setSessionData(updatedSession)
          localStorage.setItem("user_session", JSON.stringify(updatedSession))
        }
      }
    } finally {
      isProcessingQueueRef.current = false

      // If there are more events, process them in the next tick
      if (eventsQueueRef.current.length > 0) {
        setTimeout(processEventQueue, 1000)
      }
    }
  }

  const trackPageView = (additionalData?: Record<string, any>) => {
    const newEvent: TrackingEvent = {
      type: "PAGE_VIEW",
      data: {
        url: window.location.href,
        path: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash,
        referrer: document.referrer,
        timestamp: new Date().toISOString(),
        sessionId: sessionData?.sessionId,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
        screen: {
          width: screen.width,
          height: screen.height,
          colorDepth: screen.colorDepth,
        },
        userAgent: navigator.userAgent,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        cookieEnabled: navigator.cookieEnabled,
        onlineStatus: navigator.onLine,
        connectionType: getConnectionType(),
        ...additionalData,
      },
    }

    // Add to queue instead of directly updating state
    eventsQueueRef.current.push(newEvent)
    processEventQueue()
  }

  const trackScrollDepth = (depth: number) => {
    const milestones = [25, 50, 75, 90, 100]
    const milestone = milestones.find((m) => depth >= m && depth < m + 5)

    if (milestone) {
      trackEvent({
        type: "SCROLL_DEPTH",
        data: {
          depth,
          milestone,
          timestamp: new Date().toISOString(),
          url: window.location.href,
        },
      })
    }
  }

  const trackTimeOnPage = (duration: number) => {
    trackEvent({
      type: "TIME_ON_PAGE",
      data: {
        duration,
        url: window.location.href,
        timestamp: new Date().toISOString(),
      },
    })
  }

  const trackUserInteraction = (interaction: string, element: string, data?: Record<string, any>) => {
    trackEvent({
      type: "USER_INTERACTION",
      data: {
        interaction,
        element,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        ...data,
      },
    })
  }

  const trackEvent = (event: TrackingEvent) => {
    // Enhanced event deduplication
    const eventKey = `${event.type}-${JSON.stringify(event.data)}`
    const now = Date.now()

    // Different deduplication timeouts for different event types
    const deduplicationTimeout = event.type.includes("MOUSE") || event.type.includes("SCROLL") ? 500 : 2000

    if (recentEventsRef.current[eventKey] && now - recentEventsRef.current[eventKey] < deduplicationTimeout) {
      return
    }

    // Record the time of this event
    recentEventsRef.current[eventKey] = now

    // Enhanced event data
    const enhancedEvent = {
      ...event,
      data: {
        ...event.data,
        sessionId: sessionData?.sessionId,
        timestamp: event.data.timestamp || new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        deviceType: sessionData?.deviceType,
        browser: sessionData?.browser,
        os: sessionData?.os,
      },
    }

    // Add to queue instead of directly updating state
    eventsQueueRef.current.push(enhancedEvent)

    // Process queue if not already processing
    if (!isProcessingQueueRef.current) {
      setTimeout(processEventQueue, 100)
    }
  }

  // Send data to server with enhanced payload
  const sendToServer = async (event: TrackingEvent) => {
    try {
      const payload = {
        ...event,
        // Add additional info
        clientInfo: {
          userAgent: navigator.userAgent,
          language: navigator.language,
          languages: navigator.languages,
          platform: navigator.platform,
          cookieEnabled: navigator.cookieEnabled,
          onLine: navigator.onLine,
          screenSize: {
            width: window.screen.width,
            height: window.screen.height,
            colorDepth: window.screen.colorDepth,
            pixelDepth: window.screen.pixelDepth,
          },
          viewportSize: {
            width: window.innerWidth,
            height: window.innerHeight,
          },
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          connectionType: getConnectionType(),
          timestamp: new Date().toISOString(),
        },
        sessionInfo: sessionData,
        performanceInfo: {
          memory: (() => {
            // Check if performance.memory is available and accessible
            try {
              const perfMemory = (performance as any).memory
              if (perfMemory && typeof perfMemory.usedJSHeapSize === "number") {
                return {
                  usedJSHeapSize: perfMemory.usedJSHeapSize,
                  totalJSHeapSize: perfMemory.totalJSHeapSize,
                  jsHeapSizeLimit: perfMemory.jsHeapSizeLimit,
                }
              }
            } catch (error) {
              console.debug("Performance memory API not available:", error)
            }
            return null
          })(),
          timing: (() => {
            try {
              if (performance.timing) {
                return {
                  navigationStart: performance.timing.navigationStart,
                  loadEventEnd: performance.timing.loadEventEnd,
                  domContentLoadedEventEnd: performance.timing.domContentLoadedEventEnd,
                }
              }
            } catch (error) {
              console.debug("Performance timing API not available:", error)
            }
            return null
          })(),
          // Add alternative memory estimation
          estimatedMemoryUsage: (() => {
            try {
              // Estimate memory usage based on DOM complexity and stored data
              const domNodes = document.querySelectorAll("*").length
              const localStorageSize = JSON.stringify(localStorage).length
              const sessionStorageSize = JSON.stringify(sessionStorage).length

              return {
                domComplexity: domNodes,
                localStorageBytes: localStorageSize,
                sessionStorageBytes: sessionStorageSize,
                estimatedTotalKB: Math.round((domNodes * 100 + localStorageSize + sessionStorageSize) / 1024),
              }
            } catch (error) {
              return null
            }
          })(),
        },
        userData : JSON.parse(localStorage.getItem("user_data")) || null,
      }

      console.log("Sending enhanced tracking data:", payload)

      const response = await fetch("/api/track", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      // Check if response is ok first
      if (!response.ok) {
        // Try to get error details, but handle non-JSON responses
        let errorDetails = `Server responded with status: ${response.status}`

        try {
          const errorData = await response.json()
          errorDetails += `. ${errorData.error || errorData.message || ""}`
        } catch (parseError) {
          // If we can't parse JSON, get text instead
          try {
            const errorText = await response.text()
            errorDetails += `. Response: ${errorText.substring(0, 200)}`
          } catch (textError) {
            errorDetails += ". Unable to read response body."
          }
        }

        throw new Error(errorDetails)
      }

      // Parse successful response
      const result = await response.json()
      console.log("Enhanced tracking data sent successfully:", result)

      return result
    } catch (error) {
      console.error("Failed to send tracking data to server:", error)

      try {
        const failedEvents = JSON.parse(localStorage.getItem("failed_tracking_events") || "[]")
        failedEvents.push({
          event,
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : "Unknown error",
          retryCount: 0,
        })

        const recentFailedEvents = failedEvents.slice(-50)
        localStorage.setItem("failed_tracking_events", JSON.stringify(recentFailedEvents))
      } catch (storageError) {
        console.error("Failed to store failed tracking event:", storageError)
      }

      return null
    }
  }

  const clearEvents = () => {
    setEvents([])
    localStorage.removeItem("user_tracking_events")
  }

  return (
    <TrackingContext.Provider
      value={{
        events,
        trackEvent,
        clearEvents,
        sessionData,
        trackPageView,
        trackScrollDepth,
        trackTimeOnPage,
        trackUserInteraction,
      }}
    >
      {children}
    </TrackingContext.Provider>
  )
}

export function useTracker() {
  const context = useContext(TrackingContext)
  if (context === undefined) {
    throw new Error("useTracker must be used within a TrackingProvider")
  }
  return context
}
