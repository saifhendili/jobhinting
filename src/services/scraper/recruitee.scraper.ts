import { BaseScraper, ScrapeResult, ScrapedCompany, ScrapedJob } from './base.scraper';
import { logger } from '@/lib/logger';

// Recruitee's public careers site API: https://docs.recruitee.com/reference/intro-to-careers-site-api
// GET https://{subdomain}.recruitee.com/api/offers
const RECRUITEE_BOARDS = ['jobs', 'jbdeutschesradio.s'];

interface RecruiteeOffer {
  title: string;
  company_name?: string;
  department?: string;
  location?: string;
  city?: string;
  country?: string;
  description?: string;
  careers_url: string;
  careers_apply_url?: string;
  employment_type_code?: string;
  remote?: boolean;
  hybrid?: boolean;
  on_site?: boolean;
  published_at?: string;
}

interface RecruiteeOffersResponse {
  offers: RecruiteeOffer[];
}

function mapEmploymentType(code?: string): string | undefined {
  if (!code) return undefined;
  const c = code.toLowerCase();
  if (c.includes('fulltime')) return 'FULL_TIME';
  if (c.includes('parttime')) return 'PART_TIME';
  if (c.includes('internship')) return 'INTERNSHIP';
  if (c.includes('freelance')) return 'FREELANCE';
  if (c.includes('temporary') || c.includes('contract')) return 'CONTRACT';
  return undefined;
}

export class RecruiteeScraper extends BaseScraper {
  constructor() {
    super({
      name: 'Recruitee',
      baseUrl: 'https://recruitee.com',
      useBrowser: false,
      rateLimitMs: 2000,
    });
  }

  async scrape(): Promise<ScrapeResult[]> {
    const results: ScrapeResult[] = [];

    for (const board of RECRUITEE_BOARDS) {
      try {
        const response = await this.fetchJson<RecruiteeOffersResponse>(
          `https://${board}.recruitee.com/api/offers`
        );

        if (!response.offers || response.offers.length === 0) continue;

        const company: ScrapedCompany = {
          name: response.offers[0].company_name || board,
          careersPage: `https://${board}.recruitee.com`,
        };

        const jobs: ScrapedJob[] = response.offers.map((offer) => {
          const location = [offer.city, offer.country].filter(Boolean).join(', ') || offer.location || '';

          return {
            title: offer.title,
            department: offer.department,
            location,
            jobUrl: offer.careers_url,
            applyUrl: offer.careers_apply_url,
            description: offer.description,
            employmentType: mapEmploymentType(offer.employment_type_code) as ScrapedJob['employmentType'],
            remoteStatus: offer.remote ? 'FULLY_REMOTE' : offer.hybrid ? 'HYBRID' : offer.on_site ? 'ON_SITE' : 'UNKNOWN',
            isWorldwideRemote: Boolean(offer.remote) && location.toLowerCase().includes('worldwide'),
            postedDate: offer.published_at ? new Date(offer.published_at) : undefined,
          };
        });

        results.push({ company, jobs, source: this.config.name, scrapedAt: new Date() });
      } catch (err) {
        logger.warn(`Failed to scrape Recruitee board: ${board}`, { error: (err as Error).message });
      }
    }

    logger.info(`Recruitee scraped ${results.length} companies`);
    return results;
  }
}
