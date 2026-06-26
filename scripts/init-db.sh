#!/bin/bash
# Start SQL Server in the background, wait until it accepts connections,
# then run the init script once to create the database and schemas.

set -e

# Strip any Windows carriage returns that may be present if .env was created on Windows.
MSSQL_SA_PASSWORD="${MSSQL_SA_PASSWORD//$'\r'/}"
if [ -z "$MSSQL_SA_PASSWORD" ]; then
    echo "ERROR: MSSQL_SA_PASSWORD environment variable is not set." >&2
    exit 1
fi

# Forward SIGTERM to sqlservr so Docker can stop the container cleanly.
_term() {
    echo "Caught SIGTERM, stopping SQL Server..."
    kill -TERM "$SQLSERVR_PID" 2>/dev/null
}
trap _term SIGTERM SIGINT
/opt/mssql/bin/sqlservr &
SQLSERVR_PID=$!

echo "Waiting for SQL Server to be ready..."
until /opt/mssql-tools18/bin/sqlcmd \
        -S localhost -U sa -P "$MSSQL_SA_PASSWORD" \
        -Q "SELECT 1" -C \
        > /dev/null 2>&1; do
    # If sqlservr exited, report the error and stop instead of looping forever.
    if ! kill -0 "$SQLSERVR_PID" 2>/dev/null; then
        echo "ERROR: SQL Server process exited unexpectedly. Check MSSQL_SA_PASSWORD complexity and available memory." >&2
        exit 1
    fi
    sleep 2
done

echo "SQL Server is ready. Running init-db.sql..."
/opt/mssql-tools18/bin/sqlcmd \
    -S localhost -U sa -P "$MSSQL_SA_PASSWORD" \
    -i /init-db.sql -C

echo "Database initialization complete."

# Hand control back to the SQL Server process
wait $SQLSERVR_PID
