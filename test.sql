SELECT
  COUNT(*) AS total_rows,
  SUM(CASE WHEN price_change_percentage_24h < 0 THEN 1 ELSE 0 END) AS losers,
  SUM(CASE WHEN price_change_percentage_24h > 0 THEN 1 ELSE 0 END) AS gainers,
  SUM(CASE WHEN price_change_percentage_24h = 0 THEN 1 ELSE 0 END) AS flat,
  SUM(CASE WHEN price_change_percentage_24h IS NULL THEN 1 ELSE 0 END) AS nulls
FROM gold.coin_prices;