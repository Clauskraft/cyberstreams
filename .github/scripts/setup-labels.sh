#!/bin/bash
# Setup GitHub labels for Repo Hardening workflow

echo "🏷️  Setting up GitHub labels for Repo Hardening..."

# Hardening Phase Labels
echo "Creating hardening phase labels..."
gh label create "hardening:phase1" --color "0e8a16" --description "Phase 1: Demo data cleanup" --force 2>/dev/null || echo "✓ hardening:phase1 exists"
gh label create "hardening:phase2" --color "fbca04" --description "Phase 2: Infrastructure hardening" --force 2>/dev/null || echo "✓ hardening:phase2 exists"
gh label create "hardening:phase3" --color "d93f0b" --description "Phase 3: Production readiness" --force 2>/dev/null || echo "✓ hardening:phase3 exists"
gh label create "hardening:phase4" --color "0052cc" --description "Phase 4: Release preparation" --force 2>/dev/null || echo "✓ hardening:phase4 exists"

# Type Labels (Conventional Commits)
echo "Creating type labels..."
gh label create "type:feat" --color "a2eeef" --description "New feature" --force 2>/dev/null || echo "✓ type:feat exists"
gh label create "type:fix" --color "d73a4a" --description "Bug fix" --force 2>/dev/null || echo "✓ type:fix exists"
gh label create "type:refactor" --color "e99695" --description "Code refactoring" --force 2>/dev/null || echo "✓ type:refactor exists"
gh label create "type:perf" --color "1d76db" --description "Performance improvement" --force 2>/dev/null || echo "✓ type:perf exists"
gh label create "type:test" --color "c5def5" --description "Testing" --force 2>/dev/null || echo "✓ type:test exists"
gh label create "type:docs" --color "0075ca" --description "Documentation" --force 2>/dev/null || echo "✓ type:docs exists"
gh label create "type:chore" --color "fef2c0" --description "Maintenance" --force 2>/dev/null || echo "✓ type:chore exists"
gh label create "type:ci" --color "bfd4f2" --description "CI/CD changes" --force 2>/dev/null || echo "✓ type:ci exists"
gh label create "type:security" --color "ee0701" --description "Security fix" --force 2>/dev/null || echo "✓ type:security exists"

# Priority Labels
echo "Creating priority labels..."
gh label create "priority:critical" --color "b60205" --description "Critical priority" --force 2>/dev/null || echo "✓ priority:critical exists"
gh label create "priority:high" --color "d93f0b" --description "High priority" --force 2>/dev/null || echo "✓ priority:high exists"
gh label create "priority:medium" --color "fbca04" --description "Medium priority" --force 2>/dev/null || echo "✓ priority:medium exists"
gh label create "priority:low" --color "0e8a16" --description "Low priority" --force 2>/dev/null || echo "✓ priority:low exists"

# Status Labels
echo "Creating status labels..."
gh label create "status:in-progress" --color "0e8a16" --description "Work in progress" --force 2>/dev/null || echo "✓ status:in-progress exists"
gh label create "status:review-needed" --color "fbca04" --description "Needs review" --force 2>/dev/null || echo "✓ status:review-needed exists"
gh label create "status:blocked" --color "d73a4a" --description "Blocked" --force 2>/dev/null || echo "✓ status:blocked exists"

# Release Label
echo "Creating release label..."
gh label create "release" --color "0052cc" --description "Release preparation" --force 2>/dev/null || echo "✓ release exists"

echo ""
echo "✅ Label setup complete!"
echo ""
echo "📋 Summary:"
echo "  - Hardening phases: 4 labels"
echo "  - Types (Conventional Commits): 9 labels"
echo "  - Priorities: 4 labels"
echo "  - Status: 3 labels"
echo "  - Release: 1 label"
echo ""
echo "Total: 21 labels configured"
