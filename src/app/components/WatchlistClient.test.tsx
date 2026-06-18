import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
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

  it('adds a coin through the modal and shows it in the watchlist', async () => {
    render(<WatchlistClient initialCoins={deterministicInitialCoins} />);

    fireEvent.click(screen.getByRole('button', { name: /add coin/i }));

    await screen.findByRole('button', { name: 'Cancel' });

    fireEvent.change(screen.getByLabelText('Select Cryptocurrency'), {
      target: { value: 'dogecoin' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Add to Watchlist' }));

    await screen.findByRole('button', { name: 'Adding...' });

    await waitFor(
      () => {
        expect(screen.getByText('Dogecoin')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('does not allow adding a duplicate coin', async () => {
    render(<WatchlistClient initialCoins={deterministicInitialCoins} />);

    fireEvent.click(screen.getByRole('button', { name: /add coin/i }));

    await screen.findByRole('button', { name: 'Cancel' });

    const select = screen.getByLabelText('Select Cryptocurrency') as HTMLSelectElement;
    const optionValues = Array.from(select.options).map((option) => option.value);

    expect(optionValues).not.toContain('bitcoin');
    expect(optionValues).not.toContain('ethereum');
    expect(optionValues).not.toContain('bnb');
    expect(optionValues).not.toContain('solana');
    expect(optionValues).toContain('dogecoin');
  });
});
