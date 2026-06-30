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
            SELECT TOP 1
                total_market_cap,
                total_24h_volume,
                avg_24h_change_pct,
                btc_dominance_pct
            FROM gold.market_summary
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
