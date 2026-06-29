using CryptoApi.DTOs;

namespace CryptoApi.Services;

public interface ITopMoversService
{
    Task<IEnumerable<TopMoverDto>> GetTopMoversAsync();
}
