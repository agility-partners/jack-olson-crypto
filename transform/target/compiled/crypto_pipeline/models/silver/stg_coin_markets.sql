

/*
  Parses the raw CoinGecko JSON array stored in bronze.raw_coin_data
  into one typed row per coin per ingestion run.
*/

SELECT
    b.id                                                    AS bronze_id,
    b.ingested_at,
    j.coin_id,
    j.symbol,
    j.name,
    j.current_price,
    j.market_cap,
    j.market_cap_rank,
    j.total_volume,
    j.high_24h,
    j.low_24h,
    j.price_change_24h,
    j.price_change_percentage_24h,
    j.circulating_supply,
    j.total_supply,
    j.ath,
    j.atl,
    j.last_updated
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