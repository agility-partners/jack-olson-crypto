using CryptoApi.DTOs;
using CryptoApi.Services;
using Microsoft.AspNetCore.Mvc;

namespace CryptoApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MarketStatsController : ControllerBase
{
    private readonly IMarketStatsService _marketStatsService;

    public MarketStatsController(IMarketStatsService marketStatsService)
    {
        _marketStatsService = marketStatsService;
    }

    [HttpGet]
    public async Task<ActionResult<MarketStatsDto>> GetMarketStats()
    {
        var stats = await _marketStatsService.GetMarketStatsAsync();
        return Ok(stats);
    }

    [HttpGet("top-movers")]
    public async Task<ActionResult<TopMoversDto>> GetTopMovers()
    {
        var movers = await _marketStatsService.GetTopMoversAsync();
        return Ok(movers);
    }

    [HttpGet("top-movers-7d")]
    public async Task<ActionResult<TopMoversDto>> GetTopMovers7d()
    {
        var movers = await _marketStatsService.GetTopMovers7dAsync();
        return Ok(movers);
    }

    [HttpGet("top-by-volume")]
    public async Task<ActionResult<TopByVolumeDto>> GetTopByVolume([FromQuery] int limit = 10)
    {
        if (limit < 1) limit = 1;
        if (limit > 100) limit = 100;
        var result = await _marketStatsService.GetTopByVolumeAsync(limit);
        return Ok(result);
    }
}
