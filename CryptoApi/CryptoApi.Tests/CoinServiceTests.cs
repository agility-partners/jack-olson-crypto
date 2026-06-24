using Xunit;
using Moq;
using FluentAssertions;

namespace CryptoApi.Tests;

/// <summary>
/// Example test class demonstrating the structure for unit testing services.
/// Replace this with actual service tests as you build out your API.
/// </summary>
public class CoinServiceTests
{
    private readonly Mock<ICoinRepository> _mockCoinRepository;
    private readonly CoinService _coinService;

    public CoinServiceTests()
    {
        // Arrange: Set up mocks
        _mockCoinRepository = new Mock<ICoinRepository>();
        _coinService = new CoinService(_mockCoinRepository.Object);
    }

    [Fact]
    public async Task GetAllCoins_ReturnsListOfCoins_WhenRepositoryHasData()
    {
        // Arrange
        var mockCoins = new List<Coin>
        {
            new Coin { Id = "1", Symbol = "BTC", Name = "Bitcoin", CurrentPrice = 50000 },
            new Coin { Id = "2", Symbol = "ETH", Name = "Ethereum", CurrentPrice = 3000 }
        };

        _mockCoinRepository
            .Setup(repo => repo.GetAllCoinsAsync())
            .ReturnsAsync(mockCoins);

        // Act
        var result = await _coinService.GetAllCoinsAsync();

        // Assert
        result.Should().HaveCount(2);
        result.Should().Contain(c => c.Symbol == "BTC");
        result.Should().Contain(c => c.Symbol == "ETH");
    }

    [Fact]
    public async Task GetCoinById_ReturnsCoin_WhenCoinExists()
    {
        // Arrange
        var coinId = "1";
        var expectedCoin = new Coin 
        { 
            Id = coinId, 
            Symbol = "BTC", 
            Name = "Bitcoin", 
            CurrentPrice = 50000 
        };

        _mockCoinRepository
            .Setup(repo => repo.GetCoinByIdAsync(coinId))
            .ReturnsAsync(expectedCoin);

        // Act
        var result = await _coinService.GetCoinByIdAsync(coinId);

        // Assert
        result.Should().NotBeNull();
        result!.Symbol.Should().Be("BTC");
    }

    [Fact]
    public async Task GetCoinById_ReturnsNull_WhenCoinDoesNotExist()
    {
        // Arrange
        var coinId = "nonexistent";
        _mockCoinRepository
            .Setup(repo => repo.GetCoinByIdAsync(coinId))
            .ReturnsAsync((Coin?)null);

        // Act
        var result = await _coinService.GetCoinByIdAsync(coinId);

        // Assert
        result.Should().BeNull();
    }
}
