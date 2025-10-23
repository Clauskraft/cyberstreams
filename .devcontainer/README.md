# GitHub Codespaces Configuration

This directory contains the configuration for GitHub Codespaces, providing a complete development environment for Cyberstreams.

## What's Included

### Base Image
- **Node.js 20** with TypeScript support
- **Debian Bookworm** base OS
- Pre-configured development tools

### VS Code Extensions
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Tailwind CSS IntelliSense** - Tailwind class autocomplete
- **TypeScript** - Enhanced TypeScript support
- **GitLens** - Git supercharged
- **GitHub Copilot** - AI pair programmer
- **GitHub Copilot Chat** - AI assistant
- **Code Spell Checker** - Spell checking
- **Error Lens** - Inline error display
- **Path Intellisense** - File path autocomplete
- **React Snippets** - React code snippets

### Development Tools
- **Git** - Version control
- **GitHub CLI** - GitHub command-line tool
- **npm** - Package manager (included with Node.js)

### Ports
- **5173** - Vite development server (auto-forwarded)
- **3000** - Express server (auto-forwarded)

## How to Use

### Starting a Codespace

1. Go to the repository on GitHub
2. Click the **Code** button
3. Select the **Codespaces** tab
4. Click **Create codespace on [branch]**

GitHub will:
1. Create a cloud-based development environment
2. Install all dependencies automatically (`npm install`)
3. Set up all VS Code extensions
4. Forward development ports

### Development Commands

Once your Codespace is ready, you can run:

```bash
# Start the development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Start the Express server (backend)
npm run server
```

### Accessing the Application

- **Vite Dev Server**: Click on the forwarded port 5173 notification, or go to the Ports tab
- **Express Server**: Click on the forwarded port 3000 notification

## Features

### Automatic Setup
- Dependencies are installed automatically on creation
- No manual configuration needed
- Ready to code in seconds

### Pre-configured Settings
- **Format on save** enabled
- **ESLint auto-fix** on save
- **Tailwind CSS** IntelliSense configured
- **TypeScript** workspace SDK configured

### GitHub Integration
- GitHub CLI pre-installed
- GitHub Copilot ready to use
- GitLens for enhanced Git experience

## Environment Variables

The container sets:
- `NODE_ENV=development` - Development mode

For production deployment or additional environment variables, create a `.env` file in the workspace root.

## Customization

To customize the Codespace:

1. Edit `.devcontainer/devcontainer.json`
2. Add or remove VS Code extensions
3. Modify settings
4. Add additional features
5. Commit and push changes

The next Codespace created will use the updated configuration.

## Troubleshooting

### Ports Not Forwarding
- Check the **Ports** tab in VS Code
- Manually add ports if needed

### Dependencies Not Installing
- Run `npm install` manually
- Check the creation log for errors

### Extensions Not Loading
- Reload the window: `Cmd/Ctrl + Shift + P` → "Developer: Reload Window"
- Check the extensions list

## Resources

- [GitHub Codespaces Documentation](https://docs.github.com/en/codespaces)
- [Dev Container Specification](https://containers.dev/)
- [VS Code Remote Development](https://code.visualstudio.com/docs/remote/remote-overview)

## Support

If you encounter issues with the Codespace configuration:
1. Check the [repository issues](https://github.com/Clauskraft/cyberstreams/issues)
2. Create a new issue with the `codespaces` label
3. Include the creation log and error details

---

**Status**: ✅ Ready to Use
**Last Updated**: 2025-10-15
**Node.js Version**: 20.x
**Base Image**: mcr.microsoft.com/devcontainers/typescript-node:1-20-bookworm
