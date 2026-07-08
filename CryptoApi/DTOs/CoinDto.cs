namespace CryptoApi.DTOs;

public class CoinDto
{
    public string Id { get; set; } = string.Empty;
    public string Symbol { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string IconClass { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public decimal Change24h { get; set; }
    public decimal Change7d { get; set; }
    public decimal Change30d { get; set; }
    public decimal Change1y { get; set; }
    public int Rank { get; set; }
    public string MarketCap { get; set; } = string.Empty;
    public decimal MarketCapRaw { get; set; }
    public string Volume { get; set; } = string.Empty;
    public decimal VolumeRaw { get; set; }
    public decimal Ath { get; set; }
    public decimal Atl { get; set; }
    public decimal CirculatingSupplyRaw { get; set; }
    public decimal TotalSupplyRaw { get; set; }
    public decimal? MaxSupplyRaw { get; set; }
    public decimal[]? Sparkline { get; set; }
    /// <summary>ISO-8601 UTC timestamp of the warehouse row for this coin, or null when serving catalog fallback.</summary>
    public string? DataAsOf { get; set; }
}