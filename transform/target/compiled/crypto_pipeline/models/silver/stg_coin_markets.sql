

/*
  Parses the raw CoinGecko JSON array stored in bronze.raw_coin_data
  into one typed row per coin per ingestion run.
  - DECIMAL types replace FLOAT for price/market-cap precision
  - Filters out invalid records (null coin_id, non-positive prices, outlier % changes)
  - Incremental: on subsequent runs only new Bronze rows are processed
*/

SELECT                     
    b.ingested_at,
    j.coin_id,
    UPPER(j.symbol)                                                    AS symbol,
    j.name,
    CAST(j.current_price           AS DECIMAL(18, 8))                  AS current_price,
    CAST(j.market_cap              AS DECIMAL(18, 2))                  AS market_cap,
    j.market_cap_rank,
    CAST(j.total_volume            AS DECIMAL(18, 2))                  AS total_volume,
    CAST(j.high_24h                AS DECIMAL(18, 8))                  AS high_24h,
    CAST(j.low_24h                 AS DECIMAL(18, 8))                  AS low_24h,
    CAST(j.price_change_24h        AS DECIMAL(18, 8))                  AS price_change_24h,
    CAST(j.price_change_percentage_24h AS DECIMAL(10, 4))              AS price_change_percentage_24h,
    CAST(j.circulating_supply      AS DECIMAL(30, 2))                  AS circulating_supply,
    CAST(j.total_supply            AS DECIMAL(30, 2))                  AS total_supply,
    CAST(j.ath                     AS DECIMAL(18, 8))                  AS ath,
    CAST(j.atl                     AS DECIMAL(18, 8))                  AS atl,
    TRY_CAST(j.last_updated        AS DATETIME2)                       AS last_updated
FROM "crypto_data"."bronze"."raw_coin_data" AS b
CROSS APPLY OPENJSON(b.raw_json)
WITH (
    coin_id                         NVARCHAR(100)   '$.id',
    symbol                          NVARCHAR(20)    '$.symbol',
    name                            NVARCHAR(200)   '$.name',
    current_price                   FLOAT           '$.current_price',
    market_cap                      FLOAT           '$.market_cap',
    market_cap_rank                 INT             '$.market_cap_rank',
    total_volume                    FLOAT           '$.total_volume',
    high_24h                        FLOAT           '$.high_24h',
    low_24h                         FLOAT           '$.low_24h',
    price_change_24h                FLOAT           '$.price_change_24h',
    price_change_percentage_24h     FLOAT           '$.price_change_percentage_24h',
    circulating_supply              FLOAT           '$.circulating_supply',
    total_supply                    FLOAT           '$.total_supply',
    ath                             FLOAT           '$.ath',
    atl                             FLOAT           '$.atl',
    last_updated                    NVARCHAR(50)    '$.last_updated'
) AS j
WHERE j.coin_id IS NOT NULL
  AND j.current_price > 0
  AND j.market_cap_rank BETWEEN 1 AND 10000
  AND ABS(j.price_change_percentage_24h) < 1000

  AND b.ingested_at > (SELECT MAX(ingested_at) FROM "crypto_data"."silver"."stg_coin_markets")
