namespace CryptoApi.DTOs;

public class TopMoversDto
{
    public IReadOnlyList<TopMoverDto> Gainers { get; set; } = [];
    public IReadOnlyList<TopMoverDto> Losers { get; set; } = [];
    /// <summary>ISO-8601 UTC timestamp of the most recent warehouse data row, or null when serving catalog fallback.</summary>
    public string? DataAsOf { get; set; }
}
