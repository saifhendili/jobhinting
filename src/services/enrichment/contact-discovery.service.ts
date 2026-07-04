import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import * as cheerio from 'cheerio';
import axios from 'axios';

export class ContactDiscoveryService {
  private readonly emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  private readonly phoneRegex = /(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g;

  async discoverContacts(companyId: string): Promise<void> {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company || !company.website) {
      throw new Error('Company or website not found');
    }

    try {
      const url = company.website.startsWith('http') ? company.website : `https://${company.website}`;
      const pagesToCheck = [url, `${url}/contact`, `${url}/about`, `${url}/team`];

      const emails = new Set<string>();
      const phones = new Set<string>();
      const socialLinks: Record<string, string> = {};

      for (const pageUrl of pagesToCheck) {
        try {
          const response = await axios.get(pageUrl, {
            timeout: 10000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
          });

          const $ = cheerio.load(response.data);
          const html = response.data;

          // Extract emails
          const pageEmails = html.match(this.emailRegex) || [];
          pageEmails.forEach((email: string) => {
            if (!email.includes('example.com') && !email.includes('domain.com')) {
              emails.add(email.toLowerCase());
            }
          });

          // Extract phone numbers
          const pagePhones = html.match(this.phoneRegex) || [];
          pagePhones.forEach((phone: string) => phones.add(phone));

          // Extract social links
          $('a[href]').each((_, element) => {
            const href = $(element).attr('href') || '';
            if (href.includes('linkedin.com')) socialLinks['linkedIn'] = href;
            if (href.includes('twitter.com') || href.includes('x.com')) socialLinks['twitter'] = href;
            if (href.includes('facebook.com')) socialLinks['facebook'] = href;
            if (href.includes('instagram.com')) socialLinks['instagram'] = href;
            if (href.includes('github.com')) socialLinks['github'] = href;
            if (href.includes('youtube.com')) socialLinks['youtube'] = href;
          });
        } catch {
          // Skip pages that fail to load
        }
      }

      // Categorize emails
      const publicEmails = Array.from(emails);
      const supportEmail = publicEmails.find(e => e.includes('support') || e.includes('help'));
      const hrEmail = publicEmails.find(e => e.includes('hr') || e.includes('people') || e.includes('talent'));
      const recruitmentEmail = publicEmails.find(e => e.includes('recruit') || e.includes('career') || e.includes('jobs'));

      // Update company
      await prisma.company.update({
        where: { id: companyId },
        data: {
          publicEmails: publicEmails.slice(0, 10),
          phoneNumbers: Array.from(phones).slice(0, 5),
          supportEmail,
          hrEmail,
          recruitmentEmail,
          contactPage: `${url}/contact`,
          ...socialLinks,
        },
      });

      // Create contacts for discovered emails
      for (const email of publicEmails.slice(0, 5)) {
        const existing = await prisma.contact.findFirst({
          where: { companyId, email },
        });

        if (!existing) {
          await prisma.contact.create({
            data: {
              email,
              isPublic: true,
              companyId,
            },
          });
        }
      }

      logger.info(`Contact discovery completed for: ${company.name}`, {
        emailsFound: emails.size,
        phonesFound: phones.size,
      });
    } catch (error) {
      logger.error(`Contact discovery failed for: ${company.name}`, {
        error: (error as Error).message,
      });
      throw error;
    }
  }
}

export const contactDiscoveryService = new ContactDiscoveryService();
