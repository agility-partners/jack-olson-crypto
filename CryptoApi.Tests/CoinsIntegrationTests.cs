using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using CryptoApi.DTOs;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace CryptoApi.Tests;

/// <summary>
/// Integration tests that verify the frontend can communicate with the backend API.
/// These tests start the full API server and make real HTTP requests.
/// </summary>
public class CoinsIntegrationTests : IAsyncLifetime
{
    private WebApplicationFactory<Program> _factory = null!;
    private HttpClient _client = null!;

    public async Task InitializeAsync()
    {
        _factory = new WebApplicationFactory<Program>();
        _client = _factory.CreateClient();
        await Task.CompletedTask;
    }

    public async Task DisposeAsync()
    {
        _client.Dispose();
        await _factory.DisposeAsync();
    }

    [Fact]
    public async Task GetAllCoins_ReturnsSuccessAndCoins()
    {
        // Arrange & Act
        var response = await _client.GetAsync("/api/coins");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/json");

        var coins = await response.Content.ReadAsAsync<IEnumerable<CoinDto>>();
        coins.Should().NotBeNull();
        coins.Should().NotBeEmpty();
        coins.Should().Contain(c => c.Id == "bitcoin" && c.Symbol == "BTC");
    }

    [Fact]
    public async Task GetCoinById_ReturnsCoin_WhenCoinExists()
    {
        // Arrange & Act
        var response = await _client.GetAsync("/api/coins/ethereum");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var coin = await response.Content.ReadAsAsync<CoinDto>();
        coin.Should().NotBeNull();
        coin!.Id.Should().Be("ethereum");
        coin.Symbol.Should().Be("ETH");
        coin.Name.Should().Be("Ethereum");
    }

    [Fact]
    public async Task GetCoinById_ReturnsNotFound_WhenCoinDoesNotExist()
    {
        // Arrange & Act
        var response = await _client.GetAsync("/api/coins/nonexistent-coin");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Frontend_CanFetchAllCoinsAndDisplayData()
    {
        // This test simulates what the frontend does: fetch all coins and verify the data structure
        // Arrange & Act
        var response = await _client.GetAsync("/api/coins");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var coins = await response.Content.ReadAsAsync<List<CoinDto>>();
        coins.Should().NotBeNull();
        coins.Should().HaveCountGreaterThan(0);

        // Verify each coin has the expected properties for frontend display
        var coin = coins.First();
        coin.Id.Should().NotBeNullOrEmpty();
        coin.Symbol.Should().NotBeNullOrEmpty();
        coin.Name.Should().NotBeNullOrEmpty();
        coin.IconClass.Should().NotBeNullOrEmpty();
        coin.Price.Should().BeGreaterThan(0);
        coin.Rank.Should().BeGreaterThan(0);
    }
}
