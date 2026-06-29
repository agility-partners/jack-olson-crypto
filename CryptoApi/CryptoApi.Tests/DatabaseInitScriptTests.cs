using FluentAssertions;
using Xunit;

namespace CryptoApi.Tests;

public class DatabaseInitScriptTests
{
    [Fact]
    public void InitDbScript_ProvisionGoldObjectsRequiredByApi()
    {
        var scriptPath = Path.GetFullPath(Path.Combine(
            AppContext.BaseDirectory,
            "..",
            "..",
            "..",
            "..",
            "..",
            "scripts",
            "init-db.sql"));

        var script = File.ReadAllText(scriptPath);

        script.Should().Contain("CREATE TABLE gold.coin_prices");
        script.Should().Contain("coin_id");
        script.Should().Contain("current_price");
        script.Should().Contain("price_change_percentage_24h");
        script.Should().Contain("CREATE VIEW gold.market_summary");
        script.Should().Contain("CREATE VIEW gold.top_movers");
    }
}
