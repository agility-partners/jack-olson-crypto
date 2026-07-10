import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import WatchlistClient from './WatchlistClient';
import { watchlistCoins } from '@/app/lib/mockData';

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

const deterministicInitialCoins = [
  watchlistCoins.find((coin) => coin.id === 'bitcoin')!,
  watchlistCoins.find((coin) => coin.id === 'ethereum')!,
  watchlistCoins.find((coin) => coin.id === 'bnb')!,
  watchlistCoins.find((coin) => coin.id === 'solana')!,
];

beforeEach(() => {
  vi.restoreAllMocks();
  vi.stubGlobal('fetch', vi.fn((input: string | URL, init?: RequestInit) => {
    const url = String(input);

    if (url.endsWith('/api/coins')) {
      return Promise.resolve(new Response(JSON.stringify(watchlistCoins), { status: 200 }));
    }

    if (url.endsWith('/api/watchlist') && init?.method === 'POST') {
      return Promise.resolve(new Response(JSON.stringify({}), { status: 201 }));
    }

    if (url.includes('/api/watchlist/') && init?.method === 'DELETE') {
      return Promise.resolve(new Response(null, { status: 204 }));
    }

    return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }));
  }));
});

describe('WatchlistClient', () => {
  it('filters displayed coins by search term', () => {
    render(<WatchlistClient initialCoins={watchlistCoins.slice(0, 4)} />);

    fireEvent.change(screen.getByLabelText('Search watchlist'), {
      target: { value: 'Ethereum' },
    });

    expect(screen.getByText('Ethereum')).toBeInTheDocument();
    expect(screen.queryByText('Bitcoin')).not.toBeInTheDocument();
  });

  it('shows empty state when no coins match the search', () => {
    render(<WatchlistClient initialCoins={watchlistCoins.slice(0, 4)} />);

    fireEvent.change(screen.getByLabelText('Search watchlist'), {
      target: { value: 'NotACoin' },
    });

    expect(screen.getByText('No coins found')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your search or filter.')).toBeInTheDocument();
  });

  it('filters to gainers when the Gainers button is clicked', () => {
    render(<WatchlistClient initialCoins={watchlistCoins.slice(0, 4)} />);

    fireEvent.click(screen.getByRole('button', { name: 'Gainers' }));

    expect(screen.getByText('Bitcoin')).toBeInTheDocument();
    expect(screen.getByText('Solana')).toBeInTheDocument();
    expect(screen.queryByText('Ethereum')).not.toBeInTheDocument();
  });

  it('opens and closes the add coin modal', async () => {
    render(<WatchlistClient initialCoins={watchlistCoins.slice(0, 4)} />);

    fireEvent.click(screen.getByRole('button', { name: /add coin/i }));

    const cancelButton = await screen.findByRole('button', { name: 'Cancel' });
    expect(cancelButton).toBeInTheDocument();
    expect(screen.getByText('Add Cryptocurrency')).toBeInTheDocument();

    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
      expect(screen.queryByText('Add Cryptocurrency')).not.toBeInTheDocument();
    });
  });

  it('calls onStatsChange on initial render', async () => {
    const onStatsChange = vi.fn();

    render(
      <WatchlistClient
        initialCoins={deterministicInitialCoins}
        onStatsChange={onStatsChange}
      />
    );

    await waitFor(() => {
      expect(onStatsChange).toHaveBeenCalledWith(4, 3);
    });
  });

  it('updates onStatsChange after adding a coin', async () => {
    const onStatsChange = vi.fn();

    render(
      <WatchlistClient
        initialCoins={deterministicInitialCoins}
        onStatsChange={onStatsChange}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /add coin/i }));

    await screen.findByRole('button', { name: 'Cancel' });

    // Wait for coin list to load and click Dogecoin
    const dogecoinOption = await screen.findByRole('option', { name: /Dogecoin/i });
    fireEvent.click(dogecoinOption);

    fireEvent.click(screen.getByRole('button', { name: 'Add to Watchlist (1)' }));

    await waitFor(() => {
      expect(onStatsChange).toHaveBeenCalledWith(5, 4);
    }, { timeout: 3000 });
  });

  it('removes a coin from the watchlist and updates stats', async () => {
    const onStatsChange = vi.fn();

    render(
      <WatchlistClient
        initialCoins={deterministicInitialCoins}
        onStatsChange={onStatsChange}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Remove Bitcoin from watchlist' }));

    expect(screen.queryByText('Bitcoin')).not.toBeInTheDocument();

    await waitFor(() => {
      expect(onStatsChange).toHaveBeenLastCalledWith(3, 2);
    });
  });

  it('does not show remove buttons on the all coins view', () => {
    render(<WatchlistClient initialCoins={deterministicInitialCoins} useAllCoins />);

    expect(
      screen.queryByRole('button', { name: /remove .* from watchlist/i })
    ).not.toBeInTheDocument();
  });

  it('shows a validation error when submitting without selecting a coin', async () => {
    render(<WatchlistClient initialCoins={deterministicInitialCoins} />);

    fireEvent.click(screen.getByRole('button', { name: /add coin/i }));

    await screen.findByRole('button', { name: 'Cancel' });

    fireEvent.click(screen.getByRole('button', { name: 'Add to Watchlist' }));

    expect(screen.getByText('Please select a cryptocurrency')).toBeInTheDocument();
    expect(document.querySelector('a[href="/coins/dogecoin"]')).not.toBeInTheDocument();
  });

  it('restores full list when search input is cleared', () => {
    render(<WatchlistClient initialCoins={deterministicInitialCoins} />);

    const searchInput = screen.getByLabelText('Search watchlist');

    fireEvent.change(searchInput, { target: { value: 'Ethereum' } });
    expect(document.querySelector('a[href="/coins/ethereum"]')).toBeInTheDocument();
    expect(document.querySelector('a[href="/coins/bitcoin"]')).not.toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: '' } });

    expect(document.querySelector('a[href="/coins/bitcoin"]')).toBeInTheDocument();
    expect(document.querySelector('a[href="/coins/ethereum"]')).toBeInTheDocument();
    expect(document.querySelector('a[href="/coins/bnb"]')).toBeInTheDocument();
    expect(document.querySelector('a[href="/coins/solana"]')).toBeInTheDocument();
  });

  it('returns to full list when All filter is selected after Gainers', () => {
    render(<WatchlistClient initialCoins={deterministicInitialCoins} />);

    fireEvent.click(screen.getByRole('button', { name: 'Gainers' }));
    expect(document.querySelector('a[href="/coins/ethereum"]')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Value' }));

    expect(document.querySelector('a[href="/coins/bitcoin"]')).toBeInTheDocument();
    expect(document.querySelector('a[href="/coins/ethereum"]')).toBeInTheDocument();
    expect(document.querySelector('a[href="/coins/bnb"]')).toBeInTheDocument();
    expect(document.querySelector('a[href="/coins/solana"]')).toBeInTheDocument();
  });

  it('filters to losers when the Losers button is clicked', () => {
  render(<WatchlistClient initialCoins={deterministicInitialCoins} />);

  fireEvent.click(screen.getByRole('button', { name: 'Losers' }));

  // In deterministic set, Ethereum is a loser; Bitcoin/Solana are gainers
  expect(document.querySelector('a[href="/coins/ethereum"]')).toBeInTheDocument();
  expect(document.querySelector('a[href="/coins/bitcoin"]')).not.toBeInTheDocument();
  expect(document.querySelector('a[href="/coins/solana"]')).not.toBeInTheDocument();
});

  it('combines Gainers filter with search term', () => {
    render(<WatchlistClient initialCoins={deterministicInitialCoins} />);

    fireEvent.click(screen.getByRole('button', { name: 'Gainers' }));
    fireEvent.change(screen.getByLabelText('Search watchlist'), {
      target: { value: 'Sol' },
    });

    // Should narrow to Solana only
    expect(document.querySelector('a[href="/coins/solana"]')).toBeInTheDocument();
    expect(document.querySelector('a[href="/coins/bitcoin"]')).not.toBeInTheDocument();
    expect(document.querySelector('a[href="/coins/ethereum"]')).not.toBeInTheDocument();
    expect(document.querySelector('a[href="/coins/bnb"]')).not.toBeInTheDocument();
  });

  it('closes the modal after a successful add', async () => {
    render(<WatchlistClient initialCoins={deterministicInitialCoins} />);

    fireEvent.click(screen.getByRole('button', { name: /add coin/i }));

    await screen.findByRole('button', { name: 'Cancel' });

    // Wait for coin list to load and click Dogecoin
    const dogecoinOption = await screen.findByRole('option', { name: /Dogecoin/i });
    fireEvent.click(dogecoinOption);

    fireEvent.click(screen.getByRole('button', { name: 'Add to Watchlist (1)' }));

    await waitFor(() => {
      expect(document.querySelector('a[href="/coins/dogecoin"]')).toBeInTheDocument();
      expect(screen.queryByText('Add Cryptocurrency')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
