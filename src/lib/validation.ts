import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const companySearchSchema = z.object({
  query: z.string().optional(),
  country: z.string().optional(),
  industry: z.string().optional(),
  remotePolicy: z.string().optional(),
  companySize: z.string().optional(),
  minHiringScore: z.coerce.number().min(0).max(100).optional(),
  technologies: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.enum(['name', 'hiringScore', 'createdAt', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const jobSearchSchema = z.object({
  query: z.string().optional(),
  companyId: z.string().optional(),
  remoteStatus: z.enum(['FULLY_REMOTE', 'HYBRID', 'ON_SITE', 'UNKNOWN']).optional(),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE']).optional(),
  experienceLevel: z.enum(['ENTRY', 'MID', 'SENIOR', 'LEAD', 'EXECUTIVE']).optional(),
  country: z.string().optional(),
  department: z.string().optional(),
  days: z.coerce.number().min(0).max(365).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.enum(['title', 'postedDate', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const scrapeRequestSchema = z.object({
  sources: z.array(z.string()).min(1, 'At least one source is required'),
  options: z.object({
    enrich: z.boolean().default(false),
    maxPages: z.coerce.number().min(1).max(100).default(10),
  }).optional(),
});

export const exportRequestSchema = z.object({
  format: z.enum(['csv', 'xlsx', 'json']),
  entity: z.enum(['companies', 'jobs']),
  filters: z.string().optional(),
});

export const savedSearchSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  query: z.string().optional(),
  filters: z.string().optional(),
});
