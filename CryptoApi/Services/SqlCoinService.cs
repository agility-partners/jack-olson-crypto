using CryptoApi.DTOs;
using Microsoft.Data.SqlClient;

namespace CryptoApi.Services;

public class SqlCoinService : ICoinService
{
    private readonly string _connectionString;

    public SqlCoinService(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("CryptoDb")
            ?? throw new InvalidOperationException("CryptoDb connection string is not configured.");
    }

    public async Task<IEnumerable<CoinDto>> GetAllCoinsAsync()
    {
        var coins = new List<CoinDto>();

        await using var conn = new SqlConnection(_connectionString);
        await conn.OpenAsync();

        const string sql = """
            SELECT coin_id, symbol, name, market_cap_rank, current_price,
                   market_cap, total_volume, price_change_percentage_24h
            FROM gold.coin_prices
            ORDER BY market_cap_rank
            """;

        await using var cmd = new SqlCommand(sql, conn);
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            coins.Add(MapRow(reader));
        }

        return coins;
    }

    public async Task<CoinDto?> GetCoinByIdAsync(string id)
    {
        await using var conn = new SqlConnection(_connectionString);
        await conn.OpenAsync();

        const string sql = """
            SELECT coin_id, symbol, name, market_cap_rank, current_price,
                   market_cap, total_volume, price_change_percentage_24h
            FROM gold.coin_prices
            WHERE coin_id = @id
            """;

        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@id", id);
        await using var reader = await cmd.ExecuteReaderAsync();

        return await reader.ReadAsync() ? MapRow(reader) : null;
    }

    private static CoinDto MapRow(SqlDataReader reader)
    {
        var symbol = reader.GetString(reader.GetOrdinal("symbol")).ToUpperInvariant();
        var marketCapRaw = GetDecimal(reader, "market_cap");
        var volumeRaw = GetDecimal(reader, "total_volume");

        return new CoinDto
        {
            Id = reader.GetString(reader.GetOrdinal("coin_id")),
            Symbol = symbol,
            Name = reader.GetString(reader.GetOrdinal("name")),
            IconClass = symbol.ToLowerInvariant(),
            Rank = GetInt(reader, "market_cap_rank"),
            Price = GetDecimal(reader, "current_price"),
            Change24h = GetDecimal(reader, "price_change_percentage_24h"),
            MarketCapRaw = marketCapRaw,
            MarketCap = FormatLargeNumber(marketCapRaw),
            VolumeRaw = volumeRaw,
            Volume = FormatLargeNumber(volumeRaw),
        };
    }

    private static decimal GetDecimal(SqlDataReader reader, string column)
    {
        var ordinal = reader.GetOrdinal(column);
        return reader.IsDBNull(ordinal) ? 0m : (decimal)reader.GetDouble(ordinal);
    }

    private static int GetInt(SqlDataReader reader, string column)
    {
        var ordinal = reader.GetOrdinal(column);
        return reader.IsDBNull(ordinal) ? 0 : reader.GetInt32(ordinal);
    }

    private static string FormatLargeNumber(decimal value) => value switch
    {
        >= 1_000_000_000_000m => $"${value / 1_000_000_000_000m:F2}T",
        >= 1_000_000_000m     => $"${value / 1_000_000_000m:F1}B",
        >= 1_000_000m         => $"${value / 1_000_000m:F0}M",
        _                     => $"${value:F0}",
    };
}
