using System.Net;
using System.Net.Http.Json;
using CryptoApi.DTOs;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace CryptoApi.Tests;

public class TopMoversIntegrationTests : IAsyncLifetime
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
    public async Task GetTopMovers_ReturnsSuccessAndResults()
    {
        var response = await _client.GetAsync("/api/topmovers");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/json");

        var movers = await response.Content.ReadFromJsonAsync<IEnumerable<TopMoverDto>>();
        movers.Should().NotBeNull();
        movers.Should().NotBeEmpty();
    }

    [Fact]
    public async Task GetTopMovers_ContainsBothGainersAndLosers()
    {
        var response = await _client.GetAsync("/api/topmovers");

        var movers = (await response.Content.ReadFromJsonAsync<List<TopMoverDto>>())!;
        movers.Should().Contain(m => m.Category == "gainer");
        movers.Should().Contain(m => m.Category == "loser");
    }

    [Fact]
    public async Task GetTopMovers_GainersHavePositiveChange()
    {
        var response = await _client.GetAsync("/api/topmovers");

        var movers = (await response.Content.ReadFromJsonAsync<List<TopMoverDto>>())!;
        movers.Where(m => m.Category == "gainer").Should().OnlyContain(m => m.Change24h > 0);
    }

    [Fact]
    public async Task GetTopMovers_LosersHaveNegativeChange()
    {
        var response = await _client.GetAsync("/api/topmovers");

        var movers = (await response.Content.ReadFromJsonAsync<List<TopMoverDto>>())!;
        movers.Where(m => m.Category == "loser").Should().OnlyContain(m => m.Change24h < 0);
    }

    [Fact]
    public async Task GetTopMovers_EachMoverHasRequiredFields()
    {
        var response = await _client.GetAsync("/api/topmovers");

        var movers = (await response.Content.ReadFromJsonAsync<List<TopMoverDto>>())!;
        foreach (var mover in movers)
        {
            mover.Id.Should().NotBeNullOrEmpty();
            mover.Symbol.Should().NotBeNullOrEmpty();
            mover.Name.Should().NotBeNullOrEmpty();
            mover.Price.Should().BeGreaterThan(0);
            mover.Category.Should().BeOneOf("gainer", "loser");
            mover.CategoryRank.Should().BeGreaterThan(0);
        }
    }
}
