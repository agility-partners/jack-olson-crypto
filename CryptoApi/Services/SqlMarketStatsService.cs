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
            SELECT TOP 1 total_market_cap, total_24h_volume, avg_24h_change_pct, btc_dominance_pct
            FROM gold.market_summary
            """;

        await using var cmd = new SqlCommand(sql, conn);
        await using var reader = await cmd.ExecuteReaderAsync();

        if (!await reader.ReadAsync())
            return EmptyStats();

        var totalMarketCap = GetDecimal(reader, "total_market_cap");
        var volume24h = GetDecimal(reader, "total_24h_volume");
        var avg24hChangePct = GetDecimal(reader, "avg_24h_change_pct");
        var btcDominancePct = GetDecimal(reader, "btc_dominance_pct");

        return new MarketStatsDto
        {
            TotalMarketCap = FormatLargeNumber(totalMarketCap),
            MarketCapChange = FormatPercentWithArrow(avg24hChangePct),
            MarketCapChangeDir = avg24hChangePct >= 0 ? "up" : "dn",
            Volume24h = FormatLargeNumber(volume24h),
            BtcDominance = $"{btcDominancePct:F1}%"
        };
    }

    private static decimal GetDecimal(SqlDataReader reader, string column)
    {
        var ordinal = reader.GetOrdinal(column);
        return reader.IsDBNull(ordinal) ? 0m : reader.GetDecimal(ordinal);
    }

    private static MarketStatsDto EmptyStats() => new()
    {
        TotalMarketCap = "$0",
        MarketCapChange = "→ 0.0%",
        MarketCapChangeDir = "up",
        Volume24h = "$0",
        BtcDominance = "0.0%"
    };

    private static string FormatPercentWithArrow(decimal value)
    {
        if (value > 0) return $"↑ {value:F1}%";
        if (value < 0) return $"↓ {Math.Abs(value):F1}%";
        return $"→ {value:F1}%";
    }

    private static string FormatLargeNumber(decimal value) => value switch
    {
        >= 1_000_000_000_000m => $"${value / 1_000_000_000_000m:F2}T",
        >= 1_000_000_000m => $"${value / 1_000_000_000m:F1}B",
        >= 1_000_000m => $"${value / 1_000_000m:F0}M",
        _ => $"${value:F0}",
    };
}
