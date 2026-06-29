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
   automatically creates the `crypto_data` database, `bronze` schema,
   `bronze.raw_coin_data` table, and `silver` schema on first start:
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

### End-to-end local run

1. Start the stack:
   ```bash
   docker compose up -d
   ```
2. Wait for SQL Server to report `healthy` before ingesting data:
   ```bash
   docker compose ps sqlserver
   ```
3. From the host machine, verify Python can connect before running ingestion:
   ```bash
   python scripts/test_sql_connection.py
   ```
4. Run the ingestion script:
   ```bash
   python scripts/ingest_coingecko.py
   ```
5. Build the dbt models:
   ```bash
   dbt run --project-dir transform --profiles-dir .dbt
   ```
6. Query the API:
   ```bash
   curl http://localhost:8081/api/coins
   ```

If ingestion still fails after the container is healthy, verify these host-side prerequisites:

- ODBC Driver 18 for SQL Server is installed.
- `MSSQL_SA_PASSWORD` is set in the shell running Python.
- `MSSQL_SERVER` points to `localhost,1433` when connecting from the host.
