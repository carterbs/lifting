import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { Theme } from '@radix-ui/themes';
import { App } from './App';

// Mock fetch
global.fetch = vi.fn();

function renderWithTheme(
  component: React.ReactNode
): ReturnType<typeof render> {
  return render(<Theme>{component}</Theme>);
}

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('should render the heading', () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          success: true,
          data: {
            status: 'ok',
            version: '0.0.1',
            timestamp: new Date().toISOString(),
          },
        }),
    } as Response);

    renderWithTheme(<App />);

    expect(
      screen.getByRole('heading', { name: 'Lifting' })
    ).toBeInTheDocument();
  });

  it('should show loading state initially', () => {
    vi.mocked(fetch).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderWithTheme(<App />);

    expect(
      screen.getByText('Checking server connection...')
    ).toBeInTheDocument();
  });
});
