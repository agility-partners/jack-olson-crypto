using System.Globalization;
using CryptoApi.DTOs;
using Microsoft.Data.SqlClient;

namespace CryptoApi.Services;

public class SqlMarketStatsService : IMarketStatsService
{
    private readonly string _connectionString;
    private readonly Func<CancellationToken, Task<IReadOnlyList<TopMoverRow>>> _loadTopMoversAsync;
    private const string TopMoversSql = """
        WITH filtered AS (
            SELECT
                coin_id,
                symbol,
                name,
                current_price,
                market_cap,
                price_change_percentage_24h
            FROM gold.coin_prices
            WHERE market_cap_rank <= 100
                AND price_change_percentage_24h IS NOT NULL
        ),
        gainers AS (
            SELECT
                coin_id,
                symbol,
                name,
                current_price,
                market_cap,
                price_change_percentage_24h,
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
            category
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
            category
        FROM losers
        WHERE rank <= 10
        ORDER BY category, rank
        """;

    public SqlMarketStatsService(IConfiguration configuration)
        : this(configuration, null)
    {
    }

    public SqlMarketStatsService(
        IConfiguration configuration,
        Func<CancellationToken, Task<IReadOnlyList<TopMoverRow>>>? loadTopMoversAsync)
    {
        _connectionString = configuration.GetConnectionString("CryptoDb")
            ?? throw new InvalidOperationException("CryptoDb connection string is not configured.");
        _loadTopMoversAsync = loadTopMoversAsync ?? LoadTopMoversFromSqlAsync;
    }

    public async Task<MarketStatsDto> GetMarketStatsAsync()
    {
        await using var conn = new SqlConnection(_connectionString);
        await conn.OpenAsync();

        const string sql = """
            SELECT
                CAST(COALESCE(SUM(market_cap), 0) AS DECIMAL(30, 2))                  AS total_market_cap,
                CAST(COALESCE(SUM(total_volume), 0) AS DECIMAL(30, 2))                AS total_24h_volume,
                CAST(COALESCE(AVG(price_change_percentage_24h), 0) AS DECIMAL(10, 4)) AS avg_24h_change_pct,
                CAST(
                    COALESCE(
                        MAX(CASE WHEN coin_id = 'bitcoin' THEN market_cap ELSE 0 END) * 100.0
                        / NULLIF(SUM(market_cap), 0),
                        0
                    )
                AS DECIMAL(10, 4)) AS btc_dominance_pct
            FROM gold.coin_prices
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

        if (totalMarketCap <= 0m && volume24h <= 0m)
        {
            return CreateFallbackDtoFromCatalog();
        }

        return CreateDto(totalMarketCap, volume24h, marketCapChangePct, btcDominancePct);
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
                Category: reader.IsDBNull(7) ? string.Empty : reader.GetString(7)));
        }

        return rows;
    }

    private static TopMoversDto CreateFallbackTopMoversFromCatalog()
    {
        var coins = CoinCatalog.GetAll()
            .Where(coin => coin.Rank <= 100)
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
            return CreateDto(0m, 0m, 0m, 0m);
        }

        var totalMarketCap = coins.Sum(c => c.MarketCapRaw);
        var volume24h = coins.Sum(c => c.VolumeRaw);
        var marketCapChangePct = coins.Average(c => c.Change24h);
        var bitcoinMarketCap = coins.FirstOrDefault(c => c.Id == "bitcoin")?.MarketCapRaw ?? 0m;
        var btcDominancePct = totalMarketCap > 0m
            ? bitcoinMarketCap * 100m / totalMarketCap
            : 0m;

        return CreateDto(totalMarketCap, volume24h, marketCapChangePct, btcDominancePct);
    }

    private static MarketStatsDto CreateDto(
        decimal totalMarketCap,
        decimal volume24h,
        decimal marketCapChangePct,
        decimal btcDominancePct)
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

    public sealed record TopMoverRow(
        string CoinId,
        string Symbol,
        string Name,
        decimal? CurrentPrice,
        decimal? MarketCapRaw,
        decimal? Change24h,
        int Rank,
        string Category);
}
