import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@remoteintelligence.com' },
    update: {},
    create: {
      email: 'admin@remoteintelligence.com',
      password: adminPassword,
      name: 'Admin User',
      role: 'ADMIN',
    },
  });

  // Create demo user
  const userPassword = await bcrypt.hash('user123', 12);
  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      password: userPassword,
      name: 'Demo User',
      role: 'USER',
    },
  });

  // Create sample companies
  const companies = await Promise.all([
    prisma.company.upsert({
      where: { slug: 'stripe' },
      update: {},
      create: {
        name: 'Stripe',
        slug: 'stripe',
        website: 'https://stripe.com',
        domain: 'stripe.com',
        description: 'Stripe is a technology company that builds economic infrastructure for the internet.',
        industry: 'Financial Technology',
        subIndustry: 'Payment Processing',
        founded: 2010,
        companySize: '1000+',
        headquarters: 'San Francisco, CA',
        country: 'United States',
        city: 'San Francisco',
        state: 'CA',
        remotePolicy: 'Hybrid',
        linkedIn: 'https://linkedin.com/company/stripe',
        twitter: 'https://twitter.com/stripe',
        github: 'https://github.com/stripe',
        hiringScore: 85,
        growthScore: 90,
        startupScore: 40,
        remoteScore: 70,
        technologyScore: 95,
        aiAdoptionScore: 75,
        isEnriched: true,
        isVerified: true,
      },
    }),
    prisma.company.upsert({
      where: { slug: 'airbnb' },
      update: {},
      create: {
        name: 'Airbnb',
        slug: 'airbnb',
        website: 'https://airbnb.com',
        domain: 'airbnb.com',
        description: 'Airbnb is an online marketplace for lodging, primarily homestays for vacation rentals and tourism activities.',
        industry: 'Travel & Hospitality',
        subIndustry: 'Vacation Rentals',
        founded: 2008,
        companySize: '1000+',
        headquarters: 'San Francisco, CA',
        country: 'United States',
        city: 'San Francisco',
        state: 'CA',
        remotePolicy: 'Hybrid',
        linkedIn: 'https://linkedin.com/company/airbnb',
        twitter: 'https://twitter.com/airbnb',
        github: 'https://github.com/airbnb',
        hiringScore: 70,
        growthScore: 65,
        startupScore: 30,
        remoteScore: 75,
        technologyScore: 90,
        aiAdoptionScore: 80,
        isEnriched: true,
        isVerified: true,
      },
    }),
    prisma.company.upsert({
      where: { slug: 'notion' },
      update: {},
      create: {
        name: 'Notion',
        slug: 'notion',
        website: 'https://notion.so',
        domain: 'notion.so',
        description: 'Notion is an all-in-one workspace for notes, tasks, wikis, and databases.',
        industry: 'Productivity Software',
        subIndustry: 'Collaboration Tools',
        founded: 2016,
        companySize: '201-500',
        headquarters: 'San Francisco, CA',
        country: 'United States',
        city: 'San Francisco',
        state: 'CA',
        remotePolicy: 'Fully Remote',
        linkedIn: 'https://linkedin.com/company/notion',
        twitter: 'https://twitter.com/NotionHQ',
        github: 'https://github.com/makenotion',
        hiringScore: 90,
        growthScore: 95,
        startupScore: 85,
        remoteScore: 95,
        technologyScore: 90,
        aiAdoptionScore: 85,
        isEnriched: true,
        isVerified: true,
      },
    }),
    prisma.company.upsert({
      where: { slug: 'linear' },
      update: {},
      create: {
        name: 'Linear',
        slug: 'linear',
        website: 'https://linear.app',
        domain: 'linear.app',
        description: 'Linear is a purpose-built tool for modern software development teams.',
        industry: 'Productivity Software',
        subIndustry: 'Issue Tracking',
        founded: 2019,
        companySize: '51-200',
        headquarters: 'San Francisco, CA',
        country: 'United States',
        city: 'San Francisco',
        state: 'CA',
        remotePolicy: 'Fully Remote',
        linkedIn: 'https://linkedin.com/company/linear-app',
        twitter: 'https://twitter.com/linear',
        github: 'https://github.com/linear',
        hiringScore: 80,
        growthScore: 90,
        startupScore: 95,
        remoteScore: 100,
        technologyScore: 95,
        aiAdoptionScore: 70,
        isEnriched: true,
        isVerified: true,
      },
    }),
    prisma.company.upsert({
      where: { slug: 'supabase' },
      update: {},
      create: {
        name: 'Supabase',
        slug: 'supabase',
        website: 'https://supabase.com',
        domain: 'supabase.com',
        description: 'Supabase is an open-source Firebase alternative providing PostgreSQL database, authentication, and real-time subscriptions.',
        industry: 'Developer Tools',
        subIndustry: 'Database as a Service',
        founded: 2020,
        companySize: '51-200',
        headquarters: 'Singapore',
        country: 'Singapore',
        city: 'Singapore',
        remotePolicy: 'Fully Remote',
        linkedIn: 'https://linkedin.com/company/supabase',
        twitter: 'https://twitter.com/supabase',
        github: 'https://github.com/supabase',
        hiringScore: 85,
        growthScore: 95,
        startupScore: 90,
        remoteScore: 100,
        technologyScore: 95,
        aiAdoptionScore: 60,
        isEnriched: true,
        isVerified: true,
      },
    }),
  ]);

  // Create sample jobs
  const jobs = await Promise.all([
    prisma.job.create({
      data: {
        title: 'Senior Software Engineer',
        department: 'Engineering',
        location: 'Remote - Worldwide',
        employmentType: 'FULL_TIME',
        remoteStatus: 'FULLY_REMOTE',
        isWorldwideRemote: true,
        salary: '$150,000 - $200,000',
        salaryMin: 150000,
        salaryMax: 200000,
        currency: 'USD',
        experienceLevel: 'SENIOR',
        requiredSkills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL'],
        preferredSkills: ['GraphQL', 'AWS', 'Docker'],
        technologies: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'GraphQL'],
        description: 'We are looking for a Senior Software Engineer to join our team...',
        status: 'ACTIVE',
        companyId: companies[0].id,
      },
    }),
    prisma.job.create({
      data: {
        title: 'Product Designer',
        department: 'Design',
        location: 'Remote - US',
        employmentType: 'FULL_TIME',
        remoteStatus: 'FULLY_REMOTE',
        isWorldwideRemote: false,
        salary: '$120,000 - $160,000',
        salaryMin: 120000,
        salaryMax: 160000,
        currency: 'USD',
        experienceLevel: 'MID',
        requiredSkills: ['Figma', 'UI/UX', 'Design Systems'],
        preferredSkills: ['Motion Design', 'Prototyping'],
        technologies: ['Figma', 'Framer', 'Principle'],
        description: 'Join our design team to create beautiful user experiences...',
        status: 'ACTIVE',
        companyId: companies[2].id,
      },
    }),
    prisma.job.create({
      data: {
        title: 'DevOps Engineer',
        department: 'Infrastructure',
        location: 'Remote - Europe',
        employmentType: 'FULL_TIME',
        remoteStatus: 'FULLY_REMOTE',
        isWorldwideRemote: false,
        salary: '€80,000 - €120,000',
        salaryMin: 80000,
        salaryMax: 120000,
        currency: 'EUR',
        experienceLevel: 'SENIOR',
        requiredSkills: ['Kubernetes', 'Terraform', 'AWS', 'CI/CD'],
        preferredSkills: ['Go', 'Python', 'Prometheus'],
        technologies: ['Kubernetes', 'Terraform', 'AWS', 'GitHub Actions', 'Prometheus'],
        description: 'Help us build and maintain our cloud infrastructure...',
        status: 'ACTIVE',
        companyId: companies[4].id,
      },
    }),
    prisma.job.create({
      data: {
        title: 'Full Stack Developer',
        department: 'Engineering',
        location: 'Remote - Worldwide',
        employmentType: 'FULL_TIME',
        remoteStatus: 'FULLY_REMOTE',
        isWorldwideRemote: true,
        salary: '$100,000 - $150,000',
        salaryMin: 100000,
        salaryMax: 150000,
        currency: 'USD',
        experienceLevel: 'MID',
        requiredSkills: ['JavaScript', 'Python', 'React', 'Django'],
        preferredSkills: ['TypeScript', 'Next.js', 'Tailwind CSS'],
        technologies: ['JavaScript', 'Python', 'React', 'Django', 'PostgreSQL'],
        description: 'Build features across the entire stack...',
        status: 'ACTIVE',
        companyId: companies[1].id,
      },
    }),
    prisma.job.create({
      data: {
        title: 'Machine Learning Engineer',
        department: 'AI/ML',
        location: 'Remote - US/Canada',
        employmentType: 'FULL_TIME',
        remoteStatus: 'FULLY_REMOTE',
        isWorldwideRemote: false,
        salary: '$180,000 - $250,000',
        salaryMin: 180000,
        salaryMax: 250000,
        currency: 'USD',
        experienceLevel: 'SENIOR',
        requiredSkills: ['Python', 'PyTorch', 'TensorFlow', 'MLOps'],
        preferredSkills: ['LLMs', 'NLP', 'Computer Vision'],
        technologies: ['Python', 'PyTorch', 'TensorFlow', 'Kubernetes', 'AWS'],
        description: 'Build and deploy ML models at scale...',
        status: 'ACTIVE',
        companyId: companies[0].id,
      },
    }),
  ]);

  // Create technologies
  const technologies = await Promise.all([
    prisma.technology.upsert({
      where: { name: 'React' },
      update: {},
      create: { name: 'React', category: 'Frontend', description: 'JavaScript library for building user interfaces' },
    }),
    prisma.technology.upsert({
      where: { name: 'TypeScript' },
      update: {},
      create: { name: 'TypeScript', category: 'Language', description: 'Typed superset of JavaScript' },
    }),
    prisma.technology.upsert({
      where: { name: 'Node.js' },
      update: {},
      create: { name: 'Node.js', category: 'Backend', description: 'JavaScript runtime for server-side development' },
    }),
    prisma.technology.upsert({
      where: { name: 'PostgreSQL' },
      update: {},
      create: { name: 'PostgreSQL', category: 'Database', description: 'Open-source relational database' },
    }),
    prisma.technology.upsert({
      where: { name: 'Kubernetes' },
      update: {},
      create: { name: 'Kubernetes', category: 'DevOps', description: 'Container orchestration platform' },
    }),
    prisma.technology.upsert({
      where: { name: 'AWS' },
      update: {},
      create: { name: 'AWS', category: 'Cloud', description: 'Amazon Web Services cloud platform' },
    }),
    prisma.technology.upsert({
      where: { name: 'Python' },
      update: {},
      create: { name: 'Python', category: 'Language', description: 'General-purpose programming language' },
    }),
    prisma.technology.upsert({
      where: { name: 'Figma' },
      update: {},
      create: { name: 'Figma', category: 'Design', description: 'Collaborative interface design tool' },
    }),
  ]);

  // Link technologies to companies
  await Promise.all([
    prisma.companyTechnology.createMany({
      data: [
        { companyId: companies[0].id, technologyId: technologies[0].id },
        { companyId: companies[0].id, technologyId: technologies[1].id },
        { companyId: companies[0].id, technologyId: technologies[2].id },
        { companyId: companies[0].id, technologyId: technologies[3].id },
        { companyId: companies[2].id, technologyId: technologies[0].id },
        { companyId: companies[2].id, technologyId: technologies[1].id },
        { companyId: companies[2].id, technologyId: technologies[7].id },
        { companyId: companies[4].id, technologyId: technologies[1].id },
        { companyId: companies[4].id, technologyId: technologies[3].id },
        { companyId: companies[4].id, technologyId: technologies[2].id },
      ],
      skipDuplicates: true,
    }),
  ]);

  // Create scrape logs
  await prisma.scrapeLog.createMany({
    data: [
      { source: 'RemoteOK', status: 'completed', itemsFound: 45, itemsAdded: 12, itemsUpdated: 8, duration: 2500 },
      { source: 'WeWorkRemotely', status: 'completed', itemsFound: 32, itemsAdded: 9, itemsUpdated: 5, duration: 1800 },
      { source: 'Greenhouse', status: 'completed', itemsFound: 78, itemsAdded: 23, itemsUpdated: 15, duration: 4200 },
      { source: 'Lever', status: 'completed', itemsFound: 56, itemsAdded: 18, itemsUpdated: 10, duration: 3500 },
      { source: 'LinkedIn', status: 'failed', itemsFound: 0, itemsAdded: 0, itemsUpdated: 0, errors: ['CAPTCHA detected'], duration: 5000 },
    ],
  });

  console.log('Seed completed successfully!');
  console.log(`Created ${companies.length} companies, ${jobs.length} jobs, ${technologies.length} technologies`);
  console.log('Admin login: admin@remoteintelligence.com / admin123');
  console.log('User login: user@example.com / user123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
