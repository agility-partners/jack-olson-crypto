"""
Scheduled ingestion runner.

Calls ingest_coingecko.main() in a loop, sleeping INGEST_INTERVAL_SECONDS
between runs (default 900 s = 15 minutes).  The gold.coin_prices view in SQL
Server automatically reflects the newest bronze row, so no dbt run is needed
between ingestion cycles.

Environment variables:
  INGEST_INTERVAL_SECONDS  — seconds to wait between runs (default: 900)
  LOG_LEVEL                — Python logging level (default: INFO)
  MSSQL_SA_PASSWORD        — required; SQL Server SA password
  MSSQL_SERVER             — SQL Server host,port (default: sqlserver,1433)
  MSSQL_DATABASE           — target database (default: crypto_data)
  MSSQL_USER               — SQL login (default: sa)
  MSSQL_DRIVER             — ODBC driver name (default: ODBC Driver 18 for SQL Server)
"""

import logging
import os
import time

from ingest_coingecko import main as ingest_once

INGEST_INTERVAL_SECONDS = int(os.getenv("INGEST_INTERVAL_SECONDS", str(15 * 60)))


def main() -> None:
    logging.basicConfig(
        level=os.getenv("LOG_LEVEL", "INFO").upper(),
        format="%(asctime)s %(levelname)s %(message)s",
    )
    logging.info(
        "Ingestion scheduler started; interval=%ds", INGEST_INTERVAL_SECONDS
    )

    while True:
        try:
            ingest_once()
        except Exception as exc:
            logging.error("Ingestion run failed: %s", exc)

        logging.info("Next run in %ds", INGEST_INTERVAL_SECONDS)
        time.sleep(INGEST_INTERVAL_SECONDS)


if __name__ == "__main__":
    main()
