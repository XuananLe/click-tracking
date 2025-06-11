import json
import os
import clickhouse_connect
import dotenv
import sys
from pyspark.sql import SparkSession

# Load environment variables
dotenv.load_dotenv()

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

# Create a Spark session
spark = SparkSession.builder \
    .appName("Click-Tracking-Consuming") \
    .config("spark.jars.packages", "org.apache.spark:spark-sql-kafka-0-10_2.13:4.0.0") \
    .getOrCreate()

# Create ClickHouse client
clickhouse = clickhouse_connect.get_client(
    host=CLICKHOUSE_HOST,
    username=CLICKHOUSE_USERNAME,
    password=CLICKHOUSE_PASSWORD,
    secure=True,  
)

# Create the ClickHouse database and table
clickhouse.query("CREATE DATABASE IF NOT EXISTS click_tracking")

# Create `page_duration` table
clickhouse.query("""
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

# Create `session_info` table
clickhouse.query("""
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

# Create `performance_info` table
clickhouse.query("""
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

# Create `user_data` table
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


def write_to_clickhouse(batch_df, batch_id):
    rows = batch_df.select("key", "value").rdd.map(lambda row: (row['key'], row['value'])).collect()
    for row in rows:
        data = json.loads(row[1])
        page_duration_data = [
            (
                data.get("type", ""),
                data["data"].get("productId", 0),
                data["data"].get("productName", ""),
                data["data"].get("durationSeconds", 0),
                data["data"].get("timestamp", ""),
                data["data"].get("sessionId", ""),
                data["data"].get("url", ""),
                data["data"].get("userAgent", ""),
                data["data"].get("viewport", ""),
                data["data"].get("deviceType", ""),
                data["data"].get("browser", ""),
                data["data"].get("os", "")
            )
        ]
        clickhouse.insert(
            "click_tracking.page_duration",
            page_duration_data,
            column_names=[
                "page_type", "product_id", "product_name", "duration_seconds", "timestamp",
                "session_id", "url", "user_agent", "viewport", "device_type", "browser", "os"
            ]
        )        
        
        
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