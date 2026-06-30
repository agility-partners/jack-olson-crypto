import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import BrowsePageClient from './BrowsePageClient';
import { watchlistCoins } from '@/app/lib/mockData';

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.stubGlobal('fetch', vi.fn(() =>
  Promise.resolve(new Response(JSON.stringify(watchlistCoins), { status: 200 })),
));

const sampleCoins = [
  watchlistCoins.find((c) => c.id === 'bitcoin')!,
  watchlistCoins.find((c) => c.id === 'ethereum')!,
  watchlistCoins.find((c) => c.id === 'solana')!,
];

describe('BrowsePageClient', () => {
  it('renders the All Coins heading', () => {
    render(<BrowsePageClient initialCoins={sampleCoins} />);

    expect(screen.getByRole('heading', { name: 'All Coins' })).toBeInTheDocument();
  });

  it('shows the correct asset count from API-supplied initialCoins', () => {
    render(<BrowsePageClient initialCoins={sampleCoins} />);

    expect(screen.getByText(`Tracking ${sampleCoins.length} assets · Last updated just now`)).toBeInTheDocument();
  });

  it('renders a row for each coin in initialCoins', () => {
    render(<BrowsePageClient initialCoins={sampleCoins} />);

    expect(screen.getByText('Bitcoin')).toBeInTheDocument();
    expect(screen.getByText('Ethereum')).toBeInTheDocument();
    expect(screen.getByText('Solana')).toBeInTheDocument();
  });

  it('reflects the full 32-coin catalog when passed the complete API response', () => {
    render(<BrowsePageClient initialCoins={watchlistCoins} />);

    expect(
      screen.getByText(`Tracking ${watchlistCoins.length} assets · Last updated just now`),
    ).toBeInTheDocument();
    expect(screen.getByText('Bitcoin')).toBeInTheDocument();
    expect(screen.getByText('Ethereum')).toBeInTheDocument();
  });
});
