using System.Data.Common;
using System.Globalization;
using CryptoApi.DTOs;
using Microsoft.Data.SqlClient;

namespace CryptoApi.Services;

public class SqlCoinService : ICoinService
{
    private readonly Func<DbConnection> _connectionFactory;

    public SqlCoinService(IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("CryptoDb")
            ?? throw new InvalidOperationException("CryptoDb connection string is not configured.");

        _connectionFactory = () => new SqlConnection(connectionString);
    }

    internal SqlCoinService(Func<DbConnection> connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<IEnumerable<CoinDto>> GetAllCoinsAsync()
    {
        var coins = await QueryCoinsAsync();
        return coins.Count > 0 ? coins : CoinCatalog.GetAll();
    }

    public async Task<CoinDto?> GetCoinByIdAsync(string id)
    {
        var coin = (await QueryCoinsAsync(id)).SingleOrDefault();
        return coin ?? CoinCatalog.GetById(id);
    }

    private async Task<IReadOnlyList<CoinDto>> QueryCoinsAsync(string? coinId = null)
    {
        await using var connection = _connectionFactory();
        await connection.OpenAsync();

        await using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT
                coin_id,
                symbol,
                name,
                market_cap_rank,
                current_price,
                market_cap,
                total_volume,
                price_change_percentage_24h
            FROM gold.coin_prices
            WHERE (@coinId IS NULL OR coin_id = @coinId)
            ORDER BY COALESCE(market_cap_rank, 2147483647), name
            """;

        var parameter = command.CreateParameter();
        parameter.ParameterName = "@coinId";
        parameter.Value = coinId is null ? DBNull.Value : coinId;
        command.Parameters.Add(parameter);

        await using var reader = await command.ExecuteReaderAsync();
        var coins = new List<CoinDto>();

        while (await reader.ReadAsync())
        {
            var coin = MapCoin(reader);
            if (coin is not null)
            {
                coins.Add(coin);
            }
        }

        return coins;
    }

    private static CoinDto? MapCoin(DbDataReader reader)
    {
        var id = GetString(reader, "coin_id");
        if (string.IsNullOrWhiteSpace(id))
        {
            return null;
        }

        var catalogCoin = CoinCatalog.GetById(id);
        if (catalogCoin is null)
        {
            return null;
        }

        var symbol = GetString(reader, "symbol");
        var name = GetString(reader, "name");
        var rank = GetNullableInt32(reader, "market_cap_rank");
        var price = GetNullableDecimal(reader, "current_price") ?? catalogCoin.Price;
        var marketCap = GetNullableDecimal(reader, "market_cap") ?? catalogCoin.MarketCapRaw;
        var volume = GetNullableDecimal(reader, "total_volume") ?? catalogCoin.VolumeRaw;
        var change24h = GetNullableDecimal(reader, "price_change_percentage_24h") ?? catalogCoin.Change24h;

        return new CoinDto
        {
            Id = id,
            Symbol = string.IsNullOrWhiteSpace(symbol) ? catalogCoin.Symbol : symbol.ToUpperInvariant(),
            Name = string.IsNullOrWhiteSpace(name) ? catalogCoin.Name : name,
            IconClass = catalogCoin.IconClass,
            Rank = rank ?? catalogCoin.Rank,
            Price = price,
            Change24h = change24h,
            MarketCapRaw = marketCap,
            MarketCap = FormatCurrencyCompact(marketCap),
            VolumeRaw = volume,
            Volume = FormatCurrencyCompact(volume),
        };
    }

    private static string GetString(DbDataReader reader, string columnName)
    {
        var ordinal = reader.GetOrdinal(columnName);
        return reader.IsDBNull(ordinal) ? string.Empty : reader.GetString(ordinal);
    }

    private static decimal? GetNullableDecimal(DbDataReader reader, string columnName)
    {
        var ordinal = reader.GetOrdinal(columnName);
        if (reader.IsDBNull(ordinal))
        {
            return null;
        }

        return Convert.ToDecimal(reader.GetValue(ordinal), CultureInfo.InvariantCulture);
    }

    private static int? GetNullableInt32(DbDataReader reader, string columnName)
    {
        var ordinal = reader.GetOrdinal(columnName);
        if (reader.IsDBNull(ordinal))
        {
            return null;
        }

        return Convert.ToInt32(reader.GetValue(ordinal), CultureInfo.InvariantCulture);
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
