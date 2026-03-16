#!/usr/bin/env python3
"""
Import Nykaa CSV dataset into PostgreSQL using psycopg2 (sync - no asyncpg issues).
Usage: python scripts/import_csv.py --file path/to/Nykaa_Digital_Marketing.csv
"""

import argparse
import pandas as pd
import psycopg2
import psycopg2.extras
import logging
from datetime import datetime
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

EXPECTED_COLUMNS = {"campaign_id", "campaign_type", "impressions", "clicks", "revenue"}


def parse_date(val):
    if pd.isna(val):
        return None
    for fmt in ["%d-%m-%Y", "%Y-%m-%d", "%m/%d/%Y", "%d/%m/%Y"]:
        try:
            return datetime.strptime(str(val).strip(), fmt)
        except ValueError:
            continue
    return None


def import_csv(filepath: str):
    logger.info(f"Reading CSV: {filepath}")

    if not os.path.exists(filepath):
        raise FileNotFoundError(f"File not found: {filepath}")

    df = None
    for encoding in ["utf-8-sig", "utf-8", "latin-1", "cp1252"]:
        try:
            df = pd.read_csv(filepath, encoding=encoding, low_memory=False)
            df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]
            found = set(df.columns)
            if not EXPECTED_COLUMNS.issubset(found):
                logger.error(f"Wrong file! Expected Nykaa marketing CSV columns.")
                sys.exit(1)
            logger.info(f"Successfully read CSV with encoding: {encoding}")
            break
        except UnicodeDecodeError:
            continue

    if df is None:
        raise ValueError("Could not read CSV file.")

    logger.info(f"Columns: {list(df.columns)}")
    logger.info(f"Total rows: {len(df)}")

    # Connect using psycopg2 (sync) — avoids asyncpg password issues
    db_host     = os.getenv("DB_HOST", "localhost")
    db_port     = int(os.getenv("DB_PORT", "5432"))
    db_name     = os.getenv("DB_NAME", "nykaa_bi")
    db_user     = os.getenv("DB_USER", "postgres")
    db_password = os.getenv("DB_PASSWORD", "")

    logger.info(f"Connecting to {db_host}:{db_port}/{db_name} as {db_user}...")

    conn = psycopg2.connect(
        host=db_host,
        port=db_port,
        dbname=db_name,
        user=db_user,
        password=db_password,
    )
    cur = conn.cursor()

    # Create table if not exists
    logger.info("Creating tables if not exist...")
    cur.execute("""
        CREATE TABLE IF NOT EXISTS campaigns (
            id               SERIAL PRIMARY KEY,
            campaign_id      VARCHAR(50) UNIQUE,
            campaign_type    VARCHAR(100),
            target_audience  VARCHAR(100),
            duration         INTEGER,
            channel_used     VARCHAR(200),
            impressions      INTEGER,
            clicks           INTEGER,
            leads            INTEGER,
            conversions      INTEGER,
            revenue          FLOAT,
            acquisition_cost FLOAT,
            roi              FLOAT,
            language         VARCHAR(50),
            engagement_score FLOAT,
            customer_segment VARCHAR(100),
            date             TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS users (
            id            SERIAL PRIMARY KEY,
            name          VARCHAR(255) NOT NULL,
            email         VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            created_at    TIMESTAMP DEFAULT NOW(),
            is_active     BOOLEAN DEFAULT TRUE
        );
        CREATE TABLE IF NOT EXISTS chat_history (
            id            SERIAL PRIMARY KEY,
            user_id       INTEGER REFERENCES users(id),
            question      TEXT NOT NULL,
            generated_sql TEXT,
            result_json   TEXT,
            chart_type    VARCHAR(50),
            insights      TEXT,
            timestamp     TIMESTAMP DEFAULT NOW()
        );
    """)
    conn.commit()
    logger.info("Tables ready.")

    imported = 0
    skipped  = 0
    batch    = []
    BATCH_SIZE = 500

    for _, row in df.iterrows():
        try:
            batch.append((
                str(row.get("campaign_id", f"NY-{imported}")),
                str(row.get("campaign_type", "")),
                str(row.get("target_audience", "")),
                int(float(row.get("duration", 0))) if pd.notna(row.get("duration")) else 0,
                str(row.get("channel_used", "")),
                int(float(row.get("impressions", 0))) if pd.notna(row.get("impressions")) else 0,
                int(float(row.get("clicks", 0))) if pd.notna(row.get("clicks")) else 0,
                int(float(row.get("leads", 0))) if pd.notna(row.get("leads")) else 0,
                int(float(row.get("conversions", 0))) if pd.notna(row.get("conversions")) else 0,
                float(row.get("revenue", 0)) if pd.notna(row.get("revenue")) else 0.0,
                float(row.get("acquisition_cost", 0)) if pd.notna(row.get("acquisition_cost")) else 0.0,
                float(row.get("roi", 0)) if pd.notna(row.get("roi")) else 0.0,
                str(row.get("language", "")),
                float(row.get("engagement_score", 0)) if pd.notna(row.get("engagement_score")) else 0.0,
                str(row.get("customer_segment", "")),
                parse_date(row.get("date")),
            ))
            imported += 1

            if len(batch) >= BATCH_SIZE:
                psycopg2.extras.execute_values(cur, """
                    INSERT INTO campaigns (
                        campaign_id, campaign_type, target_audience, duration,
                        channel_used, impressions, clicks, leads, conversions,
                        revenue, acquisition_cost, roi, language, engagement_score,
                        customer_segment, date
                    ) VALUES %s
                    ON CONFLICT (campaign_id) DO NOTHING
                """, batch)
                conn.commit()
                logger.info(f"  Imported {imported} rows...")
                batch = []

        except Exception as e:
            logger.warning(f"Skipping row: {e}")
            skipped += 1

    # Insert remaining batch
    if batch:
        psycopg2.extras.execute_values(cur, """
            INSERT INTO campaigns (
                campaign_id, campaign_type, target_audience, duration,
                channel_used, impressions, clicks, leads, conversions,
                revenue, acquisition_cost, roi, language, engagement_score,
                customer_segment, date
            ) VALUES %s
            ON CONFLICT (campaign_id) DO NOTHING
        """, batch)
        conn.commit()

    cur.close()
    conn.close()

    logger.info(f"\n✅ Import complete: {imported} rows imported, {skipped} skipped")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--file", required=True, help="Path to CSV file")
    args = parser.parse_args()
    import_csv(args.file)
