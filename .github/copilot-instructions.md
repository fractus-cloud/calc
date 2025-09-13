# Project Copilot Instructions

**Status**: Initial setup
**Canonical File**: `.github/copilot-instructions.md` (do not duplicate at repo root)

## Purpose
This file documents project-specific guidance for AI assistants and outlines conventions for contributing, testing, and maintaining the repository.

## Inheritance & Discovery
When applicable, follow higher-level standards or templates maintained in shared configuration files. Prefer referencing those sources rather than duplicating content in this file.

## Project Scope
Authoritative current context (updated):
- Domain: Calculation and numerical utilities with optional interactive visualizers
- Site Type: Static website or single-page application using TypeScript and modern tooling
- Tech Stack: TypeScript and a modern bundler (Vite or similar); lightweight UI framework (React/Svelte) preferred
- Design Principles: Accessibility, responsiveness, performance, and theme support
- Hosting: Static hosting or edge platforms; configure CI/CD to match chosen hosting
- Infra Considerations: Keep serverless or edge functions minimal; add backend services only when necessary
- Distribution Goal: Provide modular, reusable calculator and visualization components

## AI Assistant Operational Heuristics
Practical heuristics for repository automation and AI assistance.
1. Canonical File Enforcement: Maintain a single instructions file for the repository; consolidate duplicates.
2. Memory Keys (examples - keep updated):
   - `key:domain value:calculation-visualizers`
   - `key:stack value:typescript-static-site`
   - `key:ui-framework value:vite-react (pending)`
   - `key:performance-budget value:js<200kb-initial`
   - `key:accessibility-target value:wcag2.1-aa`
   - `key:coverage-threshold value:90%`
3. Prohibited: Do not record or expose secrets, credentials, PII, or transient chat text.
4. Enhancement Bias: Prefer adding lightweight tests, documentation, and build scripts when implementing features.
5. Conventional Commits: Use clear commit scopes like `feat(calc)`, `chore(instructions)`, `docs(calc)`, `test(calc)`.
6. Quality Gates: Build → lint/format → type-check → test; add performance/accessibility checks as needed.
7. Edge Cases for numeric features: overflow/underflow, precision/rounding, division by zero, and invalid inputs.

## Standards References
When referencing external standards or templates, link to their canonical locations instead of copying content here.

## Implementation Guidance
When creating or evolving code in this repository:
- Start from a lightweight TypeScript template (Vite or similar) when applicable.
- Add linting & formatting (`eslint`, `prettier`) and enforce them in CI.
- Enable TypeScript strict mode.
- Separate pure calculation logic from UI components to simplify testing.
- Build accessible visualization components with ARIA where appropriate.
- Maintain a `README.md` with quick start, architecture, and contributing notes.
- Add unit tests (Vitest/Jest) for logic and components.
- Add CI workflows for install → lint → type-check → test → build; adapt deployment steps to your hosting.
- Optionally include runtime version pinning files (e.g., `.nvmrc`).

## Issue & PR Guidance
- Keep PRs small and focused.
- Include tests for new logic and relevant documentation updates.
- Request review from relevant maintainers or teams.
- Document infrastructure-related changes clearly in PR descriptions.

## Future Enhancements (Track via Issues)
- Define and prioritize a feature backlog (visualizers, unit conversions, calculators).
- Create a shared library for reusable calculator utilities.
- Add performance and accessibility checks to CI.
- Add visual regression tests for critical UI components.
- Add deployment workflows that match the chosen hosting provider.

---
Maintenance Note: Update this file as project scope evolves. Prefer referencing shared standards rather than duplicating them.
