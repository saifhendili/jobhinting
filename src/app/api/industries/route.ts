import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth';
import { companyRepository } from '@/repositories/company.repository';

export async function GET(request: NextRequest) {
  const auth = await authMiddleware(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const filters = await companyRepository.getFilterOptions();
    return NextResponse.json({ industries: filters.industries });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
