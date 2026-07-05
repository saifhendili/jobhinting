import { BaseScraper, ScrapeResult, ScrapedCompany, ScrapedJob } from './base.scraper';
import { logger } from '@/lib/logger';

// SmartRecruiters public Posting API: https://developers.smartrecruiters.com/docs/posting-api
// GET https://api.smartrecruiters.com/v1/companies/{identifier}/postings
const SMARTRECRUITERS_COMPANIES = ['smartrecruiters', 'Visa', 'Bosch', 'McDonalds', 'Ikea', 'Adecco'];

interface SmartRecruitersPosting {
  id: string;
  name: string;
  company: { identifier: string; name: string };
  releasedDate?: string;
  location?: {
    city?: string;
    region?: string;
    country?: string;
    remote?: boolean;
    hybrid?: boolean;
    fullLocation?: string;
  };
  department?: { label: string };
  typeOfEmployment?: { label: string };
  experienceLevel?: { label: string };
}

interface SmartRecruitersPostingsResponse {
  offset: number;
  limit: number;
  totalFound: number;
  content: SmartRecruitersPosting[];
}

function mapEmploymentType(label?: string): string | undefined {
  if (!label) return undefined;
  const l = label.toLowerCase();
  if (l.includes('full')) return 'FULL_TIME';
  if (l.includes('part')) return 'PART_TIME';
  if (l.includes('intern')) return 'INTERNSHIP';
  if (l.includes('freelance')) return 'FREELANCE';
  if (l.includes('contract') || l.includes('temporary')) return 'CONTRACT';
  return undefined;
}

function mapExperienceLevel(label?: string): string | undefined {
  if (!label) return undefined;
  const l = label.toLowerCase();
  if (l.includes('entry') || l.includes('associate')) return 'ENTRY';
  if (l.includes('mid')) return 'MID';
  if (l.includes('director') || l.includes('manager') || l.includes('lead')) return 'LEAD';
  if (l.includes('executive') || l.includes('chief') || l.includes('vp')) return 'EXECUTIVE';
  if (l.includes('senior')) return 'SENIOR';
  return undefined;
}

export class SmartRecruitersScraper extends BaseScraper {
  constructor() {
    super({
      name: 'SmartRecruiters',
      baseUrl: 'https://api.smartrecruiters.com',
      useBrowser: false,
      rateLimitMs: 2000,
    });
  }

  async scrape(): Promise<ScrapeResult[]> {
    const results: ScrapeResult[] = [];

    for (const identifier of SMARTRECRUITERS_COMPANIES) {
      try {
        const response = await this.fetchJson<SmartRecruitersPostingsResponse>(
          `${this.config.baseUrl}/v1/companies/${identifier}/postings?limit=100`
        );

        if (response.content.length === 0) continue;

        const company: ScrapedCompany = {
          name: response.content[0].company.name || identifier,
          careersPage: `https://jobs.smartrecruiters.com/${identifier}`,
        };

        const jobs: ScrapedJob[] = response.content.map((posting) => {
          const location = posting.location?.fullLocation || '';

          return {
            title: posting.name,
            department: posting.department?.label,
            location,
            jobUrl: `https://jobs.smartrecruiters.com/${identifier}/${posting.id}`,
            employmentType: mapEmploymentType(posting.typeOfEmployment?.label) as ScrapedJob['employmentType'],
            experienceLevel: mapExperienceLevel(posting.experienceLevel?.label) as ScrapedJob['experienceLevel'],
            remoteStatus: posting.location?.remote
              ? 'FULLY_REMOTE'
              : posting.location?.hybrid
                ? 'HYBRID'
                : 'ON_SITE',
            isWorldwideRemote: Boolean(posting.location?.remote) && location.toLowerCase().includes('worldwide'),
            postedDate: posting.releasedDate ? new Date(posting.releasedDate) : undefined,
          };
        });

        results.push({ company, jobs, source: this.config.name, scrapedAt: new Date() });
      } catch (err) {
        logger.warn(`Failed to scrape SmartRecruiters company: ${identifier}`, { error: (err as Error).message });
      }
    }

    logger.info(`SmartRecruiters scraped ${results.length} companies`);
    return results;
  }
}
