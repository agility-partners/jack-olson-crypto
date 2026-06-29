using CryptoApi.DTOs;

namespace CryptoApi.Services;

public class TopMoversService : ITopMoversService
{
    // Mock top movers — will be replaced with live data from gold.top_movers
    private static readonly IReadOnlyList<TopMoverDto> MockTopMovers = new List<TopMoverDto>
    {
        new() { Id = "injective",  Symbol = "INJ",  Name = "Injective",      IconClass = "inj",  Price =   28.50m, Change24h =  7.34m, MarketCap = "$2.4B", MarketCapRaw = 2_400_000_000m, CategoryRank = 1, Category = "gainer" },
        new() { Id = "uniswap",    Symbol = "UNI",  Name = "Uniswap",        IconClass = "uni",  Price =   12.45m, Change24h =  6.78m, MarketCap = "$9.2B", MarketCapRaw = 9_200_000_000m, CategoryRank = 2, Category = "gainer" },
        new() { Id = "solana",     Symbol = "SOL",  Name = "Solana",         IconClass = "sol",  Price =  182.40m, Change24h =  5.67m, MarketCap = "$85.2B", MarketCapRaw = 85_200_000_000m, CategoryRank = 3, Category = "gainer" },
        new() { Id = "arbitrum",   Symbol = "ARB",  Name = "Arbitrum",       IconClass = "arb",  Price =    1.18m, Change24h =  4.56m, MarketCap = "$1.5B", MarketCapRaw = 1_500_000_000m, CategoryRank = 4, Category = "gainer" },
        new() { Id = "dogecoin",   Symbol = "DOGE", Name = "Dogecoin",       IconClass = "doge", Price =    0.38m, Change24h =  4.12m, MarketCap = "$56.2B", MarketCapRaw = 56_200_000_000m, CategoryRank = 5, Category = "gainer" },
        new() { Id = "aave",       Symbol = "AAVE", Name = "Aave",           IconClass = "aave", Price =  265.40m, Change24h = -5.12m, MarketCap = "$3.9B", MarketCapRaw = 3_900_000_000m, CategoryRank = 1, Category = "loser"  },
        new() { Id = "optimism",   Symbol = "OP",   Name = "Optimism",       IconClass = "op",   Price =    2.09m, Change24h = -4.23m, MarketCap = "$2.8B", MarketCapRaw = 2_800_000_000m, CategoryRank = 2, Category = "loser"  },
        new() { Id = "near",       Symbol = "NEAR", Name = "NEAR Protocol",  IconClass = "near", Price =    8.54m, Change24h = -3.45m, MarketCap = "$9.2B", MarketCapRaw = 9_200_000_000m, CategoryRank = 3, Category = "loser"  },
        new() { Id = "elrond",     Symbol = "EGLD", Name = "Elrond",         IconClass = "egld", Price =   43.70m, Change24h = -2.63m, MarketCap = "$1.2B", MarketCapRaw = 1_200_000_000m, CategoryRank = 4, Category = "loser"  },
        new() { Id = "avalanche",  Symbol = "AVAX", Name = "Avalanche",      IconClass = "avax", Price =   41.72m, Change24h = -2.54m, MarketCap = "$17.1B", MarketCapRaw = 17_100_000_000m, CategoryRank = 5, Category = "loser"  },
    };

    public Task<IEnumerable<TopMoverDto>> GetTopMoversAsync()
    {
        return Task.FromResult<IEnumerable<TopMoverDto>>(MockTopMovers);
    }
}
