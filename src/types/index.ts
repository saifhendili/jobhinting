export interface Company {
  id: string;
  name: string;
  slug: string;
  website?: string;
  domain?: string;
  logo?: string;
  description?: string;
  summary?: string;
  industry?: string;
  subIndustry?: string;
  businessCategory?: string;
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
  phoneNumbers: string[];
  publicEmails: string[];
  supportEmail?: string;
  hrEmail?: string;
  recruitmentEmail?: string;
  contactPage?: string;
  privacyPage?: string;
  termsPage?: string;
  blog?: string;
  careersPage?: string;
  hiringScore?: number;
  growthScore?: number;
  startupScore?: number;
  remoteScore?: number;
  technologyScore?: number;
  aiAdoptionScore?: number;
  frontendFramework?: string;
  backendFramework?: string;
  cms?: string;
  hostingProvider?: string;
  cloudProvider?: string;
  cdn?: string;
  analytics?: string;
  tagManager?: string;
  ssl?: boolean;
  robotsTxt?: boolean;
  sitemap?: boolean;
  language?: string;
  isEnriched: boolean;
  isVerified: boolean;
  isDuplicate: boolean;
  createdAt: string;
  updatedAt: string;
  lastScrapedAt?: string;
  jobCount?: number;
  technologies?: Technology[];
}

export interface Job {
  id: string;
  title: string;
  department?: string;
  location?: string;
  employmentType?: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP' | 'FREELANCE';
  remoteStatus?: 'FULLY_REMOTE' | 'HYBRID' | 'ON_SITE' | 'UNKNOWN';
  isWorldwideRemote: boolean;
  salary?: string;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  experienceLevel?: 'ENTRY' | 'MID' | 'SENIOR' | 'LEAD' | 'EXECUTIVE';
  postedDate?: string;
  closingDate?: string;
  jobUrl?: string;
  applyUrl?: string;
  benefits: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  technologies: string[];
  description?: string;
  status: 'ACTIVE' | 'CLOSED' | 'EXPIRED';
  companyId: string;
  company?: Company;
  createdAt: string;
  updatedAt: string;
}

export interface Technology {
  id: string;
  name: string;
  category?: string;
  description?: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'ADMIN' | 'USER';
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalCompanies: number;
  totalJobs: number;
  activeJobs: number;
  fullyRemoteJobs: number;
  newCompaniesToday: number;
  newJobsToday: number;
  topCountries: { country: string; count: number }[];
  topIndustries: { industry: string; count: number }[];
  jobsByRemoteStatus: { status: string; count: number }[];
  companiesByScore: { score: string; count: number }[];
  recentScrapes: ScrapeLog[];
}

export interface ScrapeLog {
  id: string;
  source: string;
  status: string;
  itemsFound: number;
  itemsAdded: number;
  itemsUpdated: number;
  errors: string[];
  duration?: number;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface FilterOptions {
  countries: string[];
  industries: string[];
  remotePolicies: string[];
  companySizes: string[];
  technologies: string[];
  departments: string[];
  employmentTypes: string[];
  experienceLevels: string[];
}
