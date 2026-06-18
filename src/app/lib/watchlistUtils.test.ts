import { describe, expect, it } from 'vitest';
import { filterCoins, parseValue, sortCoins } from './watchlistUtils';

const sampleCoins = [
  {
    id: 'bitcoin',
    name: 'Bitcoin',
    symbol: 'BTC',
    price: 67842.5,
    change24h: 2.34,
    marketCap: '$1.34T',
    volume: '$28.4B',
  },
  {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    price: 3521.8,
    change24h: -1.12,
    marketCap: '$423B',
    volume: '$14.1B',
  },
  {
    id: 'solana',
    name: 'Solana',
    symbol: 'SOL',
    price: 182.4,
    change24h: 5.67,
    marketCap: '$85.2B',
    volume: '$4.8B',
  },
];

describe('watchlistUtils', () => {
  describe('parseValue', () => {
    it('parses trillions correctly', () => {
      expect(parseValue('$1.34T')).toBe(1_340_000_000_000);
    });

    it('parses billions correctly', () => {
      expect(parseValue('$423B')).toBe(423_000_000_000);
    });

    it('parses millions correctly', () => {
      expect(parseValue('$680M')).toBe(680_000_000);
    });

    it('returns 0 for invalid values', () => {
      expect(parseValue('invalid')).toBe(0);
    });
  });

  describe('filterCoins', () => {
    it('filters coins by search term', () => {
      const result = filterCoins(sampleCoins, 'Bitcoin', 'value');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('bitcoin');
    });

    it('filters coins by symbol', () => {
      const result = filterCoins(sampleCoins, 'ETH', 'value');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('ethereum');
    });

    it('filters coins case-insensitively', () => {
      const result = filterCoins(sampleCoins, 'eth', 'value');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('ethereum');
    });

    it('filters only gainers', () => {
      const result = filterCoins(sampleCoins, '', 'gainers');
      expect(result.map((coin) => coin.id)).toEqual(['bitcoin', 'solana']);
    });

    it('filters only losers', () => {
      const result = filterCoins(sampleCoins, '', 'losers');
      expect(result.map((coin) => coin.id)).toEqual(['ethereum']);
    });
  });

  describe('sortCoins', () => {
    it('sorts by price descending for value filter', () => {
      const result = sortCoins(sampleCoins, 'value');
      expect(result.map((coin) => coin.id)).toEqual(['bitcoin', 'ethereum', 'solana']);
    });

    it('sorts by percent change descending', () => {
      const result = sortCoins(sampleCoins, 'percentchange');
      expect(result.map((coin) => coin.id)).toEqual(['solana', 'bitcoin', 'ethereum']);
    });

    it('sorts by market cap descending', () => {
      const result = sortCoins(sampleCoins, 'marketcap');
      expect(result.map((coin) => coin.id)).toEqual(['bitcoin', 'ethereum', 'solana']);
    });

    it('sorts by volume descending', () => {
      const result = sortCoins(sampleCoins, '24hvolume');
      expect(result.map((coin) => coin.id)).toEqual(['bitcoin', 'ethereum', 'solana']);
    });
  });
});
