namespace CryptoApi.DTOs;

public class TopMoversDto
{
    public IReadOnlyList<TopMoverDto> Gainers { get; set; } = [];
    public IReadOnlyList<TopMoverDto> Losers { get; set; } = [];
}
