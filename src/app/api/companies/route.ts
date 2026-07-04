import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth';
import { companyRepository } from '@/repositories/company.repository';
import { companySearchSchema } from '@/lib/validation';

export async function GET(request: NextRequest) {
  const auth = await authMiddleware(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    const result = companySearchSchema.safeParse(params);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const data = result.data;
    const { companies, total } = await companyRepository.search({
      query: data.query,
      country: data.country,
      industry: data.industry,
      remotePolicy: data.remotePolicy,
      companySize: data.companySize,
      minHiringScore: data.minHiringScore,
      technologies: data.technologies ? data.technologies.split(',') : undefined,
      page: data.page,
      limit: data.limit,
      sortBy: data.sortBy,
      sortOrder: data.sortOrder,
    });

    return NextResponse.json({
      data: companies,
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
