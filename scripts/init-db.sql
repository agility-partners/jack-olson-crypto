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

IF OBJECT_ID('gold.market_summary', 'V') IS NULL
    EXEC('
        CREATE VIEW gold.market_summary AS
        SELECT
            CAST(0 AS BIGINT)          AS total_coins,
            CAST(0 AS DECIMAL(30, 2))  AS total_market_cap,
            CAST(0 AS DECIMAL(30, 2))  AS total_24h_volume,
            CAST(0 AS DECIMAL(10, 4))  AS avg_24h_change_pct,
            CAST(0 AS BIGINT)          AS coins_up,
            CAST(0 AS BIGINT)          AS coins_down,
            CAST(0 AS DECIMAL(10, 4))  AS btc_dominance_pct
    ');
GO

IF OBJECT_ID('gold.top_movers', 'V') IS NULL
    EXEC('
        CREATE VIEW gold.top_movers AS
        SELECT
            CAST(NULL AS NVARCHAR(100)) AS coin_id,
            CAST(NULL AS NVARCHAR(20))  AS symbol,
            CAST(NULL AS NVARCHAR(200)) AS name,
            CAST(NULL AS DECIMAL(18, 8)) AS current_price,
            CAST(NULL AS DECIMAL(18, 2)) AS market_cap,
            CAST(NULL AS DECIMAL(10, 4)) AS price_change_percentage_24h,
            CAST(NULL AS INT)            AS rank,
            CAST(NULL AS NVARCHAR(20))   AS category
        WHERE 1 = 0
    ');
GO
