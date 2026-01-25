import { test, expect } from '../helpers/fixtures.js';

/**
 * Activity Launcher E2E Tests
 *
 * Tests the hub-and-spoke navigation model:
 * - Global nav: Today, Activities, History, Profile
 * - Lifting nested nav: Back, Meso, Plans, Exercises
 * - Activity-specific navs with back buttons
 */
test.describe('Activity Launcher Navigation', () => {
  test.beforeEach(async ({ api }) => {
    await api.resetDatabase();
  });

  test.describe('Global Navigation', () => {
    test('should display global nav with 4 items on Today page', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('h1').first()).toContainText('Today');

      // Verify all 4 global nav items are present
      const nav = page.getByRole('navigation', { name: 'Main navigation' });
      await expect(nav).toBeVisible();

      await expect(page.getByRole('link', { name: /today/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /activities/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /history/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /profile/i })).toBeVisible();
    });

    test('should navigate between global nav pages', async ({ page }) => {
      await page.goto('/');

      // Navigate to Activities
      await page.getByRole('link', { name: /activities/i }).click();
      await expect(page.locator('h1').first()).toContainText('Activities');

      // Navigate to History
      await page.getByRole('link', { name: /history/i }).click();
      await expect(page.locator('h1').first()).toContainText('History');

      // Navigate to Profile
      await page.getByRole('link', { name: /profile/i }).click();
      await expect(page.locator('h1').first()).toContainText('Profile');

      // Navigate back to Today
      await page.getByRole('link', { name: /today/i }).click();
      await expect(page.locator('h1').first()).toContainText('Today');
    });

    test('should highlight active nav item', async ({ page }) => {
      await page.goto('/');

      // Today should be active (indicated by aria-current)
      await expect(page.getByRole('link', { name: /today/i })).toHaveAttribute(
        'aria-current',
        'page'
      );

      // Navigate to Activities
      await page.getByRole('link', { name: /activities/i }).click();
      await expect(page.getByRole('link', { name: /activities/i })).toHaveAttribute(
        'aria-current',
        'page'
      );
      await expect(page.getByRole('link', { name: /today/i })).not.toHaveAttribute(
        'aria-current'
      );
    });
  });

  test.describe('Activities Hub Page', () => {
    test('should display activity cards', async ({ page }) => {
      await page.goto('/activities');
      await expect(page.locator('h1').first()).toContainText('Activities');

      // Verify activity cards are present
      await expect(page.getByTestId('activity-card-lifting')).toBeVisible();
      await expect(page.getByTestId('activity-card-stretch')).toBeVisible();
      await expect(page.getByTestId('activity-card-meditation')).toBeVisible();
    });

    test('should navigate to Lifting when clicking lifting card', async ({ page }) => {
      await page.goto('/activities');
      await page.getByTestId('activity-card-lifting').click();

      await expect(page.locator('h1').first()).toContainText('Mesocycle');
      await expect(page).toHaveURL(/\/lifting$/);
    });

    test('should navigate to Stretch when clicking stretch card', async ({ page }) => {
      await page.goto('/activities');
      await page.getByTestId('activity-card-stretch').click();

      await expect(page.locator('h1').first()).toContainText('Stretch');
      await expect(page).toHaveURL(/\/stretch$/);
    });

    test('should navigate to Meditation when clicking meditate card', async ({ page }) => {
      await page.goto('/activities');
      await page.getByTestId('activity-card-meditation').click();

      await expect(page.locator('h1').first()).toContainText('Meditation');
      await expect(page).toHaveURL(/\/meditation$/);
    });
  });

  test.describe('Lifting Nested Navigation', () => {
    test('should display lifting nav with 4 items', async ({ page }) => {
      await page.goto('/lifting');
      await expect(page.locator('h1').first()).toContainText('Mesocycle');

      // Verify lifting nav items
      const nav = page.getByRole('navigation', { name: 'Lifting navigation' });
      await expect(nav).toBeVisible();

      await expect(page.getByRole('button', { name: /back to activities/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /meso/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /plans/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /exercises/i })).toBeVisible();
    });

    test('should navigate between lifting pages', async ({ page }) => {
      await page.goto('/lifting');

      // Navigate to Plans
      await page.getByRole('link', { name: /plans/i }).click();
      await expect(page.locator('h1').first()).toContainText('My Plans');
      await expect(page).toHaveURL(/\/lifting\/plans$/);

      // Navigate to Exercises
      await page.getByRole('link', { name: /exercises/i }).click();
      await expect(page.locator('h1').first()).toContainText('Exercise Library');
      await expect(page).toHaveURL(/\/lifting\/exercises$/);

      // Navigate back to Meso
      await page.getByRole('link', { name: /meso/i }).click();
      await expect(page.locator('h1').first()).toContainText('Mesocycle');
      await expect(page).toHaveURL(/\/lifting$/);
    });

    test('should navigate back to Activities via back button', async ({ page }) => {
      await page.goto('/lifting');
      await page.getByRole('button', { name: /back to activities/i }).click();

      await expect(page.locator('h1').first()).toContainText('Activities');
      await expect(page).toHaveURL(/\/activities$/);
    });

    test('should preserve lifting nav in nested routes', async ({ page, plansPage }) => {
      // Go to plans page and create a plan
      await plansPage.goto();
      await plansPage.waitForLoad();

      // Verify we're still showing lifting nav
      await expect(page.getByRole('link', { name: /exercises/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /back to activities/i })).toBeVisible();
    });
  });

  test.describe('Activity Back Navigation', () => {
    test('should show back button on Stretch page', async ({ page }) => {
      await page.goto('/stretch');
      await expect(page.locator('h1').first()).toContainText('Stretch');

      // Verify back button is present
      await expect(page.getByRole('button', { name: /back to activities/i })).toBeVisible();
    });

    test('should navigate back from Stretch to Activities', async ({ page }) => {
      await page.goto('/stretch');
      await page.getByRole('button', { name: /back to activities/i }).click();

      await expect(page.locator('h1').first()).toContainText('Activities');
    });

    test('should show back button on Meditation page', async ({ page }) => {
      await page.goto('/meditation');
      await expect(page.locator('h1').first()).toContainText('Meditation');

      // Verify back button is present
      await expect(page.getByRole('button', { name: /back to activities/i })).toBeVisible();
    });

    test('should navigate back from Meditation to Activities', async ({ page }) => {
      await page.goto('/meditation');
      await page.getByRole('button', { name: /back to activities/i }).click();

      await expect(page.locator('h1').first()).toContainText('Activities');
    });
  });
});

test.describe('Today Dashboard', () => {
  test.beforeEach(async ({ api }) => {
    await api.resetDatabase();
  });

  test('should display all three activity cards', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1').first()).toContainText('Today');

    // Workout card
    await expect(page.getByText(/Workout|No workout scheduled/i).first()).toBeVisible();

    // Stretch card
    await expect(page.getByText(/Stretch/i).first()).toBeVisible();

    // Meditation card
    await expect(page.getByText(/Meditation/i).first()).toBeVisible();
  });

  test('should show "no workout scheduled" when no mesocycle active', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText(/No workout scheduled/i)).toBeVisible();
  });

  test('should show workout info when mesocycle active', async ({ page, api }) => {
    // Set up a workout scenario
    await api.setupWorkoutScenario('E2E Bench Press');

    await page.goto('/');

    // Should show workout scheduled (not "no workout")
    await expect(page.getByText('Workout')).toBeVisible();
    // The card should have some workout details or a button to start
    await expect(page.getByText(/Start|scheduled|today/i).first()).toBeVisible();
  });

  test('should show stretch status', async ({ page }) => {
    await page.goto('/');

    // Should show stretch section with status
    const stretchCard = page.locator('text=Stretch').locator('..');
    await expect(stretchCard).toBeVisible();

    // Should have either "No sessions yet" or days since last stretch
    await expect(
      page.getByText(/No stretch sessions yet|days ago|Stretched today|yesterday/i).first()
    ).toBeVisible();
  });

  test('should show meditation status', async ({ page }) => {
    await page.goto('/');

    // Should show meditation section with status
    await expect(page.getByText('Meditation')).toBeVisible();

    // Should have either "No sessions yet" or days since last meditation
    await expect(
      page.getByText(/No meditation sessions yet|days ago|Meditated today|yesterday/i).first()
    ).toBeVisible();
  });

  test('should navigate to stretch page from stretch card button', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: /stretch now/i }).click();
    await expect(page).toHaveURL(/\/stretch$/);
  });

  test('should navigate to meditation page from meditation card button', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: /meditate/i }).click();
    await expect(page).toHaveURL(/\/meditation$/);
  });
});

test.describe('History Page', () => {
  test.beforeEach(async ({ api }) => {
    await api.resetDatabase();
  });

  test('should display history page with calendar', async ({ page }) => {
    await page.goto('/history');
    await expect(page.locator('h1').first()).toContainText('History');

    // Calendar should be visible
    await expect(page.locator('.react-calendar')).toBeVisible();
  });

  test('should display activity type filter', async ({ page }) => {
    await page.goto('/history');

    // Filter should be visible with options
    await expect(page.getByRole('button', { name: 'All' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Lifting' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Stretch' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Meditate' })).toBeVisible();
  });

  test('should filter by workout type', async ({ page, api }) => {
    // Create both workout and stretch activities
    await api.setupWorkoutScenario('E2E Bench Press');
    const workout = await api.getTodaysWorkout();
    if (workout) {
      await api.completeWorkoutViaApi(workout.id);
    }
    await api.createQuickStretchSession();

    await page.goto('/history');
    await page.waitForLoadState('networkidle');

    // Click on Lifting filter
    await page.getByRole('button', { name: 'Lifting' }).click();

    // Should still show calendar
    await expect(page.locator('.react-calendar')).toBeVisible();
  });

  test('should filter by stretch type', async ({ page, api }) => {
    await api.createQuickStretchSession();

    await page.goto('/history');
    await page.waitForLoadState('networkidle');

    // Click on Stretch filter
    await page.getByRole('button', { name: 'Stretch' }).click();

    // Should still show calendar
    await expect(page.locator('.react-calendar')).toBeVisible();
  });

  test('should show day detail dialog when clicking a date', async ({ page }) => {
    await page.goto('/history');

    // Click on today's date
    const today = new Date();
    const monthName = today.toLocaleDateString('en-US', { month: 'long' });
    const day = today.getDate();
    const year = today.getFullYear();
    const datePattern = new RegExp(`${monthName}\\s+${day},\\s+${year}`);

    await page.getByRole('button', { name: datePattern }).click();

    // Dialog should appear
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('should navigate months', async ({ page }) => {
    await page.goto('/history');

    const initialMonth = await page.locator('.react-calendar__navigation__label').textContent();

    // Click previous month
    await page.getByRole('button', { name: '< Prev' }).click();

    const newMonth = await page.locator('.react-calendar__navigation__label').textContent();
    expect(newMonth).not.toBe(initialMonth);
  });
});

test.describe('Profile Page', () => {
  test.beforeEach(async ({ api }) => {
    await api.resetDatabase();
  });

  test('should display profile page', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.locator('h1').first()).toContainText('Profile');
  });

  test('should show stats section', async ({ page }) => {
    await page.goto('/profile');

    // Should have stats displayed
    await expect(page.getByText(/Workouts|Statistics|Stats/i).first()).toBeVisible();
  });

  test('should be accessible from global nav', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /profile/i }).click();

    await expect(page.locator('h1').first()).toContainText('Profile');
    await expect(page).toHaveURL(/\/profile$/);
  });
});

test.describe('Route Structure', () => {
  test.beforeEach(async ({ api }) => {
    await api.resetDatabase();
  });

  test('lifting plans should be at /lifting/plans', async ({ page }) => {
    await page.goto('/lifting/plans');
    await expect(page.locator('h1').first()).toContainText('My Plans');
  });

  test('lifting exercises should be at /lifting/exercises', async ({ page }) => {
    await page.goto('/lifting/exercises');
    await expect(page.locator('h1').first()).toContainText('Exercise Library');
  });

  test('lifting meso should be at /lifting', async ({ page }) => {
    await page.goto('/lifting');
    await expect(page.locator('h1').first()).toContainText('Mesocycle');
  });

  test('stretch should be at /stretch', async ({ page }) => {
    await page.goto('/stretch');
    await expect(page.locator('h1').first()).toContainText('Stretch');
  });

  test('meditation should be at /meditation', async ({ page }) => {
    await page.goto('/meditation');
    await expect(page.locator('h1').first()).toContainText('Meditation');
  });

  test('history should be at /history', async ({ page }) => {
    await page.goto('/history');
    await expect(page.locator('h1').first()).toContainText('History');
  });

  test('profile should be at /profile', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.locator('h1').first()).toContainText('Profile');
  });

  test('activities hub should be at /activities', async ({ page }) => {
    await page.goto('/activities');
    await expect(page.locator('h1').first()).toContainText('Activities');
  });
});
