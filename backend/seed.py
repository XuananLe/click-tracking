import random
from faker import Faker

from model import *
import utils


fake = Faker()

fake = utils.register_providers(fake)

# Utility Functions for Random Choices
def random_choice(array):
    return random.choice(array)

def random_int(min_val, max_val):
    return random.randint(min_val, max_val)

def generate_event_data(event_type, session_id, user_id, scenario_name):
    timestamp = fake.iso8601()
    event_data = {
        "sessionId": session_id,
        "userId": user_id,
        "timestamp": timestamp,
        "url": "https://shoptrack.com/",
        "deviceType": "mobile" if scenario_name == "MOBILE_QUICK_BUY" else "desktop",
        "browser": "Chrome",
    }

    if event_type == "PAGE_VIEW":
        event_data.update({
            "path": "/",
            "referrer": "https://google.com" if random.choice([True, False]) else ""
        })
    elif event_type == "SEARCH":
        event_data.update({
            "query": random_choice(["headphones", "laptop", "shoes", "watch"]),
            "resultsCount": random_int(5, 50)
        })
    elif event_type == "PRODUCT_VIEW":
        product_id = random_int(1, 8)
        event_data.update({
            "productId": product_id,
            "productName": f"Product {product_id}",
            "category": random_choice(["Electronics", "Fashion", "Home"]),
            "price": random_int(50, 500),
            "path": f"/product/{product_id}"
        })
    elif event_type == "ADD_TO_CART":
        event_data.update({
            "productId": random_int(1, 8),
            "quantity": random_int(1, 3),
            "price": random_int(50, 500)
        })
    elif event_type == "ORDER_COMPLETE":
        event_data.update({
            "orderId": random_int(1000, 9999),
            "orderValue": random_int(100, 1000),
            "path": "/order-confirmation"
        })
    elif event_type == "FORM_INTERACTION":
        event_data.update({
            "formId": "checkout",
            "fieldName": random_choice(["email", "address", "phone"]),
            "eventType": "input",
        })
    elif event_type == "PAYMENT_INFO":
        event_data.update({
            "paymentMethod": random_choice(["credit_card", "paypal", "apple_pay"]),
            "amount": random_int(50, 500),
        })
    elif event_type == "CHECKOUT_START":
        event_data.update({
            "path": "/checkout",
            "checkoutStep": "shipping",
        })
    elif event_type == "PAGE_EXIT":
        event_data.update({
            "exitReason": "abandonment",
            "timeOnSite": random_int(60, 600),
        })

    return event_data

def generate_scenario_events(scenario_name, scenario, user_id):
    session_id = fake.uuid4()
    events = []

    for event_type in scenario["events"]:
        event_data = generate_event_data(event_type, session_id, user_id, scenario_name)
        
        event = Event(
            type=event_type,
            data=Data(
                pageType="Landing Page",
                productId=random_int(1, 8),
                productName=f"Product {random_int(1, 8)}",
                durationSeconds=random_int(30, 300),
                timestamp=event_data["timestamp"],
                sessionId=session_id,
                url="https://shoptrack.com/",
                userAgent=fake.user_agent(),
                viewport={"width": random_int(200, 1920), "height": random_int(200, 1080),
                        
                          },
                deviceType="mobile" if scenario_name == "MOBILE_QUICK_BUY" else "desktop",
                browser="Chrome",
                os="Windows"
            ),
            clientInfo=ClientInfo(
                userAgent=fake.user_agent(),
                language="en-US",
                languages=["en-US", "es-ES"],
                platform="Windows",
                cookieEnabled=True,
                onLine=True,
                screenSize=Viewport(width=1920, height=1080),
                viewportSize=Viewport(width=random_int(200, 1920), height=random_int(200, 1080)),
                timezone="America/New_York",
                connectionType="wifi",
                timestamp=event_data["timestamp"]
            ),
            sessionInfo=SessionInfo(
                sessionId=session_id,
                startTime=random_int(1600000000, 1610000000),  # Random time in the last year
                lastActivityTime=random_int(1610000000, 1620000000),
                pageViews=random_int(1, 100),
                events=random_int(1, 100),
                referrer=fake.url(),
                entryPage=fake.url(),
                userAgent=fake.user_agent(),
                language="en-US",
                timezone="America/New_York",
                screenResolution="1920x1080",
                viewportSize="1920x1080",
                deviceType="mobile" if scenario_name == "MOBILE_QUICK_BUY" else "desktop",
                browser="Chrome",
                os="Windows",
                connectionType="wifi",
                isReturningUser=random.choice([True, False])
            )
        )
        events.append(event)

    return events

def generate_scenarios():
    all_events = []
    for _ in range(20):
        scenario_name = random_choice(list(SCENARIOS.keys()))
        scenario = SCENARIOS[scenario_name]
        user_id = random.choice([None, fake.uuid4()])
        scenario_events = generate_scenario_events(scenario_name, scenario, user_id)
        all_events.extend(scenario_events)

    return all_events

events = generate_scenarios()
import json
for event in events:
    print(json.dumps(event.dict(), indent=2))