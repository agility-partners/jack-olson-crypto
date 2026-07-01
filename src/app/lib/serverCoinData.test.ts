import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { watchlistCoins } from '@/app/lib/mockData';
import { getAllCoins, getCoinById, getWatchlistCoins } from '@/app/lib/serverCoinData';

const apiCoins = watchlistCoins.slice(0, 5).map((c) => ({ ...c }));
const apiWatchlist = watchlistCoins.slice(0, 2).map((c) => ({ ...c }));

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getAllCoins', () => {
  it('fetches /api/coins with cache:no-store and returns the API coin list', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(apiCoins), { status: 200 }),
    );

    const coins = await getAllCoins();

    expect(fetch).toHaveBeenCalledOnce();
    const [url, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(url).toMatch(/\/api\/coins$/);
    expect(init).toEqual({ cache: 'no-store' });
    expect(coins).toHaveLength(apiCoins.length);
    expect(coins[0].id).toBe(apiCoins[0].id);
  });

  it('falls back to the full mock catalog when the API returns a non-OK status', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response('Internal Server Error', { status: 500 }),
    );

    const coins = await getAllCoins();

    expect(coins).toHaveLength(watchlistCoins.length);
    expect(coins.some((c) => c.id === 'bitcoin')).toBe(true);
  });

  it('falls back to the full mock catalog when fetch rejects', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('ECONNREFUSED'));

    const coins = await getAllCoins();

    expect(coins).toHaveLength(watchlistCoins.length);
    expect(coins.some((c) => c.id === 'ethereum')).toBe(true);
  });

  it('returns coins with all required Coin fields populated', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(apiCoins), { status: 200 }),
    );

    const coins = await getAllCoins();

    for (const coin of coins) {
      expect(coin.id).toBeTruthy();
      expect(coin.name).toBeTruthy();
      expect(coin.symbol).toBeTruthy();
      expect(coin.iconClass).toBeTruthy();
    }
  });
});

describe('getWatchlistCoins', () => {
  it('fetches /api/watchlist with cache:no-store and returns the API list', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(apiWatchlist), { status: 200 }),
    );

    const coins = await getWatchlistCoins();

    expect(fetch).toHaveBeenCalledOnce();
    const [url, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(url).toMatch(/\/api\/watchlist$/);
    expect(init).toEqual({ cache: 'no-store' });
    expect(coins).toHaveLength(apiWatchlist.length);
  });

  it('falls back to an empty list when the API returns a non-OK status', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response('Service Unavailable', { status: 503 }),
    );

    const coins = await getWatchlistCoins();

    expect(coins).toHaveLength(0);
  });

  it('falls back to an empty list when fetch rejects', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network timeout'));

    const coins = await getWatchlistCoins();

    expect(coins).toHaveLength(0);
  });
});

describe('getCoinById', () => {
  const bitcoinCoin = watchlistCoins.find((c) => c.id === 'bitcoin')!;

  it('fetches /api/coins/:id with cache:no-store and returns the coin', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(bitcoinCoin), { status: 200 }),
    );

    const coin = await getCoinById('bitcoin');

    expect(fetch).toHaveBeenCalledOnce();
    const [url, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(url).toMatch(/\/api\/coins\/bitcoin$/);
    expect(init).toEqual({ cache: 'no-store' });
    expect(coin).not.toBeNull();
    expect(coin!.id).toBe('bitcoin');
    expect(coin!.name).toBe('Bitcoin');
  });

  it('falls back to the mock catalog entry when the API returns a non-OK status', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response('Not Found', { status: 404 }),
    );

    const coin = await getCoinById('bitcoin');

    expect(coin).not.toBeNull();
    expect(coin!.id).toBe('bitcoin');
  });

  it('returns null when the API returns a non-OK status and the coin is not in the mock catalog', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response('Not Found', { status: 404 }),
    );

    const coin = await getCoinById('nonexistent-coin');

    expect(coin).toBeNull();
  });

  it('falls back to the mock catalog entry when fetch rejects', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('ECONNREFUSED'));

    const coin = await getCoinById('ethereum');

    expect(coin).not.toBeNull();
    expect(coin!.id).toBe('ethereum');
  });

  it('returns null when fetch rejects and the coin is not in the mock catalog', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('ECONNREFUSED'));

    const coin = await getCoinById('nonexistent-coin');

    expect(coin).toBeNull();
  });

  it('returns a coin with all required Coin fields populated', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(bitcoinCoin), { status: 200 }),
    );

    const coin = await getCoinById('bitcoin');

    expect(coin).not.toBeNull();
    expect(coin!.id).toBeTruthy();
    expect(coin!.name).toBeTruthy();
    expect(coin!.symbol).toBeTruthy();
    expect(coin!.iconClass).toBeTruthy();
  });
});
