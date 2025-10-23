# Claude Code Integration Guide

This repository uses [Claude Code](https://claude.com/claude-code) for AI-assisted development and code review.

## 🤖 Available GitHub Actions Workflows

### 1. Claude Code Integration (`claude.yml`)

Automatically triggers when Claude is mentioned in:
- Issue comments (`@claude`)
- Pull request review comments (`@claude`)
- Pull request reviews (`@claude`)
- Issue titles or descriptions (`@claude`)

**Usage:**
- Tag `@claude` in any comment to invoke Claude for assistance
- Claude can read CI results and help debug failed tests
- Claude will respond with suggestions, fixes, or explanations

### 2. Automated Code Review (`claude-code-review.yml`)

Automatically reviews all pull requests when opened or updated.

**Features:**
- Code quality and best practices analysis
- Potential bug detection
- Performance considerations
- Security concern identification
- Test coverage assessment

**Configuration:**
The workflow can be customized to:
- Filter by PR author
- Only run on specific file changes (TypeScript, JavaScript, etc.)
- Adjust review criteria based on project needs

## 🔧 Setup Requirements

### Required GitHub Secrets

Add the following secret to your repository settings:

- `ANTHROPIC_API_KEY`: Your Anthropic API key for Claude access

### Permissions

The workflows require the following permissions:
- `contents: read` - Read repository content
- `pull-requests: read` - Read pull request information
- `issues: read` - Read issue information
- `id-token: write` - Write ID tokens for authentication
- `actions: read` - Read CI results (optional, for debugging)

## 📚 Style and Conventions

When Claude performs code reviews or makes suggestions, it follows these guidelines:

### Code Quality
- Follow TypeScript/JavaScript best practices
- Maintain consistent code style with existing patterns
- Use proper type annotations
- Implement error handling where appropriate

### Architecture
- Maintain separation of concerns
- Keep components modular and reusable
- Follow the project's existing structure
- Use appropriate design patterns

### Security
- Avoid committing secrets or sensitive data
- Use environment variables for configuration
- Implement proper input validation
- Follow security best practices for web applications

### Performance
- Optimize bundle size with lazy loading
- Use code splitting where appropriate
- Minimize unnecessary re-renders
- Implement caching strategies

### Testing
- Write tests for new features (when test infrastructure exists)
- Ensure existing tests pass
- Consider edge cases
- Test error conditions

## 🚀 Technology Stack

This project uses:
- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite 4.5.14
- **Styling**: Tailwind CSS 3.3.3
- **Icons**: Lucide React
- **Hosting**: Cloudflare Pages/Workers

## 💡 Tips for Working with Claude

### Effective Prompts
- Be specific about what you need
- Provide context about the problem
- Reference specific files or functions when relevant
- Ask for explanations if you need to understand the code

### Code Review Feedback
- Claude's code review comments are constructive
- Consider the suggestions but use your judgment
- Ask follow-up questions if clarification is needed
- Claude can help explain complex code patterns

### Debugging
- Tag `@claude` in PR comments to get help with failing tests
- Ask Claude to analyze error logs or stack traces
- Request suggestions for performance improvements
- Get security vulnerability assessments

## 📖 Additional Resources

- [Claude Code Documentation](https://docs.claude.com/en/docs/claude-code)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Anthropic Claude API](https://docs.anthropic.com/)

## 🔒 Privacy and Security

- Claude only accesses repository content when invoked
- API keys are stored securely as GitHub Secrets
- No sensitive data should be committed to the repository
- Follow the principle of least privilege for permissions

---

**Note**: This integration was added to enhance development workflow and maintain code quality. For questions or issues with the Claude integration, refer to the [Anthropic Claude Code Action repository](https://github.com/anthropics/claude-code-action).
