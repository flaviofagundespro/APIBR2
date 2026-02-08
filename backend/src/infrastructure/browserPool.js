import puppeteer from 'puppeteer';
import { config } from '../config/index.js';
import { logger } from '../config/logger.js';

class BrowserPool {
  constructor() {
    this.browsers = [];
    this.availableBrowsers = [];
    this.busyBrowsers = new Set();
    this.initialized = false;
  }

  static getInstance() {
    if (!BrowserPool.instance) {
      BrowserPool.instance = new BrowserPool();
    }
    return BrowserPool.instance;
  }

  async initialize() {
    if (this.initialized) return;

    logger.info('Initializing browser pool...', { size: config.browserPool.size });

    try {
      for (let i = 0; i < config.browserPool.size; i++) {
        const browser = await puppeteer.launch({
          headless: config.browserPool.headless ? "new" : false,
          args: [
            // Critical flags for Linux/Container environments
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            // Additional optimizations
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
          ],
        });

        this.browsers.push(browser);
        this.availableBrowsers.push(browser);
      }

      this.initialized = true;
      logger.info('Browser pool initialized successfully', {
        total: this.browsers.length,
        available: this.availableBrowsers.length
      });
    } catch (error) {
      logger.error('Failed to initialize browser pool:', error);
      throw error;
    }
  }

  async getBrowser() {
    if (!this.initialized) {
      await this.initialize();
    }

    if (this.availableBrowsers.length === 0) {
      throw new Error('No browsers available in pool');
    }

    const browser = this.availableBrowsers.pop();
    this.busyBrowsers.add(browser);

    logger.debug('Browser acquired from pool', {
      available: this.availableBrowsers.length,
      busy: this.busyBrowsers.size
    });

    return browser;
  }

  async releaseBrowser(browser) {
    if (this.busyBrowsers.has(browser)) {
      this.busyBrowsers.delete(browser);
      this.availableBrowsers.push(browser);

      logger.debug('Browser released to pool', {
        available: this.availableBrowsers.length,
        busy: this.busyBrowsers.size
      });
    }
  }

  async createPage(browser) {
    const page = await browser.newPage();

    // Set default viewport
    await page.setViewport({ width: 1920, height: 1080 });

    // Set user agent
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    );

    // Set timeout
    page.setDefaultTimeout(config.browserPool.timeout);
    page.setDefaultNavigationTimeout(config.browserPool.timeout);

    return page;
  }

  async closePage(page) {
    try {
      await page.close();
    } catch (error) {
      logger.warn('Error closing page:', error);
    }
  }

  async destroy() {
    logger.info('Destroying browser pool...');

    for (const browser of this.browsers) {
      try {
        await browser.close();
      } catch (error) {
        logger.warn('Error closing browser:', error);
      }
    }

    this.browsers = [];
    this.availableBrowsers = [];
    this.busyBrowsers.clear();
    this.initialized = false;

    logger.info('Browser pool destroyed');
  }

  getStats() {
    return {
      total: this.browsers.length,
      available: this.availableBrowsers.length,
      busy: this.busyBrowsers.size,
      initialized: this.initialized,
    };
  }
}

export { BrowserPool };

