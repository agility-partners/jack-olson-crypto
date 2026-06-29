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
