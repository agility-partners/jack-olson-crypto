using CryptoApi.DTOs;
using Microsoft.Data.SqlClient;

namespace CryptoApi.Services;

public class SqlTopMoversService : ITopMoversService
{
    private readonly string _connectionString;

    public SqlTopMoversService(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("CryptoDb")
            ?? throw new InvalidOperationException("CryptoDb connection string is not configured.");
    }

    public async Task<IEnumerable<TopMoverDto>> GetTopMoversAsync()
    {
        var movers = new List<TopMoverDto>();

        await using var conn = new SqlConnection(_connectionString);
        await conn.OpenAsync();

        const string sql = """
            SELECT coin_id, symbol, name, current_price, market_cap,
                   price_change_percentage_24h, rank, category
            FROM gold.top_movers
            ORDER BY category, rank
            """;

        await using var cmd = new SqlCommand(sql, conn);
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            movers.Add(MapRow(reader));
        }

        return movers;
    }

    private static TopMoverDto MapRow(SqlDataReader reader)
    {
        var symbol = reader.GetString(reader.GetOrdinal("symbol")).ToUpperInvariant();
        var marketCapRaw = GetDecimal(reader, "market_cap");

        return new TopMoverDto
        {
            Id = reader.GetString(reader.GetOrdinal("coin_id")),
            Symbol = symbol,
            Name = reader.GetString(reader.GetOrdinal("name")),
            IconClass = symbol.ToLowerInvariant(),
            Price = GetDecimal(reader, "current_price"),
            Change24h = GetDecimal(reader, "price_change_percentage_24h"),
            MarketCapRaw = marketCapRaw,
            MarketCap = FormatLargeNumber(marketCapRaw),
            CategoryRank = GetInt(reader, "rank"),
            Category = reader.GetString(reader.GetOrdinal("category")),
        };
    }

    private static decimal GetDecimal(SqlDataReader reader, string column)
    {
        var ordinal = reader.GetOrdinal(column);
        return reader.IsDBNull(ordinal) ? 0m : reader.GetDecimal(ordinal);
    }

    private static int GetInt(SqlDataReader reader, string column)
    {
        var ordinal = reader.GetOrdinal(column);
        // ROW_NUMBER() produces BIGINT; Convert.ToInt32 handles both INT and BIGINT.
        return reader.IsDBNull(ordinal) ? 0 : Convert.ToInt32(reader.GetValue(ordinal));
    }

    private static string FormatLargeNumber(decimal value) => value switch
    {
        >= 1_000_000_000_000m => $"${value / 1_000_000_000_000m:F2}T",
        >= 1_000_000_000m     => $"${value / 1_000_000_000m:F1}B",
        >= 1_000_000m         => $"${value / 1_000_000m:F0}M",
        _                     => $"${value:F0}",
    };
}
