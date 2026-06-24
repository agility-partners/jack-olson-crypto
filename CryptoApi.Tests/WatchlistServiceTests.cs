using Moq;
using Xunit;
using CryptoApi.DTOs;
using CryptoApi.Models;
using CryptoApi.Services;
using System.Reflection;

namespace CryptoApi.Tests;

public class WatchlistServiceTests
{
    private readonly Mock<ICoinService> _mockCoinService;
    private readonly WatchlistService _watchlistService;

    public WatchlistServiceTests()
    {
        _mockCoinService = new Mock<ICoinService>();
        _watchlistService = new WatchlistService(_mockCoinService.Object);
        ClearMockWatchlist();
    }

    private static void ClearMockWatchlist()
    {
        // Clear the static MockWatchlist before each test
        var mockWatchlistField = typeof(WatchlistService)
            .GetField("MockWatchlist", BindingFlags.NonPublic | BindingFlags.Static);
        if (mockWatchlistField?.GetValue(null) is System.Collections.IList mockWatchlist)
        {
            mockWatchlist.Clear();
        }
    }

    [Fact]
    public async Task GetWatchlistAsync_ReturnsEmptyList_WhenNoCoinsAdded()
    {
        // Arrange
        _mockCoinService.Setup(cs => cs.GetAllCoinsAsync())
            .ReturnsAsync(new List<CoinDto>());

        // Act
        var result = await _watchlistService.GetWatchlistAsync();

        // Assert
        Assert.Empty(result);
    }

    [Fact]
    public async Task AddCoinAsync_AddsCoinToWatchlist_Successfully()
    {
        // Arrange
        var coinId = "bitcoin";

        // Act
        var result = await _watchlistService.AddCoinAsync(coinId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(coinId, result.CoinId);
        Assert.NotEqual(default, result.Id);
        Assert.NotEqual(default(DateTime), result.AddedAt);
    }

    [Fact]
    public async Task AddCoinAsync_ThrowsException_WhenCoinAlreadyInWatchlist()
    {
        // Arrange
        var coinId = "ethereum";
        await _watchlistService.AddCoinAsync(coinId);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _watchlistService.AddCoinAsync(coinId)
        );
        Assert.Contains("already in watchlist", exception.Message);
    }

    [Fact]
    public async Task RemoveCoinAsync_RemovesCoin_Successfully()
    {
        // Arrange
        var coinId = "cardano";
        await _watchlistService.AddCoinAsync(coinId);

        // Act
        var result = await _watchlistService.RemoveCoinAsync(coinId);

        // Assert
        Assert.True(result);
    }

    [Fact]
    public async Task RemoveCoinAsync_ReturnsFalse_WhenCoinNotInWatchlist()
    {
        // Arrange
        var coinId = "dogecoin";

        // Act
        var result = await _watchlistService.RemoveCoinAsync(coinId);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public async Task GetWatchlistAsync_ReturnsAddedCoins_WhenCoinsExist()
    {
        // Arrange
        var coins = new List<CoinDto>
        {
            new() { Id = "bitcoin", Name = "Bitcoin", Symbol = "BTC" },
            new() { Id = "ethereum", Name = "Ethereum", Symbol = "ETH" }
        };
        _mockCoinService.Setup(cs => cs.GetAllCoinsAsync())
            .ReturnsAsync(coins);

        await _watchlistService.AddCoinAsync("bitcoin");
        await _watchlistService.AddCoinAsync("ethereum");

        // Act
        var result = await _watchlistService.GetWatchlistAsync();

        // Assert
        Assert.Equal(2, result.Count());
        Assert.Contains(result, c => c.Id == "bitcoin");
        Assert.Contains(result, c => c.Id == "ethereum");
    }
}
