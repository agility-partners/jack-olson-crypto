using System.Globalization;
using CryptoApi.DTOs;
using CryptoApi.Helpers;
using Microsoft.Data.SqlClient;

namespace CryptoApi.Services;

public class SqlMarketStatsService : IMarketStatsService
{
    private readonly string _connectionString;

    public SqlMarketStatsService(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("CryptoDb")
            ?? throw new InvalidOperationException("CryptoDb connection string is not configured.");
    }

    public async Task<MarketStatsDto> GetMarketStatsAsync()
    {
        await using var conn = new SqlConnection(_connectionString);
        await conn.OpenAsync();

        const string sql = """
            SELECT
                CAST(COALESCE(SUM(market_cap), 0) AS DECIMAL(30, 2))                  AS total_market_cap,
                CAST(COALESCE(SUM(total_volume), 0) AS DECIMAL(30, 2))                AS total_24h_volume,
                CAST(COALESCE(AVG(price_change_percentage_24h), 0) AS DECIMAL(10, 4)) AS avg_24h_change_pct,
                CAST(
                    COALESCE(
                        MAX(CASE WHEN coin_id = 'bitcoin' THEN market_cap ELSE 0 END) * 100.0
                        / NULLIF(SUM(market_cap), 0),
                        0
                    )
                AS DECIMAL(10, 4)) AS btc_dominance_pct
            FROM gold.coin_prices
            """;

        await using var cmd = new SqlCommand(sql, conn);
        await using var reader = await cmd.ExecuteReaderAsync();

        if (!await reader.ReadAsync())
        {
            return CreateDto(0m, 0m, 0m, 0m);
        }

        var totalMarketCap = reader.IsDBNull(0) ? 0m : reader.GetDecimal(0);
        var volume24h = reader.IsDBNull(1) ? 0m : reader.GetDecimal(1);
        var marketCapChangePct = reader.IsDBNull(2) ? 0m : reader.GetDecimal(2);
        var btcDominancePct = reader.IsDBNull(3) ? 0m : reader.GetDecimal(3);

        if (totalMarketCap <= 0m && volume24h <= 0m)
        {
            return CreateFallbackDtoFromCatalog();
        }

        return CreateDto(totalMarketCap, volume24h, marketCapChangePct, btcDominancePct);
    }

    private static MarketStatsDto CreateFallbackDtoFromCatalog()
    {
        var coins = CoinCatalog.GetAll();
        if (coins.Count == 0)
        {
            return CreateDto(0m, 0m, 0m, 0m);
        }

        var totalMarketCap = coins.Sum(c => c.MarketCapRaw);
        var volume24h = coins.Sum(c => c.VolumeRaw);
        var marketCapChangePct = coins.Average(c => c.Change24h);
        var bitcoinMarketCap = coins.FirstOrDefault(c => c.Id == "bitcoin")?.MarketCapRaw ?? 0m;
        var btcDominancePct = totalMarketCap > 0m
            ? bitcoinMarketCap * 100m / totalMarketCap
            : 0m;

        return CreateDto(totalMarketCap, volume24h, marketCapChangePct, btcDominancePct);
    }

    private static MarketStatsDto CreateDto(
        decimal totalMarketCap,
        decimal volume24h,
        decimal marketCapChangePct,
        decimal btcDominancePct)
    {
        var isUp = marketCapChangePct >= 0;

        return new MarketStatsDto
        {
            TotalMarketCap = CurrencyFormatter.FormatCompact(totalMarketCap),
            MarketCapChange = $"{(isUp ? "↑" : "↓")} {Math.Abs(marketCapChangePct).ToString("0.#", CultureInfo.InvariantCulture)}%",
            MarketCapChangeDir = isUp ? "up" : "down",
            Volume24h = CurrencyFormatter.FormatCompact(volume24h),
            BtcDominance = $"{btcDominancePct.ToString("0.#", CultureInfo.InvariantCulture)}%",
        };
    }

}

