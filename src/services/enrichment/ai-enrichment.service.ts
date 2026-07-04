import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

interface AIEnrichmentInput {
  companyName: string;
  description?: string;
  website?: string;
  industry?: string;
}

export class AIEnrichmentService {
  private openaiKey: string | undefined;
  private geminiKey: string | undefined;
  private openrouterKey: string | undefined;

  constructor() {
    this.openaiKey = process.env.OPENAI_API_KEY;
    this.geminiKey = process.env.GEMINI_API_KEY;
    this.openrouterKey = process.env.OPENROUTER_API_KEY;
  }

  async enrichCompany(companyId: string): Promise<void> {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: { jobs: true, technologies: { include: { technology: true } } },
    });

    if (!company) {
      throw new Error('Company not found');
    }

    try {
      const enrichment = await this.generateEnrichment({
        companyName: company.name,
        description: company.description || undefined,
        website: company.website || undefined,
        industry: company.industry || undefined,
      });

      await prisma.company.update({
        where: { id: companyId },
        data: {
          summary: enrichment.summary,
          businessCategory: enrichment.businessCategory,
          hiringScore: enrichment.scores.hiring,
          growthScore: enrichment.scores.growth,
          startupScore: enrichment.scores.startup,
          remoteScore: enrichment.scores.remote,
          technologyScore: enrichment.scores.technology,
          aiAdoptionScore: enrichment.scores.aiAdoption,
          isEnriched: true,
        },
      });

      logger.info(`AI enrichment completed for company: ${company.name}`);
    } catch (error) {
      logger.error(`AI enrichment failed for company: ${company.name}`, {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  private async generateEnrichment(input: AIEnrichmentInput): Promise<{
    summary: string;
    businessCategory: string;
    scores: {
      hiring: number;
      growth: number;
      startup: number;
      remote: number;
      technology: number;
      aiAdoption: number;
    };
  }> {
    // If no AI keys available, use heuristic scoring
    if (!this.openaiKey && !this.geminiKey && !this.openrouterKey) {
      return this.heuristicEnrichment(input);
    }

    try {
      // Try OpenAI first
      if (this.openaiKey) {
        return await this.openAIEnrichment(input);
      }
      // Fallback to Gemini
      if (this.geminiKey) {
        return await this.geminiEnrichment(input);
      }
      // Fallback to OpenRouter
      if (this.openrouterKey) {
        return await this.openrouterEnrichment(input);
      }
    } catch (error) {
      logger.warn('AI enrichment failed, using heuristic fallback', {
        error: (error as Error).message,
      });
    }

    return this.heuristicEnrichment(input);
  }

  private async openAIEnrichment(input: AIEnrichmentInput): Promise<any> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a business intelligence analyst. Analyze the company and return a JSON object with: summary (2-3 sentences), businessCategory, and scores (hiring, growth, startup, remote, technology, aiAdoption - each 0-100).',
          },
          {
            role: 'user',
            content: `Company: ${input.companyName}\nDescription: ${input.description || 'N/A'}\nWebsite: ${input.website || 'N/A'}\nIndustry: ${input.industry || 'N/A'}`,
          },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    return {
      summary: result.summary,
      businessCategory: result.businessCategory,
      scores: result.scores,
    };
  }

  private async geminiEnrichment(input: AIEnrichmentInput): Promise<any> {
    // Simplified - would use actual Gemini API
    return this.heuristicEnrichment(input);
  }

  private async openrouterEnrichment(input: AIEnrichmentInput): Promise<any> {
    // Simplified - would use actual OpenRouter API
    return this.heuristicEnrichment(input);
  }

  private heuristicEnrichment(input: AIEnrichmentInput): {
    summary: string;
    businessCategory: string;
    scores: {
      hiring: number;
      growth: number;
      startup: number;
      remote: number;
      technology: number;
      aiAdoption: number;
    };
  } {
    const desc = (input.description || '').toLowerCase();
    const name = input.companyName.toLowerCase();

    // Heuristic scoring based on keywords
    const techKeywords = ['software', 'tech', 'ai', 'machine learning', 'cloud', 'saas', 'platform', 'api', 'developer'];
    const growthKeywords = ['scale', 'growing', 'expansion', 'series', 'funding', 'unicorn'];
    const remoteKeywords = ['remote', 'distributed', 'work from home', 'virtual', 'global team'];
    const aiKeywords = ['ai', 'artificial intelligence', 'machine learning', 'ml', 'llm', 'generative ai', 'automation'];
    const startupKeywords = ['startup', 'early stage', 'seed', 'pre-seed', 'founder', 'venture'];

    const hasTech = techKeywords.some(k => desc.includes(k) || name.includes(k));
    const hasGrowth = growthKeywords.some(k => desc.includes(k));
    const hasRemote = remoteKeywords.some(k => desc.includes(k));
    const hasAI = aiKeywords.some(k => desc.includes(k));
    const hasStartup = startupKeywords.some(k => desc.includes(k));

    return {
      summary: `${input.companyName} is a company in the ${input.industry || 'technology'} sector.`,
      businessCategory: input.industry || 'Technology',
      scores: {
        hiring: hasGrowth ? 75 : hasTech ? 60 : 40,
        growth: hasGrowth ? 80 : hasTech ? 65 : 45,
        startup: hasStartup ? 85 : hasGrowth ? 60 : 35,
        remote: hasRemote ? 90 : hasTech ? 70 : 50,
        technology: hasTech ? 85 : hasAI ? 75 : 40,
        aiAdoption: hasAI ? 90 : hasTech ? 60 : 30,
      },
    };
  }
}

export const aiEnrichmentService = new AIEnrichmentService();
