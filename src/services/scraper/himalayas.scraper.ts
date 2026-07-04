import { BaseScraper, ScrapeResult, ScrapedCompany, ScrapedJob } from './base.scraper';
import { logger } from '@/lib/logger';

export class HimalayasScraper extends BaseScraper {
  constructor() {
    super({
      name: 'Himalayas',
      baseUrl: 'https://himalayas.app',
      useBrowser: false,
      rateLimitMs: 2000,
    });
  }

  async scrape(): Promise<ScrapeResult[]> {
    const results: ScrapeResult[] = [];
    
    try {
      // Himalayas has a JSON API
      const jobs = await this.fetchJson<any[]>(`${this.config.baseUrl}/api/jobs?page=1&limit=100`);
      
      const companyMap = new Map<string, { company: ScrapedCompany; jobs: ScrapedJob[] }>();

      for (const job of jobs) {
        const companyName = job.company?.name?.trim() || 'Unknown';
        
        if (!companyMap.has(companyName)) {
          const company: ScrapedCompany = {
            name: companyName,
            website: job.company?.website,
            logo: job.company?.logo,
            description: job.company?.description,
            companySize: job.company?.size,
            remotePolicy: 'Fully Remote',
          };
          companyMap.set(companyName, { company, jobs: [] });
        }

        const scrapedJob: ScrapedJob = {
          title: job.title,
          department: job.department,
          location: job.location,
          jobUrl: job.url,
          applyUrl: job.applyUrl,
          description: job.description,
          technologies: job.technologies || [],
          requiredSkills: job.skills || [],
          salary: job.salary,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          currency: job.currency,
          experienceLevel: job.experienceLevel,
          employmentType: job.employmentType,
          remoteStatus: 'FULLY_REMOTE',
          isWorldwideRemote: job.location?.toLowerCase().includes('worldwide') || false,
          postedDate: job.postedAt ? new Date(job.postedAt) : undefined,
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

      logger.info(`Himalayas scraped ${results.length} companies`);
    } catch (error) {
      logger.error('Himalayas scraper error', { error: (error as Error).message });
      throw error;
    }

    return results;
  }
}
