import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Theme } from '@radix-ui/themes';
import { BottomNav } from '../BottomNav';

function renderWithRouter(
  ui: React.ReactElement,
  { route = '/' } = {}
): ReturnType<typeof render> {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Theme>{ui}</Theme>
    </MemoryRouter>
  );
}

describe('BottomNav', () => {
  it('should render Today tab', () => {
    renderWithRouter(<BottomNav />);
    expect(screen.getByText('Today')).toBeInTheDocument();
  });

  it('should render Meso tab', () => {
    renderWithRouter(<BottomNav />);
    expect(screen.getByText('Meso')).toBeInTheDocument();
  });

  it('should render Exercise Library tab', () => {
    renderWithRouter(<BottomNav />);
    expect(screen.getByText('Exercises')).toBeInTheDocument();
  });

  it('should render Meditate tab', () => {
    renderWithRouter(<BottomNav />);
    expect(screen.getByText('Meditate')).toBeInTheDocument();
  });

  it('should highlight active tab', () => {
    renderWithRouter(<BottomNav />, { route: '/exercises' });

    const exercisesLink = screen.getByText('Exercises').closest('a');
    expect(exercisesLink).toHaveAttribute('aria-current', 'page');
  });

  it('should not highlight inactive tabs', () => {
    renderWithRouter(<BottomNav />, { route: '/' });

    const todayLink = screen.getByText('Today').closest('a');
    const exercisesLink = screen.getByText('Exercises').closest('a');

    expect(todayLink).toHaveAttribute('aria-current', 'page');
    expect(exercisesLink).not.toHaveAttribute('aria-current', 'page');
  });

  it('should navigate to correct routes', () => {
    renderWithRouter(<BottomNav />);

    const todayLink = screen.getByText('Today').closest('a');
    const mesoLink = screen.getByText('Meso').closest('a');
    const exercisesLink = screen.getByText('Exercises').closest('a');

    expect(todayLink).toHaveAttribute('href', '/');
    expect(mesoLink).toHaveAttribute('href', '/meso');
    expect(exercisesLink).toHaveAttribute('href', '/exercises');
  });
});
