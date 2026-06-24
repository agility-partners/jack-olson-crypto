using CryptoApi.DTOs;

namespace CryptoApi.Services;

public class MarketStatsService : IMarketStatsService
{
    // Mock global market data — will be replaced with a live data source
    public Task<MarketStatsDto> GetMarketStatsAsync()
    {
        var stats = new MarketStatsDto
        {
            TotalMarketCap = "$2.41T",
            MarketCapChange = "↑ 1.4%",
            MarketCapChangeDir = "up",
            Volume24h = "$94.2B",
            BtcDominance = "52.3%",
        };

        return Task.FromResult(stats);
    }
}
