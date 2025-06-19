# Documentation Analysis & Alignment Prompt

## Mission Statement

Conduct a comprehensive analysis of customer requirements, Cursor project rules, and initial documentation to ensure the Smaragdus Viridi gemstone e-commerce platform has complete, aligned, and implementation-ready documentation with no gaps.

## Analysis Framework

### Phase 1: Requirements Discovery & Analysis

#### 1.1 Customer Requirements Analysis

- [ ] **Review PRD and Technical Specifications**

  - Identify all functional requirements (gemstone catalog, payment processing, admin dashboard, etc.)
  - Identify all non-functional requirements (performance, security, scalability)
  - Map user stories and acceptance criteria
  - Document business rules and constraints
  - Identify integration requirements (Supabase, Stripe, file storage)

- [ ] **Stakeholder Needs Assessment**

  - Customer-facing features (gemstone browsing, purchasing, chat support)
  - Admin requirements (inventory management, order processing, user management)
  - Business intelligence needs (analytics, reporting, tracking)
  - Compliance and security requirements

- [ ] **Feature Priority Matrix**
  - Categorize features as: Must-have, Should-have, Could-have, Won't-have
  - Identify MVP scope vs future releases
  - Document dependencies between features

#### 1.2 Technical Requirements Validation

- [ ] **Architecture Requirements**

  - Next.js 15 app router implementation patterns
  - Supabase integration (auth, database, real-time, storage)
  - TypeScript strict typing requirements
  - Performance benchmarks and targets

- [ ] **Integration Points**
  - Third-party services (Stripe payments, currency conversion)
  - External APIs and data sources
  - File storage and media management
  - Real-time communication systems

### Phase 2: Cursor Rules Alignment Assessment

#### 2.1 Rules Coverage Analysis

- [ ] **Feature-Based Architecture Rules**

  - Verify all customer features are covered by architectural patterns
  - Ensure component organization aligns with business domains
  - Validate cross-feature communication patterns

- [ ] **Build Quality Standards**

  - Check that quality standards support customer requirements
  - Ensure testing strategies cover critical user journeys
  - Validate performance standards meet business needs

- [ ] **Domain-Specific Rules**
  - Gemstone business logic completeness
  - Database design covers all data requirements
  - TypeScript types support all business entities

#### 2.2 Rule Gaps Identification

- [ ] **Missing Rule Categories**

  - Identify customer requirements not covered by existing rules
  - Find technical patterns needed but not documented
  - Discover business logic not captured in rules

- [ ] **Rule Conflicts Resolution**
  - Check for contradictory guidance between rule files
  - Ensure consistency across all documentation
  - Validate technical approach alignment

### Phase 3: Documentation Gap Analysis

#### 3.1 Implementation Readiness Check

- [ ] **Code Structure Documentation**

  - Directory structure completeness
  - Component hierarchy and relationships
  - Service layer documentation
  - Database schema completeness

- [ ] **API Documentation**

  - All endpoints defined with request/response schemas
  - Authentication and authorization patterns
  - Error handling documentation
  - Rate limiting and security measures

- [ ] **Business Logic Documentation**
  - Pricing calculation algorithms
  - Inventory management workflows
  - Order processing pipelines
  - User role and permission matrices

#### 3.2 Developer Experience Documentation

- [ ] **Setup and Installation**

  - Complete development environment setup
  - Dependency management and versions
  - Environment configuration requirements
  - Database setup and seeding

- [ ] **Development Workflows**
  - Git branching strategies
  - Code review processes
  - Testing procedures
  - Deployment pipelines

### Phase 4: Implementation Tracking System

#### 4.1 Progress Tracking Framework

- [ ] **Feature Implementation Matrix**

  ```
  | Feature | Status | Priority | Dependencies | Assigned | Est. Hours | Notes |
  |---------|---------|----------|-------------|-----------|------------|--------|
  | Gemstone Catalog | Not Started | P0 | Database Schema | - | 40 | Core feature |
  | User Authentication | Not Started | P0 | Supabase Setup | - | 16 | Prerequisite |
  ```

- [ ] **Technical Debt Tracking**
  - Code quality metrics
  - Performance optimization needs
  - Security audit requirements
  - Documentation updates needed

#### 4.2 Quality Assurance Checkpoints

- [ ] **Build Quality Gates**

  - TypeScript compilation without errors
  - All tests passing with >80% coverage
  - ESLint rules compliance
  - Performance benchmarks met

- [ ] **Business Logic Validation**
  - Pricing calculations verified
  - Inventory management tested
  - Order processing workflows validated
  - User permissions enforced

### Phase 5: Deliverables Creation

#### 5.1 Living Documentation Structure

```
docs/
├── 01-requirements/
│   ├── customer-requirements.md
│   ├── technical-specifications.md
│   ├── feature-matrix.md
│   └── acceptance-criteria.md
├── 02-architecture/
│   ├── system-overview.md
│   ├── database-design.md
│   ├── api-specifications.md
│   └── integration-patterns.md
├── 03-implementation/
│   ├── setup-guide.md
│   ├── development-workflows.md
│   ├── coding-standards.md
│   └── testing-strategy.md
├── 04-tracking/
│   ├── progress-dashboard.md
│   ├── technical-debt-log.md
│   ├── quality-metrics.md
│   └── milestone-tracking.md
└── 05-business-logic/
    ├── gemstone-domain-rules.md
    ├── pricing-algorithms.md
    ├── inventory-workflows.md
    └── user-management.md
```

#### 5.2 Implementation-Ready Documentation

- [ ] **Complete API Documentation**

  - OpenAPI/Swagger specifications
  - Authentication flow diagrams
  - Error response catalogues
  - Rate limiting policies

- [ ] **Database Documentation**

  - Complete ERD with relationships
  - Table schemas with constraints
  - Stored procedures and triggers
  - Migration scripts

- [ ] **Component Library Documentation**
  - Storybook integration
  - Component API documentation
  - Usage examples and patterns
  - Accessibility guidelines

### Phase 6: Continuous Alignment Process

#### 6.1 Documentation Maintenance

- [ ] **Regular Review Schedule**

  - Weekly progress updates
  - Monthly documentation reviews
  - Quarterly architecture assessments
  - Customer feedback integration

- [ ] **Change Management**
  - Requirement change tracking
  - Impact analysis procedures
  - Documentation update workflows
  - Stakeholder communication

#### 6.2 Quality Metrics Dashboard

- [ ] **Implementation Metrics**

  - Feature completion percentage
  - Code quality scores
  - Test coverage statistics
  - Performance benchmarks

- [ ] **Business Metrics**
  - Customer requirement satisfaction
  - Technical debt levels
  - Documentation completeness
  - Team velocity tracking

## Expected Outputs

### 1. Comprehensive Requirements Document

- Complete customer requirements with traceability
- Technical specifications aligned with business needs
- Feature priority matrix with implementation roadmap

### 2. Validated Cursor Rules

- Updated rules covering all customer requirements
- Resolved conflicts and inconsistencies
- Added missing technical patterns and business logic

### 3. Implementation-Ready Documentation

- Complete setup and development guides
- API and database documentation
- Component and service documentation
- Testing and deployment procedures

### 4. Progress Tracking System

- Feature implementation matrix
- Quality metrics dashboard
- Technical debt tracking
- Milestone and deadline management

### 5. Business Logic Specification

- Complete gemstone domain rules
- Pricing and inventory algorithms
- User management and permissions
- Order processing workflows

## Success Criteria

✅ **No Documentation Gaps**: Every customer requirement has corresponding implementation documentation
✅ **Full Cursor Rules Alignment**: All rules support customer needs and technical requirements
✅ **Implementation Ready**: Developers can start coding immediately with clear guidance
✅ **Progress Trackable**: Clear visibility into project status and remaining work
✅ **Quality Assured**: Built-in quality gates and validation checkpoints
✅ **Business Logic Complete**: All domain rules and algorithms fully specified
✅ **Stakeholder Aligned**: Customer requirements, technical approach, and business goals in harmony

## Action Items

1. **Start with Phase 1**: Thoroughly analyze all existing customer requirements and specifications
2. **Map to Cursor Rules**: Validate that current rules support all identified requirements
3. **Identify Gaps**: Document missing documentation, conflicting guidance, and unclear specifications
4. **Create Implementation Plan**: Develop detailed roadmap with trackable milestones
5. **Build Living Documentation**: Create maintainable documentation that evolves with the project
6. **Establish Quality Gates**: Implement checkpoints to ensure ongoing alignment and quality

This analysis should result in a complete, gap-free documentation suite that enables confident, efficient implementation of the Smaragdus Viridi gemstone e-commerce platform.
