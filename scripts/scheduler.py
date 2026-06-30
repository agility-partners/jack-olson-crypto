"""
Scheduled ingestion runner.

Calls ingest_coingecko.main() in a loop, sleeping INGEST_INTERVAL_SECONDS
between runs (default 900 s = 15 minutes). Each cycle writes a raw payload to
bronze.raw_coin_data and then runs dbt so Silver and Gold refresh from Bronze.

Environment variables:
  INGEST_INTERVAL_SECONDS  — seconds to wait between runs (default: 900)
  LOG_LEVEL                — Python logging level (default: INFO)
  MSSQL_SA_PASSWORD        — required; SQL Server SA password
  MSSQL_SERVER             — SQL Server host,port (default: sqlserver,1433)
  MSSQL_DATABASE           — target database (default: crypto_data)
  MSSQL_USER               — SQL login (default: sa)
  MSSQL_DRIVER             — ODBC driver name (default: ODBC Driver 18 for SQL Server)
  DBT_PROJECT_DIR          — dbt project path (default: ../transform)
  DBT_PROFILES_DIR         — dbt profiles path (default: ../.dbt)
  DBT_SELECT               — optional dbt selector for scoped runs
"""

import logging
import os
import subprocess
import time
from pathlib import Path

from ingest_coingecko import main as ingest_once

INGEST_INTERVAL_SECONDS = int(os.getenv("INGEST_INTERVAL_SECONDS", str(15 * 60)))
REPO_ROOT = Path(__file__).resolve().parent.parent
DBT_PROJECT_DIR = Path(os.getenv("DBT_PROJECT_DIR", str(REPO_ROOT / "transform")))
DBT_PROFILES_DIR = Path(os.getenv("DBT_PROFILES_DIR", str(REPO_ROOT / ".dbt")))
DBT_SELECT = os.getenv("DBT_SELECT", "").strip()


def run_dbt() -> None:
    command = [
        "dbt",
        "run",
        "--project-dir",
        str(DBT_PROJECT_DIR),
        "--profiles-dir",
        str(DBT_PROFILES_DIR),
    ]
    if DBT_SELECT:
        command.extend(["--select", DBT_SELECT])

    logging.info("Running dbt to rebuild Silver/Gold models")
    subprocess.run(command, check=True)


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
            run_dbt()
        except Exception as exc:
            logging.error("Ingestion run failed: %s", exc)

        logging.info("Next run in %ds", INGEST_INTERVAL_SECONDS)
        time.sleep(INGEST_INTERVAL_SECONDS)


if __name__ == "__main__":
    main()
