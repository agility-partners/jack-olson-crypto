

/*
  Single-row market-wide summary derived from gold.coin_prices.
  Refreshes automatically whenever coins_current updates.
*/

SELECT
    COUNT(*)                                                                        AS total_coins,
    CAST(SUM(market_cap)               AS DECIMAL(30, 2))                          AS total_market_cap,
    CAST(SUM(total_volume)             AS DECIMAL(30, 2))                          AS total_24h_volume,
    CAST(AVG(price_change_percentage_24h) AS DECIMAL(10, 4))                       AS avg_24h_change_pct,
    SUM(CASE WHEN price_change_percentage_24h > 0 THEN 1 ELSE 0 END)               AS coins_up,
    SUM(CASE WHEN price_change_percentage_24h < 0 THEN 1 ELSE 0 END)               AS coins_down,
    CAST(
        MAX(CASE WHEN coin_id = 'bitcoin' THEN market_cap ELSE 0 END)
        * 100.0 / NULLIF(SUM(market_cap), 0)
    AS DECIMAL(10, 4))                                                              AS btc_dominance_pct
FROM "crypto_data"."gold"."coin_prices"