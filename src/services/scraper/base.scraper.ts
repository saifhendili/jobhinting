import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import * as cheerio from 'cheerio';
import { chromium, Browser, Page } from 'playwright';
import { logger } from '@/lib/logger';

export interface ScraperConfig {
  name: string;
  baseUrl: string;
  useBrowser?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  requestTimeout?: number;
  rateLimitMs?: number;
  maxPages?: number;
}

export interface ScrapedJob {
  title: string;
  department?: string;
  location?: string;
  employmentType?: string;
  remoteStatus?: string;
  isWorldwideRemote?: boolean;
  salary?: string;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  experienceLevel?: string;
  postedDate?: Date;
  closingDate?: Date;
  jobUrl: string;
  applyUrl?: string;
  benefits?: string[];
  requiredSkills?: string[];
  preferredSkills?: string[];
  technologies?: string[];
  description?: string;
}

export interface ScrapedCompany {
  name: string;
  website?: string;
  logo?: string;
  description?: string;
  industry?: string;
  subIndustry?: string;
  founded?: number;
  companySize?: string;
  headquarters?: string;
  country?: string;
  city?: string;
  state?: string;
  remotePolicy?: string;
  linkedIn?: string;
  twitter?: string;
  facebook?: string;
  instagram?: string;
  github?: string;
  youtube?: string;
  phoneNumbers?: string[];
  publicEmails?: string[];
  supportEmail?: string;
  hrEmail?: string;
  recruitmentEmail?: string;
  contactPage?: string;
  privacyPage?: string;
  termsPage?: string;
  blog?: string;
  careersPage?: string;
}

export interface ScrapeResult {
  company: ScrapedCompany;
  jobs: ScrapedJob[];
  source: string;
  scrapedAt: Date;
}

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
];

const ACCEPT_HEADERS = [
  'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
];

export abstract class BaseScraper {
  protected config: ScraperConfig;
  protected axiosInstance: AxiosInstance;
  protected browser?: Browser;
  protected page?: Page;
  private lastRequestTime: number = 0;
  private retryCount: number = 0;

  constructor(config: ScraperConfig) {
    this.config = {
      maxRetries: 3,
      retryDelay: 1000,
      requestTimeout: 30000,
      rateLimitMs: 1000,
      maxPages: 10,
      ...config,
    };

    this.axiosInstance = axios.create({
      timeout: this.config.requestTimeout,
      headers: {
        'Accept': ACCEPT_HEADERS[0],
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0',
      },
    });
  }

  protected getRandomUserAgent(): string {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  }

  protected async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  protected async rateLimit(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < this.config.rateLimitMs!) {
      await this.delay(this.config.rateLimitMs! - elapsed);
    }
    this.lastRequestTime = Date.now();
  }

  protected async fetchHtml(url: string, options?: AxiosRequestConfig): Promise<cheerio.CheerioAPI> {
    await this.rateLimit();

    const config: AxiosRequestConfig = {
      ...options,
      headers: {
        'User-Agent': this.getRandomUserAgent(),
        ...options?.headers,
      },
    };

    try {
      const response = await this.axiosInstance.get(url, config);
      return cheerio.load(response.data);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        if (error.response.status === 429 || error.response.status === 403) {
          logger.warn(`Rate limited or blocked on ${url}`, { status: error.response.status, source: this.config.name });
          throw new Error(`Blocked: ${error.response.status}`);
        }
      }
      throw error;
    }
  }

  protected async fetchJson<T>(url: string, options?: AxiosRequestConfig): Promise<T> {
    await this.rateLimit();

    const config: AxiosRequestConfig = {
      ...options,
      headers: {
        'User-Agent': this.getRandomUserAgent(),
        'Accept': 'application/json',
        ...options?.headers,
      },
    };

    const response = await this.axiosInstance.get(url, config);
    return response.data;
  }

  protected async initBrowser(): Promise<Page> {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--window-size=1920,1080',
        ],
      });
    }

    if (!this.page) {
      this.page = await this.browser.newPage({
        userAgent: this.getRandomUserAgent(),
        viewport: { width: 1920, height: 1080 },
      });

      await this.page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': ACCEPT_HEADERS[0],
      });
    }

    return this.page;
  }

  protected async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = undefined;
      this.page = undefined;
    }
  }

  protected async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < (this.config.maxRetries || 3); attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        const delay = (this.config.retryDelay || 1000) * Math.pow(2, attempt);
        logger.warn(`Retry ${attempt + 1}/${this.config.maxRetries} for ${this.config.name}`, {
          error: lastError.message,
          delay,
        });
        await this.delay(delay);
      }
    }

    throw lastError;
  }

  protected detectCaptcha($: cheerio.CheerioAPI): boolean {
    const captchaIndicators = [
      'captcha',
      'recaptcha',
      'g-recaptcha',
      'hcaptcha',
      'cf-challenge',
      'challenge-form',
      'please verify',
      'are you human',
      'security check',
    ];

    const html = $.html().toLowerCase();
    return captchaIndicators.some(indicator => html.includes(indicator));
  }

  protected generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  protected extractDomain(url: string): string | undefined {
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      return urlObj.hostname.replace(/^www\./, '');
    } catch {
      return undefined;
    }
  }

  abstract scrape(): Promise<ScrapeResult[]>;

  async run(): Promise<ScrapeResult[]> {
    const startTime = Date.now();
    logger.info(`Starting scraper: ${this.config.name}`);

    try {
      const results = await this.withRetry(() => this.scrape());
      const duration = Date.now() - startTime;
      logger.info(`Scraper completed: ${this.config.name}`, {
        duration,
        results: results.length,
      });
      return results;
    } catch (error) {
      logger.error(`Scraper failed: ${this.config.name}`, { error: (error as Error).message });
      throw error;
    } finally {
      await this.closeBrowser();
    }
  }
}
