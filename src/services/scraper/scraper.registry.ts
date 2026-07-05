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
import { AshbyScraper } from './ashby.scraper';
import { WorkableScraper } from './workable.scraper';
import { SmartRecruitersScraper } from './smartrecruiters.scraper';
import { TeamtailorScraper } from './teamtailor.scraper';
import { BambooHRScraper } from './bamboohr.scraper';
import { PersonioScraper } from './personio.scraper';
import { RecruiteeScraper } from './recruitee.scraper';
import { WelcomeToTheJungleScraper } from './welcometothejungle.scraper';
import { BaseScraper } from './base.scraper';
import { ScraperName } from './scraper-names';

const scraperRegistry: Record<ScraperName, () => BaseScraper> = {
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
  'Ashby': () => new AshbyScraper(),
  'Workable': () => new WorkableScraper(),
  'SmartRecruiters': () => new SmartRecruitersScraper(),
  'Teamtailor': () => new TeamtailorScraper(),
  'BambooHR': () => new BambooHRScraper(),
  'Personio': () => new PersonioScraper(),
  'Recruitee': () => new RecruiteeScraper(),
  'WelcomeToTheJungle': () => new WelcomeToTheJungleScraper(),
};

export function getScraper(name: string): BaseScraper | null {
  const factory = (scraperRegistry as Record<string, () => BaseScraper>)[name];
  return factory ? factory() : null;
}
