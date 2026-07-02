using FluentAssertions;
using CryptoApi.Services;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace CryptoApi.Tests;

public class SqlCoinServiceTests
{
    private static IConfiguration CreateServiceConfiguration() =>
        new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:CryptoDb"] = "Server=localhost;Database=crypto_data;User Id=sa;******;"
            })
            .Build();

    private static SqlCoinService CreateService() =>
        new(
            CreateServiceConfiguration(),
            _ => Task.FromResult<IReadOnlyDictionary<string, SqlCoinService.CoinMarketSnapshot>>(
                new Dictionary<string, SqlCoinService.CoinMarketSnapshot>()));

    [Fact]
    public async Task GetAllCoinsAsync_ReturnsFullCatalog()
    {
        var service = CreateService();

        var coins = (await service.GetAllCoinsAsync()).ToList();

        coins.Should().HaveCount(100);
        coins.Should().Contain(c => c.Id == "arbitrum");
        coins.Should().Contain(c => c.Id == "injective");
        coins.Should().Contain(c => c.Id == "aptos");
        coins.Should().Contain(c => c.Id == "tether");
        coins.Should().Contain(c => c.Id == "toncoin");
        coins.Should().Contain(c => c.Id == "ethena");
        coins.Should().Contain(c => c.Id == "quant-network");
    }

    [Fact]
    public async Task GetCoinByIdAsync_ReturnsCatalogCoinWithoutDatabasePresence()
    {
        var service = CreateService();

        var coin = await service.GetCoinByIdAsync("optimism");

        coin.Should().NotBeNull();
        coin!.Symbol.Should().Be("OP");
        coin.IconClass.Should().Be("op");
    }

    [Fact]
    public async Task GetAllCoinsAsync_MergesDatabaseSnapshotWhilePreservingCatalog()
    {
        var service = new SqlCoinService(
            CreateServiceConfiguration(),
            _ => Task.FromResult<IReadOnlyDictionary<string, SqlCoinService.CoinMarketSnapshot>>(
                new Dictionary<string, SqlCoinService.CoinMarketSnapshot>
                {
                    ["bitcoin"] = new("bitcoin", 7, 70000.12m, 1_500_000_000_000m, 31_250_000_000m, 8.75m, 5.12m, 8.45m, 142.30m, 69045.00m, 65.51m, 19_742_212m, 21_000_000m, 21_000_000m, null)
                }));

        var coin = (await service.GetAllCoinsAsync()).Single(c => c.Id == "bitcoin");

        coin.Name.Should().Be("Bitcoin");
        coin.IconClass.Should().Be("btc");
        coin.Rank.Should().Be(7);
        coin.Price.Should().Be(70000.12m);
        coin.Change24h.Should().Be(8.75m);
        coin.Change7d.Should().Be(5.12m);
        coin.Change30d.Should().Be(8.45m);
        coin.Change1y.Should().Be(142.30m);
        coin.MarketCapRaw.Should().Be(1_500_000_000_000m);
        coin.MarketCap.Should().Be("$1.5T");
        coin.VolumeRaw.Should().Be(31_250_000_000m);
        coin.Volume.Should().Be("$31.25B");
        coin.Ath.Should().Be(69045.00m);
        coin.Atl.Should().Be(65.51m);
        coin.CirculatingSupplyRaw.Should().Be(19_742_212m);
        coin.TotalSupplyRaw.Should().Be(21_000_000m);
        coin.MaxSupplyRaw.Should().Be(21_000_000m);
    }

    [Fact]
    public async Task GetAllCoinsAsync_MergesSparkline_WhenSnapshotIncludesIt()
    {
        var service = new SqlCoinService(
            CreateServiceConfiguration(),
            _ => Task.FromResult<IReadOnlyDictionary<string, SqlCoinService.CoinMarketSnapshot>>(
                new Dictionary<string, SqlCoinService.CoinMarketSnapshot>
                {
                    ["bitcoin"] = new("bitcoin", 7, 70000.12m, 1_500_000_000_000m, 31_250_000_000m, 8.75m, null, null, null, null, null, null, null, null, [70000.12m, 70010m, 69995m])
                }));

        var coin = (await service.GetAllCoinsAsync()).Single(c => c.Id == "bitcoin");

        coin.Sparkline.Should().Equal([70000.12m, 70010m, 69995m]);
    }

    [Fact]
    public async Task GetCoinByIdAsync_FallsBackToCatalog_WhenSnapshotMissing()
    {
        var service = new SqlCoinService(
            CreateServiceConfiguration(),
            _ => Task.FromResult<IReadOnlyDictionary<string, SqlCoinService.CoinMarketSnapshot>>(
                new Dictionary<string, SqlCoinService.CoinMarketSnapshot>()));

        var coin = await service.GetCoinByIdAsync("ripple");

        coin.Should().NotBeNull();
        coin!.Price.Should().Be(0.578m);
        coin.MarketCap.Should().Be("$31.2B");
        coin.Volume.Should().Be("$1.1B");
    }
}
