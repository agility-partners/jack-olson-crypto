using System.Net;
using System.Net.Http.Json;
using CryptoApi.DTOs;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace CryptoApi.Tests;

public class CoinsIntegrationTests : IAsyncLifetime
{
    private WebApplicationFactory<Program> _factory = null!;
    private HttpClient _client = null!;

    public Task InitializeAsync()
    {
        _factory = new WebApplicationFactory<Program>();
        _client = _factory.CreateClient();
        return Task.CompletedTask;
    }

    public async Task DisposeAsync()
    {
        _client.Dispose();
        await _factory.DisposeAsync();
    }

    [Fact]
    public async Task GetAllCoins_ReturnsSuccessAndCoins()
    {
        var response = await _client.GetAsync("/api/coins");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/json");

        var coins = await response.Content.ReadFromJsonAsync<IEnumerable<CoinDto>>();
        coins.Should().NotBeNull();
        coins.Should().NotBeEmpty();
        coins!.Should().Contain(c => c.Id == "bitcoin" && c.Symbol == "BTC");
    }

    [Fact]
    public async Task GetCoinById_ReturnsCoin_WhenCoinExists()
    {
        var response = await _client.GetAsync("/api/coins/ethereum");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var coin = await response.Content.ReadFromJsonAsync<CoinDto>();
        coin.Should().NotBeNull();
        coin!.Id.Should().Be("ethereum");
        coin.Symbol.Should().Be("ETH");
        coin.Name.Should().Be("Ethereum");
    }

    [Fact]
    public async Task GetCoinById_ReturnsNotFound_WhenCoinDoesNotExist()
    {
        var response = await _client.GetAsync("/api/coins/nonexistent-coin");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Frontend_CanFetchAllCoinsAndDisplayData()
    {
        var response = await _client.GetAsync("/api/coins");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var coins = await response.Content.ReadFromJsonAsync<List<CoinDto>>();
        coins.Should().NotBeNull();
        coins.Should().HaveCountGreaterThan(0);

        var coin = coins!.First();
        coin.Id.Should().NotBeNullOrEmpty();
        coin.Symbol.Should().NotBeNullOrEmpty();
        coin.Name.Should().NotBeNullOrEmpty();
        coin.IconClass.Should().NotBeNullOrEmpty();
        coin.Price.Should().BeGreaterThan(0);
        coin.Rank.Should().BeGreaterThan(0);
    }
}
