SELECT category, COUNT(*) AS cnt, MIN(rank), MAX(rank)
FROM gold.top_movers
GROUP BY category;
-- Should return rows for 'gainer' and 'loser', each with max rank ≤ 10

SELECT * FROM gold.top_movers ORDER BY category, rank;
-- Should show gainers ordered by 24h change DESC, losers ASC