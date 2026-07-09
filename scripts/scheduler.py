"""
Scheduled ingestion runner.

Calls ingest_coingecko.main() in a loop, sleeping INGEST_INTERVAL_SECONDS
between runs (default 900 s = 15 minutes). After each successful Bronze
ingestion, runs DBT transformations and tests to build Silver and Gold models.

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
import subprocess
import time
from pathlib import Path

from ingest_coingecko import main as ingest_once
from ingest_coingecko import purge_stale_bronze

INGEST_INTERVAL_SECONDS = int(os.getenv("INGEST_INTERVAL_SECONDS", str(15 * 60)))
REPO_ROOT = Path(__file__).resolve().parent.parent
DBT_PROJECT_DIR = REPO_ROOT / "transform"
DBT_PROFILES_DIR = REPO_ROOT / ".dbt"


def run_dbt() -> None:
    subprocess.run(
        [
            "dbt",
            "run",
            "--project-dir",
            str(DBT_PROJECT_DIR),
            "--profiles-dir",
            str(DBT_PROFILES_DIR),
        ],
        check=True,
    )
    subprocess.run(
        [
            "dbt",
            "test",
            "--project-dir",
            str(DBT_PROJECT_DIR),
            "--profiles-dir",
            str(DBT_PROFILES_DIR),
        ],
        check=True,
    )


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
            purge_stale_bronze()
            run_dbt()
        except Exception as exc:
            logging.error("Ingestion run failed: %s", exc)

        logging.info("Next run in %ds", INGEST_INTERVAL_SECONDS)
        time.sleep(INGEST_INTERVAL_SECONDS)


if __name__ == "__main__":
    main()
