# Copilot Coding Agent Instructions for cyberstreams

## Repository Overview
This repository is for Cyberstreams, an advanced Dark Web Threat Intelligence Platform. It features a React + TypeScript frontend, Node.js/Express backend, PostgreSQL (with pgvector), and Cloudflare deployment. The codebase is organized by modules and components, with strict TypeScript and Tailwind CSS for styling.

## Copilot Coding Agent Best Practices

### 1. Follow Project Structure and Conventions
- **Frontend:**
  - Use React 18+ with TypeScript (strict mode).
  - Organize features in `src/modules/`, reusable UI in `src/components/`.
  - Use path aliases (`@/`, `@modules/`, `@components/`).
  - Style with Tailwind CSS, following the dark theme and color palette.
- **Backend:**
  - Use Express.js (Node.js) for API endpoints.
  - Use PostgreSQL with pgvector for semantic search.
  - Integrate OpenAI API for RAG features.
  - Scripts and migrations in `scripts/`.
- **Infrastructure:**
  - Deploy via Cloudflare Pages/Workers.
  - Use `wrangler.toml` for Worker config.

### 2. TypeScript and Type Safety
- Always use strict types, avoid `any`.
- Define interfaces/types for all API data, props, and responses.
- Use proper React component typing (`React.FC<Props>`).

### 3. API and Data Handling
- Implement RESTful endpoints with clear error handling.
- Validate and sanitize all inputs.
- Use environment variables for secrets (never commit API keys).

### 4. Styling and Theming
- Use Tailwind utility classes.
- Follow the established dark theme and color palette.
- Ensure responsive/mobile-first design.

### 5. Error Handling
- Use `ErrorBoundary` for React errors.
- Handle backend errors with proper status codes and messages.

### 6. Documentation and Comments
- Add JSDoc comments for complex functions.
- Document new endpoints and modules.

### 7. Testing (when implemented)
- Use consistent patterns for component and API tests.
- Focus on critical business logic and user flows.

### 8. Security
- Never commit secrets or API keys.
- Use parameterized queries for DB access.
- Implement authentication/authorization for production.

### 9. Performance
- Use code splitting and lazy loading for large modules.
- Leverage Cloudflare CDN and Workers for edge performance.

### 10. Pull Requests and Commits
- Use feature branches from `master`.
- Write clear, descriptive commit messages.
- Reference issues and ensure build passes before merging.

## Reference Files
- `.github/copilot-instructions.md` (detailed project and coding standards)
- `README.md`, `FUNCTION_LIST.md`, `QUICK_REFERENCE.md` (project docs)

## When in Doubt
- Match the style and structure of existing code.
- Ask for clarification if requirements are ambiguous.
- Default to strict type safety and security best practices.

---

_Last updated: 2025-10-14_
