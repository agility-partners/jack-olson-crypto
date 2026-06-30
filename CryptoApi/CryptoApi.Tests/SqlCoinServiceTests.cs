using FluentAssertions;
using CryptoApi.Services;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace CryptoApi.Tests;

public class SqlCoinServiceTests
{
    private static SqlCoinService CreateService()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:CryptoDb"] = "Server=localhost;Database=crypto_data;User Id=sa;******;"
            })
            .Build();

        return new SqlCoinService(config);
    }

    [Fact]
    public async Task GetAllCoinsAsync_ReturnsFullCatalog()
    {
        var service = CreateService();

        var coins = (await service.GetAllCoinsAsync()).ToList();

        coins.Should().HaveCount(32);
        coins.Should().Contain(c => c.Id == "arbitrum");
        coins.Should().Contain(c => c.Id == "injective");
        coins.Should().Contain(c => c.Id == "aptos");
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
}
