using FluentAssertions;
using CryptoApi.Services;
using Xunit;

namespace CryptoApi.Tests;

/// <summary>
/// Example test class demonstrating the structure for unit testing services.
/// Replace this with actual service tests as you build out your API.
/// </summary>
public class CoinServiceTests
{
    private readonly CoinService _coinService;

    public CoinServiceTests()
    {
        _coinService = new CoinService();
    }

    [Fact]
    public async Task GetAllCoins_ReturnsPopulatedCoinList()
    {
        var result = await _coinService.GetAllCoinsAsync();

        result.Should().NotBeEmpty();
        result.Should().Contain(c => c.Id == "bitcoin" && c.Symbol == "BTC");
    }

    [Fact]
    public async Task GetCoinById_ReturnsCoin_WhenCoinExists()
    {
        var result = await _coinService.GetCoinByIdAsync("bitcoin");

        result.Should().NotBeNull();
        result!.Symbol.Should().Be("BTC");
        result.Id.Should().Be("bitcoin");
    }

    [Fact]
    public async Task GetCoinById_ReturnsNull_WhenCoinDoesNotExist()
    {
        var result = await _coinService.GetCoinByIdAsync("nonexistent");

        result.Should().BeNull();
    }

    [Fact]
    public async Task GetCoinById_ProvidesCoinRank_WhenCoinExists()
    {
        var result = await _coinService.GetCoinByIdAsync("tezos");

        result.Should().NotBeNull();
        result!.Symbol.Should().Be("XTZ");
        result.Rank.Should().Be(28);
    }
}
