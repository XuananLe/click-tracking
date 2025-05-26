"use client"

import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from "react"

type TrackingEvent = {
  type: string
  data: Record<string, any>
}

type SessionData = {
  sessionId: string
  startTime: number
  lastActivityTime: number
  pageViews: number
  events: number
  referrer: string
  entryPage: string
}

type TrackingContextType = {
  events: TrackingEvent[]
  trackEvent: (event: TrackingEvent) => void
  clearEvents: () => void
  sessionData: SessionData | null
}

const TrackingContext = createContext<TrackingContextType | undefined>(undefined)

// Generate a unique session ID
const generateSessionId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2)
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
      }
      setSessionData(newSession)
      localStorage.setItem("user_session", JSON.stringify(newSession))
    }

    initializeSession()

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

    // Track user activity
    const trackActivity = () => {
      if (sessionData) {
        const updatedSession = {
          ...sessionData,
          lastActivityTime: Date.now(),
        }
        setSessionData(updatedSession)
        localStorage.setItem("user_session", JSON.stringify(updatedSession))
        resetActivityTimeout()
      }
    }

    // Throttled version of trackActivity
    let lastActivityTime = 0
    const throttledTrackActivity = () => {
      const now = Date.now()
      if (now - lastActivityTime > 5000) {
        // Only update every 5 seconds
        lastActivityTime = now
        trackActivity()
      }
    }

    // Set up event listeners for user activity
    window.addEventListener("mousemove", throttledTrackActivity)
    window.addEventListener("keydown", throttledTrackActivity)
    window.addEventListener("scroll", throttledTrackActivity)
    window.addEventListener("click", throttledTrackActivity)

    // Initialize activity timeout
    resetActivityTimeout()

    // Track session end when user leaves the page
    const handleBeforeUnload = () => {
      if (sessionData) {
        // We can't use async functions with beforeunload, so we use
        // synchronous methods like navigator.sendBeacon() in a real implementation
        const sessionEndEvent = {
          type: "SESSION_END",
          data: {
            sessionId: sessionData.sessionId,
            duration: Math.floor((Date.now() - sessionData.startTime) / 1000),
            pageViews: sessionData.pageViews,
            events: sessionData.events,
            reason: "page_exit",
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

    // Cleanup
    return () => {
      window.removeEventListener("mousemove", throttledTrackActivity)
      window.removeEventListener("keydown", throttledTrackActivity)
      window.removeEventListener("scroll", throttledTrackActivity)
      window.removeEventListener("click", throttledTrackActivity)
      window.removeEventListener("beforeunload", handleBeforeUnload)

      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current)
      }
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current)
      }
      clearInterval(intervalId)
    }
  }, [])

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
        setTimeout(processEventQueue, 100)
      }
    }
  }

  const trackPageView = () => {
    const newEvent: TrackingEvent = {
      type: "PAGE_VIEW",
      data: {
        url: window.location.href,
        path: window.location.pathname,
        referrer: document.referrer,
        timestamp: new Date().toISOString(),
        sessionId: sessionData?.sessionId,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
        userAgent: navigator.userAgent,
      },
    }

    // Add to queue instead of directly updating state
    eventsQueueRef.current.push(newEvent)
    processEventQueue()
  }

  const trackEvent = (event: TrackingEvent) => {
    // Thêm kiểm tra để tránh theo dõi các sự kiện trùng lặp trong thời gian ngắn
    const eventKey = `${event.type}-${JSON.stringify(event.data)}`
    const now = Date.now()

    // Kiểm tra xem sự kiện tương tự đã được ghi lại gần đây chưa
    if (recentEventsRef.current[eventKey] && now - recentEventsRef.current[eventKey] < 2000) {
      // Bỏ qua sự kiện nếu đã ghi lại trong vòng 2 giây
      return
    }

    // Ghi lại thời gian của sự kiện này
    recentEventsRef.current[eventKey] = now

    // Add to queue instead of directly updating state
    eventsQueueRef.current.push(event)

    // Process queue if not already processing
    if (!isProcessingQueueRef.current) {
      setTimeout(processEventQueue, 100)
    }
  }

  // Send data to server
  const sendToServer = async (event: TrackingEvent) => {
    try {
      const payload = {
        ...event,
        // Add additional info
        clientInfo: {
          userAgent: navigator.userAgent,
          language: navigator.language,
          screenSize: {
            width: window.screen.width,
            height: window.screen.height,
          },
          viewportSize: {
            width: window.innerWidth,
            height: window.innerHeight,
          },
          timestamp: new Date().toISOString(),
        },
        sessionInfo: sessionData,
      }

      console.log("Sending tracking data:", payload)

      const response = await fetch("/api/track", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          `Server responded with status: ${response.status}. ${errorData.error || errorData.message || ""}`,
        )
      }

      const result = await response.json()
      console.log("Tracking data sent successfully:", result)
    } catch (error) {
      // Handle error but don't disrupt user experience
      console.error("Failed to send tracking data to server:", error)

      // Store failed events in localStorage for retry later
      try {
        const failedEvents = JSON.parse(localStorage.getItem("failed_tracking_events") || "[]")
        failedEvents.push({
          event,
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : "Unknown error",
        })
        localStorage.setItem("failed_tracking_events", JSON.stringify(failedEvents.slice(-50))) // Keep last 50 failed events
      } catch (storageError) {
        console.error("Failed to store failed tracking event:", storageError)
      }
    }
  }

  const clearEvents = () => {
    setEvents([])
    localStorage.removeItem("user_tracking_events")
  }

  return (
    <TrackingContext.Provider value={{ events, trackEvent, clearEvents, sessionData }}>
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
