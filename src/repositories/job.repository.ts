import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export class JobRepository {
  async findById(id: string) {
    return prisma.job.findUnique({
      where: { id },
      include: { company: true },
    });
  }

  async search(params: {
    query?: string;
    companyId?: string;
    remoteStatus?: string;
    employmentType?: string;
    experienceLevel?: string;
    country?: string;
    department?: string;
    days?: number;
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }) {
    const where: Prisma.JobWhereInput = {};

    if (params.query) {
      where.OR = [
        { title: { contains: params.query, mode: 'insensitive' } },
        { description: { contains: params.query, mode: 'insensitive' } },
        { requiredSkills: { hasSome: [params.query] } },
      ];
    }

    if (params.companyId) where.companyId = params.companyId;
    if (params.remoteStatus) where.remoteStatus = params.remoteStatus as any;
    if (params.employmentType) where.employmentType = params.employmentType as any;
    if (params.experienceLevel) where.experienceLevel = params.experienceLevel as any;
    if (params.country) where.location = { contains: params.country, mode: 'insensitive' };
    if (params.department) where.department = params.department;
    
    // Date filter
    if (params.days && params.days > 0) {
      where.createdAt = { gte: new Date(Date.now() - params.days * 24 * 60 * 60 * 1000) };
    }

    const orderBy: Prisma.JobOrderByWithRelationInput = {};
    if (params.sortBy === 'postedDate') {
      orderBy.postedDate = params.sortOrder;
    } else if (params.sortBy === 'title') {
      orderBy.title = params.sortOrder;
    } else {
      orderBy.createdAt = params.sortOrder;
    }

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        orderBy,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        include: { company: true },
      }),
      prisma.job.count({ where }),
    ]);

    return { jobs, total };
  }

  async create(data: Prisma.JobCreateInput) {
    return prisma.job.create({ data });
  }

  async upsert(externalId: string, data: Prisma.JobCreateInput) {
    const existing = await prisma.job.findFirst({ where: { jobUrl: data.jobUrl as string } });
    if (existing) {
      return prisma.job.update({ where: { id: existing.id }, data });
    }
    return prisma.job.create({ data });
  }

  async getFilterOptions() {
    const [departments, employmentTypes, experienceLevels, remoteStatuses] = await Promise.all([
      prisma.job.findMany({ where: { department: { not: null } }, distinct: ['department'], select: { department: true } }),
      prisma.job.findMany({ where: { employmentType: { not: null } }, distinct: ['employmentType'], select: { employmentType: true } }),
      prisma.job.findMany({ where: { experienceLevel: { not: null } }, distinct: ['experienceLevel'], select: { experienceLevel: true } }),
      prisma.job.findMany({ where: { remoteStatus: { not: null } }, distinct: ['remoteStatus'], select: { remoteStatus: true } }),
    ]);

    return {
      departments: departments.map(d => d.department).filter(Boolean) as string[],
      employmentTypes: employmentTypes.map(e => e.employmentType).filter(Boolean) as string[],
      experienceLevels: experienceLevels.map(e => e.experienceLevel).filter(Boolean) as string[],
      remoteStatuses: remoteStatuses.map(r => r.remoteStatus).filter(Boolean) as string[],
    };
  }

  async getStats() {
    const [totalJobs, activeJobs, fullyRemoteJobs, newJobsToday] = await Promise.all([
      prisma.job.count(),
      prisma.job.count({ where: { status: 'ACTIVE' } }),
      prisma.job.count({ where: { remoteStatus: 'FULLY_REMOTE', status: 'ACTIVE' } }),
      prisma.job.count({
        where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      }),
    ]);

    const jobsByRemoteStatus = await prisma.job.groupBy({
      by: ['remoteStatus'],
      where: { status: 'ACTIVE', remoteStatus: { not: null } },
      _count: { remoteStatus: true },
    });

    return {
      totalJobs,
      activeJobs,
      fullyRemoteJobs,
      newJobsToday,
      jobsByRemoteStatus: jobsByRemoteStatus.map(j => ({ status: j.remoteStatus!, count: j._count.remoteStatus })),
    };
  }
}

export const jobRepository = new JobRepository();
