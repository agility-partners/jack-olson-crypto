namespace CryptoApi.DTOs;

public class MarketStatsDto
{
    public string TotalMarketCap { get; set; } = string.Empty;
    public string MarketCapChange { get; set; } = string.Empty;
    public string MarketCapChangeDir { get; set; } = string.Empty;
    public string Volume24h { get; set; } = string.Empty;
    public string BtcDominance { get; set; } = string.Empty;
}
