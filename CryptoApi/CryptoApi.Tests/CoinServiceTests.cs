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
    public async Task GetAllCoins_ContainsEthereumWithCorrectSymbol()
    {
        var result = await _coinService.GetAllCoinsAsync();

        result.Should().Contain(c => c.Id == "ethereum" && c.Symbol == "ETH");
    }

    [Fact]
    public async Task GetCoinById_ReturnsEthereum_WhenIdIsEthereum()
    {
        var result = await _coinService.GetCoinByIdAsync("ethereum");

        result.Should().NotBeNull();
        result!.Name.Should().Be("Ethereum");
        result.Symbol.Should().Be("ETH");
        result.Rank.Should().Be(2);
    }

    [Fact]
    public async Task GetAllCoins_ReturnsMultipleCoinsWithExpectedCount()
    {
        var result = await _coinService.GetAllCoinsAsync();

        result.Should().HaveCount(72);
        result.Should().Contain(c => c.Symbol == "BTC");
        result.Should().Contain(c => c.Symbol == "SOL");
        result.Should().Contain(c => c.Symbol == "DOGE");
        result.Should().Contain(c => c.Symbol == "USDT");
        result.Should().Contain(c => c.Symbol == "TON");
    }

    [Fact]
    public async Task GetAllCoins_ReplacesDogwifhatWithPepe()
    {
        var result = await _coinService.GetAllCoinsAsync();

        result.Should().Contain(c => c.Id == "pepe" && c.Symbol == "PEPE" && c.IconClass == "pepe");
        result.Should().NotContain(c => c.Id == "dogwifhat");
    }

    [Fact]
    public async Task GetCoinById_ReturnsNull_WhenIdCaseDoesNotMatch()
    {
        var result = await _coinService.GetCoinByIdAsync("Bitcoin");

        result.Should().BeNull();
    }

    [Fact]
    public async Task GetAllCoins_ReturnsCoinsWithUniqueIds()
    {
        var result = (await _coinService.GetAllCoinsAsync()).ToList();

        result.Should().OnlyHaveUniqueItems(c => c.Id);
    }

    [Fact]
    public async Task GetCoinById_ReturnsOriginalMockValues_ForRipple()
    {
        var result = await _coinService.GetCoinByIdAsync("ripple");

        result.Should().NotBeNull();
        result!.Name.Should().Be("XRP");
        result.Symbol.Should().Be("XRP");
        result.IconClass.Should().Be("xrp");
        result.Price.Should().Be(0.578m);
        result.MarketCap.Should().Be("$31.2B");
        result.Volume.Should().Be("$1.1B");
    }
}
