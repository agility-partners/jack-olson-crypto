using CryptoApi.DTOs;

namespace CryptoApi.Services;

public class SqlCoinService : ICoinService
{
    public SqlCoinService(IConfiguration configuration) =>
        _ = configuration.GetConnectionString("CryptoDb")
            ?? throw new InvalidOperationException("CryptoDb connection string is not configured.");

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
