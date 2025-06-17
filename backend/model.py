from pydantic import BaseModel
from typing import Optional, List, Any

class Viewport(BaseModel):
    width: Optional[int] = None
    height: Optional[int] = None

class Data(BaseModel):
    pageType: Optional[str] = None
    productId: Optional[int] = None
    productName: Optional[str] = None
    durationSeconds: Optional[int] =  None
    timestamp: Optional[str] = None
    sessionId: Optional[str] = None
    url: Optional[str] = None
    userAgent: Optional[str] = None
    viewport: Optional[Any] = ""
    deviceType: Optional[str] = None
    browser: Optional[str] = None
    os: Optional[str] = None

class ClientInfo(BaseModel):
    userAgent: Optional[str] = None
    language: Optional[str] = None
    languages: Optional[List[str]] = None
    platform: Optional[str] = None
    cookieEnabled: Optional[bool] = None
    onLine: Optional[bool] = None
    screenSize: Optional[Viewport] = None
    viewportSize: Optional[Viewport] = None
    timezone: Optional[str] = None
    connectionType: Optional[str] = None
    timestamp: Optional[str] = None

class SessionInfo(BaseModel):
    sessionId: Optional[str] = None
    startTime: Optional[int] = None
    lastActivityTime: Optional[int] = None
    pageViews: Optional[int] = None
    events: Optional[int] = None
    referrer: Optional[str] = None
    entryPage: Optional[str] = None
    userAgent: Optional[str] = None
    language: Optional[str] = None
    timezone: Optional[str] = None
    screenResolution: Optional[str] = None
    viewportSize: Optional[Any] = None
    deviceType: Optional[str] = None
    browser: Optional[str] = None
    os: Optional[str] = None
    connectionType: Optional[str] = None
    isReturningUser: Optional[bool] = None

class Event(BaseModel):
    type: Optional[str] = None
    data: Optional[Data] = None
    clientInfo: Optional[ClientInfo] = None
    sessionInfo: Optional[SessionInfo] = None

SCENARIOS = {
    "SUCCESSFUL_PURCHASE": {
        "name": "Successful Purchase Journey",
        "events": [
            "PAGE_VIEW", "SEARCH", "PRODUCT_VIEW", "ADD_TO_CART", 
            "CART_VIEW", "CHECKOUT_START", "FORM_INTERACTION", "PAYMENT_INFO", "ORDER_COMPLETE"
        ],
    },
    "ABANDONED_CART": {
        "name": "Cart Abandonment",
        "events": [
            "PAGE_VIEW", "PRODUCT_VIEW", "ADD_TO_CART", "CART_VIEW", 
            "CHECKOUT_START", "FORM_INTERACTION", "PAGE_EXIT"
        ],
    },
    "BROWSER_SHOPPER": {
        "name": "Window Shopping",
        "events": [
            "PAGE_VIEW", "CATEGORY_BROWSE", "PRODUCT_CLICK", "PRODUCT_CLICK", 
            "PRODUCT_CLICK", "PAGE_EXIT"
        ],
    },
    "PRICE_COMPARISON": {
        "name": "Price Comparison Shopper",
        "events": [
            "PAGE_VIEW", "SEARCH", "PRODUCT_VIEW", "PRICE_CHECK", 
            "EXTERNAL_LINK", "RETURN_VISIT", "PRODUCT_CLICK", "ADD_TO_CART"
        ],
    },
    "MOBILE_QUICK_BUY": {
        "name": "Mobile Quick Purchase",
        "events": ["PAGE_VIEW", "QUICK_SEARCH", "PRODUCT_VIEW", "ONE_CLICK_BUY", "ORDER_COMPLETE"]
    },
}
