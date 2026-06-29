USE crypto_data;

SELECT TOP 1 id, ingested_at, LEFT(raw_json, 200) AS preview
FROM bronze.raw_coin_data
ORDER BY id DESC;