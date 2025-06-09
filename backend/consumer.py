from pyspark.sql import SparkSession
import os
import dotenv

dotenv.load_dotenv()

CONFLUENT_API_KEY = os.getenv("CONFLUENT_API_KEY")
CONFLUENT_API_SECRET = os.getenv("CONFLUENT_API_SECRET")
CONFLUENT_BOOTSTRAP_SERVERS = os.getenv("CONFLUENT_BOOTSTRAP_SERVERS")
CONFLUENT_TOPIC = os.getenv("CONFLUENT_DEFAULT_TOPIC", "click-tracking")



if not CONFLUENT_API_KEY or not CONFLUENT_API_SECRET or not CONFLUENT_BOOTSTRAP_SERVERS or not CONFLUENT_TOPIC:
    raise ValueError("Missing required environment variables for Kafka configuration.")

spark = SparkSession.builder \
    .appName("Click-Tracking-Consuming") \
    .config("spark.jars.packages", "org.apache.spark:spark-sql-kafka-0-10_2.13:4.0.0") \
    .getOrCreate()

kafka_params = {
    'bootstrap.servers': CONFLUENT_BOOTSTRAP_SERVERS,
    'sasl.username': CONFLUENT_API_KEY,
    'sasl.password': CONFLUENT_API_SECRET,
}

kafka_df = spark.readStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", "pkc-4nxnd.asia-east2.gcp.confluent.cloud:9092") \
    .option("kafka.security.protocol", "SASL_SSL") \
    .option("subscribe", CONFLUENT_TOPIC) \
    .option("startingOffsets", "earliest") \
    .option("kafka.sasl.mechanism", "PLAIN") \
    .option(
    "kafka.sasl.jaas.config",
    f"""org.apache.kafka.common.security.plain.PlainLoginModule required username="{CONFLUENT_API_KEY}" password="{CONFLUENT_API_SECRET}";"""
    ).load()

kafka_df = kafka_df.selectExpr("CAST(key AS STRING)", "CAST(value AS STRING)")

while kafka_df.isStreaming:
    query = kafka_df \
        .writeStream \
        .outputMode("append") \
        .format("console") \
        .option("truncate", "false") \
        .start()
    import time
    time.sleep(5)