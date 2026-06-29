namespace CryptoApi.DTOs;

public class TopMoverDto
{
    public string Id { get; set; } = string.Empty;
    public string Symbol { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string IconClass { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public decimal Change24h { get; set; }
    public string MarketCap { get; set; } = string.Empty;
    public decimal MarketCapRaw { get; set; }
    public int CategoryRank { get; set; }
    public string Category { get; set; } = string.Empty;
}
