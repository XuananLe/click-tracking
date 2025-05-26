"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type TrackingEvent = {
  type: string
  data: Record<string, any>
  clientInfo?: Record<string, any>
}

export default function ServerTrackingDashboard() {
  const [serverEvents, setServerEvents] = useState<TrackingEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchServerEvents = async () => {
    setLoading(true)
    try {
      // Trong môi trường thực tế, bạn sẽ gọi API để lấy dữ liệu từ server
      // Đây là mô phỏng cho mục đích demo
      const response = await fetch("/api/events")

      if (!response.ok) {
        throw new Error("Failed to fetch server events")
      }

      const data = await response.json()
      setServerEvents(data.events)
      setError(null)
    } catch (err) {
      console.error("Error fetching server events:", err)
      setError("Không thể tải dữ liệu từ server. Đây là môi trường demo.")

      // Tạo dữ liệu mẫu cho mục đích demo
      setServerEvents([
        {
          type: "ELEMENT_CLICK",
          data: {
            element: {
              tagName: "button",
              className: "btn-primary",
              text: "Thêm vào giỏ hàng",
              domPath: "body > div > main > section > div > div > div > button",
              coordinates: { x: 450, y: 320, relativeX: 450, relativeY: 520 },
            },
            timestamp: new Date().toISOString(),
            url: "https://example.com/products",
            path: "/products",
          },
          clientInfo: {
            userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            language: "vi-VN",
            screenSize: { width: 1920, height: 1080 },
            viewportSize: { width: 1200, height: 800 },
            timestamp: new Date().toISOString(),
          },
        },
        {
          type: "PRODUCT_INTERACTION",
          data: {
            productId: 2,
            action: "add_to_cart",
            timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
          },
          clientInfo: {
            userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            language: "vi-VN",
            screenSize: { width: 1920, height: 1080 },
            viewportSize: { width: 1200, height: 800 },
            timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
          },
        },
        {
          type: "NAVIGATION_CLICK",
          data: {
            item: "products",
            timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
          },
          clientInfo: {
            userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)",
            language: "vi-VN",
            screenSize: { width: 390, height: 844 },
            viewportSize: { width: 390, height: 800 },
            timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
          },
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchServerEvents()

    // Cập nhật dữ liệu mỗi 30 giây
    const interval = setInterval(fetchServerEvents, 30000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Server-side Tracking Dashboard</h1>
        <Button onClick={fetchServerEvents} disabled={loading}>
          {loading ? "Đang tải..." : "Làm mới dữ liệu"}
        </Button>
      </div>

      {error && (
        <Card className="mb-6 border-yellow-500">
          <CardContent className="pt-6">
            <p className="text-yellow-600">{error}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Dữ liệu hiển thị bên dưới là dữ liệu mẫu cho mục đích demo. Trong môi trường thực tế, dữ liệu sẽ được lấy
              từ cơ sở dữ liệu của bạn.
            </p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="all-events">
        <TabsList className="mb-6">
          <TabsTrigger value="all-events">Tất cả sự kiện</TabsTrigger>
          <TabsTrigger value="clicks">Click</TabsTrigger>
          <TabsTrigger value="devices">Thiết bị</TabsTrigger>
        </TabsList>

        <TabsContent value="all-events">
          <Card>
            <CardHeader>
              <CardTitle>Dữ liệu sự kiện từ server</CardTitle>
              <CardDescription>Tất cả sự kiện được ghi lại trên server</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-[600px] overflow-auto">
                {loading ? (
                  <div className="flex h-40 items-center justify-center">
                    <p>Đang tải dữ liệu...</p>
                  </div>
                ) : serverEvents.length > 0 ? (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="pb-2 text-left">Loại sự kiện</th>
                        <th className="pb-2 text-left">Thời gian</th>
                        <th className="pb-2 text-left">Chi tiết</th>
                      </tr>
                    </thead>
                    <tbody>
                      {serverEvents.map((event, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-2">{event.type}</td>
                          <td className="py-2">{new Date(event.data.timestamp).toLocaleString("vi-VN")}</td>
                          <td className="py-2">
                            <details>
                              <summary className="cursor-pointer text-sm text-blue-500">Xem chi tiết</summary>
                              <pre className="mt-2 max-h-40 overflow-auto rounded bg-muted p-2 text-xs">
                                {JSON.stringify(event, null, 2)}
                              </pre>
                            </details>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="flex h-40 items-center justify-center">
                    <p>Không có dữ liệu sự kiện nào.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clicks">
          <Card>
            <CardHeader>
              <CardTitle>Dữ liệu click</CardTitle>
              <CardDescription>Chi tiết về các sự kiện click</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-[600px] overflow-auto">
                {loading ? (
                  <div className="flex h-40 items-center justify-center">
                    <p>Đang tải dữ liệu...</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="pb-2 text-left">Phần tử</th>
                        <th className="pb-2 text-left">Đường dẫn DOM</th>
                        <th className="pb-2 text-left">Tọa độ</th>
                        <th className="pb-2 text-left">Thời gian</th>
                      </tr>
                    </thead>
                    <tbody>
                      {serverEvents
                        .filter((event) => event.type === "ELEMENT_CLICK")
                        .map((event, index) => (
                          <tr key={index} className="border-b">
                            <td className="py-2">
                              {event.data.element?.tagName}
                              {event.data.element?.text ? `: "${event.data.element.text}"` : ""}
                            </td>
                            <td className="py-2 max-w-[200px] truncate" title={event.data.element?.domPath}>
                              {event.data.element?.domPath}
                            </td>
                            <td className="py-2">
                              x: {event.data.element?.coordinates?.x}, y: {event.data.element?.coordinates?.y}
                            </td>
                            <td className="py-2">{new Date(event.data.timestamp).toLocaleString("vi-VN")}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin thiết bị</CardTitle>
              <CardDescription>Chi tiết về thiết bị của người dùng</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-[600px] overflow-auto">
                {loading ? (
                  <div className="flex h-40 items-center justify-center">
                    <p>Đang tải dữ liệu...</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="pb-2 text-left">User Agent</th>
                        <th className="pb-2 text-left">Ngôn ngữ</th>
                        <th className="pb-2 text-left">Kích thước màn hình</th>
                        <th className="pb-2 text-left">Thời gian</th>
                      </tr>
                    </thead>
                    <tbody>
                      {serverEvents
                        .filter((event) => event.clientInfo)
                        .map((event, index) => (
                          <tr key={index} className="border-b">
                            <td className="py-2 max-w-[200px] truncate" title={event.clientInfo?.userAgent}>
                              {event.clientInfo?.userAgent}
                            </td>
                            <td className="py-2">{event.clientInfo?.language}</td>
                            <td className="py-2">
                              {event.clientInfo?.screenSize?.width} x {event.clientInfo?.screenSize?.height}
                            </td>
                            <td className="py-2">{new Date(event.clientInfo?.timestamp).toLocaleString("vi-VN")}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
