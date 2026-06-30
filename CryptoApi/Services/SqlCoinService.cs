using CryptoApi.DTOs;
using Microsoft.Data.SqlClient;

namespace CryptoApi.Services;

public class SqlCoinService : ICoinService
{
    private readonly string _connectionString;

    public SqlCoinService(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("CryptoDb")
            ?? throw new InvalidOperationException("CryptoDb connection string is not configured.");
    }

    public async Task<IEnumerable<CoinDto>> GetAllCoinsAsync()
    {
        var availableCoinIds = new HashSet<string>();

        await using var conn = new SqlConnection(_connectionString);
        await conn.OpenAsync();

        const string sql = """
            SELECT coin_id
            FROM gold.coin_prices
            """;

        await using var cmd = new SqlCommand(sql, conn);
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            availableCoinIds.Add(reader.GetString(0));
        }

        return CoinCatalog.GetAll()
            .Where(coin => availableCoinIds.Contains(coin.Id))
            .OrderBy(coin => coin.Rank)
            .ToList();
    }

    public async Task<CoinDto?> GetCoinByIdAsync(string id)
    {
        var coin = CoinCatalog.GetById(id);
        if (coin == null)
        {
            return null;
        }

        await using var conn = new SqlConnection(_connectionString);
        await conn.OpenAsync();

        const string sql = """
            SELECT 1
            FROM gold.coin_prices
            WHERE coin_id = @id
            """;

        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@id", id);
        await using var reader = await cmd.ExecuteReaderAsync();

        return await reader.ReadAsync() ? coin : null;
    }
}
