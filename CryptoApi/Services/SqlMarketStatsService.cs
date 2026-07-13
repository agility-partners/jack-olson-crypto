using System.Globalization;
using CryptoApi.DTOs;
using Microsoft.Data.SqlClient;

namespace CryptoApi.Services;

public class SqlMarketStatsService : IMarketStatsService
{
    private readonly string _connectionString;
    private readonly Func<CancellationToken, Task<IReadOnlyList<TopMoverRow>>> _loadTopMoversAsync;
    private readonly Func<CancellationToken, Task<IReadOnlyList<TopMoverRow7d>>> _loadTopMovers7dAsync;
    private readonly Func<int, CancellationToken, Task<IReadOnlyList<TopVolumeRow>>> _loadTopByVolumeAsync;
    private const string TopMoversSql = """
        WITH filtered AS (
            SELECT
                coin_id,
                symbol,
                name,
                current_price,
                market_cap,
                price_change_percentage_24h,
                last_updated
            FROM gold.coin_prices
            WHERE price_change_percentage_24h IS NOT NULL
        ),
        gainers AS (
            SELECT
                coin_id,
                symbol,
                name,
                current_price,
                market_cap,
                price_change_percentage_24h,
                last_updated,
                ROW_NUMBER() OVER (ORDER BY price_change_percentage_24h DESC) AS rank,
                'gainer' AS category
            FROM filtered
            WHERE price_change_percentage_24h > 0
        ),
        losers AS (
            SELECT
                coin_id,
                symbol,
                name,
                current_price,
                market_cap,
                price_change_percentage_24h,
                last_updated,
                ROW_NUMBER() OVER (ORDER BY price_change_percentage_24h ASC) AS rank,
                'loser' AS category
            FROM filtered
            WHERE price_change_percentage_24h < 0
        )
        SELECT
            coin_id,
            symbol,
            name,
            current_price,
            market_cap,
            price_change_percentage_24h,
            rank,
            category,
            last_updated
        FROM gainers
        WHERE rank <= 10
        UNION ALL
        SELECT
            coin_id,
            symbol,
            name,
            current_price,
            market_cap,
            price_change_percentage_24h,
            rank,
            category,
            last_updated
        FROM losers
        WHERE rank <= 10
        ORDER BY category, rank
        """;

    private const string TopMovers7dSql = """
        WITH filtered AS (
            SELECT
                coin_id,
                symbol,
                name,
                current_price,
                market_cap,
                price_change_percentage_24h,
                price_change_percentage_7d,
                last_updated
            FROM gold.coin_prices
            WHERE price_change_percentage_7d IS NOT NULL
        ),
        gainers AS (
            SELECT
                coin_id,
                symbol,
                name,
                current_price,
                market_cap,
                price_change_percentage_24h,
                price_change_percentage_7d,
                last_updated,
                ROW_NUMBER() OVER (ORDER BY price_change_percentage_7d DESC) AS rank,
                'gainer' AS category
            FROM filtered
            WHERE price_change_percentage_7d > 0
        ),
        losers AS (
            SELECT
                coin_id,
                symbol,
                name,
                current_price,
                market_cap,
                price_change_percentage_24h,
                price_change_percentage_7d,
                last_updated,
                ROW_NUMBER() OVER (ORDER BY price_change_percentage_7d ASC) AS rank,
                'loser' AS category
            FROM filtered
            WHERE price_change_percentage_7d < 0
        )
        SELECT
            coin_id,
            symbol,
            name,
            current_price,
            market_cap,
            price_change_percentage_24h,
            price_change_percentage_7d,
            rank,
            category,
            last_updated
        FROM gainers
        WHERE rank <= 10
        UNION ALL
        SELECT
            coin_id,
            symbol,
            name,
            current_price,
            market_cap,
            price_change_percentage_24h,
            price_change_percentage_7d,
            rank,
            category,
            last_updated
        FROM losers
        WHERE rank <= 10
        ORDER BY category, rank
        """;

    public SqlMarketStatsService(IConfiguration configuration)
        : this(configuration, null, null, null)
    {
    }

    public SqlMarketStatsService(
        IConfiguration configuration,
        Func<CancellationToken, Task<IReadOnlyList<TopMoverRow>>>? loadTopMoversAsync,
        Func<int, CancellationToken, Task<IReadOnlyList<TopVolumeRow>>>? loadTopByVolumeAsync = null,
        Func<CancellationToken, Task<IReadOnlyList<TopMoverRow7d>>>? loadTopMovers7dAsync = null)
    {
        _connectionString = configuration.GetConnectionString("CryptoDb")
            ?? throw new InvalidOperationException("CryptoDb connection string is not configured.");
        _loadTopMoversAsync = loadTopMoversAsync ?? LoadTopMoversFromSqlAsync;
        _loadTopByVolumeAsync = loadTopByVolumeAsync ?? LoadTopByVolumeFromSqlAsync;
        _loadTopMovers7dAsync = loadTopMovers7dAsync ?? LoadTopMovers7dFromSqlAsync;
    }

    public async Task<MarketStatsDto> GetMarketStatsAsync()
    {
        await using var conn = new SqlConnection(_connectionString);
        await conn.OpenAsync();

        const string sql = """
            SELECT
                ms.total_market_cap,
                ms.total_24h_volume,
                ms.avg_24h_change_pct,
                ms.btc_dominance_pct,
                cp.data_as_of,
                cp.gainers_count,
                cp.total_tracked
            FROM gold.market_summary ms
            CROSS JOIN (
                SELECT
                    MAX(last_updated) AS data_as_of,
                    COUNT(CASE WHEN price_change_percentage_24h > 0 THEN 1 END) AS gainers_count,
                    COUNT(*) AS total_tracked
                FROM gold.coin_prices
            ) cp
            """;

        await using var cmd = new SqlCommand(sql, conn);
        await using var reader = await cmd.ExecuteReaderAsync();

        if (!await reader.ReadAsync())
        {
            return CreateDto(0m, 0m, 0m, 0m, null, 0, 0);
        }

        var totalMarketCap = reader.IsDBNull(0) ? 0m : reader.GetDecimal(0);
        var volume24h = reader.IsDBNull(1) ? 0m : reader.GetDecimal(1);
        var marketCapChangePct = reader.IsDBNull(2) ? 0m : reader.GetDecimal(2);
        var btcDominancePct = reader.IsDBNull(3) ? 0m : reader.GetDecimal(3);
        var dataAsOf = reader.IsDBNull(4) ? null
            : reader.GetDateTime(4).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ");
        var gainersCount = reader.IsDBNull(5) ? 0 : reader.GetInt32(5);
        var totalTracked = reader.IsDBNull(6) ? 0 : reader.GetInt32(6);

        if (totalMarketCap <= 0m && volume24h <= 0m)
        {
            return CreateFallbackDtoFromCatalog();
        }

        return CreateDto(totalMarketCap, volume24h, marketCapChangePct, btcDominancePct, dataAsOf, gainersCount, totalTracked);
    }

    public async Task<TopMoversDto> GetTopMoversAsync()
    {
        IReadOnlyList<TopMoverRow> rows;

        try
        {
            rows = await _loadTopMoversAsync(CancellationToken.None);
        }
        catch (SqlException)
        {
            return CreateFallbackTopMoversFromCatalog();
        }
        catch (InvalidOperationException)
        {
            return CreateFallbackTopMoversFromCatalog();
        }

        if (rows.Count == 0)
        {
            return CreateFallbackTopMoversFromCatalog();
        }

        var latestTimestamp = rows
            .Where(r => r.LastUpdated.HasValue)
            .Select(r => r.LastUpdated!.Value)
            .DefaultIfEmpty()
            .Max();

        var dataAsOf = latestTimestamp == default
            ? null
            : latestTimestamp.ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ");

        return new TopMoversDto
        {
            Gainers = rows
                .Where(row => string.Equals(row.Category, "gainer", StringComparison.OrdinalIgnoreCase))
                .OrderBy(row => row.Rank)
                .Take(10)
                .Select(MapTopMover)
                .ToList(),
            Losers = rows
                .Where(row => string.Equals(row.Category, "loser", StringComparison.OrdinalIgnoreCase))
                .OrderBy(row => row.Rank)
                .Take(10)
                .Select(MapTopMover)
                .ToList(),
            DataAsOf = dataAsOf,
        };
    }

    private async Task<IReadOnlyList<TopMoverRow>> LoadTopMoversFromSqlAsync(CancellationToken cancellationToken)
    {
        await using var conn = new SqlConnection(_connectionString);
        await conn.OpenAsync(cancellationToken);

        await using var cmd = new SqlCommand(TopMoversSql, conn);
        await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);

        var rows = new List<TopMoverRow>();

        while (await reader.ReadAsync(cancellationToken))
        {
            rows.Add(new TopMoverRow(
                CoinId: reader.IsDBNull(0) ? string.Empty : reader.GetString(0),
                Symbol: reader.IsDBNull(1) ? string.Empty : reader.GetString(1),
                Name: reader.IsDBNull(2) ? string.Empty : reader.GetString(2),
                CurrentPrice: reader.IsDBNull(3) ? null : reader.GetDecimal(3),
                MarketCapRaw: reader.IsDBNull(4) ? null : reader.GetDecimal(4),
                Change24h: reader.IsDBNull(5) ? null : reader.GetDecimal(5),
                Rank: ParseRank(reader.GetValue(6)),
                Category: reader.IsDBNull(7) ? string.Empty : reader.GetString(7),
                LastUpdated: reader.IsDBNull(8) ? null : reader.GetDateTime(8)));
        }

        return rows;
    }

    private static TopMoversDto CreateFallbackTopMoversFromCatalog()
    {
        var coins = CoinCatalog.GetAll()
            .ToList();

        return new TopMoversDto
        {
            Gainers = coins
                .Where(coin => coin.Change24h > 0)
                .OrderByDescending(coin => coin.Change24h)
                .Take(10)
                .Select((coin, index) => CreateTopMoverDto(coin, index + 1))
                .ToList(),
            Losers = coins
                .Where(coin => coin.Change24h < 0)
                .OrderBy(coin => coin.Change24h)
                .Take(10)
                .Select((coin, index) => CreateTopMoverDto(coin, index + 1))
                .ToList(),
        };
    }

    private static TopMoverDto MapTopMover(TopMoverRow row) =>
        new()
        {
            Id = row.CoinId,
            Symbol = row.Symbol,
            Name = row.Name,
            Price = row.CurrentPrice ?? 0m,
            MarketCapRaw = row.MarketCapRaw ?? 0m,
            MarketCap = SqlCoinService.FormatCurrencyCompact(row.MarketCapRaw ?? 0m),
            Change24h = row.Change24h ?? 0m,
            Rank = row.Rank,
        };

    private static TopMoverDto CreateTopMoverDto(CoinDto coin, int rank) =>
        new()
        {
            Id = coin.Id,
            Symbol = coin.Symbol,
            Name = coin.Name,
            Price = coin.Price,
            MarketCap = coin.MarketCap,
            MarketCapRaw = coin.MarketCapRaw,
            Change24h = coin.Change24h,
            Rank = rank,
        };

    private static MarketStatsDto CreateFallbackDtoFromCatalog()
    {
        var coins = CoinCatalog.GetAll();
        if (coins.Count == 0)
        {
            return CreateDto(0m, 0m, 0m, 0m, null, 0, 0);
        }

        var totalMarketCap = coins.Sum(c => c.MarketCapRaw);
        var volume24h = coins.Sum(c => c.VolumeRaw);
        var marketCapChangePct = coins.Average(c => c.Change24h);
        var bitcoinMarketCap = coins.FirstOrDefault(c => c.Id == "bitcoin")?.MarketCapRaw ?? 0m;
        var btcDominancePct = totalMarketCap > 0m
            ? bitcoinMarketCap * 100m / totalMarketCap
            : 0m;
        var gainersCount = coins.Count(c => c.Change24h > 0);
        var totalTracked = coins.Count;

        return CreateDto(totalMarketCap, volume24h, marketCapChangePct, btcDominancePct, null, gainersCount, totalTracked);
    }

    private static MarketStatsDto CreateDto(
        decimal totalMarketCap,
        decimal volume24h,
        decimal marketCapChangePct,
        decimal btcDominancePct,
        string? dataAsOf,
        int gainersCount,
        int totalTracked)
    {
        var isUp = marketCapChangePct >= 0;

        var changeFormatted = $"{(isUp ? "↑" : "↓")} {Math.Abs(marketCapChangePct).ToString("0.#", CultureInfo.InvariantCulture)}%";

        return new MarketStatsDto
        {
            TotalMarketCap = FormatCurrencyCompact(totalMarketCap),
            MarketCapChange = changeFormatted,
            MarketCapChangeDir = isUp ? "up" : "down",
            Volume24h = FormatCurrencyCompact(volume24h),
            BtcDominance = $"{btcDominancePct.ToString("0.#", CultureInfo.InvariantCulture)}%",
            AvgChange24h = changeFormatted,
            AvgChange24hDir = isUp ? "up" : "down",
            GainersCount = gainersCount,
            TotalTracked = totalTracked,
            DataAsOf = dataAsOf,
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

    private static int ParseRank(object? value)
    {
        if (value is null or DBNull)
        {
            return 0;
        }

        return value switch
        {
            int rank => rank,
            long rank => checked((int)rank),
            short rank => rank,
            byte rank => rank,
            decimal rank => decimal.ToInt32(rank),
            _ => Convert.ToInt32(value, CultureInfo.InvariantCulture),
        };
    }

    private const string TopByVolumeSql = """
        WITH ranked AS (
            SELECT
                coin_id,
                symbol,
                name,
                current_price,
                total_volume,
                price_change_percentage_24h,
                last_updated,
                ROW_NUMBER() OVER (ORDER BY total_volume DESC) AS rank
            FROM gold.coin_prices
            WHERE total_volume IS NOT NULL
        )
        SELECT TOP (@Limit)
            coin_id,
            symbol,
            name,
            current_price,
            total_volume,
            price_change_percentage_24h,
            last_updated,
            rank
        FROM ranked
        ORDER BY rank
        """;

    public async Task<TopByVolumeDto> GetTopByVolumeAsync(int limit)
    {
        IReadOnlyList<TopVolumeRow> rows;

        try
        {
            rows = await _loadTopByVolumeAsync(limit, CancellationToken.None);
        }
        catch (SqlException)
        {
            return CreateFallbackTopByVolumeFromCatalog(limit);
        }
        catch (InvalidOperationException)
        {
            return CreateFallbackTopByVolumeFromCatalog(limit);
        }

        if (rows.Count == 0)
        {
            return CreateFallbackTopByVolumeFromCatalog(limit);
        }

        var latestTimestamp = rows
            .Where(r => r.LastUpdated.HasValue)
            .Select(r => r.LastUpdated!.Value)
            .DefaultIfEmpty()
            .Max();

        var dataAsOf = latestTimestamp == default
            ? null
            : latestTimestamp.ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ");

        return new TopByVolumeDto
        {
            Items = rows
                .OrderBy(r => r.Rank)
                .Select(MapTopVolumeItem)
                .ToList(),
            DataAsOf = dataAsOf,
        };
    }

    private async Task<IReadOnlyList<TopVolumeRow>> LoadTopByVolumeFromSqlAsync(int limit, CancellationToken cancellationToken)
    {
        await using var conn = new SqlConnection(_connectionString);
        await conn.OpenAsync(cancellationToken);

        await using var cmd = new SqlCommand(TopByVolumeSql, conn);
        cmd.Parameters.AddWithValue("@Limit", limit);
        await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);

        var rows = new List<TopVolumeRow>();

        while (await reader.ReadAsync(cancellationToken))
        {
            rows.Add(new TopVolumeRow(
                CoinId: reader.IsDBNull(0) ? string.Empty : reader.GetString(0),
                Symbol: reader.IsDBNull(1) ? string.Empty : reader.GetString(1),
                Name: reader.IsDBNull(2) ? string.Empty : reader.GetString(2),
                CurrentPrice: reader.IsDBNull(3) ? null : reader.GetDecimal(3),
                VolumeRaw: reader.IsDBNull(4) ? null : reader.GetDecimal(4),
                Change24h: reader.IsDBNull(5) ? null : reader.GetDecimal(5),
                LastUpdated: reader.IsDBNull(6) ? null : reader.GetDateTime(6),
                Rank: ParseRank(reader.GetValue(7))));
        }

        return rows;
    }

    public async Task<TopMoversDto> GetTopMovers7dAsync()
    {
        IReadOnlyList<TopMoverRow7d> rows;

        try
        {
            rows = await _loadTopMovers7dAsync(CancellationToken.None);
        }
        catch (SqlException)
        {
            return CreateFallbackTopMovers7dFromCatalog();
        }
        catch (InvalidOperationException)
        {
            return CreateFallbackTopMovers7dFromCatalog();
        }

        if (rows.Count == 0)
        {
            return CreateFallbackTopMovers7dFromCatalog();
        }

        var latestTimestamp = rows
            .Where(r => r.LastUpdated.HasValue)
            .Select(r => r.LastUpdated!.Value)
            .DefaultIfEmpty()
            .Max();

        var dataAsOf = latestTimestamp == default
            ? null
            : latestTimestamp.ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ");

        return new TopMoversDto
        {
            Gainers = rows
                .Where(row => string.Equals(row.Category, "gainer", StringComparison.OrdinalIgnoreCase))
                .OrderBy(row => row.Rank)
                .Take(10)
                .Select(MapTopMover7d)
                .ToList(),
            Losers = rows
                .Where(row => string.Equals(row.Category, "loser", StringComparison.OrdinalIgnoreCase))
                .OrderBy(row => row.Rank)
                .Take(10)
                .Select(MapTopMover7d)
                .ToList(),
            DataAsOf = dataAsOf,
        };
    }

    private async Task<IReadOnlyList<TopMoverRow7d>> LoadTopMovers7dFromSqlAsync(CancellationToken cancellationToken)
    {
        await using var conn = new SqlConnection(_connectionString);
        await conn.OpenAsync(cancellationToken);

        await using var cmd = new SqlCommand(TopMovers7dSql, conn);
        await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);

        var rows = new List<TopMoverRow7d>();

        while (await reader.ReadAsync(cancellationToken))
        {
            rows.Add(new TopMoverRow7d(
                CoinId: reader.IsDBNull(0) ? string.Empty : reader.GetString(0),
                Symbol: reader.IsDBNull(1) ? string.Empty : reader.GetString(1),
                Name: reader.IsDBNull(2) ? string.Empty : reader.GetString(2),
                CurrentPrice: reader.IsDBNull(3) ? null : reader.GetDecimal(3),
                MarketCapRaw: reader.IsDBNull(4) ? null : reader.GetDecimal(4),
                Change24h: reader.IsDBNull(5) ? null : reader.GetDecimal(5),
                Change7d: reader.IsDBNull(6) ? null : reader.GetDecimal(6),
                Rank: ParseRank(reader.GetValue(7)),
                Category: reader.IsDBNull(8) ? string.Empty : reader.GetString(8),
                LastUpdated: reader.IsDBNull(9) ? null : reader.GetDateTime(9)));
        }

        return rows;
    }

    private static TopMoversDto CreateFallbackTopMovers7dFromCatalog()
    {
        var coins = CoinCatalog.GetAll()
            .ToList();

        return new TopMoversDto
        {
            Gainers = coins
                .Where(coin => coin.Change7d > 0)
                .OrderByDescending(coin => coin.Change7d)
                .Take(10)
                .Select((coin, index) => CreateTopMover7dDto(coin, index + 1))
                .ToList(),
            Losers = coins
                .Where(coin => coin.Change7d < 0)
                .OrderBy(coin => coin.Change7d)
                .Take(10)
                .Select((coin, index) => CreateTopMover7dDto(coin, index + 1))
                .ToList(),
        };
    }

    private static TopMoverDto MapTopMover7d(TopMoverRow7d row) =>
        new()
        {
            Id = row.CoinId,
            Symbol = row.Symbol,
            Name = row.Name,
            Price = row.CurrentPrice ?? 0m,
            MarketCapRaw = row.MarketCapRaw ?? 0m,
            MarketCap = SqlCoinService.FormatCurrencyCompact(row.MarketCapRaw ?? 0m),
            Change24h = row.Change24h ?? 0m,
            Change7d = row.Change7d ?? 0m,
            Rank = row.Rank,
        };

    private static TopMoverDto CreateTopMover7dDto(CoinDto coin, int rank) =>
        new()
        {
            Id = coin.Id,
            Symbol = coin.Symbol,
            Name = coin.Name,
            Price = coin.Price,
            MarketCap = coin.MarketCap,
            MarketCapRaw = coin.MarketCapRaw,
            Change24h = coin.Change24h,
            Change7d = coin.Change7d,
            Rank = rank,
        };

    private static TopByVolumeDto CreateFallbackTopByVolumeFromCatalog(int limit)
    {
        var items = CoinCatalog.GetAll()
            .Where(coin => coin.VolumeRaw > 0)
            .OrderByDescending(coin => coin.VolumeRaw)
            .Take(limit)
            .Select((coin, index) => new TopVolumeItemDto
            {
                Id = coin.Id,
                Symbol = coin.Symbol,
                Name = coin.Name,
                Price = coin.Price,
                Volume = coin.Volume,
                VolumeRaw = coin.VolumeRaw,
                Change24h = coin.Change24h,
                Rank = index + 1,
            })
            .ToList();

        return new TopByVolumeDto { Items = items };
    }

    private static TopVolumeItemDto MapTopVolumeItem(TopVolumeRow row) =>
        new()
        {
            Id = row.CoinId,
            Symbol = row.Symbol,
            Name = row.Name,
            Price = row.CurrentPrice ?? 0m,
            Volume = SqlCoinService.FormatCurrencyCompact(row.VolumeRaw ?? 0m),
            VolumeRaw = row.VolumeRaw ?? 0m,
            Change24h = row.Change24h ?? 0m,
            Rank = row.Rank,
        };

    public sealed record TopVolumeRow(
        string CoinId,
        string Symbol,
        string Name,
        decimal? CurrentPrice,
        decimal? VolumeRaw,
        decimal? Change24h,
        DateTime? LastUpdated,
        int Rank);

    public sealed record TopMoverRow(
        string CoinId,
        string Symbol,
        string Name,
        decimal? CurrentPrice,
        decimal? MarketCapRaw,
        decimal? Change24h,
        int Rank,
        string Category,
        DateTime? LastUpdated);

    public sealed record TopMoverRow7d(
        string CoinId,
        string Symbol,
        string Name,
        decimal? CurrentPrice,
        decimal? MarketCapRaw,
        decimal? Change24h,
        decimal? Change7d,
        int Rank,
        string Category,
        DateTime? LastUpdated);
}
