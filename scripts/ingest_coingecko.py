import logging
import os
import time
from datetime import datetime, timezone
from typing import Optional

import pyodbc
import requests


COINGECKO_URL = "https://api.coingecko.com/api/v3/coins/markets"
MAX_RETRIES = int(os.getenv("COINGECKO_MAX_RETRIES", "3"))
BASE_BACKOFF_SECONDS = float(os.getenv("COINGECKO_BACKOFF_SECONDS", "1"))
REQUEST_TIMEOUT_SECONDS = float(os.getenv("COINGECKO_TIMEOUT_SECONDS", "20"))
MIN_AGE_SECONDS = float(os.getenv("COINGECKO_MIN_AGE_SECONDS", "300"))


def build_connection_string() -> str:
    password = os.getenv("MSSQL_SA_PASSWORD")
    if not password:
        raise RuntimeError("Set MSSQL_SA_PASSWORD in your shell first.")

    server = os.getenv("MSSQL_SERVER", "localhost,1433")
    database = os.getenv("MSSQL_DATABASE", "crypto_data")
    user = os.getenv("MSSQL_USER", "sa")
    driver = os.getenv("MSSQL_DRIVER", "ODBC Driver 18 for SQL Server")

    return (
        f"DRIVER={{{driver}}};"
        f"SERVER={server};"
        f"DATABASE={database};"
        f"UID={user};"
        f"{chr(80)}WD={password};"
        "Encrypt=yes;"
        "TrustServerCertificate=yes;"
    )


def get_last_ingested_at() -> Optional[datetime]:
    """Return the most recent ingested_at timestamp from bronze.raw_coin_data, or None."""
    try:
        conn = pyodbc.connect(build_connection_string())
        try:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT MAX(ingested_at) FROM bronze.raw_coin_data"
            )
            row = cursor.fetchone()
            if row and row[0] is not None:
                ts = row[0]
                if ts.tzinfo is None:
                    ts = ts.replace(tzinfo=timezone.utc)
                return ts
        finally:
            conn.close()
    except Exception as exc:
        logging.warning("Could not query last ingested_at: %s — will fetch anyway.", exc)
    return None


def fetch_market_payload() -> str:
    params: dict = {
        "vs_currency": os.getenv("COINGECKO_VS_CURRENCY", "usd"),
        "order": os.getenv("COINGECKO_ORDER", "market_cap_desc"),
        "per_page": int(os.getenv("COINGECKO_PER_PAGE", "100")),
        "page": int(os.getenv("COINGECKO_PAGE", "1")),
        "sparkline": "true",
        "price_change_percentage": "7d,30d,1y",
    }
    headers: dict = {}
    api_key = os.getenv("COINGECKO_API_KEY", "").strip()
    if api_key:
        headers["x-cg-demo-api-key"] = api_key

    coin_ids = os.getenv("COINGECKO_COIN_IDS", "").strip()
    if coin_ids:
        params["ids"] = coin_ids

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            response = requests.get(
                COINGECKO_URL,
                params=params,
                headers=headers or None,
                timeout=REQUEST_TIMEOUT_SECONDS,
            )
            response.raise_for_status()
            return response.text
        except requests.RequestException as exc:
            if attempt == MAX_RETRIES:
                raise RuntimeError(
                    f"CoinGecko request failed after {MAX_RETRIES} attempts."
                ) from exc

            delay = BASE_BACKOFF_SECONDS * (2 ** (attempt - 1))
            logging.warning(
                "CoinGecko request failed (attempt %s/%s): %s. Retrying in %.1fs",
                attempt,
                MAX_RETRIES,
                exc,
                delay,
            )
            time.sleep(delay)

    raise RuntimeError("CoinGecko request failed unexpectedly.")


def insert_bronze_row(raw_json: str) -> None:
    conn = pyodbc.connect(build_connection_string())
    try:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO bronze.raw_coin_data (ingested_at, raw_json) VALUES (?, ?)",
            datetime.now(timezone.utc),
            raw_json,
        )
        conn.commit()
    finally:
        conn.close()


def main() -> None:
    logging.basicConfig(
        level=os.getenv("LOG_LEVEL", "INFO").upper(),
        format="%(asctime)s %(levelname)s %(message)s",
    )

    last = get_last_ingested_at()
    if last is not None:
        age = (datetime.now(timezone.utc) - last).total_seconds()
        if age < MIN_AGE_SECONDS:
            logging.info(
                "Skipping CoinGecko fetch — last ingestion was %.0fs ago (threshold: %.0fs).",
                age,
                MIN_AGE_SECONDS,
            )
            return

    payload = fetch_market_payload()
    insert_bronze_row(payload)
    logging.info("Ingested CoinGecko payload into bronze.raw_coin_data")


if __name__ == "__main__":
    main()
