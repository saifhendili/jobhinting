import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth';
import { jobRepository } from '@/repositories/job.repository';
import { jobSearchSchema } from '@/lib/validation';

export async function GET(request: NextRequest) {
  const auth = await authMiddleware(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    const result = jobSearchSchema.safeParse(params);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const data = result.data;
    const { jobs, total } = await jobRepository.search({
      query: data.query,
      companyId: data.companyId,
      remoteStatus: data.remoteStatus,
      employmentType: data.employmentType,
      experienceLevel: data.experienceLevel,
      country: data.country,
      department: data.department,
      days: data.days,
      page: data.page,
      limit: data.limit,
      sortBy: data.sortBy,
      sortOrder: data.sortOrder,
    });

    return NextResponse.json({
      data: jobs,
      pagination: {
        page: data.page,
        limit: data.limit,
        total,
        totalPages: Math.ceil(total / data.limit),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
