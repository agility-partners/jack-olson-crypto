using System.Globalization;
using System.Text.Json;
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
                price_change_percentage_24h,
                price_change_percentage_7d,
                price_change_percentage_30d,
                price_change_percentage_1y,
                ath,
                atl,
                circulating_supply,
                total_supply,
                max_supply,
                sparkline_7d,
                last_updated
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
                Change24h: reader.IsDBNull(5) ? null : reader.GetDecimal(5),
                Change7d: reader.IsDBNull(6) ? null : reader.GetDecimal(6),
                Change30d: reader.IsDBNull(7) ? null : reader.GetDecimal(7),
                Change1y: reader.IsDBNull(8) ? null : reader.GetDecimal(8),
                Ath: reader.IsDBNull(9) ? null : reader.GetDecimal(9),
                Atl: reader.IsDBNull(10) ? null : reader.GetDecimal(10),
                CirculatingSupplyRaw: reader.IsDBNull(11) ? null : reader.GetDecimal(11),
                TotalSupplyRaw: reader.IsDBNull(12) ? null : reader.GetDecimal(12),
                MaxSupplyRaw: reader.IsDBNull(13) ? null : reader.GetDecimal(13),
                Sparkline: reader.IsDBNull(14) ? null : ParseSparklinePoints(reader.GetString(14)),
                LastUpdated: reader.IsDBNull(15) ? null : reader.GetDateTime(15));
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
            Change7d = snapshot.Change7d ?? coin.Change7d,
            Change30d = snapshot.Change30d ?? coin.Change30d,
            Change1y = snapshot.Change1y ?? coin.Change1y,
            Rank = snapshot.Rank ?? coin.Rank,
            MarketCapRaw = marketCapRaw,
            MarketCap = FormatCurrencyCompact(marketCapRaw),
            VolumeRaw = volumeRaw,
            Volume = FormatCurrencyCompact(volumeRaw),
            Ath = snapshot.Ath ?? coin.Ath,
            Atl = snapshot.Atl ?? coin.Atl,
            CirculatingSupplyRaw = snapshot.CirculatingSupplyRaw ?? coin.CirculatingSupplyRaw,
            TotalSupplyRaw = snapshot.TotalSupplyRaw ?? coin.TotalSupplyRaw,
            MaxSupplyRaw = snapshot.MaxSupplyRaw ?? coin.MaxSupplyRaw,
            Sparkline = snapshot.Sparkline ?? coin.Sparkline,
            DataAsOf = snapshot.LastUpdated.HasValue
                ? snapshot.LastUpdated.Value.ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
                : null,
        };
    }

    private static decimal[]? ParseSparklinePoints(string? rawSparkline)
    {
        if (string.IsNullOrWhiteSpace(rawSparkline))
        {
            return null;
        }

        try
        {
            return JsonSerializer.Deserialize<decimal[]>(rawSparkline);
        }
        catch (JsonException)
        {
            return null;
        }
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
        decimal? Change24h,
        decimal? Change7d,
        decimal? Change30d,
        decimal? Change1y,
        decimal? Ath,
        decimal? Atl,
        decimal? CirculatingSupplyRaw,
        decimal? TotalSupplyRaw,
        decimal? MaxSupplyRaw,
        decimal[]? Sparkline,
        DateTime? LastUpdated);
}
