using System.Globalization;
using CryptoApi.DTOs;
using Microsoft.Data.SqlClient;

namespace CryptoApi.Services;

public class SqlCoinService : ICoinService
{
    private readonly string _connectionString;
    private static readonly IReadOnlyDictionary<string, string[]> CoinIdAliases = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase)
    {
        ["bnb"] = ["binancecoin"],
        ["avalanche"] = ["avalanche-2"],
        ["polygon"] = ["matic-network", "polygon-ecosystem-token"],
        ["theta"] = ["theta-token"],
        ["hedera"] = ["hedera-hashgraph"],
        ["elrond"] = ["multiversx", "elrond-erd-2"],
        ["near"] = ["near-protocol"],
    };
    private static readonly IReadOnlyDictionary<string, string> CanonicalCoinIdsByDatabaseId = BuildCanonicalCoinIdsByDatabaseId();

    public SqlCoinService(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("CryptoDb")
            ?? throw new InvalidOperationException("CryptoDb connection string is not configured.");
    }

    public async Task<IEnumerable<CoinDto>> GetAllCoinsAsync()
    {
        var liveRows = new List<LiveCoinRow>();

        await using var conn = new SqlConnection(_connectionString);
        await conn.OpenAsync();

        const string sql = """
            SELECT coin_id, market_cap_rank, current_price, price_change_percentage_24h, market_cap, total_volume
            FROM gold.coin_prices
            """;

        await using var cmd = new SqlCommand(sql, conn);
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            liveRows.Add(ReadLiveCoinRow(reader));
        }

        return MergeCatalogWithLiveRows(liveRows);
    }

    public async Task<CoinDto?> GetCoinByIdAsync(string id)
    {
        var coin = CoinCatalog.GetById(id);
        if (coin == null)
        {
            return null;
        }

        await using var conn = new SqlConnection(_connectionString);
        await conn.OpenAsync();

        var databaseIds = GetDatabaseCoinIds(id);
        var parameterNames = databaseIds
            .Select((_, index) => $"@id{index}")
            .ToArray();
        var sql = $"""
            SELECT coin_id, market_cap_rank, current_price, price_change_percentage_24h, market_cap, total_volume
            FROM gold.coin_prices
            WHERE coin_id IN ({string.Join(", ", parameterNames)})
            """;

        await using var cmd = new SqlCommand(sql, conn);
        for (var i = 0; i < databaseIds.Count; i++)
        {
            cmd.Parameters.AddWithValue(parameterNames[i], databaseIds[i]);
        }

        await using var reader = await cmd.ExecuteReaderAsync();
        var liveRows = new List<LiveCoinRow>();
        while (await reader.ReadAsync())
        {
            liveRows.Add(ReadLiveCoinRow(reader));
        }

        var liveRow = SelectBestLiveRows(liveRows)
            .GetValueOrDefault(id);

        return MergeCatalogCoin(coin, liveRow);
    }

    internal static IReadOnlyList<CoinDto> MergeCatalogWithLiveRows(IEnumerable<LiveCoinRow> liveRows)
    {
        var liveRowsByCanonicalId = SelectBestLiveRows(liveRows);

        return CoinCatalog.GetAll()
            .Select(coin => MergeCatalogCoin(
                coin,
                liveRowsByCanonicalId.TryGetValue(coin.Id, out var liveRow) ? liveRow : null
            ))
            .OrderBy(coin => coin.Rank)
            .ToList();
    }

    internal static CoinDto MergeCatalogCoin(CoinDto coin, LiveCoinRow? liveRow)
    {
        if (liveRow == null)
        {
            return coin;
        }

        if (liveRow.Rank is > 0)
        {
            coin.Rank = liveRow.Rank.Value;
        }

        if (liveRow.Price is > 0)
        {
            coin.Price = liveRow.Price.Value;
        }

        if (liveRow.Change24h.HasValue)
        {
            coin.Change24h = liveRow.Change24h.Value;
        }

        if (liveRow.MarketCapRaw is > 0)
        {
            coin.MarketCapRaw = liveRow.MarketCapRaw.Value;
            coin.MarketCap = FormatCompactCurrency(liveRow.MarketCapRaw.Value);
        }

        if (liveRow.VolumeRaw is > 0)
        {
            coin.VolumeRaw = liveRow.VolumeRaw.Value;
            coin.Volume = FormatCompactCurrency(liveRow.VolumeRaw.Value);
        }

        return coin;
    }

    internal static IReadOnlyList<string> GetDatabaseCoinIds(string coinId)
    {
        var ids = new List<string> { coinId };
        if (CoinIdAliases.TryGetValue(coinId, out var aliases))
        {
            ids.AddRange(aliases);
        }

        return ids;
    }

    internal static string? GetCanonicalCoinId(string databaseId) =>
        CanonicalCoinIdsByDatabaseId.TryGetValue(databaseId, out var canonicalCoinId)
            ? canonicalCoinId
            : null;

    private static Dictionary<string, LiveCoinRow> SelectBestLiveRows(IEnumerable<LiveCoinRow> liveRows)
    {
        var liveRowsByCanonicalId = new Dictionary<string, LiveCoinRow>(StringComparer.OrdinalIgnoreCase);

        foreach (var liveRow in liveRows)
        {
            var canonicalCoinId = GetCanonicalCoinId(liveRow.DatabaseId);
            if (canonicalCoinId == null)
            {
                continue;
            }

            if (!liveRowsByCanonicalId.TryGetValue(canonicalCoinId, out var existingRow)
                || ShouldPreferLiveRow(liveRow, existingRow, canonicalCoinId))
            {
                liveRowsByCanonicalId[canonicalCoinId] = liveRow;
            }
        }

        return liveRowsByCanonicalId;
    }

    private static bool ShouldPreferLiveRow(LiveCoinRow candidate, LiveCoinRow existing, string canonicalCoinId)
    {
        var candidateIsCanonicalId = string.Equals(candidate.DatabaseId, canonicalCoinId, StringComparison.OrdinalIgnoreCase);
        var existingIsCanonicalId = string.Equals(existing.DatabaseId, canonicalCoinId, StringComparison.OrdinalIgnoreCase);

        if (candidateIsCanonicalId != existingIsCanonicalId)
        {
            return candidateIsCanonicalId;
        }

        return candidate.Rank.GetValueOrDefault(int.MaxValue) < existing.Rank.GetValueOrDefault(int.MaxValue);
    }

    private static LiveCoinRow ReadLiveCoinRow(SqlDataReader reader) =>
        new(
            DatabaseId: reader.GetString(0),
            Rank: reader.IsDBNull(1) ? null : reader.GetInt32(1),
            Price: reader.IsDBNull(2) ? null : reader.GetDecimal(2),
            Change24h: reader.IsDBNull(3) ? null : reader.GetDecimal(3),
            MarketCapRaw: reader.IsDBNull(4) ? null : reader.GetDecimal(4),
            VolumeRaw: reader.IsDBNull(5) ? null : reader.GetDecimal(5)
        );

    private static Dictionary<string, string> BuildCanonicalCoinIdsByDatabaseId()
    {
        var canonicalIds = CoinCatalog.GetAll()
            .Select(coin => coin.Id)
            .ToDictionary(id => id, id => id, StringComparer.OrdinalIgnoreCase);

        foreach (var (canonicalId, aliases) in CoinIdAliases)
        {
            foreach (var alias in aliases)
            {
                canonicalIds[alias] = canonicalId;
            }
        }

        return canonicalIds;
    }

    private static string FormatCompactCurrency(decimal value)
    {
        var absValue = Math.Abs(value);

        return absValue switch
        {
            >= 1_000_000_000_000m => $"${(value / 1_000_000_000_000m).ToString("0.##", CultureInfo.InvariantCulture)}T",
            >= 1_000_000_000m => $"${(value / 1_000_000_000m).ToString("0.##", CultureInfo.InvariantCulture)}B",
            >= 1_000_000m => $"${(value / 1_000_000m).ToString("0.##", CultureInfo.InvariantCulture)}M",
            >= 1_000m => $"${(value / 1_000m).ToString("0.##", CultureInfo.InvariantCulture)}K",
            _ => $"${value.ToString("0.##", CultureInfo.InvariantCulture)}"
        };
    }

    internal sealed record LiveCoinRow(
        string DatabaseId,
        int? Rank,
        decimal? Price,
        decimal? Change24h,
        decimal? MarketCapRaw,
        decimal? VolumeRaw);
}
