import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import * as XLSX from 'xlsx';

export class ExportService {
  async exportCompanies(format: 'csv' | 'xlsx' | 'json', filters?: string): Promise<{
    fileUrl: string;
    recordCount: number;
  }> {
    const where: any = { isDuplicate: false };
    
    if (filters) {
      try {
        const parsed = JSON.parse(filters);
        Object.assign(where, parsed);
      } catch {
        // Invalid filters, ignore
      }
    }

    const companies = await prisma.company.findMany({
      where,
      include: {
        jobs: { where: { status: 'ACTIVE' } },
        technologies: { include: { technology: true } },
        contacts: true,
      },
      take: 10000,
    });

    const data = companies.map(company => ({
      'Company Name': company.name,
      'Website': company.website || '',
      'Industry': company.industry || '',
      'Country': company.country || '',
      'City': company.city || '',
      'Company Size': company.companySize || '',
      'Remote Policy': company.remotePolicy || '',
      'Hiring Score': company.hiringScore || 0,
      'Growth Score': company.growthScore || 0,
      'Remote Score': company.remoteScore || 0,
      'Technology Score': company.technologyScore || 0,
      'LinkedIn': company.linkedIn || '',
      'Twitter': company.twitter || '',
      'GitHub': company.github || '',
      'Public Emails': company.publicEmails.join('; '),
      'Phone Numbers': company.phoneNumbers.join('; '),
      'Technologies': company.technologies.map(t => t.technology.name).join('; '),
      'Active Jobs': company.jobs.length,
      'Description': company.description || '',
    }));

    const filename = `companies_export_${Date.now()}`;
    let fileUrl: string;

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      fileUrl = URL.createObjectURL(blob);
    } else if (format === 'csv') {
      const csv = this.toCSV(data);
      const blob = new Blob([csv], { type: 'text/csv' });
      fileUrl = URL.createObjectURL(blob);
    } else {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Companies');
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      fileUrl = URL.createObjectURL(blob);
    }

    logger.info(`Exported ${companies.length} companies as ${format}`);

    return {
      fileUrl,
      recordCount: companies.length,
    };
  }

  async exportJobs(format: 'csv' | 'xlsx' | 'json', filters?: string): Promise<{
    fileUrl: string;
    recordCount: number;
  }> {
    const where: any = { status: 'ACTIVE' };
    
    if (filters) {
      try {
        const parsed = JSON.parse(filters);
        Object.assign(where, parsed);
      } catch {
        // Invalid filters, ignore
      }
    }

    const jobs = await prisma.job.findMany({
      where,
      include: { company: true },
      take: 10000,
    });

    const data = jobs.map(job => ({
      'Job Title': job.title,
      'Company': job.company?.name || '',
      'Department': job.department || '',
      'Location': job.location || '',
      'Remote Status': job.remoteStatus || '',
      'Worldwide Remote': job.isWorldwideRemote ? 'Yes' : 'No',
      'Employment Type': job.employmentType || '',
      'Experience Level': job.experienceLevel || '',
      'Salary': job.salary || '',
      'Currency': job.currency || '',
      'Required Skills': job.requiredSkills.join('; '),
      'Preferred Skills': job.preferredSkills.join('; '),
      'Technologies': job.technologies.join('; '),
      'Benefits': job.benefits.join('; '),
      'Job URL': job.jobUrl || '',
      'Apply URL': job.applyUrl || '',
      'Posted Date': job.postedDate ? new Date(job.postedDate).toISOString() : '',
      'Description': job.description || '',
    }));

    const filename = `jobs_export_${Date.now()}`;
    let fileUrl: string;

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      fileUrl = URL.createObjectURL(blob);
    } else if (format === 'csv') {
      const csv = this.toCSV(data);
      const blob = new Blob([csv], { type: 'text/csv' });
      fileUrl = URL.createObjectURL(blob);
    } else {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Jobs');
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      fileUrl = URL.createObjectURL(blob);
    }

    logger.info(`Exported ${jobs.length} jobs as ${format}`);

    return {
      fileUrl,
      recordCount: jobs.length,
    };
  }

  private toCSV(data: any[]): string {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const rows = data.map(row => 
      headers.map(h => {
        const val = row[h];
        if (typeof val === 'string' && val.includes(',')) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      }).join(',')
    );
    
    return [headers.join(','), ...rows].join('\n');
  }
}

export const exportService = new ExportService();
