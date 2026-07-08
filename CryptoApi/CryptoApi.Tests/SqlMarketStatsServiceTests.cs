using System.Reflection;
using CryptoApi.DTOs;
using CryptoApi.Services;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace CryptoApi.Tests;

public class SqlMarketStatsServiceTests
{
    private static IConfiguration CreateServiceConfiguration() =>
        new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:CryptoDb"] = "Server=localhost;Database=crypto_data;User Id=sa;******;"
            })
            .Build();

    [Fact]
    public void CreateFallbackDtoFromCatalog_ReturnsNonZeroMarketStats()
    {
        var method = typeof(SqlMarketStatsService).GetMethod(
            "CreateFallbackDtoFromCatalog",
            BindingFlags.NonPublic | BindingFlags.Static);

        method.Should().NotBeNull();

        var result = method!.Invoke(null, null);
        result.Should().BeOfType<MarketStatsDto>();

        var stats = (MarketStatsDto)result!;
        stats.TotalMarketCap.Should().NotBe("$0");
        stats.Volume24h.Should().NotBe("$0");
        stats.BtcDominance.Should().NotBe("0%");
        stats.BtcDominance.Should().EndWith("%");
        stats.AvgChange24h.Should().NotBeEmpty();
        stats.AvgChange24hDir.Should().BeOneOf("up", "down");
    }

    [Fact]
    public async Task GetTopMoversAsync_ReturnsCategorizedMoversFromSqlRows()
    {
        var service = new SqlMarketStatsService(
            CreateServiceConfiguration(),
            _ => Task.FromResult<IReadOnlyList<SqlMarketStatsService.TopMoverRow>>([
                new("pepe", "PEPE", "Pepe", 0.00001m, 4_500_000_000m, 15.5m, 1, "gainer", null),
                new("bitcoin", "BTC", "Bitcoin", 70000m, 1_500_000_000_000m, 5.25m, 2, "gainer", null),
                new("ethereum", "ETH", "Ethereum", 3500m, 420_000_000_000m, -4.75m, 1, "loser", null)
            ]));

        var movers = await service.GetTopMoversAsync();

        movers.Gainers.Should().HaveCount(2);
        movers.Gainers[0].Id.Should().Be("pepe");
        movers.Gainers[0].Rank.Should().Be(1);
        movers.Gainers[0].Change24h.Should().Be(15.5m);
        movers.Gainers[0].MarketCap.Should().Be("$4.5B");
        movers.Gainers[1].Id.Should().Be("bitcoin");
        movers.Losers.Should().ContainSingle();
        movers.Losers[0].Id.Should().Be("ethereum");
        movers.Losers[0].Change24h.Should().Be(-4.75m);
    }

    [Fact]
    public async Task GetTopMoversAsync_FallsBackToCatalog_WhenSqlRowsAreEmpty()
    {
        var service = new SqlMarketStatsService(
            CreateServiceConfiguration(),
            _ => Task.FromResult<IReadOnlyList<SqlMarketStatsService.TopMoverRow>>([]));

        var movers = await service.GetTopMoversAsync();

        movers.Gainers.Should().NotBeEmpty();
        movers.Gainers.Should().OnlyContain(coin => coin.Change24h > 0);
        movers.Gainers.Should().HaveCountLessThanOrEqualTo(10);
        movers.Losers.Should().NotBeEmpty();
        movers.Losers.Should().OnlyContain(coin => coin.Change24h < 0);
        movers.Losers.Should().HaveCountLessThanOrEqualTo(10);
    }

    [Fact]
    public void TopMoversSql_SelectsTopTenPerCategory_FromTop100Coins()
    {
        var field = typeof(SqlMarketStatsService).GetField(
            "TopMoversSql",
            BindingFlags.NonPublic | BindingFlags.Static);

        field.Should().NotBeNull();

        var sql = field!.GetRawConstantValue() as string;

        sql.Should().NotBeNullOrWhiteSpace();
        sql.Should().Contain("FROM gold.coin_prices");
        sql.Should().Contain("WHERE market_cap_rank <= 100");
        sql.Should().Contain("ROW_NUMBER() OVER (ORDER BY price_change_percentage_24h DESC) AS rank");
        sql.Should().Contain("ROW_NUMBER() OVER (ORDER BY price_change_percentage_24h ASC) AS rank");
        sql.Should().Contain("FROM gainers");
        sql.Should().Contain("FROM losers");
        sql.Should().Contain("WHERE rank <= 10");
        sql!.Split("WHERE rank <= 10").Should().HaveCount(3);
    }

    [Fact]
    public async Task GetTopMoversAsync_SetsDataAsOf_WhenRowsIncludeLastUpdated()
    {
        var lastUpdated = new DateTime(2024, 6, 1, 8, 0, 0, DateTimeKind.Utc);
        var service = new SqlMarketStatsService(
            CreateServiceConfiguration(),
            _ => Task.FromResult<IReadOnlyList<SqlMarketStatsService.TopMoverRow>>([
                new("bitcoin", "BTC", "Bitcoin", 70000m, 1_500_000_000_000m, 5.25m, 1, "gainer", lastUpdated),
                new("ethereum", "ETH", "Ethereum", 3500m, 420_000_000_000m, -4.75m, 1, "loser", lastUpdated)
            ]));

        var movers = await service.GetTopMoversAsync();

        movers.DataAsOf.Should().Be("2024-06-01T08:00:00Z");
    }

    [Fact]
    public async Task GetTopMoversAsync_LeavesDataAsOfNull_WhenFallback()
    {
        var service = new SqlMarketStatsService(
            CreateServiceConfiguration(),
            _ => Task.FromResult<IReadOnlyList<SqlMarketStatsService.TopMoverRow>>([]));

        var movers = await service.GetTopMoversAsync();

        movers.DataAsOf.Should().BeNull();
    }

    [Fact]
    public void CreateFallbackDtoFromCatalog_LeavesDataAsOfNull()
    {
        var method = typeof(SqlMarketStatsService).GetMethod(
            "CreateFallbackDtoFromCatalog",
            BindingFlags.NonPublic | BindingFlags.Static);

        method.Should().NotBeNull();
        var result = (MarketStatsDto)method!.Invoke(null, null)!;

        result.DataAsOf.Should().BeNull();
    }

    public static IEnumerable<object[]> ParseRankCases()
    {
        yield return [1, 1];
        yield return [1L, 1];
        yield return [(short)1, 1];
        yield return [(byte)1, 1];
        yield return [1.0m, 1];
    }

    [Theory]
    [MemberData(nameof(ParseRankCases))]
    public void ParseRank_ConvertsNumericTypesToInt(object value, int expected)
    {
        var method = typeof(SqlMarketStatsService).GetMethod(
            "ParseRank",
            BindingFlags.NonPublic | BindingFlags.Static);

        method.Should().NotBeNull();
        var result = method!.Invoke(null, [value]);

        result.Should().Be(expected);
    }
}
