import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import * as cheerio from 'cheerio';
import axios from 'axios';

export class WebsiteAnalysisService {
  async analyzeWebsite(companyId: string): Promise<void> {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company || !company.website) {
      throw new Error('Company or website not found');
    }

    try {
      const url = company.website.startsWith('http') ? company.website : `https://${company.website}`;
      const response = await axios.get(url, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      const $ = cheerio.load(response.data);
      const html = response.data.toLowerCase();
      const headers = response.headers;

      // Detect frontend frameworks
      const frontendFramework = this.detectFrontendFramework(html, $);
      const backendFramework = this.detectBackendFramework(headers, html);
      const cms = this.detectCMS(html, $);
      const hostingProvider = this.detectHosting(headers, html);
      const cloudProvider = this.detectCloudProvider(html, headers);
      const cdn = this.detectCDN(headers, html);
      const analytics = this.detectAnalytics(html);
      const tagManager = this.detectTagManager(html);
      const ssl = url.startsWith('https');
      const robotsTxt = await this.checkRobotsTxt(url);
      const sitemap = await this.checkSitemap(url);
      const language = $('html').attr('lang') || 'en';

      await prisma.company.update({
        where: { id: companyId },
        data: {
          frontendFramework,
          backendFramework,
          cms,
          hostingProvider,
          cloudProvider,
          cdn,
          analytics,
          tagManager,
          ssl,
          robotsTxt,
          sitemap,
          language,
        },
      });

      logger.info(`Website analysis completed for: ${company.name}`);
    } catch (error) {
      logger.error(`Website analysis failed for: ${company.name}`, {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  private detectFrontendFramework(html: string, $: cheerio.CheerioAPI): string | undefined {
    if (html.includes('react')) return 'React';
    if (html.includes('vue')) return 'Vue.js';
    if (html.includes('angular')) return 'Angular';
    if (html.includes('svelte')) return 'Svelte';
    if (html.includes('next.js') || html.includes('__next')) return 'Next.js';
    if (html.includes('nuxt')) return 'Nuxt.js';
    if ($('[data-reactroot]').length > 0) return 'React';
    if ($('#__vue').length > 0) return 'Vue.js';
    return undefined;
  }

  private detectBackendFramework(headers: any, html: string): string | undefined {
    const server = headers['server']?.toLowerCase() || '';
    if (server.includes('next.js')) return 'Next.js';
    if (server.includes('nginx')) return 'Nginx';
    if (server.includes('apache')) return 'Apache';
    if (html.includes('laravel')) return 'Laravel';
    if (html.includes('django')) return 'Django';
    if (html.includes('rails')) return 'Ruby on Rails';
    if (html.includes('express')) return 'Express.js';
    if (headers['x-powered-by']?.includes('Express')) return 'Express.js';
    return undefined;
  }

  private detectCMS(html: string, $: cheerio.CheerioAPI): string | undefined {
    if (html.includes('wordpress') || $('meta[name="generator"][content*="WordPress"]').length > 0) return 'WordPress';
    if (html.includes('drupal')) return 'Drupal';
    if (html.includes('joomla')) return 'Joomla';
    if (html.includes('shopify')) return 'Shopify';
    if (html.includes('webflow')) return 'Webflow';
    if (html.includes('squarespace')) return 'Squarespace';
    if (html.includes('wix')) return 'Wix';
    if (html.includes('contentful')) return 'Contentful';
    if (html.includes('strapi')) return 'Strapi';
    return undefined;
  }

  private detectHosting(headers: any, html: string): string | undefined {
    const server = headers['server']?.toLowerCase() || '';
    if (server.includes('cloudflare')) return 'Cloudflare';
    if (server.includes('netlify')) return 'Netlify';
    if (server.includes('vercel')) return 'Vercel';
    if (html.includes('heroku')) return 'Heroku';
    if (html.includes('digitalocean')) return 'DigitalOcean';
    if (html.includes('aws')) return 'AWS';
    if (html.includes('google cloud')) return 'Google Cloud';
    if (html.includes('azure')) return 'Azure';
    return undefined;
  }

  private detectCloudProvider(html: string, headers: any): string | undefined {
    if (html.includes('aws') || html.includes('amazon web services')) return 'AWS';
    if (html.includes('google cloud') || html.includes('gcp')) return 'Google Cloud';
    if (html.includes('azure') || html.includes('microsoft azure')) return 'Azure';
    if (html.includes('cloudflare')) return 'Cloudflare';
    if (headers['cf-ray']) return 'Cloudflare';
    return undefined;
  }

  private detectCDN(headers: any, html: string): string | undefined {
    if (headers['cf-ray']) return 'Cloudflare';
    if (html.includes('cloudfront')) return 'CloudFront';
    if (html.includes('fastly')) return 'Fastly';
    if (html.includes('akamai')) return 'Akamai';
    if (html.includes('keycdn')) return 'KeyCDN';
    if (html.includes('bunnycdn')) return 'BunnyCDN';
    return undefined;
  }

  private detectAnalytics(html: string): string | undefined {
    if (html.includes('google-analytics') || html.includes('gtag')) return 'Google Analytics';
    if (html.includes('plausible')) return 'Plausible';
    if (html.includes('mixpanel')) return 'Mixpanel';
    if (html.includes('amplitude')) return 'Amplitude';
    if (html.includes('segment')) return 'Segment';
    if (html.includes('matomo') || html.includes('piwik')) return 'Matomo';
    if (html.includes('hotjar')) return 'Hotjar';
    return undefined;
  }

  private detectTagManager(html: string): string | undefined {
    if (html.includes('googletagmanager') || html.includes('gtm-')) return 'Google Tag Manager';
    if (html.includes('tealium')) return 'Tealium';
    if (html.includes('adobe launch')) return 'Adobe Launch';
    return undefined;
  }

  private async checkRobotsTxt(baseUrl: string): Promise<boolean> {
    try {
      const url = new URL(baseUrl);
      const robotsUrl = `${url.protocol}//${url.host}/robots.txt`;
      const response = await axios.get(robotsUrl, { timeout: 5000 });
      return response.status === 200 && response.data.length > 0;
    } catch {
      return false;
    }
  }

  private async checkSitemap(baseUrl: string): Promise<boolean> {
    try {
      const url = new URL(baseUrl);
      const sitemapUrl = `${url.protocol}//${url.host}/sitemap.xml`;
      const response = await axios.get(sitemapUrl, { timeout: 5000 });
      return response.status === 200 && response.data.includes('<urlset');
    } catch {
      return false;
    }
  }
}

export const websiteAnalysisService = new WebsiteAnalysisService();
