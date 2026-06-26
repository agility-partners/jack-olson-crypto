import os
import pyodbc
from datetime import datetime

# Read from environment variable so password isn't hardcoded
DB_PASSWORD = os.getenv("MSSQL_SA_PASSWORD")
if not DB_PASSWORD:
    raise RuntimeError("Set MSSQL_SA_PASSWORD in your shell first.")

conn_str = (
    "DRIVER={ODBC Driver 18 for SQL Server};"
    "SERVER=localhost,1433;"
    "DATABASE=crypto_data;"
    "UID=sa;" 
    f"PWD={DB_PASSWORD};"
    "Encrypt=yes;"
    "TrustServerCertificate=yes;"
)

def main():
    conn = pyodbc.connect(conn_str)
    cursor = conn.cursor()

    # 1) Confirm server connection
    cursor.execute("SELECT @@VERSION")
    print("Connected to:", cursor.fetchone()[0][:80], "...")

    # 2) Confirm database context
    cursor.execute("SELECT DB_NAME()")
    print("Database:", cursor.fetchone()[0])

    # 3) Write one row to bronze table
    payload = '[{"coin_id":"bitcoin","price":12345.67}]'
    cursor.execute(
        "INSERT INTO bronze.raw_coin_data (ingested_at, raw_json) VALUES (?, ?)",
        datetime.utcnow(),
        payload
    )
    conn.commit()
    print("Inserted 1 row into bronze.raw_coin_data")

    # 4) Read back latest row
    cursor.execute("""
        SELECT TOP 1 id, ingested_at, raw_json
        FROM bronze.raw_coin_data
        ORDER BY id DESC
    """)
    row = cursor.fetchone()
    print("Latest row:", row)

    cursor.close()
    conn.close()
    print("Python + SQL Server setup test passed.")

if __name__ == "__main__":
    main()