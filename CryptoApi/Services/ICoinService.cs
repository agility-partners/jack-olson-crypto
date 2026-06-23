using CryptoApi.DTOs;

namespace CryptoApi.Services;

public interface ICoinService
{
    Task<IEnumerable<CoinDto>> GetAllCoinsAsync();
    Task<CoinDto?> GetCoinByIdAsync(string id);
}