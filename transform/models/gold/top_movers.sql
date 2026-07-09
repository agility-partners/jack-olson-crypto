{{
    config(
        materialized = 'view',
        schema = 'gold'
    )
}}

/*
  Top 10 gainers and top 10 losers across all coins.
  Refreshes automatically when coin_prices updates.
*/

WITH filtered AS (
    SELECT
        coin_id,
        symbol,
        name,
        current_price,
        market_cap,
        price_change_percentage_24h
    FROM {{ ref('coin_prices') }}
    WHERE price_change_percentage_24h IS NOT NULL
),

gainers AS (
    SELECT
        *,
        ROW_NUMBER() OVER (ORDER BY price_change_percentage_24h DESC) AS rank,
        'gainer'                                                        AS category
    FROM filtered
    WHERE price_change_percentage_24h > 0
),

losers AS (
    SELECT
        *,
        ROW_NUMBER() OVER (ORDER BY price_change_percentage_24h ASC)  AS rank,
        'loser'                                                         AS category
    FROM filtered
    WHERE price_change_percentage_24h < 0
)

SELECT coin_id, symbol, name, current_price, market_cap,
       price_change_percentage_24h, rank, category
FROM gainers
WHERE rank <= 10

UNION ALL

SELECT coin_id, symbol, name, current_price, market_cap,
       price_change_percentage_24h, rank, category
FROM losers
WHERE rank <= 10
