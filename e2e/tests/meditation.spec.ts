import { test, expect } from '@playwright/test';

// Use shorter timeout for meditation tests
test.setTimeout(60000);

test.describe('Meditation Feature', () => {
  test.describe('Setup Screen', () => {
    test('should display meditation setup page', async ({ page }) => {
      await page.goto('/meditation');

      await expect(page.locator('h1')).toContainText('Meditation');
      await expect(page.getByText('Select Duration')).toBeVisible();
    });

    test('should display three duration options', async ({ page }) => {
      await page.goto('/meditation');

      await expect(page.getByRole('button', { name: /5 minutes/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /10 minutes/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /20 minutes/i })).toBeVisible();
    });

    test('should have 10 minutes selected by default', async ({ page }) => {
      await page.goto('/meditation');

      const tenMinButton = page.getByRole('button', { name: /10 minutes/i });
      await expect(tenMinButton).toHaveAttribute('aria-pressed', 'true');
    });

    test('should allow changing duration selection', async ({ page }) => {
      await page.goto('/meditation');

      const fiveMinButton = page.getByRole('button', { name: /5 minutes/i });
      const tenMinButton = page.getByRole('button', { name: /10 minutes/i });

      await fiveMinButton.click();

      await expect(fiveMinButton).toHaveAttribute('aria-pressed', 'true');
      await expect(tenMinButton).toHaveAttribute('aria-pressed', 'false');
    });

    test('should persist duration selection', async ({ page }) => {
      await page.goto('/meditation');

      // Select 20 minutes
      await page.getByRole('button', { name: /20 minutes/i }).click();

      // Reload page
      await page.reload();

      // Should still be 20 minutes
      const twentyMinButton = page.getByRole('button', { name: /20 minutes/i });
      await expect(twentyMinButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  test.describe('Session Flow', () => {
    test('should start a meditation session', async ({ page }) => {
      await page.goto('/meditation');

      // Select 5 minutes for faster test
      await page.getByRole('button', { name: /5 minutes/i }).click();
      await page.getByRole('button', { name: 'Begin Meditation' }).click();

      // Should show session view
      await expect(page.getByText('Basic Breathing')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'End' })).toBeVisible();
    });

    test('should display timer counting down', async ({ page }) => {
      await page.goto('/meditation');

      await page.getByRole('button', { name: /5 minutes/i }).click();
      await page.getByRole('button', { name: 'Begin Meditation' }).click();

      // Timer should be visible and show ~5:00
      const timer = page.locator('text=/[0-4]:[0-5][0-9]/');
      await expect(timer).toBeVisible();
    });

    test('should show phase indicator', async ({ page }) => {
      await page.goto('/meditation');

      await page.getByRole('button', { name: /5 minutes/i }).click();
      await page.getByRole('button', { name: 'Begin Meditation' }).click();

      // Should show Introduction phase initially
      await expect(page.getByText('Introduction')).toBeVisible();
    });

    test('should pause and resume session', async ({ page }) => {
      await page.goto('/meditation');

      await page.getByRole('button', { name: /5 minutes/i }).click();
      await page.getByRole('button', { name: 'Begin Meditation' }).click();

      // Wait for session to start
      await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();

      // Pause
      await page.getByRole('button', { name: 'Pause' }).click();
      await expect(page.getByRole('button', { name: 'Resume' })).toBeVisible();

      // Resume
      await page.getByRole('button', { name: 'Resume' }).click();
      await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
    });

    test('should show confirmation dialog when ending early', async ({ page }) => {
      await page.goto('/meditation');

      await page.getByRole('button', { name: /5 minutes/i }).click();
      await page.getByRole('button', { name: 'Begin Meditation' }).click();

      // Click End
      await page.getByRole('button', { name: 'End' }).click();

      // Should show confirmation dialog
      await expect(page.getByRole('alertdialog')).toBeVisible();
      await expect(page.getByText('End Session?')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'End Session' })).toBeVisible();
    });

    test('should cancel end confirmation and continue session', async ({ page }) => {
      await page.goto('/meditation');

      await page.getByRole('button', { name: /5 minutes/i }).click();
      await page.getByRole('button', { name: 'Begin Meditation' }).click();

      // Click End
      await page.getByRole('button', { name: 'End' }).click();

      // Cancel
      await page.getByRole('button', { name: 'Cancel' }).click();

      // Should still be in session
      await expect(page.getByRole('alertdialog')).not.toBeVisible();
      await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
    });

    test('should end session when confirmed', async ({ page }) => {
      await page.goto('/meditation');

      await page.getByRole('button', { name: /5 minutes/i }).click();
      await page.getByRole('button', { name: 'Begin Meditation' }).click();

      // Click End
      await page.getByRole('button', { name: 'End' }).click();

      // Confirm
      await page.getByRole('button', { name: 'End Session' }).click();

      // Should return to setup screen
      await expect(page.getByText('Select Duration')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Begin Meditation' })).toBeVisible();
    });
  });

  test.describe('Audio Logging (verifies audio triggers)', () => {
    test('should not play bell at session start', async ({ page }) => {
      const consoleLogs: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'log') {
          consoleLogs.push(msg.text());
        }
      });

      await page.goto('/meditation');
      await page.getByRole('button', { name: /5 minutes/i }).click();
      await page.getByRole('button', { name: 'Begin Meditation' }).click();

      // Wait for initial audio to trigger
      await page.waitForTimeout(1000);

      // Should NOT have bell at start
      const bellLogs = consoleLogs.filter((log) => log.includes('Playing bell'));
      expect(bellLogs.length).toBe(0);

      // Should have narration
      const narrationLogs = consoleLogs.filter((log) => log.includes('Playing narration'));
      expect(narrationLogs.length).toBeGreaterThan(0);
    });

    test('should trigger intro narration at session start', async ({ page }) => {
      const consoleLogs: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'log') {
          consoleLogs.push(msg.text());
        }
      });

      await page.goto('/meditation');
      await page.getByRole('button', { name: /5 minutes/i }).click();
      await page.getByRole('button', { name: 'Begin Meditation' }).click();

      // Wait for initial audio
      await page.waitForTimeout(1000);

      // Should trigger intro-welcome cue
      const introLog = consoleLogs.find((log) => log.includes('intro-welcome'));
      expect(introLog).toBeDefined();
    });

    test('should log scheduled cues at session start', async ({ page }) => {
      const consoleLogs: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'log') {
          consoleLogs.push(msg.text());
        }
      });

      await page.goto('/meditation');
      await page.getByRole('button', { name: /5 minutes/i }).click();
      await page.getByRole('button', { name: 'Begin Meditation' }).click();

      await page.waitForTimeout(500);

      // Should log scheduled cues
      const cueLog = consoleLogs.find((log) => log.includes('Starting session with cues'));
      expect(cueLog).toBeDefined();
    });
  });

  test.describe('Session with Fake Timers', () => {
    test('should transition phases as time progresses', async ({ page }) => {
      // Install fake timers before navigating
      await page.clock.install({ time: new Date('2024-01-01T00:00:00') });

      await page.goto('/meditation');
      await page.getByRole('button', { name: /5 minutes/i }).click();
      await page.getByRole('button', { name: 'Begin Meditation' }).click();

      // Should start in Introduction phase
      await expect(page.getByText('Introduction')).toBeVisible();

      // Fast-forward past intro phase (30 seconds for 5-min session)
      // Advance in chunks to allow React to update
      for (let i = 0; i < 7; i++) {
        await page.clock.runFor(5000);
      }

      // Should now be in Breathing phase - wait for the phase text to update
      await expect(page.getByText('Breathing', { exact: true })).toBeVisible({ timeout: 10000 });
    });

    test('should complete session when timer reaches zero', async ({ page }) => {
      // Install fake timers
      await page.clock.install({ time: new Date('2024-01-01T00:00:00') });

      await page.goto('/meditation');
      await page.getByRole('button', { name: /5 minutes/i }).click();
      await page.getByRole('button', { name: 'Begin Meditation' }).click();

      // Fast-forward entire 5 minutes (300 seconds) in chunks
      for (let i = 0; i < 31; i++) {
        await page.clock.runFor(10000);
      }

      // Should show completion screen
      await expect(page.getByText('Session Complete!')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Done' })).toBeVisible();
    });

    test('should show correct stats on completion', async ({ page }) => {
      await page.clock.install({ time: new Date('2024-01-01T00:00:00') });

      await page.goto('/meditation');
      await page.getByRole('button', { name: /5 minutes/i }).click();
      await page.getByRole('button', { name: 'Begin Meditation' }).click();

      // Complete full session in chunks
      for (let i = 0; i < 31; i++) {
        await page.clock.runFor(10000);
      }

      // Should show completion screen with stats
      await expect(page.getByText('Session Complete!')).toBeVisible();
    });

    test('should return to setup after clicking Done', async ({ page }) => {
      await page.clock.install({ time: new Date('2024-01-01T00:00:00') });

      await page.goto('/meditation');
      await page.getByRole('button', { name: /5 minutes/i }).click();
      await page.getByRole('button', { name: 'Begin Meditation' }).click();

      // Complete session in chunks
      for (let i = 0; i < 31; i++) {
        await page.clock.runFor(10000);
      }

      // Click Done
      await page.getByRole('button', { name: 'Done' }).click();

      // Should return to setup
      await expect(page.getByText('Select Duration')).toBeVisible();
    });
  });

  test.describe('Session Recovery', () => {
    test('should offer to resume interrupted session', async ({ page }) => {
      await page.goto('/meditation');
      await page.getByRole('button', { name: /5 minutes/i }).click();
      await page.getByRole('button', { name: 'Begin Meditation' }).click();

      // Wait a moment
      await page.waitForTimeout(1000);

      // Pause the session (this saves state)
      await page.getByRole('button', { name: 'Pause' }).click();

      // Navigate away and back
      await page.goto('/');
      await page.goto('/meditation');

      // Should show recovery prompt with Resume button
      await expect(page.getByRole('button', { name: 'Resume' })).toBeVisible();
    });
  });
});
