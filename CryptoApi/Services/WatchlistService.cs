using CryptoApi.DTOs;
using CryptoApi.Models;

namespace CryptoApi.Services;

public class WatchlistService : IWatchlistService
{
    // In-memory storage — will be replaced with database in Week 3
    private static readonly List<WatchlistItem> MockWatchlist = new();

    private readonly ICoinService _coinService;

    public WatchlistService(ICoinService coinService)
    {
        _coinService = coinService;
    }

    public async Task<IEnumerable<CoinDto>> GetWatchlistAsync()
    {
        var allCoins = await _coinService.GetAllCoinsAsync();
        var coinMap = allCoins.ToDictionary(c => c.Id);

        return MockWatchlist
            .Where(item => coinMap.ContainsKey(item.CoinId))
            .Select(item => coinMap[item.CoinId])
            .ToList();
    }

    public Task<WatchlistItemDto> AddCoinAsync(string coinId)
    {
        // Check if already in watchlist
        if (MockWatchlist.Any(item => item.CoinId == coinId))
        {
            throw new InvalidOperationException($"Coin {coinId} is already in watchlist");
        }

        var newItem = new WatchlistItem
        {
            Id = Guid.NewGuid().ToString(),
            CoinId = coinId,
            AddedAt = DateTime.UtcNow
        };

        MockWatchlist.Add(newItem);
        return Task.FromResult(MapToDto(newItem));
    }

    public Task<bool> RemoveCoinAsync(string coinId)
    {
        var item = MockWatchlist.FirstOrDefault(i => i.CoinId == coinId);

        if (item == null)
        {
            return Task.FromResult(false);
        }

        MockWatchlist.Remove(item);
        return Task.FromResult(true);
    }

    private static WatchlistItemDto MapToDto(WatchlistItem item)
    {
        return new WatchlistItemDto
        {
            Id = item.Id,
            CoinId = item.CoinId,
            AddedAt = item.AddedAt
        };
    }
}