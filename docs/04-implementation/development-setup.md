# 🚀 Development Setup Guide - Smaragdus Viridi

**Document Status**: ✅ Complete  
**Last Updated**: January 2025  
**Target Audience**: Developers starting on the project

---

## 🎯 Prerequisites

### Required Software

- **Node.js 20.x.x** (use fnm for version management)
- **npm** or **yarn**
- **Git** (latest version)
- **VSCode/Cursor** (recommended IDE)

### Required Accounts

- **Supabase Account** - For backend services
- **GitHub Account** - For code repository
- **Stripe Account** (for payments) - Development mode initially

---

## 🚀 Quick Start (5 Minutes)

### 1. Project Setup

```bash
# Clone repository
git clone <repository-url> crystallique
cd crystallique

# Install Node.js version manager and Node.js 20
curl -fsSL https://fnm.vercel.app/install | bash
fnm install 20
fnm use 20

# Install dependencies
npm install
```

### 2. Environment Configuration

```bash
# Copy environment template
cp env.example .env.local

# Edit with your Supabase credentials
# Required variables:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY
```

### 3. Database Setup (Using Supabase MCP Tools)

```bash
# ⚠️ IMPORTANT: Use MCP tools instead of Supabase CLI
# The project is configured to work with Supabase MCP integration
# All database operations should be done through MCP tools
```

### 4. Start Development

```bash
# Start development server
npm run dev

# Open browser to http://localhost:3000
```

---

## 🔧 Detailed Setup Instructions

### Node.js Version Management

```bash
# Install fnm (Fast Node Manager)
curl -fsSL https://fnm.vercel.app/install | bash

# Restart your terminal or source your profile
source ~/.bashrc  # or ~/.zshrc

# Install and use Node.js 20
fnm install 20.12.0
fnm use 20.12.0
fnm default 20.12.0

# Verify installation
node --version  # Should show v20.12.0
npm --version   # Should show 10.x.x
```

### Project Dependencies

```bash
# Install all project dependencies
npm install

# Core dependencies that will be installed:
# - next@15.x.x (React framework)
# - react@18.x.x (UI library)
# - typescript@5.x.x (Type safety)
# - @supabase/supabase-js@2.x.x (Backend client)
# - tailwindcss@3.x.x (Styling)
# - three@0.x.x (3D visualization)
# - stripe@15.x.x (Payment processing)
```

### Development Scripts

```bash
# Available npm scripts:
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Auto-fix ESLint issues
npm run type-check   # TypeScript type checking
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Generate coverage report
```

---

## 🗄️ Database Configuration

### Supabase MCP Integration

The project uses Supabase MCP tools for all database operations. This provides:

- Direct database interaction from the development environment
- Real-time schema management
- Automated type generation
- Integrated deployment workflows

### Database Schema Setup

```sql
-- The database schema is defined in migration files
-- Location: supabase/migrations/
-- 001_initial_schema.sql - Core tables and types
-- 002_rls_policies.sql - Row Level Security setup
-- 003_indexes.sql - Performance indexes
-- 004_functions.sql - Database functions and triggers
```

### Required Environment Variables

```bash
# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
DATABASE_URL=your_supabase_db_url

# Payment Processing (Development)
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Currency Exchange (Optional in development)
EXCHANGE_RATE_API_KEY=your_api_key

# Application Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME="Smaragdus Viridi"
NODE_ENV=development
```

---

## 🏗️ Development Environment

### IDE Configuration

**Recommended: Cursor IDE**

```json
// .vscode/settings.json (included in project)
{
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "files.associations": {
    "*.css": "tailwindcss"
  }
}
```

### Browser DevTools Setup

- **React Developer Tools** - For component debugging
- **Redux DevTools** - For state management (if used)
- **Supabase Dashboard** - For database monitoring

### Git Configuration

```bash
# Configure Git for the project
git config user.name "Your Name"
git config user.email "your.email@example.com"

# Install pre-commit hooks
npm run prepare

# Verify hooks are working
git add . && git commit -m "test: verify pre-commit hooks"
```

---

## 🧪 Testing Setup

### Test Environment Configuration

```bash
# Install test dependencies (included in package.json)
# - vitest (test runner)
# - @testing-library/react (React testing utilities)
# - @testing-library/jest-dom (DOM testing matchers)
# - jsdom (DOM simulation)

# Run tests
npm run test

# Watch mode for development
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Database Setup

```bash
# Use a separate Supabase project for testing
# Set in .env.test.local:
NEXT_PUBLIC_SUPABASE_URL=your_test_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_test_anon_key
```

---

## 📁 Project Structure Overview

```
crystallique/
├── src/                          # Source code
│   ├── features/                 # Feature modules
│   │   ├── gemstones/           # Gemstone catalog feature
│   │   ├── authentication/      # User authentication
│   │   ├── cart/                # Shopping cart
│   │   ├── orders/              # Order management
│   │   ├── chat/                # Real-time chat
│   │   └── admin/               # Admin dashboard
│   ├── shared/                   # Shared utilities
│   │   ├── components/          # Reusable UI components
│   │   ├── hooks/               # Custom React hooks
│   │   ├── services/            # API services
│   │   └── types/               # TypeScript definitions
│   └── app/                      # Next.js 15 App Router
│       ├── (auth)/              # Auth route group
│       ├── (shop)/              # Shop route group
│       └── admin/               # Admin routes
├── public/                       # Static assets
├── docs/                         # Project documentation
├── supabase/                     # Database configuration
│   └── migrations/              # Database migrations
├── .cursor/                      # Cursor IDE rules
│   └── rules/                   # Development standards
├── tests/                        # Test files
└── package.json                  # Project configuration
```

---

## 🔐 Security Setup

### Environment Security

```bash
# Ensure .env files are in .gitignore
echo ".env*" >> .gitignore

# Never commit production secrets
# Use different keys for development/staging/production

# Verify no secrets in git history
git log --grep="password\|secret\|key" --oneline
```

### Development Security

- **Row Level Security (RLS)** enabled on all database tables
- **Type-safe API calls** with TypeScript
- **Input validation** with Zod schemas
- **HTTPS in production** (automatic with Vercel/Netlify)

---

## 📊 Quality Assurance Setup

### Code Quality Tools

```bash
# ESLint configuration (automated)
npm run lint

# TypeScript type checking
npm run type-check

# Prettier formatting (automatic on save)
# Format all files manually:
npx prettier --write .

# Pre-commit hooks (automatic)
# Runs on every commit:
# - ESLint
# - TypeScript checking
# - Test execution
```

### Performance Monitoring

```bash
# Lighthouse CI (in CI/CD pipeline)
# Local performance testing:
npm run build
npm run start
# Then run Lighthouse in Chrome DevTools
```

---

## 🚀 Deployment Preparation

### Build Verification

```bash
# Test production build locally
npm run build
npm run start

# Verify all pages load correctly
# Check for any build errors or warnings
```

### Environment-Specific Configuration

```bash
# Development
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Staging
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://staging.crystallique.com

# Production
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://crystallique.com
```

---

## 🆘 Troubleshooting

### Common Issues

#### Node.js Version Problems

```bash
# Ensure you're using Node.js 20
node --version

# If not, install correct version
fnm install 20
fnm use 20
```

#### Dependency Installation Issues

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Database Connection Issues

```bash
# Verify Supabase credentials in .env.local
# Check Supabase project status
# Ensure RLS policies are correctly configured
```

#### TypeScript Errors

```bash
# Regenerate TypeScript types
npm run type-check

# If Supabase types are outdated:
# Use MCP tools to regenerate database types
```

### Getting Help

- **Documentation**: Check [Living Development Dashboard](../06-tracking/LIVING_PLAN.md)
- **Architecture**: Review [System Architecture](../03-architecture/system-overview.md)
- **Issues**: Create GitHub issue with error details
- **Development Team**: Contact via project chat channels

---

## ✅ Development Readiness Checklist

### Environment Setup

- [ ] Node.js 20.x.x installed and verified
- [ ] Project dependencies installed successfully
- [ ] Environment variables configured
- [ ] Development server starts without errors
- [ ] Database connection established

### Tool Configuration

- [ ] Cursor IDE configured with project settings
- [ ] Git hooks installed and working
- [ ] ESLint and TypeScript checking passes
- [ ] Test suite runs successfully
- [ ] Browser development tools ready

### Access & Permissions

- [ ] Supabase project access confirmed
- [ ] GitHub repository access verified
- [ ] Development environment secrets configured
- [ ] Team communication channels joined

### Knowledge & Documentation

- [ ] Project overview reviewed
- [ ] Architecture documentation read
- [ ] Development workflow understood
- [ ] Quality standards familiar
- [ ] Living plan dashboard bookmarked
- [ ] **Human-AI collaboration guide** reviewed

**Status**: Ready to begin Sprint 1 development when all items are checked ✅

---

## 🤝 Human-AI Collaboration

For effective collaboration during implementation, see: **[Human-AI Collaboration Guide](./human-ai-collaboration-guide.md)**

### Key Collaboration Patterns:

- **Start with context**: Reference current documentation (`@docs/...`), never legacy archives
- **Be specific**: "Implement gemstone color filtering component" vs "add filtering"
- **Use iterative development**: Complete one feature component before moving to next
- **Validate each step**: Test functionality before proceeding
- **Update tracking**: Keep `docs/06-tracking/LIVING_PLAN.md` current

### Communication Templates:

```
"Let's implement [feature] from @docs/05-features/[feature-name].md
Current status: [what's completed]
Next step: [specific task]
Context: [constraints/requirements]"
```

---

_This setup guide ensures a consistent, secure, and productive development environment for all team members working on Smaragdus Viridi._
