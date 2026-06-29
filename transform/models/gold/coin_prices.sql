{{
    config(
        materialized = 'view',
        schema = 'gold'
    )
}}

/*
  Latest price snapshot per coin — sourced from the most recent
  ingestion run in the silver layer.
*/

WITH latest_ingestion AS (
    SELECT MAX(bronze_id) AS latest_id
    FROM {{ ref('stg_coin_markets') }}
)

SELECT
    s.coin_id,
    s.symbol,
    s.name,
    s.market_cap_rank,
    s.current_price,
    s.market_cap,
    s.total_volume,
    s.high_24h,
    s.low_24h,
    s.price_change_24h,
    s.price_change_percentage_24h,
    s.circulating_supply,
    s.total_supply,
    s.ath,
    s.atl,
    s.ingested_at,
    s.last_updated
FROM {{ ref('stg_coin_markets') }} AS s
INNER JOIN latest_ingestion AS l
    ON s.bronze_id = l.latest_id
