"use client"

import { useState } from "react"
import { useTracker } from "@/lib/use-tracker"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"

export default function AnalyticsPage() {
  const { events, clearEvents, sessionData } = useTracker()
  const [activeTab, setActiveTab] = useState("overview")

  // Group events by type
  const eventsByType = events.reduce(
    (acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const eventTypeData = Object.entries(eventsByType).map(([name, value]) => ({
    name,
    value,
  }))

  // Product views
  const productViews = events.filter((event) => event.type === "PRODUCT_VIEW")

  const productViewsData = productViews.reduce(
    (acc, event) => {
      const productId = event.data.productId
      const productName = event.data.productName
      const key = `${productId}-${productName}`
      acc[key] = (acc[key] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const productViewsChartData = Object.entries(productViewsData)
    .map(([key, value]) => {
      const [, productName] = key.split("-")
      return {
        name: productName,
        value,
      }
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 5) // Top 5 products

  // Page durations
  const pageDurations = events.filter((event) => event.type === "PAGE_DURATION")

  const pageDurationsByProduct = pageDurations.reduce(
    (acc, event) => {
      if (event.data.pageType === "product" && event.data.productName) {
        const productName = event.data.productName
        acc[productName] = (acc[productName] || 0) + event.data.durationSeconds
      }
      return acc
    },
    {} as Record<string, number>,
  )

  const pageDurationsData = Object.entries(pageDurationsByProduct).map(([name, value]) => ({
    name,
    seconds: value,
  }))

  // Section views
  const sectionViews = events.filter((event) => event.type === "SECTION_VIEW")

  const sectionViewsCount = sectionViews.reduce(
    (acc, event) => {
      const sectionName = event.data.sectionName
      acc[sectionName] = (acc[sectionName] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const sectionViewsData = Object.entries(sectionViewsCount).map(([name, value]) => ({
    name,
    views: value,
  }))

  // Tab views
  const tabViews = events.filter((event) => event.type === "PRODUCT_TAB_VIEW")

  const tabViewsCount = tabViews.reduce(
    (acc, event) => {
      const tabName = event.data.tabName
      acc[tabName] = (acc[tabName] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const tabViewsData = Object.entries(tabViewsCount).map(([name, value]) => ({
    name,
    views: value,
  }))

  // Related product clicks
  const relatedClicks = events.filter((event) => event.type === "RELATED_PRODUCT_CLICK")

  // Colors for charts
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"]

  // Calculate session metrics
  const calculateSessionMetrics = () => {
    if (!sessionData) return { duration: 0, pageViews: 0, events: 0 }

    const durationSeconds = Math.floor((Date.now() - sessionData.startTime) / 1000)
    return {
      duration: durationSeconds,
      pageViews: sessionData.pageViews,
      events: sessionData.events,
    }
  }

  const sessionMetrics = calculateSessionMetrics()

  // Format duration as mm:ss
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">User Behavior Analytics</h1>
        <Button variant="destructive" onClick={clearEvents}>
          Clear Data
        </Button>
      </div>

      <div className="mb-8 grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Current Session</CardTitle>
            <CardDescription>Session ID: {sessionData?.sessionId}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{formatDuration(sessionMetrics.duration)}</div>
            <p className="text-sm text-muted-foreground">Duration</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Page Views</CardTitle>
            <CardDescription>In current session</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{sessionData?.pageViews || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total Events</CardTitle>
            <CardDescription>All tracked interactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{events.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Product Analytics</TabsTrigger>
          <TabsTrigger value="engagement">User Engagement</TabsTrigger>
          <TabsTrigger value="events">Raw Events</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Events by Type</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={eventTypeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Most Viewed Products</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={productViewsChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {productViewsChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Time Spent on Product Pages</CardTitle>
                <CardDescription>Average time in seconds</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pageDurationsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="seconds" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Product Tab Engagement</CardTitle>
                <CardDescription>Which tabs users view most</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={tabViewsData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="views"
                    >
                      {tabViewsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Section Engagement</CardTitle>
                <CardDescription>Most viewed sections on product pages</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sectionViewsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="views" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Related Products</CardTitle>
                <CardDescription>Related product click-through rate</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium">Related Product Impressions</h4>
                    <p className="text-2xl font-bold">
                      {events.filter((e) => e.type === "RELATED_PRODUCTS_IMPRESSION").length}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium">Related Product Clicks</h4>
                    <p className="text-2xl font-bold">{relatedClicks.length}</p>
                  </div>
                  <div>
                    <h4 className="font-medium">Click-through Rate</h4>
                    <p className="text-2xl font-bold">
                      {events.filter((e) => e.type === "RELATED_PRODUCTS_IMPRESSION").length > 0
                        ? (
                            (relatedClicks.length /
                              events.filter((e) => e.type === "RELATED_PRODUCTS_IMPRESSION").length) *
                            100
                          ).toFixed(2)
                        : 0}
                      %
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="engagement">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Product Interactions</CardTitle>
                <CardDescription>How users interact with products</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {events.filter(
                  (e) => e.type === "ADD_TO_CART" || e.type === "WISHLIST_ADD" || e.type === "PRODUCT_SHARE",
                ).length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          {
                            name: "Add to Cart",
                            value: events.filter((e) => e.type === "ADD_TO_CART").length,
                          },
                          {
                            name: "Wishlist",
                            value: events.filter((e) => e.type === "WISHLIST_ADD").length,
                          },
                          {
                            name: "Share",
                            value: events.filter((e) => e.type === "PRODUCT_SHARE").length,
                          },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {[0, 1, 2].map((index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">No product interaction data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Session Duration</CardTitle>
                <CardDescription>Current session time spent</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <div className="flex h-full flex-col items-center justify-center">
                  <div className="text-6xl font-bold">{formatDuration(sessionMetrics.duration)}</div>
                  <p className="mt-4 text-muted-foreground">Minutes:Seconds</p>
                  <div className="mt-8 grid w-full grid-cols-2 gap-4">
                    <div className="rounded-lg border p-4 text-center">
                      <p className="text-sm text-muted-foreground">Page Views</p>
                      <p className="text-2xl font-bold">{sessionData?.pageViews || 0}</p>
                    </div>
                    <div className="rounded-lg border p-4 text-center">
                      <p className="text-sm text-muted-foreground">Events</p>
                      <p className="text-2xl font-bold">{sessionData?.events || 0}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>User Engagement Timeline</CardTitle>
                <CardDescription>Events over time</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {events.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={events.map((event, index) => ({
                        name: index,
                        time: new Date(event.data.timestamp).getTime(),
                        type: event.type,
                      }))}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        type="number"
                        domain={["dataMin", "dataMax"]}
                        tickFormatter={(value) => `${value}`}
                      />
                      <YAxis
                        dataKey="time"
                        domain={["dataMin", "dataMax"]}
                        tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                      />
                      <Tooltip
                        labelFormatter={(value) => `Event #${value}`}
                        formatter={(value, name, props) => [
                          new Date(value as number).toLocaleTimeString(),
                          props.payload.type,
                        ]}
                      />
                      <Line type="monotone" dataKey="time" stroke="#8884d8" dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">No timeline data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle>Raw Event Data</CardTitle>
              <CardDescription>All tracked events in chronological order</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-[600px] overflow-auto">
                <pre className="whitespace-pre-wrap rounded-lg bg-muted p-4 text-sm">
                  {JSON.stringify(events, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
