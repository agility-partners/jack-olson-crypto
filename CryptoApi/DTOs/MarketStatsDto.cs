namespace CryptoApi.DTOs;

public class MarketStatsDto
{
    public string TotalMarketCap { get; set; } = string.Empty;
    public string MarketCapChange { get; set; } = string.Empty;
    public string MarketCapChangeDir { get; set; } = string.Empty;
    public string Volume24h { get; set; } = string.Empty;
    public string BtcDominance { get; set; } = string.Empty;
    public string AvgChange24h { get; set; } = string.Empty;
    public string AvgChange24hDir { get; set; } = string.Empty;
    /// <summary>ISO-8601 UTC timestamp of the most recent warehouse data row, or null when serving catalog fallback.</summary>
    public string? DataAsOf { get; set; }
}
