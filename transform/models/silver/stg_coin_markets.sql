{{
    config(
        materialized = 'incremental',
        unique_key = ['coin_id', 'last_updated'],
        incremental_strategy = 'delete+insert',
        schema = 'silver'
    )
}}

/*
  Parses the raw CoinGecko JSON array stored in bronze.raw_coin_data
  into one typed row per coin per ingestion run.
  Maps CoinGecko-specific IDs back to the app's canonical 40-coin IDs so
  downstream API joins continue to match CoinCatalog entries.
  - DECIMAL types replace FLOAT for price/market-cap precision
  - Filters out invalid records (null coin_id, non-positive prices, outlier % changes)
  - Incremental: on subsequent runs only new Bronze rows are processed
*/

SELECT                     
    b.ingested_at,
    CASE j.coin_id
        WHEN 'binancecoin' THEN 'bnb'
        WHEN 'avalanche-2' THEN 'avalanche'
        WHEN 'theta-token' THEN 'theta'
        WHEN 'hedera-hashgraph' THEN 'hedera'
        WHEN 'elrond-erd-2' THEN 'elrond'
        WHEN 'injective-protocol' THEN 'injective'
        WHEN 'usd-coin' THEN 'usdc'
        WHEN 'the-open-network' THEN 'toncoin'
        WHEN 'render-token' THEN 'render'
        WHEN 'sei-network' THEN 'sei'
        ELSE j.coin_id
    END                                                               AS coin_id,
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
    CAST(j.max_supply              AS DECIMAL(30, 2))                  AS max_supply,
    CAST(j.ath                     AS DECIMAL(18, 8))                  AS ath,
    CAST(j.atl                     AS DECIMAL(18, 8))                  AS atl,
    CAST(j.price_change_percentage_7d_in_currency  AS DECIMAL(10, 4)) AS price_change_percentage_7d,
    CAST(j.price_change_percentage_30d_in_currency AS DECIMAL(10, 4)) AS price_change_percentage_30d,
    CAST(j.price_change_percentage_1y_in_currency  AS DECIMAL(10, 4)) AS price_change_percentage_1y,
    j.sparkline_7d,
    TRY_CAST(j.last_updated        AS DATETIME2)                       AS last_updated
FROM {{ source('bronze', 'raw_coin_data') }} AS b
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
    max_supply                      FLOAT           '$.max_supply',
    ath                             FLOAT           '$.ath',
    atl                             FLOAT           '$.atl',
    price_change_percentage_7d_in_currency  FLOAT   '$.price_change_percentage_7d_in_currency',
    price_change_percentage_30d_in_currency FLOAT   '$.price_change_percentage_30d_in_currency',
    price_change_percentage_1y_in_currency  FLOAT   '$.price_change_percentage_1y_in_currency',
    sparkline_7d                    NVARCHAR(MAX)   '$.sparkline_in_7d.price' AS JSON,
    last_updated                    NVARCHAR(50)    '$.last_updated'
) AS j
WHERE j.coin_id IS NOT NULL
  AND j.current_price > 0
  AND j.market_cap_rank BETWEEN 1 AND 10000
  AND ABS(j.price_change_percentage_24h) < 1000
{% if is_incremental() %}
  AND b.ingested_at > (SELECT MAX(ingested_at) FROM {{ this }})
{% endif %}
