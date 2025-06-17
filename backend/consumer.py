import os
import clickhouse_connect
import dotenv
import warnings
import utils
from pyspark.sql import SparkSession


warnings.filterwarnings("ignore")
from faker import Faker


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
CREATE TABLE IF NOT EXISTS click_tracking.click_tracking_events
(
    `event_type` String,
    `timestamp` DateTime64(3),
    `session_id` String,
    `user_id` Nullable(String),
    `device_type` String,
    `browser` String,
    `os` String,
    `user_agent` String,
    `ip_address` String,
    `geo_location_country` String,
    `geo_location_city` String,
    `client_timezone` String,
    `connection_type` String,
    `url` Nullable(String),
    `path` Nullable(String),
    `referrer` Nullable(String),
    `page_type` Nullable(String),
    `query` Nullable(String),
    `results_count` Nullable(UInt32),
    `filters_applied` Nullable(String),
    `product_id` Nullable(UInt32),
    `product_name` Nullable(String),
    `category` Nullable(String),
    `sub_type` Nullable(String),
    `price` Nullable(UInt32),
    `currency` Nullable(String),
    `sku` Nullable(String),
    `brand` Nullable(String),
    `quantity` Nullable(UInt32),
    `variant` Nullable(String),
    `cart_value` Nullable(Float64),
    `cart_items` Nullable(String),
    `checkout_step` Nullable(String),
    `step_number` Nullable(UInt8),
    `payment_method` Nullable(String),
    `amount` Nullable(Float64),
    `order_id` Nullable(UInt32),
    `order_value` Nullable(Float64),
    `shipping_method` Nullable(String),
    `shipping_cost` Nullable(Float64),
    `tax_amount` Nullable(Float64),
    `login_method` Nullable(String),
    `login_success` Nullable(UInt8),
    `review_rating` Nullable(UInt8),
    `review_text` Nullable(String),
    `share_platform` Nullable(String),
    `share_url` Nullable(String),
    `error_type` Nullable(String),
    `error_message` Nullable(String),
    `error_component` Nullable(String),
    `filter_type` Nullable(String),
    `filter_value` Nullable(String),
    `filter_action` Nullable(String),
    `promotion_id` Nullable(UInt32),
    `promotion_name` Nullable(String),
    `creative_id` Nullable(String),
    `placement` Nullable(String),
    `target_url` Nullable(String),
    `element_id` Nullable(String),
    `element_class` Nullable(String),
    `element_type` Nullable(String),
    `text_content` Nullable(String),
    `position_x` Nullable(UInt32),
    `position_y` Nullable(UInt32),
    `session_duration_seconds` Nullable(UInt32),
    `time_on_page` Nullable(UInt32),
    `exit_reason` Nullable(String)
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (timestamp, session_id, event_type)
SETTINGS index_granularity = 8192;
""")

packages = [
    "org.apache.spark:spark-sql-kafka-0-10_2.13:3.5.3",
    "com.clickhouse.spark:clickhouse-spark-runtime-3.5_2.13:0.8.1",
    "com.clickhouse:clickhouse-client:0.7.0",
    "com.clickhouse:clickhouse-http-client:0.7.0",
    "org.apache.httpcomponents.client5:httpclient5:5.2.1"
]


spark = SparkSession.builder \
    .appName("Click-Tracking-Consuming") \
    .config("spark.driver.memory", "10g") \
    .config("spark.jars.packages", ",".join(packages)) \
    .config("spark.jars", "jars/clickhouse-jdbc-0.8.2-shaded-all.jar") \
    .getOrCreate()


spark.conf.set("spark.sql.catalog.clickhouse", "com.clickhouse.spark.ClickHouseCatalog")
spark.conf.set("spark.sql.catalog.clickhouse.host", CLICKHOUSE_HOST)
spark.conf.set("spark.sql.catalog.clickhouse.protocol", "https")
spark.conf.set("spark.sql.catalog.clickhouse.http_port", "8443")
spark.conf.set("spark.sql.catalog.clickhouse.option.ssl", True)
spark.conf.set("spark.sql.catalog.clickhouse.option.ssl_mode", "NONE")
spark.conf.set("spark.sql.catalog.clickhouse.user", CLICKHOUSE_USERNAME)
spark.conf.set("spark.sql.catalog.clickhouse.password", CLICKHOUSE_PASSWORD)
spark.conf.set("spark.sql.catalog.clickhouse.database", "click_tracking")

url = f"jdbc:clickhouse:https://{CLICKHOUSE_HOST}:8443?ssl=true"



from pyspark.sql.types import StructType, StructField, StringType, IntegerType, FloatType, BooleanType, ArrayType

schema = StructType([
    StructField("event_type", StringType(), False),
    StructField("timestamp", StringType(), False),
    StructField("session_id", StringType(), False),
    StructField("user_id", StringType(), True),
    StructField("device_type", StringType(), True),
    StructField("browser", StringType(), True),
    StructField("os", StringType(), True),
    StructField("user_agent", StringType(), True),
    StructField("ip_address", StringType(), True),
    StructField("geo_location", StructType([
        StructField("country", StringType(), True),
        StructField("city", StringType(), True)
    ]), True),
    StructField("client_timezone", StringType(), True),
    StructField("connection_type", StringType(), True),
    StructField("url", StringType(), True),
    StructField("path", StringType(), True),
    StructField("referrer", StringType(), True),
    StructField("page_type", StringType(), True),
    StructField("query", StringType(), True),
    StructField("results_count", IntegerType(), True),
    StructField("filters_applied", ArrayType(StringType()), True),
    StructField("product_id", IntegerType(), True),
    StructField("product_name", StringType(), True),
    StructField("category", StringType(), True),
    StructField("sub_type", StringType(), True),
    StructField("price", IntegerType(), True),
    StructField("currency", StringType(), True),
    StructField("sku", StringType(), True),
    StructField("brand", StringType(), True),
    StructField("quantity", IntegerType(), True),
    StructField("variant", StringType(), True),
    StructField("cart_value", FloatType(), True),
    StructField("cart_items", ArrayType(StructType([
        StructField("product_id", IntegerType(), True),
        StructField("product_name", StringType(), True),
        StructField("quantity", IntegerType(), True),
        StructField("price", IntegerType(), True)
    ])), True),
    StructField("checkout_step", StringType(), True),
    StructField("step_number", IntegerType(), True),
    StructField("payment_method", StringType(), True),
    StructField("amount", FloatType(), True),
    StructField("order_id", IntegerType(), True),
    StructField("order_value", FloatType(), True),
    StructField("shipping_method", StringType(), True),
    StructField("shipping_cost", FloatType(), True),
    StructField("tax_amount", FloatType(), True),
    StructField("login_method", StringType(), True),
    StructField("success", BooleanType(), True),
    StructField("rating", IntegerType(), True),
    StructField("review_text", StringType(), True),
    StructField("platform", StringType(), True),
    StructField("share_url", StringType(), True),
    StructField("error_type", StringType(), True),
    StructField("error_message", StringType(), True),
    StructField("component", StringType(), True),
    StructField("filter_type", StringType(), True),
    StructField("filter_value", StringType(), True),
    StructField("action", StringType(), True),
    StructField("promotion_id", IntegerType(), True),
    StructField("promotion_name", StringType(), True),
    StructField("creative_id", StringType(), True),
    StructField("placement", StringType(), True),
    StructField("target_url", StringType(), True),
    StructField("element_id", StringType(), True),
    StructField("element_class", StringType(), True),
    StructField("element_type", StringType(), True),
    StructField("text_content", StringType(), True),
    StructField("position", StructType([
        StructField("x", IntegerType(), True),
        StructField("y", IntegerType(), True)
    ]), True),
    StructField("session_duration_seconds", IntegerType(), True),
    StructField("time_on_page", IntegerType(), True),
    StructField("exit_reason", StringType(), True)
])


from pyspark.sql.functions import from_json, col, when, array, lit
import pyspark.sql.functions as F

def write_to_clickhouse(batch_df, batch_id):
    print(f"Processing batch {batch_id} with {batch_df.count()} rows")

    parsed_df = batch_df.select(
        from_json(col("value").cast("string"), schema).alias("event")
    )

    flattened_df = parsed_df.select(
        col("event.event_type").alias("event_type"),
        col("event.timestamp").alias("timestamp"),
        col("event.session_id").cast("string").alias("session_id"),
        col("event.user_id").cast("string").alias("user_id"),
        col("event.device_type").alias("device_type"),
        col("event.browser").alias("browser"),
        col("event.os").alias("os"),
        col("event.user_agent").alias("user_agent"),
        col("event.ip_address").alias("ip_address"),
        col("event.geo_location.country").alias("geo_location_country"),
        col("event.geo_location.city").alias("geo_location_city"),
        col("event.client_timezone").alias("client_timezone"),
        col("event.connection_type").alias("connection_type"),
        col("event.url").alias("url"),
        col("event.path").alias("path"),
        col("event.referrer").alias("referrer"),
        col("event.page_type").alias("page_type"),
        col("event.query").alias("query"),
        col("event.results_count").alias("results_count"),
        when(
            col("event.filters_applied").isNull() | (F.size(col("event.filters_applied")) == 0),
            array(lit(None))
        ).otherwise(col("event.filters_applied")).alias("filters_applied"),        
        col("event.product_id").alias("product_id"),
        col("event.product_name").alias("product_name"),
        col("event.category").alias("category"),
        col("event.sub_type").alias("sub_type"),
        col("event.price").alias("price"),
        col("event.currency").alias("currency"),
        col("event.sku").alias("sku"),
        col("event.brand").alias("brand"),
        col("event.quantity").alias("quantity"),
        col("event.variant").alias("variant"),
        col("event.cart_value").alias("cart_value"),
        col("event.cart_items").cast("string").alias("cart_items"),
        col("event.checkout_step").alias("checkout_step"),
        col("event.step_number").alias("step_number"),
        col("event.payment_method").alias("payment_method"),
        col("event.amount").alias("amount"),
        col("event.order_id").alias("order_id"),
        col("event.order_value").alias("order_value"),
        col("event.shipping_method").alias("shipping_method"),
        col("event.shipping_cost").alias("shipping_cost"),
        col("event.tax_amount").alias("tax_amount"),
        col("event.login_method").alias("login_method"),
        when(col("event.success") == True, 1).otherwise(0).alias("login_success"),
        col("event.rating").alias("review_rating"),
        col("event.review_text").alias("review_text"),
        col("event.platform").alias("share_platform"),
        col("event.share_url").alias("share_url"),
        col("event.error_type").alias("error_type"),
        col("event.error_message").alias("error_message"),
        col("event.component").alias("error_component"),
        col("event.filter_type").alias("filter_type"),
        col("event.filter_value").alias("filter_value"),
        col("event.action").alias("filter_action"),
        col("event.promotion_id").alias("promotion_id"),
        col("event.promotion_name").alias("promotion_name"),
        col("event.creative_id").alias("creative_id"),
        col("event.placement").alias("placement"),
        col("event.target_url").alias("target_url"),
        col("event.element_id").alias("element_id"),
        col("event.element_class").alias("element_class"),
        col("event.element_type").alias("element_type"),
        col("event.text_content").alias("text_content"),
        col("event.position.x").alias("position_x"),
        col("event.position.y").alias("position_y"),
        col("event.session_duration_seconds").alias("session_duration_seconds"),
        col("event.time_on_page").alias("time_on_page"),
        col("event.exit_reason").alias("exit_reason")
    )
    
    # flattened_df = flattened_df.withColumn("filters_applied", F.to_json(col("filters_applied")))    
    flattened_df = flattened_df.withColumn(
            "filters_applied",
            F.concat(
                lit("['"),
                F.concat_ws("','", col("filters_applied")),
                lit("']")
            )
        )
    flattened_df = flattened_df.withColumn("session_id", col("session_id").cast("string"))
    flattened_df = flattened_df.withColumn("user_id", col("user_id").cast("string"))    
    
    try:
        if not flattened_df.rdd.isEmpty():
            flattened_df.write \
                .format("jdbc") \
                .option("url", url) \
                .option("user", os.getenv("CLICKHOUSE_USERNAME")) \
                .option("password", os.getenv("CLICKHOUSE_PASSWORD")) \
                .option("driver", "com.clickhouse.jdbc.ClickHouseDriver") \
                .option("dbtable", "click_tracking.click_tracking_events") \
                .mode("append") \
                .save()
            
            print(f"Inserted {flattened_df.count()} events into ClickHouse (batch {batch_id}).")
        else:
            print(f"Batch {batch_id} is empty.")
    except Exception as e:
        print(f"Error inserting batch {batch_id} into ClickHouse: {e}")


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
    ) \
    .option("rowsPerBatch", "400000") \
    .option("maxOffsetsPerTrigger", "400000") \
    .load()

kafka_df = kafka_df.selectExpr("CAST(value AS STRING)")

query = kafka_df \
    .writeStream \
    .foreachBatch(write_to_clickhouse) \
    .outputMode("append") \
    .start()

try:
    query.awaitTermination()
except KeyboardInterrupt:
    print("Shutting down Spark streaming query...")
    query.stop()
finally:
    spark.stop()
    clickhouse.close()