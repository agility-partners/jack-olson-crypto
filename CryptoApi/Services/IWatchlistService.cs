using CryptoApi.DTOs;

namespace CryptoApi.Services;

public interface IWatchlistService
{
    Task<IEnumerable<CoinDto>> GetWatchlistAsync();
    Task<WatchlistItemDto> AddCoinAsync(string coinId);
    Task<bool> RemoveCoinAsync(string coinId);
}