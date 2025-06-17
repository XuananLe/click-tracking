const SCENARIOS = {
  SUCCESSFUL_PURCHASE: {
    name: "Successful Purchase Journey",
    events: [
      "PAGE_VIEW", // Landing page
      "SEARCH", // Search for product
      "PRODUCT_VIEW", // View product details
      "ADD_TO_CART", // Add to cart
      "CART_VIEW", // View cart
      "CHECKOUT_START", // Start checkout
      "FORM_INTERACTION", // Fill shipping info
      "PAYMENT_INFO", // Enter payment
      "ORDER_COMPLETE", // Complete order
    ],
  },
  ABANDONED_CART: {
    name: "Cart Abandonment",
    events: [
      "PAGE_VIEW",
      "PRODUCT_VIEW",
      "ADD_TO_CART",
      "CART_VIEW",
      "CHECKOUT_START",
      "FORM_INTERACTION",
      "PAGE_EXIT", // Abandon at checkout
    ],
  },
  BROWSER_SHOPPER: {
    name: "Window Shopping",
    events: [
      "PAGE_VIEW",
      "CATEGORY_BROWSE",
      "PRODUCT_VIEW",
      "PRODUCT_VIEW",
      "PRODUCT_VIEW",
      "WISHLIST_ADD",
      "PAGE_EXIT",
    ],
  },
  PRICE_COMPARISON: {
    name: "Price Comparison Shopper",
    events: [
      "PAGE_VIEW",
      "SEARCH",
      "PRODUCT_VIEW",
      "PRICE_CHECK",
      "EXTERNAL_LINK",
      "RETURN_VISIT",
      "PRODUCT_VIEW",
      "ADD_TO_CART",
    ],
  },
  MOBILE_QUICK_BUY: {
    name: "Mobile Quick Purchase",
    events: ["PAGE_VIEW", "QUICK_SEARCH", "PRODUCT_VIEW", "ONE_CLICK_BUY", "ORDER_COMPLETE"],
  },
}

async function generateScenario(scenarioName, scenario, userId = null) {
  const sessionId = Date.now().toString(36) + Math.random().toString(36).substring(2)
  const baseTime = Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000 // Random time in last 7 days
  const events = []

  console.log(`📱 Generating scenario: ${scenario.name}`)

  for (let i = 0; i < scenario.events.length; i++) {
    const eventType = scenario.events[i]
    const timestamp = new Date(baseTime + i * 30000 + Math.random() * 60000).toISOString()

    let eventData = {
      timestamp,
      sessionId,
      userId,
      url: "https://shoptrack.com/",
      deviceType: scenarioName === "MOBILE_QUICK_BUY" ? "mobile" : "desktop",
      browser: "Chrome",
    }

    // Add specific data based on event type
    switch (eventType) {
      case "PAGE_VIEW":
        eventData = {
          ...eventData,
          path: "/",
          referrer: Math.random() > 0.5 ? "https://google.com" : "",
        }
        break

      case "SEARCH":
      case "QUICK_SEARCH":
        eventData = {
          ...eventData,
          query: ["headphones", "laptop", "shoes", "watch"][Math.floor(Math.random() * 4)],
          resultsCount: Math.floor(Math.random() * 50) + 5,
        }
        break

      case "PRODUCT_VIEW":
        const productId = Math.floor(Math.random() * 8) + 1
        eventData = {
          ...eventData,
          productId,
          productName: `Product ${productId}`,
          category: ["Electronics", "Fashion", "Home"][Math.floor(Math.random() * 3)],
          price: Math.floor(Math.random() * 500) + 50,
          path: `/product/${productId}`,
        }
        break

      case "ADD_TO_CART":
        eventData = {
          ...eventData,
          productId: Math.floor(Math.random() * 8) + 1,
          quantity: Math.floor(Math.random() * 3) + 1,
          price: Math.floor(Math.random() * 500) + 50,
        }
        break

      case "CART_VIEW":
        eventData = {
          ...eventData,
          path: "/cart",
          itemCount: Math.floor(Math.random() * 5) + 1,
          totalValue: Math.floor(Math.random() * 1000) + 100,
        }
        break

      case "CHECKOUT_START":
        eventData = {
          ...eventData,
          path: "/checkout",
          checkoutStep: "shipping",
        }
        break

      case "FORM_INTERACTION":
        eventData = {
          ...eventData,
          formId: "checkout",
          fieldName: ["email", "address", "phone"][Math.floor(Math.random() * 3)],
          eventType: "input",
        }
        break

      case "PAYMENT_INFO":
        eventData = {
          ...eventData,
          paymentMethod: ["credit_card", "paypal", "apple_pay"][Math.floor(Math.random() * 3)],
        }
        break

      case "ORDER_COMPLETE":
        eventData = {
          ...eventData,
          orderId: Math.floor(Math.random() * 10000) + 1000,
          orderValue: Math.floor(Math.random() * 1000) + 100,
          path: "/order-confirmation",
        }
        break

      case "WISHLIST_ADD":
        eventData = {
          ...eventData,
          productId: Math.floor(Math.random() * 8) + 1,
          action: "add_to_wishlist",
        }
        break

      case "PRICE_CHECK":
        eventData = {
          ...eventData,
          action: "price_comparison",
          competitorChecked: true,
        }
        break

      case "EXTERNAL_LINK":
        eventData = {
          ...eventData,
          destination: "competitor_site",
          reason: "price_comparison",
        }
        break

      case "RETURN_VISIT":
        eventData = {
          ...eventData,
          returnReason: "price_comparison_complete",
        }
        break

      case "ONE_CLICK_BUY":
        eventData = {
          ...eventData,
          purchaseMethod: "one_click",
          productId: Math.floor(Math.random() * 8) + 1,
        }
        break

      case "PAGE_EXIT":
        eventData = {
          ...eventData,
          exitReason: "abandonment",
          timeOnSite: Math.floor(Math.random() * 600) + 60, // 1-10 minutes
        }
        break

      default:
        eventData = {
          ...eventData,
          action: eventType.toLowerCase(),
        }
    }

    const event = {
      session_id: sessionId,
      user_id: userId,
      event_type: eventType,
      event_data: eventData,
      client_info: {
        userAgent:
          scenarioName === "MOBILE_QUICK_BUY"
            ? "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15"
            : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        language: "en-US",
        screenSize: scenarioName === "MOBILE_QUICK_BUY" ? { width: 375, height: 667 } : { width: 1920, height: 1080 },
        timestamp,
      },
    }

    events.push(event)
  }

  return events
}

async function generateEcommerceScenarios() {
  console.log("🛒 Generating realistic e-commerce scenarios...")

  const allEvents = []
  const scenarioNames = Object.keys(SCENARIOS)

  // Generate multiple instances of each scenario
  for (let i = 0; i < 20; i++) {
    // 20 total scenarios
    const scenarioName = scenarioNames[Math.floor(Math.random() * scenarioNames.length)]
    const scenario = SCENARIOS[scenarioName]
    const userId = Math.random() > 0.3 ? Math.floor(Math.random() * 3) + 1 : null // 70% authenticated

    const scenarioEvents = await generateScenario(scenarioName, scenario, userId)
    console.log(scenarioEvents)
    allEvents.push(...scenarioEvents)
  }

  console.log(`📊 Generated ${allEvents.length} e-commerce events`)

  process.exit(0)
  
  
  for (const event of allEvents) {
    try {
      await sql`
        INSERT INTO tracking_events (session_id, user_id, event_type, event_data, client_info)
        VALUES (
          ${event.session_id},
          ${event.user_id},
          ${event.event_type},
          ${JSON.stringify(event.event_data)},
          ${JSON.stringify(event.client_info)}
        )
      `
    } catch (error) {
      console.error("Error inserting event:", error)
    }
  }

  console.log("🎉 E-commerce scenarios generated successfully!")

  // Print summary
  const scenarioSummary = {}
  allEvents.forEach((event) => {
    scenarioSummary[event.event_type] = (scenarioSummary[event.event_type] || 0) + 1
  })

  console.log("\n📈 Event Summary:")
  Object.entries(scenarioSummary).forEach(([eventType, count]) => {
    console.log(`  ${eventType}: ${count}`)
  })
}

generateEcommerceScenarios().catch(console.error)
