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
            AvgChange24h = "↑ 1.4%",
            AvgChange24hDir = "up",
        };

        return Task.FromResult(stats);
    }

    public Task<TopMoversDto> GetTopMoversAsync()
    {
        var coins = CoinCatalog.GetAll()
            .Where(coin => coin.Rank <= 100)
            .ToList();

        var gainers = coins
            .Where(coin => coin.Change24h > 0)
            .OrderByDescending(coin => coin.Change24h)
            .Take(10)
            .Select((coin, index) => CreateTopMoverDto(coin, index + 1))
            .ToList();

        var losers = coins
            .Where(coin => coin.Change24h < 0)
            .OrderBy(coin => coin.Change24h)
            .Take(10)
            .Select((coin, index) => CreateTopMoverDto(coin, index + 1))
            .ToList();

        return Task.FromResult(new TopMoversDto
        {
            Gainers = gainers,
            Losers = losers,
        });
    }

    private static TopMoverDto CreateTopMoverDto(CoinDto coin, int rank) =>
        new()
        {
            Id = coin.Id,
            Symbol = coin.Symbol,
            Name = coin.Name,
            Price = coin.Price,
            MarketCap = coin.MarketCap,
            MarketCapRaw = coin.MarketCapRaw,
            Change24h = coin.Change24h,
            Rank = rank,
        };
}
