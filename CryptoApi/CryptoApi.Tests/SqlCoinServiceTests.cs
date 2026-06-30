using CryptoApi.Services;
using FluentAssertions;
using Xunit;

namespace CryptoApi.Tests;

public class SqlCoinServiceTests
{
    [Theory]
    [InlineData("binancecoin", "bnb")]
    [InlineData("avalanche-2", "avalanche")]
    [InlineData("matic-network", "polygon")]
    [InlineData("theta-token", "theta")]
    [InlineData("hedera-hashgraph", "hedera")]
    [InlineData("multiversx", "elrond")]
    [InlineData("near-protocol", "near")]
    public void GetCanonicalCoinId_MapsKnownLiveAliases(string databaseId, string expectedCanonicalId)
    {
        SqlCoinService.GetCanonicalCoinId(databaseId).Should().Be(expectedCanonicalId);
    }

    [Fact]
    public void MergeCatalogWithLiveRows_PreservesFullCatalogAndMergesLiveMetrics()
    {
        var liveRows = new[]
        {
            new SqlCoinService.LiveCoinRow("binancecoin", 3, 701.23m, 4.56m, 102_000_000_000m, 2_500_000_000m),
            new SqlCoinService.LiveCoinRow("near-protocol", 17, 6.54m, -1.25m, 7_650_000_000m, 420_000_000m),
            new SqlCoinService.LiveCoinRow("tezos", 28, 0.91m, 0.42m, 990_000_000m, 45_000_000m),
        };

        var coins = SqlCoinService.MergeCatalogWithLiveRows(liveRows);

        coins.Should().HaveCount(32);
        coins.Should().Contain(c => c.Id == "polygon");

        var bnb = coins.Single(c => c.Id == "bnb");
        bnb.Name.Should().Be("BNB");
        bnb.Symbol.Should().Be("BNB");
        bnb.Price.Should().Be(701.23m);
        bnb.Change24h.Should().Be(4.56m);
        bnb.MarketCap.Should().Be("$102B");
        bnb.Volume.Should().Be("$2.5B");

        var near = coins.Single(c => c.Id == "near");
        near.Price.Should().Be(6.54m);
        near.Change24h.Should().Be(-1.25m);
        near.MarketCapRaw.Should().Be(7_650_000_000m);
    }
}
