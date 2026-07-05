import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { ScrapeResult } from './scraper/base.scraper';
import { duplicateDetectionService } from './duplicate-detection.service';

export class DataIngestionService {
  async ingestScrapeResults(results: ScrapeResult[], sourceName: string): Promise<{
    companiesAdded: number;
    companiesUpdated: number;
    jobsAdded: number;
    jobsUpdated: number;
  }> {
    let companiesAdded = 0;
    let companiesUpdated = 0;
    let jobsAdded = 0;
    let jobsUpdated = 0;

    for (const result of results) {
      try {
        const qualifyingJobs = result.jobs.filter(
          (job) => job.remoteStatus === 'FULLY_REMOTE' && job.isWorldwideRemote === true
        );

        if (qualifyingJobs.length === 0) {
          continue;
        }

        // Check for duplicates
        const domain = result.company.website
          ? new URL(result.company.website.startsWith('http') ? result.company.website : `https://${result.company.website}`).hostname.replace(/^www\./, '')
          : undefined;

        const duplicateCheck = await duplicateDetectionService.checkDuplicate({
          name: result.company.name,
          website: result.company.website,
          domain,
          linkedIn: result.company.linkedIn,
        });

        let companyId: string;

        if (duplicateCheck.isDuplicate && duplicateCheck.duplicateOfId) {
          // Update existing company
          companyId = duplicateCheck.duplicateOfId;
          await prisma.company.update({
            where: { id: companyId },
            data: {
              ...this.buildCompanyData(result.company),
              lastScrapedAt: new Date(),
            },
          });
          companiesUpdated++;
        } else {
          // Create new company
          const slug = result.company.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

          const newCompany = await prisma.company.create({
            data: {
              ...this.buildCompanyData(result.company),
              slug,
              domain,
              lastScrapedAt: new Date(),
            },
          });
          companyId = newCompany.id;
          companiesAdded++;
        }

        // Create source record
        await prisma.source.create({
          data: {
            name: sourceName,
            url: result.company.careersPage || result.company.website || '',
            type: 'scraper',
            companyId,
          },
        });

        // Ingest jobs
        for (const job of qualifyingJobs) {
          const existingJob = await prisma.job.findFirst({
            where: {
              companyId,
              jobUrl: job.jobUrl || undefined,
            },
          });

          if (existingJob) {
            await prisma.job.update({
              where: { id: existingJob.id },
              data: {
                ...this.buildJobData(job),
                status: 'ACTIVE',
              },
            });
            jobsUpdated++;
          } else {
            await prisma.job.create({
              data: {
                ...this.buildJobData(job),
                companyId,
                status: 'ACTIVE',
              },
            });
            jobsAdded++;
          }
        }
      } catch (error) {
        logger.error('Error ingesting scrape result', {
          company: result.company.name,
          error: (error as Error).message,
        });
      }
    }

    logger.info('Ingestion complete', {
      companiesAdded,
      companiesUpdated,
      jobsAdded,
      jobsUpdated,
    });

    return { companiesAdded, companiesUpdated, jobsAdded, jobsUpdated };
  }

  private buildCompanyData(company: ScrapeResult['company']) {
    return {
      name: company.name,
      website: company.website,
      logo: company.logo,
      description: company.description,
      industry: company.industry,
      subIndustry: company.subIndustry,
      founded: company.founded,
      companySize: company.companySize,
      headquarters: company.headquarters,
      country: company.country,
      city: company.city,
      state: company.state,
      remotePolicy: company.remotePolicy,
      linkedIn: company.linkedIn,
      twitter: company.twitter,
      facebook: company.facebook,
      instagram: company.instagram,
      github: company.github,
      youtube: company.youtube,
      phoneNumbers: company.phoneNumbers || [],
      publicEmails: company.publicEmails || [],
      supportEmail: company.supportEmail,
      hrEmail: company.hrEmail,
      recruitmentEmail: company.recruitmentEmail,
      contactPage: company.contactPage,
      privacyPage: company.privacyPage,
      termsPage: company.termsPage,
      blog: company.blog,
      careersPage: company.careersPage,
    };
  }

  private buildJobData(job: ScrapeResult['jobs'][0]) {
    return {
      title: job.title,
      department: job.department,
      location: job.location,
      employmentType: job.employmentType as any,
      remoteStatus: job.remoteStatus as any,
      isWorldwideRemote: job.isWorldwideRemote || false,
      salary: job.salary,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      currency: job.currency,
      experienceLevel: job.experienceLevel as any,
      postedDate: job.postedDate,
      closingDate: job.closingDate,
      jobUrl: job.jobUrl,
      applyUrl: job.applyUrl,
      benefits: job.benefits || [],
      requiredSkills: job.requiredSkills || [],
      preferredSkills: job.preferredSkills || [],
      technologies: job.technologies || [],
      description: job.description,
    };
  }
}

export const dataIngestionService = new DataIngestionService();
