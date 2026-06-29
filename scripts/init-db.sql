-- Idempotent database and schema initialization for crypto_data.
-- Run automatically by init-db.sh on first container start.

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'crypto_data')
BEGIN
    CREATE DATABASE crypto_data;
END
GO

USE crypto_data;
GO

IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'bronze')
    EXEC('CREATE SCHEMA bronze');
GO

IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'silver')
    EXEC('CREATE SCHEMA silver');
GO

IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'gold')
    EXEC('CREATE SCHEMA gold');
GO

IF NOT EXISTS (
    SELECT * FROM sys.tables
    WHERE name = 'raw_coin_data'
      AND schema_id = SCHEMA_ID('bronze')
)
BEGIN
    CREATE TABLE bronze.raw_coin_data (
        id          INT IDENTITY(1,1) PRIMARY KEY,
        ingested_at DATETIME2       NOT NULL,
        raw_json    NVARCHAR(MAX)   NOT NULL
    );
END
GO

-- Stub gold.coin_prices table so the API can query it immediately on a fresh
-- start and return empty data rather than a 500.  dbt drops and repopulates
-- this table when it runs, so the schema here must match the dbt model.
IF NOT EXISTS (
    SELECT * FROM sys.tables
    WHERE name = 'coin_prices'
      AND schema_id = SCHEMA_ID('gold')
)
BEGIN
    CREATE TABLE gold.coin_prices (
        coin_id                     NVARCHAR(100)   NOT NULL,
        symbol                      NVARCHAR(20)    NOT NULL,
        name                        NVARCHAR(200)   NOT NULL,
        market_cap_rank             INT             NULL,
        current_price               DECIMAL(18, 8)  NULL,
        market_cap                  DECIMAL(18, 2)  NULL,
        total_volume                DECIMAL(18, 2)  NULL,
        high_24h                    DECIMAL(18, 8)  NULL,
        low_24h                     DECIMAL(18, 8)  NULL,
        price_change_24h            DECIMAL(18, 8)  NULL,
        price_change_percentage_24h DECIMAL(10, 4)  NULL,
        circulating_supply          DECIMAL(30, 2)  NULL,
        total_supply                DECIMAL(30, 2)  NULL,
        ath                         DECIMAL(18, 8)  NULL,
        atl                         DECIMAL(18, 8)  NULL,
        ingested_at                 DATETIME2       NULL,
        last_updated                DATETIME2       NULL,
        price_trend                 NVARCHAR(20)    NULL,
        market_dominance_pct        DECIMAL(10, 4)  NULL
    );
END
GO

-- Stub gold.market_summary view — mirrors the dbt model definition.
-- dbt replaces this view when it runs.
IF NOT EXISTS (
    SELECT * FROM sys.views
    WHERE name = 'market_summary'
      AND schema_id = SCHEMA_ID('gold')
)
    EXEC('
        CREATE VIEW gold.market_summary AS
        SELECT
            COUNT(*)                                                                    AS total_coins,
            CAST(ISNULL(SUM(market_cap), 0)                  AS DECIMAL(30, 2))       AS total_market_cap,
            CAST(ISNULL(SUM(total_volume), 0)                AS DECIMAL(30, 2))       AS total_24h_volume,
            CAST(ISNULL(AVG(price_change_percentage_24h), 0) AS DECIMAL(10, 4))       AS avg_24h_change_pct,
            SUM(CASE WHEN price_change_percentage_24h > 0 THEN 1 ELSE 0 END)          AS coins_up,
            SUM(CASE WHEN price_change_percentage_24h < 0 THEN 1 ELSE 0 END)          AS coins_down,
            CAST(
                MAX(CASE WHEN coin_id = ''bitcoin'' THEN market_cap ELSE 0 END)
                * 100.0 / NULLIF(SUM(market_cap), 0)
            AS DECIMAL(10, 4))                                                          AS btc_dominance_pct
        FROM gold.coin_prices
    ');
GO

-- Stub gold.top_movers view — mirrors the dbt model definition.
-- dbt replaces this view when it runs.
IF NOT EXISTS (
    SELECT * FROM sys.views
    WHERE name = 'top_movers'
      AND schema_id = SCHEMA_ID('gold')
)
    EXEC('
        CREATE VIEW gold.top_movers AS
        WITH filtered AS (
            SELECT coin_id, symbol, name, current_price, market_cap,
                   price_change_percentage_24h, market_cap_rank
            FROM gold.coin_prices
            WHERE market_cap_rank <= 100
        ),
        gainers AS (
            SELECT *, ROW_NUMBER() OVER (ORDER BY price_change_percentage_24h DESC) AS rank,
                   CAST(''gainer'' AS NVARCHAR(10)) AS category
            FROM filtered WHERE price_change_percentage_24h > 0
        ),
        losers AS (
            SELECT *, ROW_NUMBER() OVER (ORDER BY price_change_percentage_24h ASC) AS rank,
                   CAST(''loser'' AS NVARCHAR(10)) AS category
            FROM filtered WHERE price_change_percentage_24h < 0
        )
        SELECT coin_id, symbol, name, current_price, market_cap,
               price_change_percentage_24h, rank, category
        FROM gainers WHERE rank <= 10
        UNION ALL
        SELECT coin_id, symbol, name, current_price, market_cap,
               price_change_percentage_24h, rank, category
        FROM losers WHERE rank <= 10
    ');
GO
