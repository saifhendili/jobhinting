import { BaseScraper, ScrapeResult, ScrapedCompany, ScrapedJob } from './base.scraper';
import { logger } from '@/lib/logger';

interface RemoteOKJob {
  id: string;
  company: string;
  position: string;
  description: string;
  location: string;
  tags: string[];
  url: string;
  date: string;
  logo: string;
  apply_url: string;
  slug: string;
  original?: boolean;
}

export class RemoteOKScraper extends BaseScraper {
  constructor() {
    super({
      name: 'RemoteOK',
      baseUrl: 'https://remoteok.com/api',
      useBrowser: false,
      rateLimitMs: 2000,
    });
  }

  async scrape(): Promise<ScrapeResult[]> {
    const results: ScrapeResult[] = [];
    
    try {
      const jobs = await this.fetchJson<RemoteOKJob[]>(this.config.baseUrl);
      
      // Skip the first element which is usually metadata
      const actualJobs = jobs.filter(job => job.id && job.id !== '0');
      
      const companyMap = new Map<string, { company: ScrapedCompany; jobs: ScrapedJob[] }>();

      for (const job of actualJobs) {
        const companyName = job.company?.trim() || 'Unknown';
        
        if (!companyMap.has(companyName)) {
          const company: ScrapedCompany = {
            name: companyName,
            logo: job.logo || undefined,
            description: job.description?.substring(0, 500),
            remotePolicy: 'Fully Remote',
          };
          companyMap.set(companyName, { company, jobs: [] });
        }

        const scrapedJob: ScrapedJob = {
          title: job.position,
          location: job.location,
          jobUrl: job.url,
          applyUrl: job.apply_url,
          description: job.description,
          technologies: job.tags || [],
          requiredSkills: job.tags || [],
          postedDate: job.date ? new Date(job.date) : undefined,
          remoteStatus: 'FULLY_REMOTE',
          isWorldwideRemote: job.location?.toLowerCase().includes('worldwide') || false,
        };

        companyMap.get(companyName)!.jobs.push(scrapedJob);
      }

      for (const [, value] of Array.from(companyMap.entries())) {
        results.push({
          company: value.company,
          jobs: value.jobs,
          source: this.config.name,
          scrapedAt: new Date(),
        });
      }

      logger.info(`RemoteOK scraped ${results.length} companies with ${actualJobs.length} jobs`);
    } catch (error) {
      logger.error('RemoteOK scraper error', { error: (error as Error).message });
      throw error;
    }

    return results;
  }
}
