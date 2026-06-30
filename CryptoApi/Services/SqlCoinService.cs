using System.Globalization;
using CryptoApi.DTOs;
using Microsoft.Data.SqlClient;

namespace CryptoApi.Services;

public class SqlCoinService : ICoinService
{
    private readonly string _connectionString;
    private readonly Func<CancellationToken, Task<IReadOnlyDictionary<string, CoinMarketSnapshot>>> _loadSnapshotsAsync;

    public SqlCoinService(IConfiguration configuration)
        : this(configuration, null)
    {
    }

    public SqlCoinService(
        IConfiguration configuration,
        Func<CancellationToken, Task<IReadOnlyDictionary<string, CoinMarketSnapshot>>>? loadSnapshotsAsync)
    {
        _connectionString = configuration.GetConnectionString("CryptoDb")
            ?? throw new InvalidOperationException("CryptoDb connection string is not configured.");
        _loadSnapshotsAsync = loadSnapshotsAsync ?? LoadSnapshotsFromSqlAsync;
    }

    public async Task<IEnumerable<CoinDto>> GetAllCoinsAsync()
    {
        var snapshots = await LoadSnapshotsSafelyAsync(CancellationToken.None);

        return CoinCatalog.GetAll()
            .Select(coin => snapshots.TryGetValue(coin.Id, out var snapshot)
                ? MergeCatalogCoin(coin, snapshot)
                : coin)
            .OrderBy(coin => coin.Rank)
            .ToList();
    }

    public async Task<CoinDto?> GetCoinByIdAsync(string id)
    {
        var coin = CoinCatalog.GetById(id);
        if (coin is null)
        {
            return null;
        }

        var snapshots = await LoadSnapshotsSafelyAsync(CancellationToken.None);
        return snapshots.TryGetValue(id, out var snapshot)
            ? MergeCatalogCoin(coin, snapshot)
            : coin;
    }

    private async Task<IReadOnlyDictionary<string, CoinMarketSnapshot>> LoadSnapshotsSafelyAsync(CancellationToken cancellationToken)
    {
        try
        {
            return await _loadSnapshotsAsync(cancellationToken);
        }
        catch (SqlException)
        {
            return new Dictionary<string, CoinMarketSnapshot>(StringComparer.Ordinal);
        }
        catch (InvalidOperationException)
        {
            return new Dictionary<string, CoinMarketSnapshot>(StringComparer.Ordinal);
        }
    }

    private async Task<IReadOnlyDictionary<string, CoinMarketSnapshot>> LoadSnapshotsFromSqlAsync(CancellationToken cancellationToken)
    {
        await using var conn = new SqlConnection(_connectionString);
        await conn.OpenAsync(cancellationToken);

        const string sql = """
            SELECT
                coin_id,
                market_cap_rank,
                current_price,
                market_cap,
                total_volume,
                price_change_percentage_24h
            FROM gold.coin_prices
            """;

        await using var cmd = new SqlCommand(sql, conn);
        await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);

        var snapshots = new Dictionary<string, CoinMarketSnapshot>(StringComparer.Ordinal);

        while (await reader.ReadAsync(cancellationToken))
        {
            if (reader.IsDBNull(0))
            {
                continue;
            }

            var coinId = reader.GetString(0);
            snapshots[coinId] = new CoinMarketSnapshot(
                CoinId: coinId,
                Rank: reader.IsDBNull(1) ? null : reader.GetInt32(1),
                CurrentPrice: reader.IsDBNull(2) ? null : reader.GetDecimal(2),
                MarketCapRaw: reader.IsDBNull(3) ? null : reader.GetDecimal(3),
                VolumeRaw: reader.IsDBNull(4) ? null : reader.GetDecimal(4),
                Change24h: reader.IsDBNull(5) ? null : reader.GetDecimal(5));
        }

        return snapshots;
    }

    internal static CoinDto MergeCatalogCoin(CoinDto coin, CoinMarketSnapshot snapshot)
    {
        var marketCapRaw = snapshot.MarketCapRaw ?? coin.MarketCapRaw;
        var volumeRaw = snapshot.VolumeRaw ?? coin.VolumeRaw;

        return new CoinDto
        {
            Id = coin.Id,
            Symbol = coin.Symbol,
            Name = coin.Name,
            IconClass = coin.IconClass,
            Price = snapshot.CurrentPrice ?? coin.Price,
            Change24h = snapshot.Change24h ?? coin.Change24h,
            Rank = snapshot.Rank ?? coin.Rank,
            MarketCapRaw = marketCapRaw,
            MarketCap = FormatCurrencyCompact(marketCapRaw),
            VolumeRaw = volumeRaw,
            Volume = FormatCurrencyCompact(volumeRaw),
        };
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

    public sealed record CoinMarketSnapshot(
        string CoinId,
        int? Rank,
        decimal? CurrentPrice,
        decimal? MarketCapRaw,
        decimal? VolumeRaw,
        decimal? Change24h);
}
