using CryptoApi.DTOs;
using CryptoApi.Models;

namespace CryptoApi.Services;

public class WatchlistService : IWatchlistService
{
    // In-memory storage — will be replaced with database in Week 3
    private static readonly List<WatchlistItem> MockWatchlist = new();

    public async Task<IEnumerable<WatchlistItemDto>> GetWatchlistAsync()
    {
        await Task.Delay(0);
        return MockWatchlist.Select(item => MapToDto(item)).ToList();
    }

    public async Task<WatchlistItemDto> AddCoinAsync(string coinId)
    {
        await Task.Delay(0);

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
        return MapToDto(newItem);
    }

    public async Task<bool> RemoveCoinAsync(string coinId)
    {
        await Task.Delay(0);

        var item = MockWatchlist.FirstOrDefault(i => i.CoinId == coinId);
        
        if (item == null)
        {
            return false;
        }

        MockWatchlist.Remove(item);
        return true;
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