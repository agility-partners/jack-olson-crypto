import json
import logging
import os
import time
from datetime import datetime, timezone

import pyodbc
import requests


COINGECKO_URL = "https://api.coingecko.com/api/v3/coins/markets"
MAX_RETRIES = int(os.getenv("COINGECKO_MAX_RETRIES", "3"))
BASE_BACKOFF_SECONDS = float(os.getenv("COINGECKO_BACKOFF_SECONDS", "1"))
REQUEST_TIMEOUT_SECONDS = float(os.getenv("COINGECKO_TIMEOUT_SECONDS", "20"))


def _price_trend(pct: float | None) -> str:
    if pct is None:
        return "stable"
    if pct > 10:
        return "strong_up"
    if pct > 2:
        return "up"
    if pct >= -2:
        return "stable"
    if pct >= -10:
        return "down"
    return "strong_down"


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


def fetch_market_payload() -> str:
    params: dict = {
        "vs_currency": os.getenv("COINGECKO_VS_CURRENCY", "usd"),
        "order": os.getenv("COINGECKO_ORDER", "market_cap_desc"),
        "per_page": int(os.getenv("COINGECKO_PER_PAGE", "100")),
        "page": int(os.getenv("COINGECKO_PAGE", "1")),
    }
    coin_ids = os.getenv("COINGECKO_COIN_IDS", "").strip()
    if coin_ids:
        params["ids"] = coin_ids

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            response = requests.get(
                COINGECKO_URL, params=params, timeout=REQUEST_TIMEOUT_SECONDS
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


def upsert_gold_coins(raw_json: str, ingested_at: datetime) -> int:
    """Parse a CoinGecko markets payload and upsert rows into gold.coin_prices.

    This keeps the gold layer current after every ingestion cycle without
    requiring a separate dbt run.  dbt may still run to recompute the table
    with additional transformations; it will simply overwrite these rows.
    """
    coins = json.loads(raw_json)
    if not coins:
        return 0

    total_market_cap = sum(c.get("market_cap") or 0.0 for c in coins)

    rows = []
    for coin in coins:
        coin_id = coin.get("id")
        current_price = coin.get("current_price")
        rank = coin.get("market_cap_rank")

        if not coin_id or not current_price or not rank:
            continue
        if current_price <= 0:
            continue
        if not (1 <= rank <= 10000):
            continue
        pct = coin.get("price_change_percentage_24h")
        if pct is not None and abs(pct) >= 1000:
            continue

        market_cap = coin.get("market_cap")
        dominance = (
            round(market_cap * 100.0 / total_market_cap, 4)
            if market_cap and total_market_cap
            else None
        )

        last_updated_raw = coin.get("last_updated")
        last_updated: datetime | None = None
        if last_updated_raw:
            try:
                last_updated = datetime.fromisoformat(
                    last_updated_raw.replace("Z", "+00:00")
                )
            except ValueError:
                pass

        rows.append((
            coin_id,
            (coin.get("symbol") or "").upper(),
            coin.get("name"),
            rank,
            current_price,
            market_cap,
            coin.get("total_volume"),
            coin.get("high_24h"),
            coin.get("low_24h"),
            coin.get("price_change_24h"),
            pct,
            coin.get("circulating_supply"),
            coin.get("total_supply"),
            coin.get("ath"),
            coin.get("atl"),
            ingested_at,
            last_updated,
            _price_trend(pct),
            dominance,
        ))

    if not rows:
        return 0

    merge_sql = """
        MERGE gold.coin_prices AS target
        USING (SELECT ? AS coin_id) AS source ON target.coin_id = source.coin_id
        WHEN MATCHED THEN UPDATE SET
            symbol = ?, name = ?, market_cap_rank = ?,
            current_price = ?, market_cap = ?, total_volume = ?,
            high_24h = ?, low_24h = ?,
            price_change_24h = ?, price_change_percentage_24h = ?,
            circulating_supply = ?, total_supply = ?,
            ath = ?, atl = ?,
            ingested_at = ?, last_updated = ?,
            price_trend = ?, market_dominance_pct = ?
        WHEN NOT MATCHED THEN INSERT (
            coin_id, symbol, name, market_cap_rank,
            current_price, market_cap, total_volume,
            high_24h, low_24h,
            price_change_24h, price_change_percentage_24h,
            circulating_supply, total_supply,
            ath, atl,
            ingested_at, last_updated,
            price_trend, market_dominance_pct
        ) VALUES (
            ?, ?, ?, ?,
            ?, ?, ?,
            ?, ?,
            ?, ?,
            ?, ?,
            ?, ?,
            ?, ?,
            ?, ?
        );
    """

    conn = pyodbc.connect(build_connection_string())
    try:
        cursor = conn.cursor()
        for row in rows:
            (
                coin_id, symbol, name, rank,
                current_price, market_cap, total_volume,
                high_24h, low_24h,
                price_change_24h, pct,
                circulating_supply, total_supply,
                ath, atl,
                ingested_at_val, last_updated_val,
                price_trend, dominance,
            ) = row
            cursor.execute(
                merge_sql,
                # USING source
                coin_id,
                # UPDATE SET
                symbol, name, rank,
                current_price, market_cap, total_volume,
                high_24h, low_24h,
                price_change_24h, pct,
                circulating_supply, total_supply,
                ath, atl,
                ingested_at_val, last_updated_val,
                price_trend, dominance,
                # INSERT VALUES
                coin_id, symbol, name, rank,
                current_price, market_cap, total_volume,
                high_24h, low_24h,
                price_change_24h, pct,
                circulating_supply, total_supply,
                ath, atl,
                ingested_at_val, last_updated_val,
                price_trend, dominance,
            )
        conn.commit()
        return len(rows)
    finally:
        conn.close()


def main() -> None:
    logging.basicConfig(
        level=os.getenv("LOG_LEVEL", "INFO").upper(),
        format="%(asctime)s %(levelname)s %(message)s",
    )

    payload = fetch_market_payload()
    json.loads(payload)
    now = datetime.now(timezone.utc)
    insert_bronze_row(payload)
    logging.info("Ingested CoinGecko payload into bronze.raw_coin_data")
    count = upsert_gold_coins(payload, now)
    logging.info("Upserted %d coins into gold.coin_prices", count)


if __name__ == "__main__":
    main()
