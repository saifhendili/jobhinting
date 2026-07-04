import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import type { Company, Prisma } from '@prisma/client';

export class CompanyRepository {
  async findById(id: string) {
    return prisma.company.findUnique({
      where: { id },
      include: {
        jobs: { take: 5, orderBy: { createdAt: 'desc' } },
        technologies: { include: { technology: true } },
        contacts: { take: 10 },
        sources: true,
      },
    });
  }

  async findBySlug(slug: string) {
    return prisma.company.findUnique({
      where: { slug },
      include: {
        jobs: { orderBy: { createdAt: 'desc' } },
        technologies: { include: { technology: true } },
        contacts: true,
      },
    });
  }

  async findByDomain(domain: string) {
    return prisma.company.findUnique({ where: { domain } });
  }

  async search(params: {
    query?: string;
    country?: string;
    industry?: string;
    remotePolicy?: string;
    companySize?: string;
    minHiringScore?: number;
    technologies?: string[];
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }) {
    const where: Prisma.CompanyWhereInput = { isDuplicate: false };

    if (params.query) {
      where.OR = [
        { name: { contains: params.query, mode: 'insensitive' } },
        { description: { contains: params.query, mode: 'insensitive' } },
        { industry: { contains: params.query, mode: 'insensitive' } },
      ];
    }

    if (params.country) where.country = params.country;
    if (params.industry) where.industry = params.industry;
    if (params.remotePolicy) where.remotePolicy = params.remotePolicy;
    if (params.companySize) where.companySize = params.companySize;
    if (params.minHiringScore !== undefined) {
      where.hiringScore = { gte: params.minHiringScore };
    }

    if (params.technologies && params.technologies.length > 0) {
      where.technologies = {
        some: { technology: { name: { in: params.technologies } } },
      };
    }

    const orderBy: Prisma.CompanyOrderByWithRelationInput = {};
    if (params.sortBy === 'hiringScore') {
      orderBy.hiringScore = params.sortOrder;
    } else if (params.sortBy === 'name') {
      orderBy.name = params.sortOrder;
    } else if (params.sortBy === 'updatedAt') {
      orderBy.updatedAt = params.sortOrder;
    } else {
      orderBy.createdAt = params.sortOrder;
    }

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        orderBy,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        include: {
          technologies: { include: { technology: true } },
          _count: { select: { jobs: true } },
        },
      }),
      prisma.company.count({ where }),
    ]);

    return { companies, total };
  }

  async create(data: Prisma.CompanyCreateInput) {
    return prisma.company.create({ data });
  }

  async update(id: string, data: Prisma.CompanyUpdateInput) {
    return prisma.company.update({ where: { id }, data });
  }

  async upsertByDomain(domain: string, data: Prisma.CompanyCreateInput) {
    return prisma.company.upsert({
      where: { domain },
      update: data,
      create: data,
    });
  }

  async getFilterOptions() {
    const [countries, industries, remotePolicies, companySizes, technologies] = await Promise.all([
      prisma.company.findMany({ where: { country: { not: null } }, distinct: ['country'], select: { country: true } }),
      prisma.company.findMany({ where: { industry: { not: null } }, distinct: ['industry'], select: { industry: true } }),
      prisma.company.findMany({ where: { remotePolicy: { not: null } }, distinct: ['remotePolicy'], select: { remotePolicy: true } }),
      prisma.company.findMany({ where: { companySize: { not: null } }, distinct: ['companySize'], select: { companySize: true } }),
      prisma.technology.findMany({ select: { name: true }, orderBy: { name: 'asc' } }),
    ]);

    return {
      countries: countries.map(c => c.country).filter(Boolean) as string[],
      industries: industries.map(i => i.industry).filter(Boolean) as string[],
      remotePolicies: remotePolicies.map(r => r.remotePolicy).filter(Boolean) as string[],
      companySizes: companySizes.map(s => s.companySize).filter(Boolean) as string[],
      technologies: technologies.map(t => t.name),
    };
  }

  async getStats() {
    const [totalCompanies, newCompaniesToday, topCountries, topIndustries] = await Promise.all([
      prisma.company.count({ where: { isDuplicate: false } }),
      prisma.company.count({
        where: {
          isDuplicate: false,
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.company.groupBy({
        by: ['country'],
        where: { isDuplicate: false, country: { not: null } },
        _count: { country: true },
        orderBy: { _count: { country: 'desc' } },
        take: 10,
      }),
      prisma.company.groupBy({
        by: ['industry'],
        where: { isDuplicate: false, industry: { not: null } },
        _count: { industry: true },
        orderBy: { _count: { industry: 'desc' } },
        take: 10,
      }),
    ]);

    return {
      totalCompanies,
      newCompaniesToday,
      topCountries: topCountries.map(c => ({ country: c.country!, count: c._count.country })),
      topIndustries: topIndustries.map(i => ({ industry: i.industry!, count: i._count.industry })),
    };
  }
}

export const companyRepository = new CompanyRepository();
