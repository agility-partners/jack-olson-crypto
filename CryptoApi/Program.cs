using CryptoApi.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddControllers();
var cryptoDbConnectionString = builder.Configuration.GetConnectionString("CryptoDb");
if (!string.IsNullOrWhiteSpace(cryptoDbConnectionString))
{
    builder.Services.AddScoped<ICoinService, SqlCoinService>();
    builder.Services.AddScoped<IMarketStatsService, SqlMarketStatsService>();
}
else
{
    builder.Services.AddScoped<ICoinService, CoinService>();
    builder.Services.AddScoped<IMarketStatsService, MarketStatsService>();
}
builder.Services.AddScoped<IWatchlistService, WatchlistService>();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

if (app.Environment.IsProduction())
{
    app.UseHttpsRedirection();
}

app.UseCors("AllowFrontend");

app.UseAuthorization();

app.MapControllers();

app.Run();

// Make Program accessible for integration tests
public partial class Program { }
