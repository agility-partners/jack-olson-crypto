using System.Net;
using System.Net.Http.Json;
using CryptoApi.DTOs;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace CryptoApi.Tests;

public class MarketStatsIntegrationTests : IAsyncLifetime
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
    public async Task GetTopMovers_ReturnsSuccessAndCategorizedLists()
    {
        var response = await _client.GetAsync("/api/marketstats/top-movers");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/json");

        var movers = await response.Content.ReadFromJsonAsync<TopMoversDto>();
        movers.Should().NotBeNull();
        movers!.Gainers.Should().NotBeEmpty();
        movers.Gainers.Should().HaveCountLessThanOrEqualTo(10);
        movers.Gainers.Should().BeInDescendingOrder(coin => coin.Change24h);
        movers.Gainers.Should().OnlyContain(coin => coin.Change24h > 0);
        movers.Losers.Should().NotBeEmpty();
        movers.Losers.Should().HaveCountLessThanOrEqualTo(10);
        movers.Losers.Should().BeInAscendingOrder(coin => coin.Change24h);
        movers.Losers.Should().OnlyContain(coin => coin.Change24h < 0);
    }

    [Fact]
    public async Task GetTopByVolume_ReturnsSuccessAndVolumeOrderedList()
    {
        var response = await _client.GetAsync("/api/marketstats/top-by-volume?limit=5");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/json");

        var result = await response.Content.ReadFromJsonAsync<TopByVolumeDto>();
        result.Should().NotBeNull();
        result!.Items.Should().NotBeEmpty();
        result.Items.Should().HaveCountLessThanOrEqualTo(5);
        result.Items.Should().BeInDescendingOrder(item => item.VolumeRaw);
        result.Items.Should().OnlyContain(item => item.VolumeRaw > 0);
    }

    [Fact]
    public async Task GetTopByVolume_DefaultsToTenItems_WhenLimitOmitted()
    {
        var response = await _client.GetAsync("/api/marketstats/top-by-volume");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<TopByVolumeDto>();
        result.Should().NotBeNull();
        result!.Items.Should().HaveCountLessThanOrEqualTo(10);
    }
}
