import { BaseScraper, ScrapeResult, ScrapedCompany, ScrapedJob } from './base.scraper';
import { logger } from '@/lib/logger';

// Welcome to the Jungle has no official public API. Its site search runs on Algolia
// with a public, search-only key embedded in its own frontend JS (same credentials
// this feed uses), so we query that index directly.
const ALGOLIA_APP_ID = 'CSEKHVMS53';
const ALGOLIA_SEARCH_KEY = '4bd8f6215d0cc52b26430765769e65a0';
const ALGOLIA_URL = `https://${ALGOLIA_APP_ID.toLowerCase()}-dsn.algolia.net/1/indexes/*/queries`;
const JOBS_INDEX = 'wk_cms_jobs_production';
const PAGE_SIZE = 50;

interface WTTJOffice {
  city?: string;
  country?: string;
}

interface WTTJJob {
  slug: string;
  name: string;
  profile?: string;
  department?: string;
  contract_type?: string;
  remote?: 'fulltime' | 'partial' | 'punctual' | 'no' | 'unknown';
  offices: WTTJOffice[];
  published_at?: string;
  organization: { name: string; slug: string };
}

interface AlgoliaResponse {
  results: { hits: WTTJJob[]; nbHits: number; page: number; nbPages: number }[];
}

const CONTRACT_TYPE_MAP: Record<string, string> = {
  FULL_TIME: 'FULL_TIME',
  PART_TIME: 'PART_TIME',
  FREELANCE: 'FREELANCE',
  INTERNSHIP: 'INTERNSHIP',
  TEMPORARY: 'CONTRACT',
};

export class WelcomeToTheJungleScraper extends BaseScraper {
  constructor() {
    super({
      name: 'WelcomeToTheJungle',
      baseUrl: 'https://www.welcometothejungle.com',
      useBrowser: false,
      rateLimitMs: 2000,
    });
  }

  async scrape(): Promise<ScrapeResult[]> {
    const companyMap = new Map<string, { company: ScrapedCompany; jobs: ScrapedJob[] }>();

    try {
      const maxPages = this.config.maxPages || 5;

      for (let page = 0; page < maxPages; page++) {
        const response = await this.fetchJson<AlgoliaResponse>(ALGOLIA_URL, {
          method: 'POST',
          headers: {
            'X-Algolia-API-Key': ALGOLIA_SEARCH_KEY,
            'X-Algolia-Application-Id': ALGOLIA_APP_ID,
            Referer: 'https://www.welcometothejungle.com/',
          },
          data: {
            requests: [
              {
                indexName: JOBS_INDEX,
                params: `hitsPerPage=${PAGE_SIZE}&page=${page}&facetFilters=[["remote:fulltime"]]`,
              },
            ],
          },
        });

        const result = response.results[0];

        for (const job of result.hits) {
          const companyName = job.organization?.name?.trim() || 'Unknown';

          if (!companyMap.has(companyName)) {
            companyMap.set(companyName, {
              company: {
                name: companyName,
                careersPage: `${this.config.baseUrl}/en/companies/${job.organization.slug}`,
              },
              jobs: [],
            });
          }

          const location = (job.offices || []).map((o) => [o.city, o.country].filter(Boolean).join(', ')).join('; ');
          // WTTJ has no explicit worldwide flag (fully-remote jobs still list an anchor
          // office), so fall back to the same "worldwide" text convention used by the
          // other scrapers in this project.
          const isWorldwide =
            job.remote === 'fulltime' &&
            (location.toLowerCase().includes('worldwide') || job.name.toLowerCase().includes('worldwide'));

          companyMap.get(companyName)!.jobs.push({
            title: job.name,
            department: job.department,
            location: isWorldwide ? 'Worldwide' : location,
            jobUrl: `${this.config.baseUrl}/en/companies/${job.organization.slug}/jobs/${job.slug}`,
            description: job.profile,
            employmentType: (job.contract_type ? CONTRACT_TYPE_MAP[job.contract_type] : undefined) as ScrapedJob['employmentType'],
            remoteStatus: job.remote === 'fulltime' ? 'FULLY_REMOTE' : job.remote === 'partial' || job.remote === 'punctual' ? 'HYBRID' : 'ON_SITE',
            isWorldwideRemote: isWorldwide,
            postedDate: job.published_at ? new Date(job.published_at) : undefined,
          });
        }

        if (page + 1 >= result.nbPages) break;
      }

      const results: ScrapeResult[] = Array.from(companyMap.values()).map((value) => ({
        company: value.company,
        jobs: value.jobs,
        source: this.config.name,
        scrapedAt: new Date(),
      }));

      logger.info(`WelcomeToTheJungle scraped ${results.length} companies`);
      return results;
    } catch (error) {
      logger.error('WelcomeToTheJungle scraper error', { error: (error as Error).message });
      throw error;
    }
  }
}
