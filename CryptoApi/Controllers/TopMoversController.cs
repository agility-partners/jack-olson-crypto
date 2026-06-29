using CryptoApi.DTOs;
using CryptoApi.Services;
using Microsoft.AspNetCore.Mvc;

namespace CryptoApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TopMoversController : ControllerBase
{
    private readonly ITopMoversService _topMoversService;

    public TopMoversController(ITopMoversService topMoversService)
    {
        _topMoversService = topMoversService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TopMoverDto>>> GetTopMovers()
    {
        var movers = await _topMoversService.GetTopMoversAsync();
        return Ok(movers);
    }
}
