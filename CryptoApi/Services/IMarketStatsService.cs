using CryptoApi.DTOs;

namespace CryptoApi.Services;

public interface IMarketStatsService
{
    Task<MarketStatsDto> GetMarketStatsAsync();
    Task<TopMoversDto> GetTopMoversAsync();
}
