from concurrent.futures import ThreadPoolExecutor
import random
import json
from faker import Faker
from datetime import datetime, timedelta
from uuid import uuid4
import dotenv
import utils

dotenv.load_dotenv()

fake = Faker()
fake = utils.register_providers(fake)

def random_choice(array):
    return random.choice(array)

def random_int(min_val, max_val):
    return random.randint(min_val, max_val)

def random_float(min_val, max_val):
    return round(random.uniform(min_val, max_val), 2)

PRODUCT_TYPES = {
    "Electronics": ["Smartphones", "Laptops", "Headphones", "Smartwatches", "Cameras"],
    "Fashion": ["Clothing", "Footwear", "Accessories", "Bags", "Jewelry"],
    "Home": ["Furniture", "Appliances", "Decor", "Kitchenware", "Bedding"],
    "Sports": ["Equipment", "Apparel", "Footwear", "Accessories", "Outdoor Gear"],
    "Beauty": ["Skincare", "Makeup", "Haircare", "Fragrances", "Personal Care"]
}

def get_product_type():
    category = random_choice(list(PRODUCT_TYPES.keys()))
    sub_type = random_choice(PRODUCT_TYPES[category])
    return {"category": category, "sub_type": sub_type}

def generate_event_data(event_type, session_id, user_id, scenario_name, session_start_time):
    session_duration_minutes = random_int(1, 30)
    timestamp = (session_start_time + timedelta(minutes=random.uniform(0, session_duration_minutes))).isoformat()
    
    base_event_data = {
        "event_type": event_type,
        "timestamp": timestamp,
        "session_id": str(session_id),
        "user_id": str(user_id) if user_id else None,
        "device_type": fake.random_device_type(),
        "browser": fake.random_browser_type(),
        "os": fake.random_os_type(),
        "user_agent": fake.user_agent(),
        "ip_address": fake.ipv4(),
        "geo_location": {
            "country": fake.country(),
            "city": fake.city()
        },
        "client_timezone": random_choice(["America/New_York", "Europe/London", "Asia/Tokyo"]),
        "connection_type": fake.random_connection_type(),
    }

    if event_type == "PAGE_VIEW":
        base_event_data.update({
            "url": "https://shoptrack.com" + (path := random_choice(["/", "/category/electronics", "/search", f"/product/{random_int(1, 100)}"])),
            "path": path,
            "referrer": random_choice(["https://google.com", "https://facebook.com", "", fake.url()]),
            "page_type": random_choice(["homepage", "category", "search", "product"])
        })
    elif event_type == "SEARCH":
        base_event_data.update({
            "query": random_choice(["headphones", "laptop", "shoes", "watch", "skincare"]),
            "results_count": random_int(5, 50),
            "filters_applied": random.sample(["brand:Apple", "price:100-200", "color:black"], k=random_int(0, 3)),
            "url": "https://shoptrack.com/search",
            "path": "/search"
        })
    elif event_type == "PRODUCT_VIEW":
        product_id = random_int(1, 100)
        product_type = get_product_type()
        base_event_data.update({
            "product_id": product_id,
            "product_name": f"{product_type['sub_type']} {product_id}",
            "category": product_type["category"],
            "sub_type": product_type["sub_type"],
            "price": random_int(50, 500),
            "currency": fake.random_currency_type(),
            "sku": f"SKU-{random_int(1000, 9999)}",
            "brand": random_choice(["Apple", "Nike", "Samsung", "Generic", "L’Oreal"]),
            "url": f"https://shoptrack.com/product/{product_id}",
            "path": f"/product/{product_id}"
        })
    elif event_type == "ADD_TO_CART":
        product_id = random_int(1, 100)
        product_type = get_product_type()
        base_event_data.update({
            "product_id": product_id,
            "product_name": f"{product_type['sub_type']} {product_id}",
            "category": product_type["category"],
            "sub_type": product_type["sub_type"],
            "price": random_int(50, 500),
            "currency": fake.random_currency_type(),
            "sku": f"SKU-{random_int(1000, 9999)}",
            "brand": random_choice(["Apple", "Nike", "Samsung", "Generic", "L’Oreal"]),
            "quantity": random_int(1, 3),
            "variant": random_choice(["color:black", "size:medium", "model:pro"])
        })
    elif event_type == "REMOVE_FROM_CART":
        product_id = random_int(1, 100)
        product_type = get_product_type()
        base_event_data.update({
            "product_id": product_id,
            "product_name": f"{product_type['sub_type']} {product_id}",
            "category": product_type["category"],
            "sub_type": product_type["sub_type"],
            "price": random_int(50, 500),
            "currency": fake.random_currency_type(),
            "sku": f"SKU-{random_int(1000, 9999)}",
            "quantity": random_int(1, 3)
        })
    elif event_type == "CART_VIEW":
        base_event_data.update({
            "cart_value": random_float(50, 1000),
            "cart_items": [
                {
                    "product_id": random_int(1, 100),
                    "product_name": f"{get_product_type()['sub_type']} {random_int(1, 100)}",
                    "quantity": random_int(1, 3),
                    "price": random_int(50, 500)
                } for _ in range(random_int(1, 5))
            ],
            "url": "https://shoptrack.com/cart",
            "path": "/cart"
        })
    elif event_type == "CHECKOUT_START":
        base_event_data.update({
            "cart_value": random_float(50, 1000),
            "cart_items": [
                {
                    "product_id": random_int(1, 100),
                    "product_name": f"{get_product_type()['sub_type']} {random_int(1, 100)}",
                    "quantity": random_int(1, 3),
                    "price": random_int(50, 500)
                } for _ in range(random_int(1, 5))
            ],
            "checkout_step": "shipping",
            "url": "https://shoptrack.com/checkout",
            "path": "/checkout"
        })
    elif event_type == "CHECKOUT_STEP":
        base_event_data.update({
            "checkout_step": random_choice(["shipping", "payment", "review"]),
            "step_number": random_int(1, 3),
            "cart_value": random_float(50, 1000),
            "url": "https://shoptrack.com/checkout",
            "path": "/checkout"
        })
    elif event_type == "PAYMENT_INFO":
        base_event_data.update({
            "payment_method": fake.random_payment_type(),
            "amount": random_float(50, 1000),
            "currency": "USD"
        })
    elif event_type == "ORDER_COMPLETE":
        product_type = get_product_type()
        base_event_data.update({
            "order_id": random_int(1000, 9999),
            "order_value": random_float(100, 1000),
            "currency": "USD",
            "cart_items": [
                {
                    "product_id": random_int(1, 100),
                    "product_name": f"{get_product_type()['sub_type']} {random_int(1, 100)}",
                    "quantity": random_int(1, 3),
                    "price": random_int(50, 500),
                    "category": product_type["category"],
                    "sub_type": product_type["sub_type"],
                    "sku": f"SKU-{random_int(1000, 9999)}",
                    "brand": random_choice(["Apple", "Nike", "Samsung", "Generic", "L’Oreal"])
                } for _ in range(random_int(1, 5))
            ],
            "payment_method": fake.random_payment_type(),
            "shipping_method": fake.random_shipment_type(),
            "shipping_cost": random_float(5, 50),
            "tax_amount": random_float(5, 50),
            "url": "https://shoptrack.com/order-confirmation",
            "path": "/order-confirmation"
        })
    elif event_type == "LOGIN":
        base_event_data.update({
            "login_method": fake.random_login_type(),
            "success": random_choice([True, False]),
            "url": "https://shoptrack.com/login",
            "path": "/login"
        })
    elif event_type == "LOGOUT":
        session_end = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
        duration_seconds = int((session_end - session_start_time).total_seconds())
        base_event_data.update({
            "url": "https://shoptrack.com/logout",
            "path": "/logout",
            "session_duration_seconds": duration_seconds
        })
    elif event_type == "REVIEW_SUBMISSION":
        product_id = random_int(1, 100)
        product_type = get_product_type()
        base_event_data.update({
            "product_id": product_id,
            "product_name": f"{product_type['sub_type']} {product_id}",
            "category": product_type["category"],
            "sub_type": product_type["sub_type"],
            "rating": random_int(1, 5),
            "review_text": fake.sentence(nb_words=10),
            "url": f"https://shoptrack.com/product/{product_id}",
            "path": f"/product/{product_id}"
        })
    elif event_type == "SHARE":
        product_id = random_int(1, 100)
        product_type = get_product_type()
        base_event_data.update({
            "product_id": product_id,
            "product_name": f"{product_type['sub_type']} {product_id}",
            "category": product_type["category"],
            "sub_type": product_type["sub_type"],
            "platform": random_choice(["facebook", "twitter", "email", "whatsapp"]),
            "share_url": f"https://shoptrack.com/product/{product_id}",
            "url": f"https://shoptrack.com/product/{product_id}",
            "path": f"/product/{product_id}"
        })
    elif event_type == "ERROR":
        base_event_data.update({
            "error_type": random_choice(["api_failure", "validation_error", "timeout", "network_error"]),
            "error_message": fake.sentence(nb_words=8),
            "component": random_choice(["checkout", "search", "product_page", "login"]),
            "url": f"https://shoptrack.com/{random_choice(['checkout', 'search', 'product/123', 'login'])}",
            "path": f"/{random_choice(['checkout', 'search', 'product/123', 'login'])}"
        })
    elif event_type == "FILTER_INTERACTION":
        base_event_data.update({
            "filter_type": random_choice(["price", "brand", "category", "color"]),
            "filter_value": random_choice(["100-200", "Apple", "Electronics", "black"]),
            "action": random_choice(["apply", "remove"]),
            "url": "https://shoptrack.com/category",
            "path": "/category"
        })
    elif event_type == "PROMOTION_VIEW":
        base_event_data.update({
            "promotion_id": random_int(100, 999),
            "promotion_name": random_choice(["Summer Sale", "Black Friday", "New Arrivals"]),
            "creative_id": f"banner-{random_int(1, 50)}",
            "placement": random_choice(["homepage_top", "sidebar", "product_page"]),
            "url": "https://shoptrack.com/",
            "path": "/"
        })
    elif event_type == "PROMOTION_CLICK":
        base_event_data.update({
            "promotion_id": random_int(100, 999),
            "promotion_name": random_choice(["Summer Sale", "Black Friday", "New Arrivals"]),
            "creative_id": f"banner-{random_int(1, 50)}",
            "placement": random_choice(["homepage_top", "sidebar", "product_page"]),
            "target_url": f"https://shoptrack.com/promo/{random_int(1, 100)}",
            "url": "https://shoptrack.com/",
            "path": "/"
        })
    elif event_type == "WISHLIST_ADD":
        product_id = random_int(1, 100)
        product_type = get_product_type()
        base_event_data.update({
            "product_id": product_id,
            "product_name": f"{product_type['sub_type']} {product_id}",
            "category": product_type["category"],
            "sub_type": product_type["sub_type"],
            "price": random_int(50, 500),
            "currency": fake.random_currency_type(),
            "sku": f"SKU-{random_int(1000, 9999)}",
            "brand": random_choice(["Apple", "Nike", "Samsung", "Generic", "L’Oreal"]),
            "url": f"https://shoptrack.com/product/{product_id}",
            "path": f"/product/{product_id}"
        })
    elif event_type == "CLICK":
        base_event_data.update({
            "element_id": f"element-{random_int(1, 1000)}",
            "element_class": random_choice(["btn-primary", "link", "image"]),
            "element_type": random_choice(["button", "a", "img"]),
            "text_content": random_choice(["Add to Cart", "View Details", "Shop Now"]),
            "target_url": f"https://shoptrack.com/{random_choice(['product/123', 'cart', 'checkout'])}",
            "position": {"x": random_int(0, 1920), "y": random_int(0, 1080)},
            "url": f"https://shoptrack.com/{random_choice(['product/123', 'category', 'homepage'])}",
            "path": f"/{random_choice(['product/123', 'category', ''])}"
        })
    elif event_type == "PAGE_EXIT":
        session_end = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
        duration_seconds = int((session_end - session_start_time).total_seconds())
        base_event_data.update({
            "url": f"https://shoptrack.com/{random_choice(['product/123', 'cart', 'checkout'])}",
            "path": f"/{random_choice(['product/123', 'cart', 'checkout'])}",
            "time_on_page": random_int(10, 300),
            "session_duration_seconds": duration_seconds,
            "exit_reason": fake.random_exit_reasons_type()
        })
    elif event_type == "SESSION_END":
        session_end = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
        duration_seconds = int((session_end - session_start_time).total_seconds())
        base_event_data.update({
            "session_duration_seconds": duration_seconds,
            "url": "https://shoptrack.com/",
            "path": "/"
        })

    return base_event_data

def generate_scenario_events(scenario_name, user_id):
    session_id = uuid4()
    session_start_time = datetime.now()
    events = []

    scenarios = {
        "MOBILE_QUICK_BUY": ["PAGE_VIEW", "SEARCH", "PRODUCT_VIEW", "ADD_TO_CART", "CHECKOUT_START", "CHECKOUT_STEP", "PAYMENT_INFO", "ORDER_COMPLETE", "SESSION_END"],
        "DESKTOP_BROWSE": ["PAGE_VIEW", "SEARCH", "FILTER_INTERACTION", "PRODUCT_VIEW", "WISHLIST_ADD", "PROMOTION_VIEW", "PROMOTION_CLICK", "PAGE_EXIT", "SESSION_END"],
        "USER_AUTH": ["LOGIN", "PAGE_VIEW", "LOGOUT", "SESSION_END"],
        "PRODUCT_REVIEW": ["PRODUCT_VIEW", "REVIEW_SUBMISSION", "SESSION_END"],
        "PRODUCT_SHARE": ["PRODUCT_VIEW", "SHARE", "SESSION_END"],
        "ERROR_ENCOUNTER": ["PAGE_VIEW", "ERROR", "PAGE_EXIT", "SESSION_END"],
        "FULL_JOURNEY": ["LOGIN", "PAGE_VIEW", "SEARCH", "FILTER_INTERACTION", "PRODUCT_VIEW", "WISHLIST_ADD", "ADD_TO_CART", "CART_VIEW", "CHECKOUT_START", "CHECKOUT_STEP", "PAYMENT_INFO", "ORDER_COMPLETE", "REVIEW_SUBMISSION", "SHARE", "LOGOUT", "SESSION_END"],
        "PROMO_INTERACTION": ["PAGE_VIEW", "PROMOTION_VIEW", "PROMOTION_CLICK", "PRODUCT_VIEW", "SESSION_END"],
        "CART_ABANDONMENT": ["PAGE_VIEW", "SEARCH", "PRODUCT_VIEW", "ADD_TO_CART", "CART_VIEW", "REMOVE_FROM_CART", "PAGE_EXIT", "SESSION_END"],
        "GENERAL_INTERACTION": ["PAGE_VIEW", "CLICK", "FILTER_INTERACTION", "PRODUCT_VIEW", "SESSION_END"]
    }

    event_sequence = scenarios.get(scenario_name, ["PAGE_VIEW", "SESSION_END"])

    for event_type in event_sequence:
        event_data = generate_event_data(event_type, session_id, user_id, scenario_name, session_start_time)
        events.append(event_data)

    return events

import numpy as np

def generate_scenarios(num_scenarios=2000):
    all_events = []
    scenario_names = [
        "MOBILE_QUICK_BUY", "DESKTOP_BROWSE", "USER_AUTH", "PRODUCT_REVIEW",
        "PRODUCT_SHARE", "ERROR_ENCOUNTER", "FULL_JOURNEY", "PROMO_INTERACTION",
        "CART_ABANDONMENT", "GENERAL_INTERACTION"
    ]
    
    scenario_names_array = np.array(scenario_names)
    user_ids = np.array([None, *[uuid4() for _ in range(num_scenarios - 1)]])
    user_ids_choice = np.random.choice(user_ids, num_scenarios)

    scenario_names_choice = np.random.choice(scenario_names_array, num_scenarios)

    for scenario_name, user_id in zip(scenario_names_choice, user_ids_choice):
        scenario_events = generate_scenario_events(scenario_name, user_id)
        all_events.extend(scenario_events)

    return all_events


import os
CONFLUENT_API_KEY = os.getenv("CONFLUENT_API_KEY")
CONFLUENT_API_SECRET = os.getenv("CONFLUENT_API_SECRET")
CONFLUENT_BOOTSTRAP_SERVERS = os.getenv("CONFLUENT_BOOTSTRAP_SERVERS")
CONFLUENT_TOPIC = os.getenv("CONFLUENT_DEFAULT_TOPIC", "click-tracking")


if not CONFLUENT_API_KEY or not CONFLUENT_API_SECRET or not CONFLUENT_BOOTSTRAP_SERVERS or not CONFLUENT_TOPIC:
    raise ValueError("Missing required environment variables for Kafka configuration.")

config = {
    'bootstrap.servers': CONFLUENT_BOOTSTRAP_SERVERS,
    'sasl.username': CONFLUENT_API_KEY,
    'sasl.password': CONFLUENT_API_SECRET,
    'security.protocol': 'SASL_SSL',
    'sasl.mechanisms': 'PLAIN',
    'acks': 'all'
}
from confluent_kafka import Producer, KafkaException

producer = Producer(config)

def delivery_report(err, msg):
    if err is not None:
        print(f"Message delivery failed: {err}")
    else:
        pass
        # print(f"Message delivered to {msg.topic()} [{msg.partition()}] at offset {msg.offset()}")


def produce_events(events, thread_id):
    producer = Producer(config)
    try:
        for event in events:
            event_json = json.dumps(event)
            try:
                producer.produce(
                    topic=CONFLUENT_TOPIC,
                    key=str(event["session_id"]).encode('utf-8'),
                    value=event_json.encode('utf-8'),
                    callback=delivery_report
                )
                producer.poll(0)
            except KafkaException as e:
                print(f"Thread {thread_id} failed to produce message: {e}")
        producer.flush()
        # print(f"Thread {thread_id} completed producing {len(events)} events.")
    except Exception as e:
        print(f"Thread {thread_id} error: {e}")
    finally:
        producer.flush()


def main():
    try:
        while True:
            events = generate_scenarios()
            num_threads = os.cpu_count()
            events_per_thread = len(events) // num_threads + (1 if len(events) % num_threads else 0)
            
            event_chunks = [events[i:i + events_per_thread] for i in range(0, len(events), events_per_thread)]
            
            with ThreadPoolExecutor(max_workers=num_threads) as executor:
                futures = [
                    executor.submit(produce_events, chunk, thread_id)
                    for thread_id, chunk in enumerate(event_chunks)
                ]
                for future in futures:
                    future.result()
            
            print("All events successfully sent to Kafka.")
    except Exception as e:
        print(f"Error in main: {e}")

if __name__ == "__main__":
    main()