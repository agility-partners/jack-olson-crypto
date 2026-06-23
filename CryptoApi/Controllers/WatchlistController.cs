using CryptoApi.DTOs;
using CryptoApi.Services;
using Microsoft.AspNetCore.Mvc;

namespace CryptoApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WatchlistController : ControllerBase
{
    private readonly IWatchlistService _watchlistService;
    private readonly ICoinService _coinService;

    public WatchlistController(IWatchlistService watchlistService, ICoinService coinService)
    {
        _watchlistService = watchlistService;
        _coinService = coinService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<WatchlistItemDto>>> GetWatchlist()
    {
        var watchlist = await _watchlistService.GetWatchlistAsync();
        return Ok(watchlist);
    }

    [HttpPost]
    public async Task<ActionResult<WatchlistItemDto>> AddCoin([FromBody] AddCoinRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.CoinId))
        {
            return BadRequest("CoinId is required");
        }

        // Verify coin exists
        var coin = await _coinService.GetCoinByIdAsync(request.CoinId);
        if (coin == null)
        {
            return NotFound($"Coin {request.CoinId} not found");
        }

        try
        {
            var item = await _watchlistService.AddCoinAsync(request.CoinId);
            return CreatedAtAction(nameof(GetWatchlist), item);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ex.Message);
        }
    }

    [HttpDelete("{coinId}")]
    public async Task<ActionResult> RemoveCoin(string coinId)
    {
        var removed = await _watchlistService.RemoveCoinAsync(coinId);
        
        if (!removed)
        {
            return NotFound($"Coin {coinId} not in watchlist");
        }

        return NoContent();
    }
}

public class AddCoinRequest
{
    public string CoinId { get; set; } = string.Empty;
}