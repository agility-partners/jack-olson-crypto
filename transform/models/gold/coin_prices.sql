{{
    config(
        materialized = 'table',
        schema = 'gold'
    )
}}

/*
  Latest price snapshot per coin — one row per coin_id using the most
  recent last_updated timestamp from the silver layer, breaking ties with
  the latest ingestion timestamp so repeated mock-data cycles still refresh.
  Adds price_trend classification and market dominance percentage.
  Your .NET API reads directly from this table.
*/

WITH ranked AS (
    SELECT
        *,
        ROW_NUMBER() OVER (
            PARTITION BY coin_id
            ORDER BY last_updated DESC, ingested_at DESC
        )                                                               AS rn,
        SUM(market_cap) OVER ()                                         AS total_market_cap
    FROM {{ ref('stg_coin_markets') }}
)

SELECT
    coin_id,
    symbol,
    name,
    market_cap_rank,
    current_price,
    market_cap,
    total_volume,
    high_24h,
    low_24h,
    price_change_24h,
    price_change_percentage_24h,
    circulating_supply,
    total_supply,
    ath,
    atl,
    sparkline_7d,
    ingested_at,
    last_updated,
    CASE
        WHEN price_change_percentage_24h > 10   THEN 'strong_up'
        WHEN price_change_percentage_24h > 2    THEN 'up'
        WHEN price_change_percentage_24h >= -2  THEN 'stable'
        WHEN price_change_percentage_24h >= -10 THEN 'down'
        ELSE                                         'strong_down'
    END                                                                 AS price_trend,
    CAST(
        market_cap * 100.0 / NULLIF(total_market_cap, 0)
    AS DECIMAL(10, 4))                                                  AS market_dominance_pct
FROM ranked
WHERE rn = 1
