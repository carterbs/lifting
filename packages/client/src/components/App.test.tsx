import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Theme } from '@radix-ui/themes';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import type { Exercise, ApiResponse } from '@lifting/shared';
import { App } from './App';

const mockExercises: Exercise[] = [
  {
    id: 1,
    name: 'Bench Press',
    weight_increment: 5,
    is_custom: false,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
  },
];

const handlers = [
  http.get('/api/exercises', () => {
    const response: ApiResponse<Exercise[]> = {
      success: true,
      data: mockExercises,
    };
    return HttpResponse.json(response);
  }),
];

const server = setupServer(...handlers);

describe('App', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterAll(() => server.close());
  afterEach(() => server.resetHandlers());

  it('should render the app with navigation', () => {
    render(
      <Theme>
        <App />
      </Theme>
    );

    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Today/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Meso/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Exercises/i })).toBeInTheDocument();
  });

  it('should show Today page by default', () => {
    render(
      <Theme>
        <App />
      </Theme>
    );

    expect(screen.getByRole('heading', { name: 'Today' })).toBeInTheDocument();
  });
});
