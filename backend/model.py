from pydantic import BaseModel, Field, ValidationError
from typing import Optional, List, Dict
class PerformanceInfo(BaseModel):
    memory_usage: Optional[float] = None
    navigation_start: Optional[str] = None
    load_event_end: Optional[str] = None
    dom_content_loaded_event_end: Optional[str] = None
    dom_complexity: Optional[int] = None
    local_storage_bytes: Optional[int] = None
    session_storage_bytes: Optional[int] = None
    estimated_total_kb: Optional[int] = None

class SessionInfo(BaseModel):
    session_id: str
    start_time: str
    last_activity_time: str
    page_views: int
    events: int
    referrer: str
    entry_page: str
    user_agent: str
    language: str
    timezone: str
    screen_resolution: str
    viewport_size: str
    device_type: str
    browser: str
    os: str
    connection_type: str
    is_returning_user: bool

class Data(BaseModel):
    productId: int
    productName: str
    durationSeconds: int
    timestamp: str
    sessionId: str
    url: str
    userAgent: str
    viewport: str
    deviceType: str
    browser: str
    os: str

class Event(BaseModel):
    type: str
    data: Data