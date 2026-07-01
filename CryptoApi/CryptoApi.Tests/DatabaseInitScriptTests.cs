using FluentAssertions;
using Xunit;

namespace CryptoApi.Tests;

public class DatabaseInitScriptTests
{
    private static string GetRepoFile(string relativePath) =>
        Path.GetFullPath(Path.Combine(
            AppContext.BaseDirectory,
            "..",
            "..",
            "..",
            "..",
            "..",
            relativePath));

    [Fact]
    public void InitDbScript_ProvisionGoldObjectsRequiredByApi()
    {
        var scriptPath = GetRepoFile(Path.Combine("scripts", "init-db.sql"));

        var script = File.ReadAllText(scriptPath);

        script.Should().Contain("CREATE TABLE gold.coin_prices");
        script.Should().Contain("coin_id");
        script.Should().Contain("current_price");
        script.Should().Contain("price_change_percentage_24h");
        script.Should().Contain("CREATE OR ALTER VIEW gold.market_summary");
        script.Should().Contain("CREATE VIEW gold.top_movers");
    }

    [Fact]
    public void InitDbScript_MarketSummaryViewAggregatesCoinPrices()
    {
        var scriptPath = GetRepoFile(Path.Combine("scripts", "init-db.sql"));

        var script = File.ReadAllText(scriptPath);

        script.Should().Contain("CREATE OR ALTER VIEW gold.market_summary");
        script.Should().Contain("FROM gold.coin_prices");
        script.Should().NotContain("CAST(0 AS DECIMAL(30, 2))  AS total_market_cap");
    }

    [Fact]
    public void CoinPricesModel_BreaksTimestampTiesWithIngestedAt()
    {
        var modelPath = GetRepoFile(Path.Combine("transform", "models", "gold", "coin_prices.sql"));

        var model = File.ReadAllText(modelPath);

        model.Should().Contain("ORDER BY last_updated DESC, ingested_at DESC");
    }
}
