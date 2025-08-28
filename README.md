# 🔷 Smaragdus Viridi - Premium Gemstone E-commerce Platform

> Professional gemstone trading platform for jewelers, collectors, and enthusiasts

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-2.24-green)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-38B2AC)](https://tailwindcss.com/)
[![Three.js](https://img.shields.io/badge/Three.js-3D-049EF4)](https://threejs.org/)

## 🌟 Overview

Smaragdus Viridi is a sophisticated gemstone trading platform designed for professional jewelers, collectors, and gemstone enthusiasts. The platform features advanced 3D visualization, real-time chat support, multi-currency transactions, and comprehensive inventory management.

### 🏆 Key Differentiators

- **Advanced 3D Ring Visualization** - Interactive Three.js gemstone rendering with accurate sizing
- **Multi-Currency Support** - Real-time conversion (USD, EUR, GBP, RUB, CHF, JPY)
- **AI-Powered Analysis** - Automatic gemstone data extraction and primary image selection
- **Professional Media Management** - High-resolution images with watermarking and secure downloads
- **Real-time Customer Support** - Integrated chat system with file attachments
- **Advanced Filtering** - 11 filter types with instant client-side updates

## 🚀 Quick Start

### Prerequisites

- **Node.js 20+** - Runtime environment
- **Supabase Account** - Backend database and authentication
- **OpenAI API Key** - For AI gemstone analysis (optional for basic functionality)

### Installation

```bash
# Clone repository
git clone https://github.com/your-repo/smaragdus-viridi.git
cd smaragdus-viridi

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your credentials:
# NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
# OPENAI_API_KEY=your_openai_api_key

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 🏗️ Architecture

### Technology Stack

| Component            | Technology                           | Purpose                                      |
| -------------------- | ------------------------------------ | -------------------------------------------- |
| **Frontend**         | Next.js 15, TypeScript, Tailwind CSS | Modern React framework with type safety      |
| **Backend**          | Supabase (PostgreSQL)                | Database, authentication, real-time features |
| **3D Visualization** | Three.js                             | Interactive gemstone rendering               |
| **AI Analysis**      | OpenAI GPT-4o                        | Automated gemstone data extraction           |
| **Payments**         | Stripe                               | Secure payment processing                    |
| **File Storage**     | Supabase Storage                     | Media file management                        |

### Project Structure

```
src/
├── app/                    # Next.js 15 App Router
│   ├── (auth)/            # Authentication routes
│   ├── (shop)/            # Shopping routes
│   ├── admin/             # Admin dashboard
│   └── api/               # API routes
├── features/              # Feature-based modules
│   ├── auth/              # Authentication system
│   ├── gemstones/         # Gemstone catalog
│   ├── cart/              # Shopping cart
│   ├── orders/            # Order management
│   ├── chat/              # Real-time support
│   └── visualization/     # 3D ring visualizer
├── shared/                # Shared components & utilities
└── lib/                   # External service configurations
```

## 🎨 Key Features

### For Professional Jewelers

- **Advanced Technical Specifications** - Complete 4Cs (Cut, Color, Clarity, Carat) data
- **High-Resolution Media** - Professional photography with watermarking
- **Bulk Operations** - Batch downloads and wholesale pricing
- **Real-time Inventory** - Live availability and delivery estimates
- **Expert Support** - Direct chat with gemstone specialists

### For Gem-Cutters & Manufacturers

- **Technical Precision** - Exact dimensional specifications
- **Origin Tracking** - Mine source and certification data
- **Custom Consultation** - Direct communication for bespoke projects
- **Volume Pricing** - Professional tier pricing structures

### For End Customers

- **3D Visualization** - Try gemstones on virtual rings
- **Educational Content** - Gemstone knowledge and care guides
- **Secure Checkout** - Multiple payment options
- **Customer Support** - 24/7 assistance via chat

## 📊 Development Status

**Current Sprint**: Sprint 4 Complete ✅
**Next Sprint**: Sprint 5 - Shopping Cart (Ready to begin)
**Overall Progress**: 75% Complete

### Sprint Status

- ✅ **Sprint 1**: Core Infrastructure (Database, Auth, Build)
- ✅ **Sprint 2**: Homepage & Navigation (Theme, Mobile, SEO)
- ✅ **Sprint 3**: Catalog & Filtering (Advanced filtering system)
- ✅ **Sprint 4**: Product Details (Luxury UI, Media galleries)
- 🚧 **Sprint 5**: Shopping Cart (Next priority)

## 🔧 Development Commands

### Core Development

```bash
# Development server
npm run dev

# Build for production
npm run build

# Type checking
npm run type-check

# Code quality
npm run lint
npm run lint:fix
```

### AI Analysis & Data

```bash
# Analyze gemstones with AI
node scripts/ai-gemstone-analyzer-v3.mjs --limit 5

# Test AI system
node scripts/test-multi-image.mjs
```

### Quality Gates

```bash
# Run all quality checks
npm run quality-check

# Test suite
npm run test
```

## 📚 Documentation

### Core Documentation

- **[📊 Living Development Dashboard](../docs/06-tracking/LIVING_PLAN.md)** - Real-time project status
- **[📝 Customer Requirements](../docs/02-requirements/)** - Business needs and user stories
- **[🏗️ System Architecture](../docs/03-architecture/)** - Technical design and patterns
- **[🚀 Implementation Guide](../docs/04-implementation/)** - Development setup and workflow

### Feature Documentation

- **[💎 Gemstone Catalog](../docs/05-features/)** - Product features and specifications
- **[🛡️ Quality Standards](../docs/07-quality/)** - Code quality and testing requirements
- **[📦 AI Analysis System](../scripts/ai-analysis/)** - Automated gemstone data processing

## 🤝 Contributing

### Development Workflow

1. **Read the Documentation**:

   ```bash
   # Start with the living plan
   cat docs/06-tracking/LIVING_PLAN.md
   ```

2. **Follow the Implementation Guide**:

   ```bash
   cat docs/04-implementation/implementation-playbook.md
   ```

3. **Adhere to Type Governance**:

   ```bash
   cat docs/04-implementation/TYPE_GOVERNANCE.md
   ```

4. **Run Quality Checks**:
   ```bash
   npm run quality-check
   ```

### Code Standards

- **TypeScript**: 100% coverage, strict mode enabled
- **ESLint**: Zero errors, auto-fix enabled
- **Testing**: Minimum 80% coverage for business logic
- **Performance**: Lighthouse scores >90

### Commit Convention

```bash
# Feature commits
git commit -m "feat(catalog): add advanced gemstone filtering"

# Bug fixes
git commit -m "fix(cart): resolve total calculation error"

# Documentation
git commit -m "docs(readme): update installation instructions"
```

## 🌐 Environment Configuration

### Required Environment Variables

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Analysis (Optional)
OPENAI_API_KEY=your-openai-api-key

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### Database Setup

The application uses Supabase with the following key tables:

- `gemstones` - Main inventory with technical specifications
- `user_profiles` - Customer and admin user management
- `orders` - Order processing and tracking
- `chat_messages` - Real-time customer support
- `gemstone_images` - Media file management

## 🚀 Deployment

### Production Deployment

The application is designed for deployment on Vercel or Netlify:

```bash
# Build for production
npm run build

# Deploy to Vercel
vercel --prod

# Or deploy to Netlify
netlify deploy --prod --dir=out
```

### Environment Requirements

- **Node.js**: 20.x or higher
- **Database**: Supabase PostgreSQL
- **Storage**: Supabase Storage for media files
- **CDN**: Automatic image optimization via Next.js

## 🔐 Security & Privacy

### Security Features

- **Row Level Security (RLS)** - Database-level access control
- **JWT Authentication** - Secure session management
- **Input Validation** - Zod schemas for all user inputs
- **XSS Protection** - Content Security Policy and sanitization
- **CSRF Protection** - Anti-forgery tokens for state changes

### Data Privacy

- **GDPR Compliance** - EU data protection standards
- **PCI DSS** - Payment security compliance
- **Encryption** - Data encrypted at rest and in transit
- **Audit Logging** - Comprehensive activity tracking

## 📈 Performance

### Performance Targets

- **Page Load**: <2.5 seconds for catalog pages
- **Image Loading**: Progressive loading with optimization
- **Search Response**: <500ms for filter updates
- **3D Rendering**: 60fps interactive visualization
- **Lighthouse Score**: >90 for all metrics

### Optimization Features

- **Next.js ISR** - Incremental Static Regeneration
- **Image Optimization** - Automatic WebP conversion
- **Bundle Splitting** - Code splitting by feature
- **Caching Strategy** - Multi-layer caching (CDN, browser, server)

## 🧪 Testing

### Test Categories

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Performance tests
npm run test:performance
```

### Test Coverage

- **Unit Tests**: 80%+ coverage for utilities and business logic
- **Integration Tests**: API endpoints and database operations
- **E2E Tests**: Critical user journeys (checkout, search)
- **Performance Tests**: Lighthouse CI integration

## 📞 Support & Community

### Getting Help

- **Documentation**: Check the [living development dashboard](../docs/06-tracking/LIVING_PLAN.md)
- **Issues**: Report bugs via [GitHub Issues](../../issues)
- **Discussions**: Join community discussions
- **Email**: Contact the development team

### Contributing Guidelines

- **Code of Conduct**: Respectful and inclusive environment
- **Pull Requests**: Follow the contribution workflow
- **Documentation**: Update docs for all feature changes
- **Testing**: Include tests for new functionality

## 📄 License

**Private Project** - Smaragdus Viridi © 2025

---

## 🎯 Project Vision

Smaragdus Viridi aims to revolutionize the gemstone industry by providing:

- **Transparency**: Complete technical specifications and origin tracking
- **Accessibility**: Professional tools for jewelers and enthusiasts
- **Innovation**: AI-powered analysis and 3D visualization
- **Trust**: Secure transactions and expert support
- **Excellence**: Premium user experience and technical quality

---

**📊 Live Status**: Check [Living Development Dashboard](../docs/06-tracking/LIVING_PLAN.md) for real-time project updates

**🚀 Ready for Launch**: Join us in building the future of gemstone commerce!
