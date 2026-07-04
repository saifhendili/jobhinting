# Build a Production-Grade Remote Company Intelligence SaaS

You are a Senior Full Stack Engineer specializing in Next.js 15, React, Node.js, TypeScript, Prisma, PostgreSQL, Redis, Playwright, and AI-powered SaaS applications.

Your mission is to build a production-ready SaaS platform that automatically discovers companies actively hiring remotely and allows users to search, filter, enrich, and generate leads from those companies.

The code must be production-ready, modular, scalable, secure, and follow modern best practices.

---

# Tech Stack

Frontend

* Next.js 15 (App Router)
* React 19
* TypeScript
* SCSS Modules (do NOT use Tailwind CSS)
* Server Components where appropriate
* Client Components only when needed
* React Query (TanStack Query)
* Zustand (if global state is needed)

Backend

* Next.js Route Handlers
* Node.js
* Prisma ORM
* PostgreSQL
* Redis
* BullMQ for queues
* Zod for validation
* JWT authentication
* Role-based authorization (Admin/User)

AI

* OpenAI API
* Gemini API
* OpenRouter support
* Local model support through Ollama (optional)

Scraping

* Playwright
* Cheerio
* Axios
* Puppeteer only if absolutely necessary

Utilities

* Winston or Pino logging
* node-cron
* dotenv
* Fuse.js
* Fastest-levenshtein
* CSV export
* Excel export
* Docker
* Docker Compose

---

# Goal

Build a SaaS that automatically discovers companies actively hiring remotely.

The platform should:

* Discover companies
* Discover active remote jobs
* Enrich company profiles
* Detect technologies
* Collect contact information
* Remove duplicates
* Store everything in PostgreSQL
* Expose a REST API
* Display everything inside a beautiful dashboard

---

# Scrapers

Create dedicated scraper services for:

RemoteOK

We Work Remotely

Wellfound

Arc.dev

Himalayas

Jobspresso

Y Combinator Jobs

Greenhouse

Lever

Ashby

Workable

SmartRecruiters

Teamtailor

BambooHR

Personio

Recruitee

Comeet

Jobvite

Oracle Careers

SAP SuccessFactors

Workday

Google Jobs

Startup.jobs

Remote.co

Indeed (where legally permitted)

ZipRecruiter (where legally permitted)

LinkedIn Jobs (respect Terms of Service)

Glassdoor (respect Terms of Service)

---

# Google Discovery

Automatically search Google for ATS-hosted job pages using queries such as:

site:boards.greenhouse.io remote

site:jobs.lever.co remote

site:jobs.ashbyhq.com remote

site:apply.workable.com remote

site:careers.teamtailor.com remote

site:jobs.smartrecruiters.com remote

site:workdayjobs.com remote

Generate additional discovery queries automatically based on country, industry, and job title.

---

# Discover Company Information

For every company collect:

Company Name

Website

Logo

Description

Industry

Sub Industry

Founded

Company Size

Headquarters

Country

City

State

Remote Policy

Website URL

LinkedIn

Twitter/X

Facebook

Instagram

GitHub Organization

YouTube

Phone Numbers

Public Emails

Support Email

HR Email

Recruitment Email

Contact Page

Privacy Page

Terms Page

Blog

Careers Page

---

# Discover Job Information

Collect:

Job Title

Department

Location

Employment Type

Remote Status

Worldwide Remote

Salary

Salary Range

Currency

Experience Level

Posted Date

Closing Date

Job URL

Apply URL

Benefits

Required Skills

Preferred Skills

Technologies

Job Description

---

# Website Analysis

Visit every company website and detect:

Frontend Framework

Backend Framework

CMS

Hosting Provider

Cloud Provider

CDN

Analytics

Tag Manager

SSL

Robots.txt

Sitemap

Language

Meta Tags

OpenGraph

Schema.org

Performance indicators

---

# Contact Discovery

Extract all publicly available contact information:

Emails

Phone Numbers

LinkedIn

Twitter/X

Facebook

Instagram

GitHub

Contact Forms

---

# AI Enrichment

Generate:

Company Summary

Business Category

Industry Classification

Products

Services

Hiring Score

Growth Score

Startup Score

Remote Score

Technology Score

AI Adoption Score

---

# Duplicate Detection

Remove duplicates using:

Domain

Website

LinkedIn URL

Company Name similarity

Email

Phone Number

Logo similarity (optional)

---

# Database

Use Prisma with PostgreSQL.

Models should include:

User

Company

Job

Contact

Technology

Industry

Location

Source

ScrapeLog

Export

SavedCompany

SavedSearch

Notification

SearchHistory

AuditLog

Create proper relations, indexes, and migrations.

---

# Scheduler

Use BullMQ and Redis to:

Run scraping jobs

Retry failed jobs

Resume interrupted jobs

Schedule recurring crawls

Prioritize high-value sources

---

# REST API

Implement endpoints such as:

GET /api/companies

GET /api/companies/:id

GET /api/jobs

GET /api/search

GET /api/industries

GET /api/countries

GET /api/dashboard

POST /api/scrape

POST /api/export

POST /api/enrich

---

# Dashboard

Build an admin dashboard with:

Company table

Job table

Search

Advanced filters

Pagination

Charts

Statistics

Country filters

Industry filters

Technology filters

Export buttons

Saved searches

Notifications

Dark mode

Responsive design

---

# Export

Support exporting to:

CSV

Excel (.xlsx)

JSON

---

# Authentication

Implement:

JWT

Refresh Tokens

Role-Based Access Control (RBAC)

Admin

User

Protected routes

Middleware

---

# Performance

Implement:

Concurrent scraping

Caching with Redis

Retry logic

Rate limiting

Request deduplication

Incremental crawling

Resume after interruption

Batch database writes

Lazy loading

---

# Anti-Bot

Use:

User-Agent rotation

Header rotation

Session persistence

Cookie management

Playwright for JavaScript-heavy pages

Exponential backoff

Detect CAPTCHA and log it for manual review

Respect robots.txt where appropriate and comply with each site's Terms of Service.

---

# Logging

Log:

Requests

Errors

New companies

New jobs

Execution time

Queue status

Database errors

---

# Docker

Provide:

Dockerfile

docker-compose.yml

PostgreSQL

Redis

Application

Health checks

Development and production configurations

---

# Documentation

Generate a professional README containing:

Installation

Configuration

Folder structure

Database schema

API documentation

Deployment guide

Docker setup

Environment variables

Scaling recommendations

Troubleshooting

---

# Code Quality

Use:

TypeScript everywhere

Prisma best practices

Reusable services

Repository pattern

Service layer

Dependency injection where appropriate

Strict typing

ESLint

Prettier

SOLID principles

Clean Architecture

Avoid duplicated code

The finished result should be a production-ready GitHub project that can scale to hundreds of thousands of companies and millions of job records, with a modern Next.js frontend, a robust Node.js backend, and a maintainable architecture suitable for long-term growth.
