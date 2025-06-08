import json
from random import randint
from fastapi import FastAPI, HTTPException, BackgroundTasks
import os
from random import choice
from fastapi.middleware.cors import CORSMiddleware
import dotenv
from confluent_kafka import Producer, KafkaError
import logging
from pydantic import BaseModel
from typing import Optional, List, Dict

dotenv.load_dotenv()

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

producer = Producer(config)
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def send_event_to_kafka(event: Dict):
    try:
        event_json = json.dumps(event)
        producer.produce(
            topic=CONFLUENT_TOPIC,
            key=str(randint(1, 1000)),
            value=event_json
            # on_delivery=lambda err, msg: print(
            #     f"Message delivery status: {err}" if err else f"Message delivered to {msg.topic()} [{msg.partition()}]"
            # )
        )
        producer.flush()
    except Exception as e:
        print(f"Kafka produce failed: {e}", flush=True)



@app.get("/")
async def root(event: dict):
    print(f"Received event: {event}", flush=True)
    return {"message": "Welcome to the Click Tracking API"}


@app.post("/event-track")
async def track_event(event: Dict, background_tasks: BackgroundTasks):

    if not isinstance(event, dict):
        raise HTTPException(status_code=400, detail="Event must be a dictionary")

    background_tasks.add_task(send_event_to_kafka, event)

    return {"status": "success", "message": "Event enqueued for tracking"}