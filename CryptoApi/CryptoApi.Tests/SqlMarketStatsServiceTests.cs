using System.Reflection;
using CryptoApi.DTOs;
using CryptoApi.Services;
using FluentAssertions;
using Xunit;

namespace CryptoApi.Tests;

public class SqlMarketStatsServiceTests
{
    [Fact]
    public void CreateFallbackDtoFromCatalog_ReturnsNonZeroMarketStats()
    {
        var method = typeof(SqlMarketStatsService).GetMethod(
            "CreateFallbackDtoFromCatalog",
            BindingFlags.NonPublic | BindingFlags.Static);

        method.Should().NotBeNull();

        var result = method!.Invoke(null, null);
        result.Should().BeOfType<MarketStatsDto>();

        var stats = (MarketStatsDto)result!;
        stats.TotalMarketCap.Should().NotBe("$0");
        stats.Volume24h.Should().NotBe("$0");
        stats.BtcDominance.Should().NotBe("0%");
        stats.BtcDominance.Should().EndWith("%");
    }
}
