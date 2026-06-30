using FluentAssertions;
using CryptoApi.Services;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace CryptoApi.Tests;

public class SqlCoinServiceTests
{
    private static SqlCoinService CreateService()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:CryptoDb"] = "Server=localhost;Database=crypto_data;User Id=sa;******;"
            })
            .Build();

        return new SqlCoinService(config);
    }

    [Fact]
    public void Constructor_ThrowsWhenConnectionStringMissing()
    {
        var config = new ConfigurationBuilder().Build();

        var act = () => new SqlCoinService(config);

        act.Should().Throw<InvalidOperationException>();
    }

    [Fact]
    public void ResolveIconClass_UsesCatalogIconForKnownAlias()
    {
        var iconClass = SqlCoinService.ResolveIconClass("ripple", "XRP");

        iconClass.Should().Be("xrp");
    }

    [Fact]
    public void ResolveIconClass_FallsBackToLowercaseSymbol()
    {
        var iconClass = SqlCoinService.ResolveIconClass("brand-new-coin", "NEW");

        iconClass.Should().Be("new");
    }

    [Theory]
    [InlineData(1_340_000_000_000d, "$1.34T")]
    [InlineData(28_400_000_000d, "$28.4B")]
    [InlineData(680_000_000d, "$680M")]
    [InlineData(95_000d, "$95K")]
    [InlineData(0d, "$0")]
    public void FormatCurrencyCompact_FormatsExpectedBuckets(double rawValue, string expected)
    {
        var formatted = SqlCoinService.FormatCurrencyCompact((decimal)rawValue);

        formatted.Should().Be(expected);
    }

    [Fact]
    public void Constructor_AcceptsConfiguredConnectionString()
    {
        var service = CreateService();

        service.Should().NotBeNull();
    }
}
