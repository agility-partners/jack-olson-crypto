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

IF NOT EXISTS (
    SELECT * FROM sys.tables
    WHERE name = 'coin_prices'
      AND schema_id = SCHEMA_ID('gold')
)
BEGIN
    CREATE TABLE gold.coin_prices (
        coin_id                     NVARCHAR(100)   NOT NULL PRIMARY KEY,
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

EXEC('
    CREATE OR ALTER VIEW gold.market_summary AS
    SELECT
        COUNT(*)                                                              AS total_coins,
        CAST(COALESCE(SUM(market_cap), 0) AS DECIMAL(30, 2))                  AS total_market_cap,
        CAST(COALESCE(SUM(total_volume), 0) AS DECIMAL(30, 2))                AS total_24h_volume,
        CAST(COALESCE(AVG(price_change_percentage_24h), 0) AS DECIMAL(10, 4)) AS avg_24h_change_pct,
        SUM(CASE WHEN price_change_percentage_24h > 0 THEN 1 ELSE 0 END)      AS coins_up,
        SUM(CASE WHEN price_change_percentage_24h < 0 THEN 1 ELSE 0 END)      AS coins_down,
        CAST(
            COALESCE(
                MAX(CASE WHEN coin_id = ''''bitcoin'''' THEN market_cap ELSE 0 END) * 100.0
                / NULLIF(SUM(market_cap), 0),
                0
            )
        AS DECIMAL(10, 4))                                                    AS btc_dominance_pct
    FROM gold.coin_prices
');
GO

-- gold.top_movers was a stub view never queried by the API (SqlMarketStatsService
-- uses an inline CTE against gold.coin_prices). Drop it if it exists.
IF OBJECT_ID('gold.top_movers', 'V') IS NOT NULL
    DROP VIEW gold.top_movers;
GO
