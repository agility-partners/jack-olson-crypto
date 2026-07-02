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
}
