using System.Globalization;
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

    public async Task<IEnumerable<CoinDto>> GetAllCoinsAsync() =>
        await QueryCoinsAsync(
            """
            SELECT
                coin_id,
                symbol,
                name,
                market_cap_rank,
                current_price,
                price_change_percentage_24h,
                market_cap,
                total_volume
            FROM gold.coin_prices
            ORDER BY
                CASE WHEN market_cap_rank IS NULL THEN 1 ELSE 0 END,
                market_cap_rank,
                coin_id
            """);

    public async Task<CoinDto?> GetCoinByIdAsync(string id)
    {
        var coins = await QueryCoinsAsync(
            """
            SELECT
                coin_id,
                symbol,
                name,
                market_cap_rank,
                current_price,
                price_change_percentage_24h,
                market_cap,
                total_volume
            FROM gold.coin_prices
            WHERE coin_id = @coinId
            """,
            new SqlParameter("@coinId", id));

        return coins.SingleOrDefault();
    }

    private async Task<List<CoinDto>> QueryCoinsAsync(string sql, params SqlParameter[] parameters)
    {
        var coins = new List<CoinDto>();

        await using var conn = new SqlConnection(_connectionString);
        await conn.OpenAsync();

        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddRange(parameters);

        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            coins.Add(MapCoin(reader));
        }

        return coins;
    }

    internal static CoinDto MapCoin(SqlDataReader reader)
    {
        var coinId = reader.GetString(0);
        var symbol = reader.GetString(1);
        var marketCapRaw = reader.IsDBNull(6) ? 0m : reader.GetDecimal(6);
        var volumeRaw = reader.IsDBNull(7) ? 0m : reader.GetDecimal(7);

        return new CoinDto
        {
            Id = coinId,
            Symbol = symbol,
            Name = reader.GetString(2),
            IconClass = ResolveIconClass(coinId, symbol),
            Rank = reader.IsDBNull(3) ? 0 : reader.GetInt32(3),
            Price = reader.IsDBNull(4) ? 0m : reader.GetDecimal(4),
            Change24h = reader.IsDBNull(5) ? 0m : reader.GetDecimal(5),
            MarketCapRaw = marketCapRaw,
            MarketCap = FormatCurrencyCompact(marketCapRaw),
            VolumeRaw = volumeRaw,
            Volume = FormatCurrencyCompact(volumeRaw),
        };
    }

    internal static string ResolveIconClass(string coinId, string symbol)
    {
        var fallbackCoin = CoinCatalog.GetById(coinId);
        if (!string.IsNullOrWhiteSpace(fallbackCoin?.IconClass))
        {
            return fallbackCoin.IconClass;
        }

        return string.IsNullOrWhiteSpace(symbol)
            ? coinId.ToLowerInvariant()
            : symbol.ToLowerInvariant();
    }

    internal static string FormatCurrencyCompact(decimal value)
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
