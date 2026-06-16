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

export type CoinDetail = Coin & {
  description: string;
  allTimeHigh: number;
  allTimeLow: number;
  circulatingSupply: string;
  totalSupply: string;
  maxSupply: string | null;
  change7d: number;
  change30d: number;
  change1y: number;
  website: string;
  founded: number;
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

export const coinDetails: Record<string, CoinDetail> = {
  bitcoin: {
    id: "bitcoin",
    name: "Bitcoin",
    symbol: "BTC",
    iconClass: "btc",
    rank: 1,
    price: 67842.50,
    change24h: 2.34,
    change7d: 5.12,
    change30d: 8.45,
    change1y: 142.30,
    marketCap: "$1.34T",
    volume: "$28.4B",
    description: "Bitcoin is the first and most well-known cryptocurrency, created in 2009 by an anonymous person or group known as Satoshi Nakamoto. It uses a peer-to-peer network and cryptographic proof to create and manage transactions.",
    allTimeHigh: 69045.00,
    allTimeLow: 65.51,
    circulatingSupply: "21.45M BTC",
    totalSupply: "21.00M BTC",
    maxSupply: "21.00M BTC",
    website: "https://bitcoin.org",
    founded: 2009,
  },
  ethereum: {
    id: "ethereum",
    name: "Ethereum",
    symbol: "ETH",
    iconClass: "eth",
    rank: 2,
    price: 3521.80,
    change24h: -1.12,
    change7d: -3.45,
    change30d: 2.15,
    change1y: 85.20,
    marketCap: "$423B",
    volume: "$14.1B",
    description: "Ethereum is an open-source blockchain platform that enables developers to build and deploy smart contracts and decentralized applications (dApps). It introduced the concept of smart contracts to blockchain technology.",
    allTimeHigh: 4891.70,
    allTimeLow: 0.51,
    circulatingSupply: "120.45M ETH",
    totalSupply: "120.45M ETH",
    maxSupply: null,
    website: "https://ethereum.org",
    founded: 2015,
  },
  solana: {
    id: "solana",
    name: "Solana",
    symbol: "SOL",
    iconClass: "sol",
    rank: 5,
    price: 182.40,
    change24h: 5.67,
    change7d: 12.34,
    change30d: 18.90,
    change1y: 320.45,
    marketCap: "$85.2B",
    volume: "$4.8B",
    description: "Solana is a high-performance blockchain platform designed for scalability. It uses a unique consensus mechanism called Proof of History to enable fast transaction speeds and low fees.",
    allTimeHigh: 259.96,
    allTimeLow: 1.95,
    circulatingSupply: "467.41M SOL",
    totalSupply: "534.99M SOL",
    maxSupply: null,
    website: "https://solana.com",
    founded: 2017,
  },
  cardano: {
    id: "cardano",
    name: "Cardano",
    symbol: "ADA",
    iconClass: "ada",
    rank: 8,
    price: 0.624,
    change24h: -0.88,
    change7d: -2.14,
    change30d: 3.21,
    change1y: 45.67,
    marketCap: "$21.8B",
    volume: "$680M",
    description: "Cardano is a blockchain platform built on peer-reviewed research and developed with scientific rigor. It aims to provide a more secure and scalable smart contract platform.",
    allTimeHigh: 3.10,
    allTimeLow: 0.02,
    circulatingSupply: "34.99B ADA",
    totalSupply: "45.00B ADA",
    maxSupply: "45.00B ADA",
    website: "https://cardano.org",
    founded: 2015,
  },
  polkadot: {
    id: "polkadot",
    name: "Polkadot",
    symbol: "DOT",
    iconClass: "dot",
    rank: 13,
    price: 9.14,
    change24h: 3.21,
    change7d: 7.89,
    change30d: 12.34,
    change1y: 75.43,
    marketCap: "$12.4B",
    volume: "$412M",
    description: "Polkadot is a multi-chain protocol that enables different blockchains to interoperate and share information securely. It uses a relay chain architecture to connect multiple parachains.",
    allTimeHigh: 54.98,
    allTimeLow: 2.29,
    circulatingSupply: "1.36B DOT",
    totalSupply: "1.36B DOT",
    maxSupply: null,
    website: "https://polkadot.network",
    founded: 2016,
  },
  avalanche: {
    id: "avalanche",
    name: "Avalanche",
    symbol: "AVAX",
    iconClass: "avax",
    rank: 11,
    price: 41.72,
    change24h: -2.54,
    change7d: -5.12,
    change30d: 8.67,
    change1y: 120.50,
    marketCap: "$17.1B",
    volume: "$820M",
    description: "Avalanche is a blockchain platform offering a highly scalable, fast, and secure environment for decentralized applications. It uses a novel consensus protocol called Avalanche.",
    allTimeHigh: 147.00,
    allTimeLow: 2.79,
    circulatingSupply: "409.47M AVAX",
    totalSupply: "720.00M AVAX",
    maxSupply: "720.00M AVAX",
    website: "https://www.avax.network",
    founded: 2020,
  },
  bnb: {
    id: "bnb",
    name: "BNB",
    symbol: "BNB",
    iconClass: "bnb",
    rank: 3,
    price: 608.30,
    change24h: 0.97,
    change7d: 2.45,
    change30d: 5.67,
    change1y: 95.34,
    marketCap: "$88.4B",
    volume: "$1.9B",
    description: "BNB is the native token of the Binance Chain ecosystem. Originally created as a utility token for trading fee discounts on Binance, it has evolved into a major blockchain platform.",
    allTimeHigh: 686.31,
    allTimeLow: 0.05,
    circulatingSupply: "145.25M BNB",
    totalSupply: "200.00M BNB",
    maxSupply: "200.00M BNB",
    website: "https://www.binance.com",
    founded: 2017,
  },
  ripple: {
    id: "ripple",
    name: "XRP",
    symbol: "XRP",
    iconClass: "xrp",
    rank: 6,
    price: 0.578,
    change24h: 1.42,
    change7d: 4.56,
    change30d: 6.78,
    change1y: 34.21,
    marketCap: "$31.2B",
    volume: "$1.1B",
    description: "XRP is the native token of the Ripple network, designed to facilitate fast and low-cost international payments. It powers the RippleNet ecosystem for cross-border transactions.",
    allTimeHigh: 3.84,
    allTimeLow: 0.002,
    circulatingSupply: "54.04B XRP",
    totalSupply: "99.99B XRP",
    maxSupply: "100.00B XRP",
    website: "https://xrpl.org",
    founded: 2012,
  },
};

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
