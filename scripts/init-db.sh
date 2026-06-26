#!/bin/bash
# Start SQL Server in the background, wait until it accepts connections,
# then run the init script once to create the database and schemas.

set -e

/opt/mssql/bin/sqlservr &
SQLSERVR_PID=$!

echo "Waiting for SQL Server to be ready..."
until /opt/mssql-tools18/bin/sqlcmd \
        -S localhost -U sa -P "$MSSQL_SA_PASSWORD" \
        -Q "SELECT 1" -C \
        > /dev/null 2>&1; do
    sleep 2
done

echo "SQL Server is ready. Running init-db.sql..."
/opt/mssql-tools18/bin/sqlcmd \
    -S localhost -U sa -P "$MSSQL_SA_PASSWORD" \
    -i /init-db.sql -C

echo "Database initialization complete."

# Hand control back to the SQL Server process
wait $SQLSERVR_PID
