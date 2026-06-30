using CryptoApi.DTOs;

namespace CryptoApi.Services;

public class CoinService : ICoinService
{
    public async Task<IEnumerable<CoinDto>> GetAllCoinsAsync()
    {
        await Task.Delay(0);
        return CoinCatalog.GetAll();
    }

    public async Task<CoinDto?> GetCoinByIdAsync(string id)
    {
        await Task.Delay(0);
        return CoinCatalog.GetById(id);
    }
}
