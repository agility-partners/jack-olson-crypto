import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import StatsBar from './StatsBar';

describe('StatsBar', () => {
  it('shows fallback gainers text when counts are not provided', () => {
    render(<StatsBar />);

    expect(screen.getByText('Gainers')).toBeInTheDocument();
    expect(screen.getByText('— / —')).toBeInTheDocument();
    expect(screen.getByText('Avg change (24h)')).toBeInTheDocument();
  });

  it('shows computed gainers text when counts are provided', () => {
    render(<StatsBar coinCount={12} gainerCount={7} />);

    expect(screen.getByText('Gainers')).toBeInTheDocument();
    expect(screen.getByText('7 / 12')).toBeInTheDocument();
  });
});
