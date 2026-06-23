using CryptoApi.DTOs;
using CryptoApi.Services;
using Microsoft.AspNetCore.Mvc;

namespace CryptoApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CoinsController : ControllerBase
{
    private readonly ICoinService _coinService;

    public CoinsController(ICoinService coinService)
    {
        _coinService = coinService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<CoinDto>>> GetAllCoins()
    {
        var coins = await _coinService.GetAllCoinsAsync();
        return Ok(coins);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<CoinDto>> GetCoinById(string id)
    {
        var coin = await _coinService.GetCoinByIdAsync(id);
        
        if (coin == null)
        {
            return NotFound();
        }

        return Ok(coin);
    }
}