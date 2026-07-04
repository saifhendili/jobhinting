import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import Fuse from 'fuse.js';
import { distance } from 'fastest-levenshtein';

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  duplicateOfId?: string;
  confidence: number;
  reason: string;
}

export class DuplicateDetectionService {
  private readonly nameThreshold = 0.85;
  private readonly levenshteinThreshold = 3;

  async checkDuplicate(company: {
    name: string;
    website?: string;
    domain?: string;
    linkedIn?: string;
    email?: string;
    phone?: string;
  }): Promise<DuplicateCheckResult> {
    // Check by domain
    if (company.domain) {
      const existingByDomain = await prisma.company.findUnique({
        where: { domain: company.domain },
        select: { id: true, name: true },
      });
      if (existingByDomain) {
        return {
          isDuplicate: true,
          duplicateOfId: existingByDomain.id,
          confidence: 1.0,
          reason: 'Domain match',
        };
      }
    }

    // Check by website
    if (company.website) {
      const domain = this.extractDomain(company.website);
      if (domain) {
        const existingByDomain = await prisma.company.findUnique({
          where: { domain },
          select: { id: true, name: true },
        });
        if (existingByDomain) {
          return {
            isDuplicate: true,
            duplicateOfId: existingByDomain.id,
            confidence: 1.0,
            reason: 'Website domain match',
          };
        }
      }
    }

    // Check by LinkedIn
    if (company.linkedIn) {
      const existingByLinkedIn = await prisma.company.findFirst({
        where: { linkedIn: company.linkedIn },
        select: { id: true, name: true },
      });
      if (existingByLinkedIn) {
        return {
          isDuplicate: true,
          duplicateOfId: existingByLinkedIn.id,
          confidence: 1.0,
          reason: 'LinkedIn match',
        };
      }
    }

    // Check by email
    if (company.email) {
      const existingByEmail = await prisma.company.findFirst({
        where: { publicEmails: { has: company.email } },
        select: { id: true, name: true },
      });
      if (existingByEmail) {
        return {
          isDuplicate: true,
          duplicateOfId: existingByEmail.id,
          confidence: 1.0,
          reason: 'Email match',
        };
      }
    }

    // Check by phone
    if (company.phone) {
      const existingByPhone = await prisma.company.findFirst({
        where: { phoneNumbers: { has: company.phone } },
        select: { id: true, name: true },
      });
      if (existingByPhone) {
        return {
          isDuplicate: true,
          duplicateOfId: existingByPhone.id,
          confidence: 1.0,
          reason: 'Phone match',
        };
      }
    }

    // Check by name similarity using fuzzy matching
    const allCompanies = await prisma.company.findMany({
      where: { isDuplicate: false },
      select: { id: true, name: true },
    });

    const fuse = new Fuse(allCompanies, {
      keys: ['name'],
      threshold: 0.3,
      includeScore: true,
    });

    const fuseResults = fuse.search(company.name);
    if (fuseResults.length > 0 && fuseResults[0].score !== undefined && fuseResults[0].score < 0.3) {
      return {
        isDuplicate: true,
        duplicateOfId: fuseResults[0].item.id,
        confidence: 1 - (fuseResults[0].score || 0),
        reason: 'Name similarity (fuzzy match)',
      };
    }

    // Check by Levenshtein distance
    for (const existing of allCompanies) {
      const dist = distance(company.name.toLowerCase(), existing.name.toLowerCase());
      const maxLen = Math.max(company.name.length, existing.name.length);
      const similarity = 1 - dist / maxLen;

      if (similarity >= this.nameThreshold) {
        return {
          isDuplicate: true,
          duplicateOfId: existing.id,
          confidence: similarity,
          reason: 'Name similarity (Levenshtein)',
        };
      }
    }

    return {
      isDuplicate: false,
      confidence: 0,
      reason: 'No duplicate found',
    };
  }

  private extractDomain(url: string): string | undefined {
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      return urlObj.hostname.replace(/^www\./, '');
    } catch {
      return undefined;
    }
  }

  async mergeDuplicateCompanies(): Promise<number> {
    const duplicates = await prisma.company.findMany({
      where: { isDuplicate: true },
    });

    let merged = 0;
    for (const dup of duplicates) {
      if (!dup.duplicateOfId) continue;

      const original = await prisma.company.findUnique({
        where: { id: dup.duplicateOfId },
      });

      if (!original) continue;

      // Merge jobs
      await prisma.job.updateMany({
        where: { companyId: dup.id },
        data: { companyId: original.id },
      });

      // Merge contacts
      await prisma.contact.updateMany({
        where: { companyId: dup.id },
        data: { companyId: original.id },
      });

      // Merge sources
      await prisma.source.updateMany({
        where: { companyId: dup.id },
        data: { companyId: original.id },
      });

      merged++;
    }

    logger.info(`Merged ${merged} duplicate companies`);
    return merged;
  }
}

export const duplicateDetectionService = new DuplicateDetectionService();
