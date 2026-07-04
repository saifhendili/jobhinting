import { RemoteOKScraper } from './remoteok.scraper';
import { WeWorkRemotelyScraper } from './weworkremotely.scraper';
import { HimalayasScraper } from './himalayas.scraper';
import { JobspressoScraper } from './jobspresso.scraper';
import { GreenhouseScraper } from './greenhouse.scraper';
import { LeverScraper } from './lever.scraper';
import { IndeedScraper } from './indeed.scraper';
import { LinkedInScraper } from './linkedin.scraper';
import { GoogleJobsScraper } from './googlejobs.scraper';
import { ZipRecruiterScraper } from './ziprecruiter.scraper';
import { GlassdoorScraper } from './glassdoor.scraper';
import { GoogleDiscoveryScraper } from './google-discovery.scraper';
import { BaseScraper } from './base.scraper';

const scraperRegistry: Record<string, () => BaseScraper> = {
  'RemoteOK': () => new RemoteOKScraper(),
  'WeWorkRemotely': () => new WeWorkRemotelyScraper(),
  'Himalayas': () => new HimalayasScraper(),
  'Jobspresso': () => new JobspressoScraper(),
  'Greenhouse': () => new GreenhouseScraper(),
  'Lever': () => new LeverScraper(),
  'Indeed': () => new IndeedScraper(),
  'LinkedIn': () => new LinkedInScraper(),
  'GoogleJobs': () => new GoogleJobsScraper(),
  'ZipRecruiter': () => new ZipRecruiterScraper(),
  'Glassdoor': () => new GlassdoorScraper(),
  'GoogleDiscovery': () => new GoogleDiscoveryScraper(),
};

export function getScraper(name: string): BaseScraper | null {
  const factory = scraperRegistry[name];
  return factory ? factory() : null;
}

export function getAllScraperNames(): string[] {
  return Object.keys(scraperRegistry);
}
