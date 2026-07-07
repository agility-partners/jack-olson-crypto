This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

### Assistant model setup

The `/assistant` chat route now uses GitHub Models instead of Gemini. To enable it locally, set either `GITHUB_MODELS_TOKEN` or `GITHUB_TOKEN` to a GitHub personal access token with the `models` scope.

You can optionally override the default model:

```bash
GITHUB_MODELS_MODEL=openai/gpt-4.1
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## dbt setup (SQL Server)

This repository includes a local dbt scaffold in `/transform` and a local profile in `/.dbt/profiles.yml`.

### First-time setup

1. Copy `.env.example` to `.env` and set your SA password:
   ```
   MSSQL_SA_PASSWORD=YourStrongPassword123
   ```

2. Start (or restart) the SQL Server container. The `init-db.sh` entrypoint
   automatically creates the `crypto_data` database, the `bronze`, `silver`,
   and `gold` schemas, the `bronze.raw_coin_data` table, and empty Gold-layer
   stub objects used by the API on first start:
   ```bash
   docker compose up -d sqlserver
   ```
   If the container already exists from a previous run **without** the init
   script, tear it down first (the named volume preserves data if you omit `-v`):
   ```bash
   docker compose down            # stops and removes containers (keeps volume)
   docker compose up -d sqlserver # recreates with init entrypoint
   ```
   To start completely fresh (drops all stored data):
   ```bash
   docker compose down -v
   docker compose up -d sqlserver
   ```

3. Once the container is healthy, verify the connection:
   ```bash
   # PowerShell
   $env:MSSQL_SA_PASSWORD="YourStrongPassword123"
   dbt debug --project-dir transform --profiles-dir .dbt
   ```
   ```bash
   # bash/zsh
   export MSSQL_SA_PASSWORD="YourStrongPassword123"
   dbt debug --project-dir transform --profiles-dir .dbt
   ```

## Scheduled ingestion

The `ingester` Docker Compose service runs `scripts/scheduler.py` in a loop.
It waits for the `sqlserver` container to pass its healthcheck, fetches the
CoinGecko `/coins/markets` endpoint, and inserts a new row into
`bronze.raw_coin_data`.

### Starting the ingester

```bash
docker compose up -d
```

The ingester starts automatically with `docker compose up`. It will not
begin ingesting until `sqlserver` reports healthy (typically ~30 s).

The initial SQL setup only creates empty Gold-layer placeholders so the API
does not fail before transformations exist. After Bronze data is ingested, run
the DBT models to populate `gold.coin_prices` with live data.

### Configuring the schedule

Set `INGEST_INTERVAL_SECONDS` in your `.env` file (default: 900 = 15 minutes):

```
INGEST_INTERVAL_SECONDS=300   # run every 5 minutes
```

### Monitoring ingestion

```bash
docker compose logs -f ingester
```

### Manual one-off run (host machine)

```bash
python scripts/ingest_coingecko.py
```

### Viewing bronze data

Connect to `localhost,1433` (user `sa`, password from `.env`) in Azure Data
Studio or DBeaver, or query from the container:

```powershell
# PowerShell
docker exec -it my-app-sqlserver-1 /opt/mssql-tools18/bin/sqlcmd `
  -S localhost -U sa -P "$env:MSSQL_SA_PASSWORD" -C `
  -Q "SELECT TOP 5 id, ingested_at, LEN(raw_json) AS bytes FROM bronze.raw_coin_data ORDER BY id DESC"
```

## DBT transformations (Silver → Gold)

The `transform/` directory contains the DBT project. Run models after at least
one ingestion cycle has populated `bronze.raw_coin_data`.

### Model overview

| Layer  | Model / file                    | Materialization | Description |
|--------|---------------------------------|-----------------|-------------|
| Silver | `stg_coin_markets`              | incremental     | Parses Bronze JSON into typed rows; deduplicates on `(coin_id, last_updated)` |
| Gold   | `coin_prices`                   | table           | Latest price per coin + `price_trend` + `market_dominance_pct`; read by the .NET API |
| Gold   | `market_summary`                | view            | Single-row market-wide aggregation (total market cap, BTC dominance, coins up/down) |
| Gold   | `top_movers`                    | view            | Top 10 gainers and top 10 losers from the top-100 coins by market cap |

### Running the models

```bash
# PowerShell
$env:MSSQL_SA_PASSWORD="YourStrongPassword123"
dbt run  --project-dir transform --profiles-dir .dbt

# bash/zsh
export MSSQL_SA_PASSWORD="YourStrongPassword123"
dbt run  --project-dir transform --profiles-dir .dbt
```

Run a specific layer only:

```bash
dbt run --project-dir transform --profiles-dir .dbt --select silver
dbt run --project-dir transform --profiles-dir .dbt --select gold
```

### Testing data quality

```bash
dbt test --project-dir transform --profiles-dir .dbt
```

Tests enforce: `coin_id` is unique in `coin_prices`, `current_price` is never
null, `price_trend` is one of the five expected labels, and more (see
`transform/models/*/schema.yml`).

### Querying the Gold layer

After `dbt run` completes, the `.NET API` reads from `gold.coin_prices`
automatically. You can also query directly:

```powershell
# PowerShell — top 10 coins with trend label
docker exec -it my-app-sqlserver-1 /opt/mssql-tools18/bin/sqlcmd `
  -S localhost -U sa -P "$env:MSSQL_SA_PASSWORD" -C `
  -Q "SELECT TOP 10 coin_id, symbol, current_price, price_trend, market_dominance_pct FROM gold.coin_prices ORDER BY market_cap_rank"

# Market summary
docker exec -it my-app-sqlserver-1 /opt/mssql-tools18/bin/sqlcmd `
  -S localhost -U sa -P "$env:MSSQL_SA_PASSWORD" -C `
  -Q "SELECT * FROM gold.market_summary"

# Top movers
docker exec -it my-app-sqlserver-1 /opt/mssql-tools18/bin/sqlcmd `
  -S localhost -U sa -P "$env:MSSQL_SA_PASSWORD" -C `
  -Q "SELECT category, rank, symbol, price_change_percentage_24h FROM gold.top_movers ORDER BY category, rank"
```
