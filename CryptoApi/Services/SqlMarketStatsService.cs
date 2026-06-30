using System.Globalization;
using CryptoApi.DTOs;
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
            WITH market_summary AS (
                SELECT TOP 1
                    total_market_cap,
                    total_24h_volume,
                    avg_24h_change_pct,
                    btc_dominance_pct
                FROM gold.market_summary
            ),
            coin_summary AS (
                SELECT
                    COUNT(*) AS total_coins,
                    CAST(COALESCE(SUM(market_cap), 0) AS DECIMAL(30, 2)) AS total_market_cap,
                    CAST(COALESCE(SUM(total_volume), 0) AS DECIMAL(30, 2)) AS total_24h_volume,
                    CAST(COALESCE(AVG(price_change_percentage_24h), 0) AS DECIMAL(10, 4)) AS avg_24h_change_pct,
                    CAST(
                        COALESCE(
                            MAX(CASE WHEN coin_id = 'bitcoin' THEN market_cap ELSE 0 END) * 100.0
                            / NULLIF(SUM(market_cap), 0),
                            0
                        )
                    AS DECIMAL(10, 4)) AS btc_dominance_pct
                FROM gold.coin_prices
            )
            SELECT TOP 1
                CASE
                    WHEN coin_summary.total_coins > 0
                        AND COALESCE(market_summary.total_market_cap, 0) = 0
                        AND COALESCE(market_summary.total_24h_volume, 0) = 0
                        AND COALESCE(market_summary.btc_dominance_pct, 0) = 0
                    THEN coin_summary.total_market_cap
                    ELSE COALESCE(market_summary.total_market_cap, coin_summary.total_market_cap)
                END AS total_market_cap,
                CASE
                    WHEN coin_summary.total_coins > 0
                        AND COALESCE(market_summary.total_market_cap, 0) = 0
                        AND COALESCE(market_summary.total_24h_volume, 0) = 0
                        AND COALESCE(market_summary.btc_dominance_pct, 0) = 0
                    THEN coin_summary.total_24h_volume
                    ELSE COALESCE(market_summary.total_24h_volume, coin_summary.total_24h_volume)
                END AS total_24h_volume,
                CASE
                    WHEN coin_summary.total_coins > 0
                        AND COALESCE(market_summary.total_market_cap, 0) = 0
                        AND COALESCE(market_summary.total_24h_volume, 0) = 0
                        AND COALESCE(market_summary.btc_dominance_pct, 0) = 0
                    THEN coin_summary.avg_24h_change_pct
                    ELSE COALESCE(market_summary.avg_24h_change_pct, coin_summary.avg_24h_change_pct)
                END AS avg_24h_change_pct,
                CASE
                    WHEN coin_summary.total_coins > 0
                        AND COALESCE(market_summary.total_market_cap, 0) = 0
                        AND COALESCE(market_summary.total_24h_volume, 0) = 0
                        AND COALESCE(market_summary.btc_dominance_pct, 0) = 0
                    THEN coin_summary.btc_dominance_pct
                    ELSE COALESCE(market_summary.btc_dominance_pct, coin_summary.btc_dominance_pct)
                END AS btc_dominance_pct
            FROM coin_summary
            LEFT JOIN market_summary ON 1 = 1
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
            TotalMarketCap = FormatCurrencyCompact(totalMarketCap),
            MarketCapChange = $"{(isUp ? "↑" : "↓")} {Math.Abs(marketCapChangePct).ToString("0.#", CultureInfo.InvariantCulture)}%",
            MarketCapChangeDir = isUp ? "up" : "down",
            Volume24h = FormatCurrencyCompact(volume24h),
            BtcDominance = $"{btcDominancePct.ToString("0.#", CultureInfo.InvariantCulture)}%",
        };
    }

    private static string FormatCurrencyCompact(decimal value)
    {
        var sign = value < 0 ? "-" : string.Empty;
        var abs = Math.Abs(value);

        if (abs >= 1_000_000_000_000m)
            return $"{sign}${(abs / 1_000_000_000_000m).ToString("0.##", CultureInfo.InvariantCulture)}T";
        if (abs >= 1_000_000_000m)
            return $"{sign}${(abs / 1_000_000_000m).ToString("0.##", CultureInfo.InvariantCulture)}B";
        if (abs >= 1_000_000m)
            return $"{sign}${(abs / 1_000_000m).ToString("0.##", CultureInfo.InvariantCulture)}M";
        if (abs >= 1_000m)
            return $"{sign}${(abs / 1_000m).ToString("0.##", CultureInfo.InvariantCulture)}K";

        return $"{sign}${abs.ToString("0.##", CultureInfo.InvariantCulture)}";
    }
}
