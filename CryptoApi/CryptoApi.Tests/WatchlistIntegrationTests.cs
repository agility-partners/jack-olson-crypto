using System.Net;
using System.Net.Http.Json;
using CryptoApi.DTOs;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace CryptoApi.Tests;

public class WatchlistIntegrationTests : IAsyncLifetime
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
    public async Task GetWatchlist_ReturnsEmptyList_WhenNoCoinsAdded()
    {
        await ResetWatchlistAsync();

        var response = await _client.GetAsync("/api/watchlist");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var watchlist = await response.Content.ReadFromJsonAsync<List<CoinDto>>();
        watchlist.Should().NotBeNull();
        watchlist.Should().BeEmpty();
    }

    [Fact]
    public async Task AddCoin_ReturnsCreated_AndCoinAppearsInWatchlist()
    {
        await ResetWatchlistAsync();

        var addResponse = await _client.PostAsJsonAsync("/api/watchlist", new { CoinId = "bitcoin" });
        addResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        var watchlistResponse = await _client.GetAsync("/api/watchlist");
        var watchlist = await watchlistResponse.Content.ReadFromJsonAsync<List<CoinDto>>();

        watchlist.Should().NotBeNull();
        watchlist.Should().ContainSingle(c => c.Id == "bitcoin");
    }

    [Fact]
    public async Task AddCoin_ReturnsConflict_WhenCoinAlreadyInWatchlist()
    {
        await ResetWatchlistAsync();
        await _client.PostAsJsonAsync("/api/watchlist", new { CoinId = "ethereum" });

        var duplicateResponse = await _client.PostAsJsonAsync("/api/watchlist", new { CoinId = "ethereum" });

        duplicateResponse.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task AddCoin_ReturnsBadRequest_WhenCoinIdIsWhitespace()
    {
        await ResetWatchlistAsync();

        var response = await _client.PostAsJsonAsync("/api/watchlist", new { CoinId = "   " });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task AddCoin_ReturnsNotFound_WhenCoinDoesNotExist()
    {
        await ResetWatchlistAsync();

        var response = await _client.PostAsJsonAsync("/api/watchlist", new { CoinId = "ghost-coin" });

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task RemoveCoin_ReturnsNoContent_AndRemovesCoinFromWatchlist()
    {
        await ResetWatchlistAsync();
        await _client.PostAsJsonAsync("/api/watchlist", new { CoinId = "cardano" });

        var removeResponse = await _client.DeleteAsync("/api/watchlist/cardano");
        removeResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var watchlistResponse = await _client.GetAsync("/api/watchlist");
        var watchlist = await watchlistResponse.Content.ReadFromJsonAsync<List<CoinDto>>();
        watchlist.Should().NotBeNull();
        watchlist.Should().NotContain(c => c.Id == "cardano");
    }

    private async Task ResetWatchlistAsync()
    {
        var response = await _client.GetAsync("/api/watchlist");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var watchlist = await response.Content.ReadFromJsonAsync<List<CoinDto>>() ?? [];
        foreach (var coin in watchlist)
        {
            await _client.DeleteAsync($"/api/watchlist/{coin.Id}");
        }
    }
}
