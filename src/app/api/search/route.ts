import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth';
import { companyRepository } from '@/repositories/company.repository';
import { jobRepository } from '@/repositories/job.repository';
import { getScraper } from '@/services/scraper/scraper.registry';
import { dataIngestionService } from '@/services/data-ingestion.service';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const auth = await authMiddleware(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const days = parseInt(searchParams.get('days') || '0');
    const includeWeb = searchParams.get('web') === 'true';

    const skip = (page - 1) * limit;
    let results: any[] = [];
    let total = 0;
    let webResults: any[] = [];

    // Calculate date filter
    const dateFilter = days > 0 ? new Date(Date.now() - days * 24 * 60 * 60 * 1000) : null;

    // Search local database
    if (type === 'all' || type === 'companies') {
      const { companies, total: companyTotal } = await companyRepository.search({
        query,
        page: 1,
        limit: type === 'all' ? Math.ceil(limit / 2) : limit,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      results = [...results, ...companies.map(c => ({ 
        id: c.id,
        name: c.name,
        type: 'company',
        industry: c.industry,
        country: c.country,
        slug: c.slug,
        postedDate: c.createdAt,
        source: 'Local Database',
      }))];
      total += companyTotal;
    }

    if (type === 'all' || type === 'jobs') {
      const { jobs, total: jobTotal } = await jobRepository.search({
        query,
        page: 1,
        limit: type === 'all' ? Math.ceil(limit / 2) : limit,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      results = [...results, ...jobs.map(j => ({ 
        id: j.id,
        name: j.title,
        type: 'job',
        industry: j.company?.industry,
        country: j.company?.country,
        company: j.company?.name,
        location: j.location,
        remoteStatus: j.remoteStatus,
        postedDate: j.postedDate || j.createdAt,
        source: 'Local Database',
      }))];
      total += jobTotal;
    }

    // Filter by date if specified
    if (dateFilter) {
      results = results.filter(r => {
        const date = r.postedDate ? new Date(r.postedDate) : null;
        return date && date >= dateFilter;
      });
    }

    // Search live websites if requested
    if (includeWeb && query.length > 0) {
      const scrapers = ['RemoteOK', 'WeWorkRemotely', 'Himalayas'];
      
      for (const sourceName of scrapers) {
        try {
          const scraper = getScraper(sourceName);
          if (!scraper) continue;

          const scrapeResults = await scraper.run();
          
          // Ingest results into database
          await dataIngestionService.ingestScrapeResults(scrapeResults, sourceName);

          // Filter and format web results
          for (const result of scrapeResults) {
            for (const job of result.jobs) {
              const titleMatch = job.title.toLowerCase().includes(query.toLowerCase());
              const companyMatch = result.company.name.toLowerCase().includes(query.toLowerCase());
              const techMatch = job.technologies?.some((t: string) => 
                t.toLowerCase().includes(query.toLowerCase())
              );
              
              if (titleMatch || companyMatch || techMatch) {
                // Check date filter
                if (dateFilter && job.postedDate && new Date(job.postedDate) < dateFilter) {
                  continue;
                }

                webResults.push({
                  id: `web-${sourceName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  name: job.title,
                  type: 'job',
                  industry: result.company.industry,
                  country: job.location,
                  company: result.company.name,
                  location: job.location,
                  remoteStatus: job.remoteStatus,
                  postedDate: job.postedDate,
                  source: sourceName,
                  url: job.jobUrl,
                });
              }
            }
          }
        } catch (err) {
          logger.warn(`Web search failed for ${sourceName}`, { error: (err as Error).message });
        }
      }

      // Add web results to the main results
      results = [...results, ...webResults];
      total += webResults.length;
    }

    // Sort by posted date (newest first)
    results.sort((a, b) => {
      const dateA = a.postedDate ? new Date(a.postedDate).getTime() : 0;
      const dateB = b.postedDate ? new Date(b.postedDate).getTime() : 0;
      return dateB - dateA;
    });

    return NextResponse.json({
      data: results.slice(skip, skip + limit),
      webResults: webResults.slice(0, 10),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Search error', { error: (error as Error).message });
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
