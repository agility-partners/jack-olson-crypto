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
}
