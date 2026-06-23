using CryptoApi.DTOs;
using CryptoApi.Models;

namespace CryptoApi.Services;

public class CoinService : ICoinService
{
    // Mock data from Week 1
    private static readonly List<Coin> MockCoins = new()
    {
        new Coin { Id = "bitcoin", Name = "Bitcoin", Symbol = "BTC", IconClass = "btc", Rank = 1, Price = 67842.50m, Change24h = 2.34m, MarketCap = "$1.34T", Volume = "$28.4B" },
        new Coin { Id = "ethereum", Name = "Ethereum", Symbol = "ETH", IconClass = "eth", Rank = 2, Price = 3521.80m, Change24h = -1.12m, MarketCap = "$423B", Volume = "$14.1B" },
        new Coin { Id = "bnb", Name = "BNB", Symbol = "BNB", IconClass = "bnb", Rank = 3, Price = 608.30m, Change24h = 0.97m, MarketCap = "$88.4B", Volume = "$1.9B" },
        new Coin { Id = "solana", Name = "Solana", Symbol = "SOL", IconClass = "sol", Rank = 5, Price = 182.40m, Change24h = 5.67m, MarketCap = "$85.2B", Volume = "$4.8B" },
        new Coin { Id = "ripple", Name = "XRP", Symbol = "XRP", IconClass = "xrp", Rank = 6, Price = 0.578m, Change24h = 1.42m, MarketCap = "$31.2B", Volume = "$1.1B" },
    };

    public async Task<IEnumerable<CoinDto>> GetAllCoinsAsync()
    {
        // Simulate async work (e.g., database query)
        await Task.Delay(0);

        return MockCoins.Select(coin => MapToDto(coin)).ToList();
    }

    public async Task<CoinDto?> GetCoinByIdAsync(string id)
    {
        // Simulate async work
        await Task.Delay(0);

        var coin = MockCoins.FirstOrDefault(c => c.Id == id);
        return coin == null ? null : MapToDto(coin);
    }

    private static CoinDto MapToDto(Coin coin)
    {
        return new CoinDto
        {
            Id = coin.Id,
            Symbol = coin.Symbol,
            Name = coin.Name,
            Price = coin.Price,
            Change24h = coin.Change24h,
            Rank = coin.Rank,
            MarketCap = coin.MarketCap,
            Volume = coin.Volume,
        };
    }
}