namespace CryptoApi.Models;

public class WatchlistItem
{
    public string Id { get; set; } = string.Empty;
    public string CoinId { get; set; } = string.Empty;
    public DateTime AddedAt { get; set; }
}