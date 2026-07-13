using CryptoApi.DTOs;

namespace CryptoApi.Services;

public interface IMarketStatsService
{
    Task<MarketStatsDto> GetMarketStatsAsync();
    Task<TopMoversDto> GetTopMoversAsync();
    Task<TopMoversDto> GetTopMovers7dAsync();
    Task<TopByVolumeDto> GetTopByVolumeAsync(int limit);
}
