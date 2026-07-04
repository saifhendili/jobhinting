import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth';
import { companyRepository } from '@/repositories/company.repository';
import { jobRepository } from '@/repositories/job.repository';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const auth = await authMiddleware(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const [companyStats, jobStats, recentScrapes] = await Promise.all([
      companyRepository.getStats(),
      jobRepository.getStats(),
      prisma.scrapeLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          source: true,
          status: true,
          itemsFound: true,
          itemsAdded: true,
          itemsUpdated: true,
          errors: true,
          duration: true,
          createdAt: true,
        },
      }),
    ]);

    const companiesByScore = await prisma.company.groupBy({
      by: ['hiringScore'],
      where: { isDuplicate: false, hiringScore: { not: null } },
      _count: { hiringScore: true },
      orderBy: { hiringScore: 'asc' },
    });

    return NextResponse.json({
      totalCompanies: companyStats.totalCompanies,
      totalJobs: jobStats.totalJobs,
      activeJobs: jobStats.activeJobs,
      fullyRemoteJobs: jobStats.fullyRemoteJobs,
      newCompaniesToday: companyStats.newCompaniesToday,
      newJobsToday: jobStats.newJobsToday,
      topCountries: companyStats.topCountries,
      topIndustries: companyStats.topIndustries,
      jobsByRemoteStatus: jobStats.jobsByRemoteStatus,
      companiesByScore: companiesByScore.map(c => ({
        score: `${c.hiringScore || 0}`,
        count: c._count.hiringScore,
      })),
      recentScrapes,
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
