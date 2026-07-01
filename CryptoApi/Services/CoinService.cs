using CryptoApi.DTOs;

namespace CryptoApi.Services;

public class CoinService : ICoinService
{
    public Task<IEnumerable<CoinDto>> GetAllCoinsAsync()
    {
        return Task.FromResult<IEnumerable<CoinDto>>(CoinCatalog.GetAll());
    }

    public Task<CoinDto?> GetCoinByIdAsync(string id)
    {
        return Task.FromResult(CoinCatalog.GetById(id));
    }
}
