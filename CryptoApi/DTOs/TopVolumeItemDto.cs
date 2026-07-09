namespace CryptoApi.DTOs;

public class TopVolumeItemDto
{
    public string Id { get; set; } = string.Empty;
    public string Symbol { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string Volume { get; set; } = string.Empty;
    public decimal VolumeRaw { get; set; }
    public decimal Change24h { get; set; }
    public int Rank { get; set; }
}
