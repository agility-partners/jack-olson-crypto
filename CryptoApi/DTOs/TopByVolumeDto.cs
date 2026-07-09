namespace CryptoApi.DTOs;

public class TopByVolumeDto
{
    public IReadOnlyList<TopVolumeItemDto> Items { get; set; } = [];
    /// <summary>ISO-8601 UTC timestamp of the most recent warehouse data row, or null when serving catalog fallback.</summary>
    public string? DataAsOf { get; set; }
}
