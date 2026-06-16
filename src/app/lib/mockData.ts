export type Coin = {
  id: string;
  name: string;
  symbol: string;
  iconClass: string;
  rank: number;
  price: number;
  change24h: number;
  marketCap: string;
  volume: string;
};

export type SparkPath = {
  d: string;
  up: boolean;
};

export const watchlistCoins: Coin[] = [
  { id: "bitcoin",   name: "Bitcoin",   symbol: "BTC",  iconClass: "btc",  rank: 1,  price: 67842.50, change24h: 2.34,  marketCap: "$1.34T", volume: "$28.4B" },
  { id: "ethereum",  name: "Ethereum",  symbol: "ETH",  iconClass: "eth",  rank: 2,  price: 3521.80,  change24h: -1.12, marketCap: "$423B",  volume: "$14.1B" },
  { id: "solana",    name: "Solana",    symbol: "SOL",  iconClass: "sol",  rank: 5,  price: 182.40,   change24h: 5.67,  marketCap: "$85.2B", volume: "$4.8B"  },
  { id: "cardano",   name: "Cardano",   symbol: "ADA",  iconClass: "ada",  rank: 8,  price: 0.624,    change24h: -0.88, marketCap: "$21.8B", volume: "$680M"  },
  { id: "polkadot",  name: "Polkadot",  symbol: "DOT",  iconClass: "dot",  rank: 13, price: 9.14,     change24h: 3.21,  marketCap: "$12.4B", volume: "$412M"  },
  { id: "avalanche", name: "Avalanche", symbol: "AVAX", iconClass: "avax", rank: 11, price: 41.72,    change24h: -2.54, marketCap: "$17.1B", volume: "$820M"  },
  { id: "bnb",       name: "BNB",       symbol: "BNB",  iconClass: "bnb",  rank: 3,  price: 608.30,   change24h: 0.97,  marketCap: "$88.4B", volume: "$1.9B"  },
  { id: "ripple",    name: "XRP",       symbol: "XRP",  iconClass: "xrp",  rank: 6,  price: 0.578,    change24h: 1.42,  marketCap: "$31.2B", volume: "$1.1B"  },
];

export const sparkPaths: Record<string, SparkPath> = {
  btc:  { d: "M0,32 C20,28 40,20 60,22 C80,24 100,12 120,10 C140,8 160,14 180,8 C200,2 220,6 240,4",    up: true  },
  eth:  { d: "M0,8  C20,10 40,14 60,12 C80,10 100,20 120,24 C140,28 160,26 180,30 C200,34 220,32 240,36", up: false },
  sol:  { d: "M0,30 C20,26 40,22 60,16 C80,10 100,8  120,6  C140,4  160,4  180,2  C200,0  220,2  240,0",  up: true  },
  ada:  { d: "M0,10 C20,12 40,16 60,18 C80,20 100,24 120,28 C140,30 160,28 180,32 C200,34 220,36 240,36", up: false },
  dot:  { d: "M0,28 C20,24 40,20 60,18 C80,16 100,12 120,10 C140,8  160,10 180,8  C200,6  220,4  240,2",  up: true  },
  avax: { d: "M0,4  C20,8  40,10 60,14 C80,18 100,22 120,26 C140,28 160,32 180,30 C200,34 220,36 240,38", up: false },
  bnb:  { d: "M0,20 C20,18 40,14 60,12 C80,10 100,8  120,10 C140,12 160,8  180,6  C200,4  220,6  240,4",  up: true  },
  xrp:  { d: "M0,22 C20,20 40,18 60,14 C80,10 100,12 120,8  C140,6  160,8  180,6  C200,4  220,6  240,4",  up: true  },
};
