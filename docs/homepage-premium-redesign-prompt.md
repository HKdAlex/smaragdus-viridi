## Homepage Premium Redesign Prompt

You are a senior product designer and UX engineer. Redesign the homepage end-to-end for a premium look and feel. The goal is to elevate the brand experience with high-quality visuals, elegant typography, thoughtful motion, and a clear, conversion-focused narrative.

Constraints and goals
- Redesign is allowed to be a major departure from the current page: reorganize sections, add or remove content, and expand the experience for a premium audience.
- Prioritize clarity, hierarchy, and usability across desktop and mobile.
- The new design must be implementable incrementally in a production codebase.
- Implementation must be rollback-safe: use a feature flag, configuration toggle, or parallel route to switch between the current homepage and the new premium version without removing existing code.

Deliverables
- A full-page UX and UI specification with section-by-section structure.
- Visual system guidelines: typography scale, color palette, spacing, grids, and iconography.
- Motion and interaction spec: micro-interactions, scroll animations, hover states, and transitions with rationale.
- Responsive behavior: desktop, tablet, and mobile adaptations.
- Content strategy: recommended copy themes, content modules, and data/visuals.
- Implementation notes: component structure, reuse of existing components where possible, and how to support rollback.
- A complete universal harness setup for this initiative using `docs/universal-harness` templates.

Brand and experience direction
- Tone: luxurious, refined, minimal, confident.
- Visuals: high-end editorial layout, high contrast, precise spacing, premium materials/texture cues if appropriate.
- UX: short attention path to the primary CTA, with secondary exploration that feels curated.
- Performance: animations should be tasteful and performant, not distracting.

Homepage structure (propose new layout)
- Hero: immersive headline, premium product imagery, primary CTA, optional secondary CTA.
- Trust and social proof: certifications, awards, reviews, or partner logos.
- Signature products or collections: curated highlights with emphasis on quality and provenance.
- Value pillars: concise benefits framed for a premium audience.
- Editorial narrative: story-driven section with high-end visuals.
- Education or expertise section: explain craftsmanship, sourcing, or differentiation.
- Personalization: recommendations or filters to guide discovery.
- Final CTA: elegant, conversion-focused close.

Interaction and animation guidance
- Subtle parallax or depth on hero imagery.
- Scroll-based reveals for sections (fade, slide, staggered).
- Hover states that enhance clarity (not gimmicky).
- Loading states that feel premium and calm.
- Accessibility: ensure reduced motion support and keyboard navigation.

Rollback-safe implementation requirements
- Keep the current homepage intact.
- Implement the premium homepage behind a feature flag or a dedicated route that can be toggled on/off at runtime.
- Ensure shared data fetching logic can be reused without breaking the existing page.
- Provide a migration strategy so new components can be adopted gradually.

Harness setup requirements (use `docs/universal-harness`)
- Create a full harness in `docs/plan/` for the premium homepage redesign.
- Use these templates as sources, replacing all placeholders with this project’s details:
  - `docs/universal-harness/TEMPLATE_00_vision.md` → `docs/plan/00_vision.md`
  - `docs/universal-harness/TEMPLATE_01_contracts.md` → `docs/plan/01_contracts.md`
  - `docs/universal-harness/TEMPLATE_02_interfaces.md` → `docs/plan/02_interfaces.md`
  - `docs/universal-harness/TEMPLATE_03_test_corpus.md` → `docs/plan/03_test_corpus.md`
  - `docs/universal-harness/TEMPLATE_AGENT_PROMPT.md` → `docs/plan/AGENT_PROMPT.md`
  - `docs/universal-harness/README.md` → `docs/plan/README.md` (adapt to this initiative)
- The harness must include:
  - Vision: premium homepage experience goals, non-negotiable UX constraints, and architectural intent.
  - Contracts: phased contracts for discovery, design, implementation, motion, and rollout with acceptance tests.
  - Interfaces: authority boundaries (design tokens, content copy, animation system, data sources).
  - Test corpus: golden UI/UX behaviors, accessibility expectations, and visual regression coverage.
  - Agent prompt: tools, repo structure, and workflow rules specific to this redesign.
- Ensure the harness explicitly states rollback strategy and feature-flag requirements.

Output format
- Provide the full homepage outline with section names and purpose.
- For each section: layout, key UI elements, copy direction, and motion.
- Provide a concise UI kit summary and animation system summary.
- End with implementation and rollout notes including the rollback plan.
