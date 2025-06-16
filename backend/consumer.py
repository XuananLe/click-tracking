import json
import os
import clickhouse_connect
import dotenv
import faker
import warnings
import utils
import datetime
import random
from datetime import timedelta

warnings.filterwarnings("ignore")
from model import Event
from faker import Faker
from datetime import datetime


# Load environment variables
dotenv.load_dotenv()
fake = Faker()
fake = utils.register_providers(fake)

# Get environment variables
CONFLUENT_API_KEY = os.getenv("CONFLUENT_API_KEY")
CONFLUENT_API_SECRET = os.getenv("CONFLUENT_API_SECRET")
CONFLUENT_BOOTSTRAP_SERVERS = os.getenv("CONFLUENT_BOOTSTRAP_SERVERS")
CONFLUENT_TOPIC = os.getenv("CONFLUENT_DEFAULT_TOPIC", "click-tracking")
CLICKHOUSE_USERNAME = os.getenv("CLICKHOUSE_USERNAME", "default")
CLICKHOUSE_HOST = os.getenv("CLICKHOUSE_HOST", "localhost")
CLICKHOUSE_PASSWORD = os.getenv("CLICKHOUSE_PASSWORD", "default")

# Validate environment variables
if not CLICKHOUSE_USERNAME or not CLICKHOUSE_PASSWORD:
    raise ValueError("Missing required environment variables for ClickHouse configuration.")

if not CONFLUENT_API_KEY or not CONFLUENT_API_SECRET or not CONFLUENT_BOOTSTRAP_SERVERS or not CONFLUENT_TOPIC:
    raise ValueError("Missing required environment variables for Kafka configuration.")


clickhouse = clickhouse_connect.get_client(
    host=CLICKHOUSE_HOST,
    username=CLICKHOUSE_USERNAME,
    password=CLICKHOUSE_PASSWORD,
    secure=True,  
)

clickhouse.command("CREATE DATABASE IF NOT EXISTS click_tracking")

clickhouse.command("""
CREATE TABLE IF NOT EXISTS click_tracking.page_duration (
    page_type String,
    product_id Int32,
    product_name String,
    duration_seconds Int32,
    timestamp DateTime,
    session_id String,
    url String,
    user_agent String,
    viewport String,
    device_type String,
    browser String,
    os String
) ENGINE = MergeTree()
ORDER BY (session_id, timestamp);
""")


clickhouse.command("""
CREATE TABLE IF NOT EXISTS click_tracking.session_info (
    session_id String,
    start_time DateTime,
    last_activity_time DateTime,
    page_views Int32,
    events Int32,
    referrer String,
    entry_page String,
    user_agent String,
    language String,
    timezone String,
    screen_resolution String,
    viewport_size String,
    device_type String,
    browser String,
    os String,
    connection_type String,
    is_returning_user Boolean
) ENGINE = MergeTree()
ORDER BY (session_id, start_time);
""")

clickhouse.command("""
CREATE TABLE IF NOT EXISTS click_tracking.performance_info (
    session_id String,
    memory_usage Float64,
    navigation_start DateTime,
    load_event_end DateTime,
    dom_content_loaded_event_end DateTime,
    dom_complexity Int32,
    local_storage_bytes Int32,
    session_storage_bytes Int32,
    estimated_total_kb Int32
) ENGINE = MergeTree()
ORDER BY (session_id, navigation_start);
""")

clickhouse.query("""
CREATE TABLE IF NOT EXISTS click_tracking.user_data (
    user_id Int32,
    email String,
    name String,
    phone String,
    address String,
    created_at DateTime,
    updated_at DateTime
) ENGINE = MergeTree()
ORDER BY (user_id);
""")

from pyspark.sql import SparkSession

spark = SparkSession.builder \
    .appName("Click-Tracking-Consuming") \
    .config("spark.driver.memory", "8g") \
    .config("spark.jars.packages", "org.apache.spark:spark-sql-kafka-0-10_2.13:4.0.0") \
    .getOrCreate()



def write_to_clickhouse(batch_df, batch_id):
    rows = batch_df.select("key", "value").rdd.map(lambda row: (row['key'], row['value'])).collect()
    print(f"Processing batch with {len(rows)} rows")

    for row in rows:
        event = json.loads(row[1])
        try:
            event = Event(**event)
            viewport = event.data.viewport
            
            if isinstance(viewport, dict):
                viewport = json.dumps(viewport)
            else:
                viewport = str(viewport) if viewport is not None else ""

            clickhouse.insert(
                "click_tracking.session_info",
                [[
                    event.data.sessionId or "anonymous",
                    datetime.now(),
                    datetime.now() + timedelta(seconds=random.randint(0, 3600)),
                    random.randint(1, 100),
                    faker.Faker().random_int(min=0, max=100),
                    fake.domain_name(),
                    fake.domain_name(),
                    fake.ascii_company_email(),
                    event.clientInfo.language or "en-US",
                    event.clientInfo.timezone or "UTC",
                    str(random.randint(1000, 2000)) + "x" + str(random.randint(1000, 2000)),
                    viewport,
                    event.data.deviceType or "Desktop",
                    event.data.browser or "Chrome",
                    event.clientInfo.platform or faker.Faker().platform() or "Linux",
                    event.clientInfo.connectionType or "WiFi",
                ]],
                column_names=[
                    "session_id", 
                    "start_time", 
                    "last_activity_time", 
                    "page_views", 
                    "events", 
                    "referrer", 
                    "entry_page", 
                    "user_agent", 
                    "language", 
                    "timezone", 
                    "screen_resolution", 
                    "viewport_size", 
                    "device_type", 
                    "browser", 
                    "os", 
                    "connection_type", 
                ]
            )
            
            if event.performanceInfo:
                performance_info = event.performanceInfo
                clickhouse.insert(
                    "click_tracking.performance_info",
                    [[
                        event.data.sessionId or "anonymous",
                        0.0 if not performance_info.memory else performance_info.memory.usedJSHeapSize or 0.0,
                        datetime.fromtimestamp(performance_info.timing.navigationStart / 1000) if performance_info.timing.navigationStart else datetime.now(),
                        datetime.fromtimestamp(performance_info.timing.loadEventEnd / 1000) if performance_info.timing.loadEventEnd else datetime.now(),
                        datetime.fromtimestamp(performance_info.timing.domContentLoadedEventEnd / 1000) if performance_info.timing.domContentLoadedEventEnd else datetime.now(),
                        performance_info.estimatedMemoryUsage.domComplexity or 0,
                        performance_info.estimatedMemoryUsage.localStorageBytes or 0,
                        performance_info.estimatedMemoryUsage.sessionStorageBytes or 0,
                        performance_info.estimatedMemoryUsage.estimatedTotalKB or 0
                    ]],
                    column_names=[
                        "session_id", 
                        "memory_usage", 
                        "navigation_start", 
                        "load_event_end", 
                        "dom_content_loaded_event_end", 
                        "dom_complexity", 
                        "local_storage_bytes", 
                        "session_storage_bytes", 
                        "estimated_total_kb"
                    ]
                )


            clickhouse.insert(
                "click_tracking.session_info",
                [[
                    fake.random_letter(),
                    datetime.now(),
                    datetime.now() + timedelta(seconds=random.randint(0, 3600)),
                    random.randint(1, 100),
                    faker.Faker().random_int(min=0, max=100),
                    fake.domain_name(),
                    fake.domain_name(),
                    fake.ascii_company_email(),
                    event.clientInfo.language or "en-US",
                    event.clientInfo.timezone or "UTC",
                    fake.random_viewport_type(),
                    viewport,
                    fake.random_device_type(),
                    fake.random_browser_type(),
                    event.clientInfo.platform or faker.Faker().platform() or "Linux",
                    event.clientInfo.connectionType or "WiFi",
                    True
                ]],
                column_names=[
                    "session_id", 
                    "start_time", 
                    "last_activity_time", 
                    "page_views", 
                    "events", 
                    "referrer", 
                    "entry_page", 
                    "user_agent", 
                    "language", 
                    "timezone", 
                    "screen_resolution", 
                    "viewport_size", 
                    "device_type", 
                    "browser", 
                    "os", 
                    "connection_type",
                    "is_returning_user"
                ]
            )    
        except Exception as e:
            pretty_print = json.dumps(event.model_dump(), indent=2, ensure_ascii=False)
            print(pretty_print)
            raise(f"Error parsing data: {e}")
        

kafka_df = spark.readStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", CONFLUENT_BOOTSTRAP_SERVERS) \
    .option("kafka.security.protocol", "SASL_SSL") \
    .option("subscribe", CONFLUENT_TOPIC) \
    .option("startingOffsets", "earliest") \
    .option("kafka.sasl.mechanism", "PLAIN") \
    .option(
    "kafka.sasl.jaas.config",
    f"""org.apache.kafka.common.security.plain.PlainLoginModule required username="{CONFLUENT_API_KEY}" password="{CONFLUENT_API_SECRET}";"""
    ).load()

kafka_df = kafka_df.selectExpr("CAST(key AS STRING)", "CAST(value AS STRING)")

query = kafka_df \
    .writeStream \
    .foreachBatch(write_to_clickhouse) \
    .outputMode("append") \
    .start()

query.awaitTermination()