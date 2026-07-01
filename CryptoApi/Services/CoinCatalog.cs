using CryptoApi.DTOs;

namespace CryptoApi.Services;

internal static class CoinCatalog
{
    private static readonly IReadOnlyList<CoinDto> Coins =
    [
        new() { Id = "bitcoin",           Name = "Bitcoin",           Symbol = "BTC",   IconClass = "btc",   Rank = 1,  Price = 67842.50m, Change24h =  2.34m, MarketCap = "$1.34T", MarketCapRaw = 1_340_000_000_000m, Volume = "$28.4B", VolumeRaw =  28_400_000_000m },
        new() { Id = "ethereum",          Name = "Ethereum",          Symbol = "ETH",   IconClass = "eth",   Rank = 2,  Price =  3521.80m, Change24h = -1.12m, MarketCap = "$423B",  MarketCapRaw =   423_000_000_000m, Volume = "$14.1B", VolumeRaw =  14_100_000_000m },
        new() { Id = "bnb",               Name = "BNB",               Symbol = "BNB",   IconClass = "bnb",   Rank = 3,  Price =   608.30m, Change24h =  0.97m, MarketCap = "$88.4B", MarketCapRaw =    88_400_000_000m, Volume = "$1.9B",  VolumeRaw =   1_900_000_000m },
        new() { Id = "solana",            Name = "Solana",            Symbol = "SOL",   IconClass = "sol",   Rank = 5,  Price =   182.40m, Change24h =  5.67m, MarketCap = "$85.2B", MarketCapRaw =    85_200_000_000m, Volume = "$4.8B",  VolumeRaw =   4_800_000_000m },
        new() { Id = "ripple",            Name = "XRP",               Symbol = "XRP",   IconClass = "xrp",   Rank = 6,  Price =     0.578m, Change24h =  1.42m, MarketCap = "$31.2B", MarketCapRaw =    31_200_000_000m, Volume = "$1.1B",  VolumeRaw =   1_100_000_000m },
        new() { Id = "cardano",           Name = "Cardano",           Symbol = "ADA",   IconClass = "ada",   Rank = 8,  Price =     0.624m, Change24h = -0.88m, MarketCap = "$21.8B", MarketCapRaw =    21_800_000_000m, Volume = "$680M",  VolumeRaw =     680_000_000m },
        new() { Id = "avalanche",         Name = "Avalanche",         Symbol = "AVAX",  IconClass = "avax",  Rank = 11, Price =    41.72m, Change24h = -2.54m, MarketCap = "$17.1B", MarketCapRaw =    17_100_000_000m, Volume = "$820M",  VolumeRaw =     820_000_000m },
        new() { Id = "polkadot",          Name = "Polkadot",          Symbol = "DOT",   IconClass = "dot",   Rank = 13, Price =     9.14m, Change24h =  3.21m, MarketCap = "$12.4B", MarketCapRaw =    12_400_000_000m, Volume = "$412M",  VolumeRaw =     412_000_000m },
        new() { Id = "dogecoin",          Name = "Dogecoin",          Symbol = "DOGE",  IconClass = "doge",  Rank = 9,  Price =      0.38m, Change24h =  4.12m, MarketCap = "$56.2B", MarketCapRaw =    56_200_000_000m, Volume = "$2.1B",  VolumeRaw =   2_100_000_000m },
        new() { Id = "litecoin",          Name = "Litecoin",          Symbol = "LTC",   IconClass = "ltc",   Rank = 10, Price =    95.62m, Change24h = -0.45m, MarketCap = "$14.8B", MarketCapRaw =    14_800_000_000m, Volume = "$580M",  VolumeRaw =     580_000_000m },
        new() { Id = "uniswap",           Name = "Uniswap",           Symbol = "UNI",   IconClass = "uni",   Rank = 14, Price =    12.45m, Change24h =  6.78m, MarketCap = "$9.2B",  MarketCapRaw =     9_200_000_000m, Volume = "$285M",  VolumeRaw =     285_000_000m },
        new() { Id = "chainlink",         Name = "Chainlink",         Symbol = "LINK",  IconClass = "link",  Rank = 15, Price =    28.90m, Change24h =  2.15m, MarketCap = "$13.5B", MarketCapRaw =    13_500_000_000m, Volume = "$650M",  VolumeRaw =     650_000_000m },
        new() { Id = "sui",               Name = "Sui",               Symbol = "SUI",   IconClass = "sui",   Rank = 16, Price =     1.14m, Change24h = -0.94m, MarketCap = "$11.9B", MarketCapRaw =    11_900_000_000m, Volume = "$355M",  VolumeRaw =     355_000_000m },
        new() { Id = "monero",            Name = "Monero",            Symbol = "XMR",   IconClass = "xmr",   Rank = 19, Price =   195.34m, Change24h =  3.56m, MarketCap = "$3.5B",  MarketCapRaw =     3_500_000_000m, Volume = "$95M",   VolumeRaw =      95_000_000m },
        new() { Id = "cosmos",            Name = "Cosmos",            Symbol = "ATOM",  IconClass = "atom",  Rank = 20, Price =    11.78m, Change24h =  2.89m, MarketCap = "$4.1B",  MarketCapRaw =     4_100_000_000m, Volume = "$125M",  VolumeRaw =     125_000_000m },
        new() { Id = "vechain",           Name = "VeChain",           Symbol = "VET",   IconClass = "vet",   Rank = 22, Price =     0.048m, Change24h = -2.34m, MarketCap = "$3.2B",  MarketCapRaw =     3_200_000_000m, Volume = "$78M",   VolumeRaw =      78_000_000m },
        new() { Id = "theta",             Name = "Theta",             Symbol = "THETA", IconClass = "theta", Rank = 17, Price =     2.84m, Change24h =  1.87m, MarketCap = "$2.8B",  MarketCapRaw =     2_800_000_000m, Volume = "$132M",  VolumeRaw =     132_000_000m },
        new() { Id = "the-graph",         Name = "The Graph",         Symbol = "GRT",   IconClass = "grt",   Rank = 23, Price =     0.34m, Change24h = -1.76m, MarketCap = "$3.1B",  MarketCapRaw =     3_100_000_000m, Volume = "$118M",  VolumeRaw =     118_000_000m },
        new() { Id = "hedera",            Name = "Hedera",            Symbol = "HBAR",  IconClass = "hbar",  Rank = 24, Price =     0.11m, Change24h =  2.48m, MarketCap = "$3.9B",  MarketCapRaw =     3_900_000_000m, Volume = "$96M",   VolumeRaw =      96_000_000m },
        new() { Id = "algorand",          Name = "Algorand",          Symbol = "ALGO",  IconClass = "algo",  Rank = 25, Price =     0.19m, Change24h =  0.95m, MarketCap = "$1.7B",  MarketCapRaw =     1_700_000_000m, Volume = "$84M",   VolumeRaw =      84_000_000m },
        new() { Id = "elrond",            Name = "Elrond",            Symbol = "EGLD",  IconClass = "egld",  Rank = 26, Price =    43.70m, Change24h = -2.63m, MarketCap = "$1.2B",  MarketCapRaw =     1_200_000_000m, Volume = "$68M",   VolumeRaw =      68_000_000m },
        new() { Id = "filecoin",          Name = "Filecoin",          Symbol = "FIL",   IconClass = "fil",   Rank = 27, Price =     6.12m, Change24h =  3.41m, MarketCap = "$3.4B",  MarketCapRaw =     3_400_000_000m, Volume = "$210M",  VolumeRaw =     210_000_000m },
        new() { Id = "internet-computer", Name = "Internet Computer", Symbol = "ICP",   IconClass = "icp",   Rank = 18, Price =    11.28m, Change24h = -0.72m, MarketCap = "$5.2B",  MarketCapRaw =     5_200_000_000m, Volume = "$145M",  VolumeRaw =     145_000_000m },
        new() { Id = "tezos",             Name = "Tezos",             Symbol = "XTZ",   IconClass = "xtz",   Rank = 28, Price =     1.07m, Change24h =  1.32m, MarketCap = "$1.1B",  MarketCapRaw =     1_100_000_000m, Volume = "$52M",   VolumeRaw =      52_000_000m },
        new() { Id = "near",              Name = "NEAR Protocol",     Symbol = "NEAR",  IconClass = "near",  Rank = 29, Price =     8.54m, Change24h = -3.45m, MarketCap = "$9.2B",  MarketCapRaw =     9_200_000_000m, Volume = "$310M",  VolumeRaw =     310_000_000m },
        new() { Id = "aave",              Name = "Aave",              Symbol = "AAVE",  IconClass = "aave",  Rank = 30, Price =   265.40m, Change24h = -5.12m, MarketCap = "$3.9B",  MarketCapRaw =     3_900_000_000m, Volume = "$185M",  VolumeRaw =     185_000_000m },
        new() { Id = "stellar",           Name = "Stellar",           Symbol = "XLM",   IconClass = "xlm",   Rank = 31, Price =     0.13m, Change24h = -1.89m, MarketCap = "$3.7B",  MarketCapRaw =     3_700_000_000m, Volume = "$145M",  VolumeRaw =     145_000_000m },
        new() { Id = "optimism",          Name = "Optimism",          Symbol = "OP",    IconClass = "op",    Rank = 32, Price =     2.09m, Change24h = -4.23m, MarketCap = "$2.8B",  MarketCapRaw =     2_800_000_000m, Volume = "$220M",  VolumeRaw =     220_000_000m },
        new() { Id = "bitcoin-cash",      Name = "Bitcoin Cash",      Symbol = "BCH",   IconClass = "bch",   Rank = 33, Price =   486.12m, Change24h =  3.18m, MarketCap = "$9.6B",  MarketCapRaw =     9_600_000_000m, Volume = "$415M",  VolumeRaw =     415_000_000m },
        new() { Id = "injective",         Name = "Injective",         Symbol = "INJ",   IconClass = "inj",   Rank = 34, Price =    28.50m, Change24h =  7.34m, MarketCap = "$2.4B",  MarketCapRaw =     2_400_000_000m, Volume = "$176M",  VolumeRaw =     176_000_000m },
        new() { Id = "arbitrum",          Name = "Arbitrum",          Symbol = "ARB",   IconClass = "arb",   Rank = 35, Price =     1.18m, Change24h =  4.56m, MarketCap = "$1.5B",  MarketCapRaw =     1_500_000_000m, Volume = "$134M",  VolumeRaw =     134_000_000m },
        new() { Id = "aptos",             Name = "Aptos",             Symbol = "APT",   IconClass = "apt",   Rank = 36, Price =     9.85m, Change24h =  2.11m, MarketCap = "$2.1B",  MarketCapRaw =     2_100_000_000m, Volume = "$112M",  VolumeRaw =     112_000_000m },
    ];

    private static readonly IReadOnlyDictionary<string, CoinDto> CoinsById = Coins.ToDictionary(coin => coin.Id);

    public static IReadOnlyList<CoinDto> GetAll() => Coins.Select(Clone).ToList();

    public static CoinDto? GetById(string id) =>
        CoinsById.TryGetValue(id, out var coin) ? Clone(coin) : null;

    private static CoinDto Clone(CoinDto coin) =>
        new()
        {
            Id = coin.Id,
            Symbol = coin.Symbol,
            Name = coin.Name,
            IconClass = coin.IconClass,
            Price = coin.Price,
            Change24h = coin.Change24h,
            Change7d = coin.Change7d,
            Change30d = coin.Change30d,
            Change1y = coin.Change1y,
            Rank = coin.Rank,
            MarketCap = coin.MarketCap,
            MarketCapRaw = coin.MarketCapRaw,
            Volume = coin.Volume,
            VolumeRaw = coin.VolumeRaw,
            Ath = coin.Ath,
            Atl = coin.Atl,
            CirculatingSupplyRaw = coin.CirculatingSupplyRaw,
            TotalSupplyRaw = coin.TotalSupplyRaw,
            MaxSupplyRaw = coin.MaxSupplyRaw,
        };
}
