## 🎯 Type
<!-- Select ONE type -->
- [ ] `feat`: New feature
- [ ] `fix`: Bug fix
- [ ] `refactor`: Code refactoring
- [ ] `perf`: Performance improvement
- [ ] `test`: Testing
- [ ] `docs`: Documentation
- [ ] `chore`: Maintenance
- [ ] `ci`: CI/CD changes
- [ ] `security`: Security fix

## 📋 Hardening Phase
<!-- If applicable, select phase -->
- [ ] Phase 1: Demo Data Cleanup
- [ ] Phase 2: Infrastructure Hardening
- [ ] Phase 3: Production Readiness
- [ ] Phase 4: Release Preparation
- [ ] N/A (not part of hardening)

## 📝 Description
<!-- Describe your changes in detail -->

## 🔗 Related Issues
<!-- Link related issues -->
Closes #
Related to #

## ✅ Checklist

### Code Quality
- [ ] Follows Conventional Commits specification
- [ ] TypeScript types added/updated
- [ ] No console.log statements (use logger)
- [ ] ESLint warnings addressed
- [ ] Code formatted with Prettier

### Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated (if applicable)
- [ ] All tests passing locally
- [ ] Test coverage maintained/improved

### Documentation
- [ ] README updated (if needed)
- [ ] API documentation updated (if needed)
- [ ] Inline code comments added
- [ ] CHANGELOG.md entry added

### Security
- [ ] No hardcoded secrets
- [ ] Dependencies audit passed
- [ ] Security headers configured (if applicable)
- [ ] Input validation implemented (if applicable)

### Performance
- [ ] Bundle size impact assessed
- [ ] Database queries optimized (if applicable)
- [ ] Lighthouse score maintained/improved

## 📸 Screenshots
<!-- If applicable, add screenshots -->

## 🚀 Deployment Notes
<!-- Any special deployment considerations -->

## 🔍 Review Focus Areas
<!-- What should reviewers focus on? -->

---

**Conventional Commit Title Format**: 
```
<type>(<scope>): <description>

Example: feat(auth): add OAuth2 login support
Example: fix(api): resolve CORS issue for /api/pulse endpoint
Example: refactor(phase1): remove mock data and implement real APIs
```

### Conventional Commit Guidelines:
- **Type**: One of `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`, `security`
- **Scope**: Optional, indicates what part of codebase (e.g., `auth`, `api`, `ui`, `phase1`)
- **Description**: Short summary in imperative mood (e.g., "add" not "added")
- **Body**: Optional, detailed explanation (separate with blank line)
- **Footer**: Optional, breaking changes or issue references

### Example Commit:
```
feat(api): add real-time pulse data endpoint

- Implemented /api/pulse endpoint with PostgreSQL integration
- Added error handling and fallback mechanisms
- Included request validation and rate limiting

Closes #123
```
