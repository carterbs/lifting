import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import puppeteer, { type Browser, type Page } from 'puppeteer';

describe('Smoke Tests', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  it('should load the home page', async () => {
    const baseUrl = process.env['BASE_URL'] ?? 'http://localhost:3000';
    await page.goto(baseUrl);

    const title = await page.title();
    expect(title).toContain('Lifting');
  });

  it('should display the app heading', async () => {
    const baseUrl = process.env['BASE_URL'] ?? 'http://localhost:3000';
    await page.goto(baseUrl);

    const heading = await page.$eval('h1', (el) => el.textContent);
    expect(heading).toBe('Lifting');
  });
});
