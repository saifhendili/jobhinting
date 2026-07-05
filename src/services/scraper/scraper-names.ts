// Plain list of registered scraper names, with zero scraper/browser/http
// imports so it's safe to bundle into client components (e.g. the admin
// panel's source picker). scraper.registry.ts is typed against this list so
// the two can't drift apart.
export const SCRAPER_NAMES = [
  'RemoteOK',
  'WeWorkRemotely',
  'Himalayas',
  'Jobspresso',
  'Greenhouse',
  'Lever',
  'Indeed',
  'LinkedIn',
  'GoogleJobs',
  'ZipRecruiter',
  'Glassdoor',
  'GoogleDiscovery',
  'Ashby',
  'Workable',
  'SmartRecruiters',
  'Teamtailor',
  'BambooHR',
  'Personio',
  'Recruitee',
  'WelcomeToTheJungle',
] as const;

export type ScraperName = (typeof SCRAPER_NAMES)[number];
