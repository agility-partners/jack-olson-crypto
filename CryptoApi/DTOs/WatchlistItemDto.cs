namespace CryptoApi.DTOs;

public class WatchlistItemDto
{
    public string Id { get; set; } = string.Empty;
    public string CoinId { get; set; } = string.Empty;
    public DateTime AddedAt { get; set; }
}