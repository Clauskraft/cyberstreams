#!/usr/bin/env bash
set -euo pipefail

# Requires gh CLI authenticated with repo scope
# Usage: ./scripts/setup-repo.sh <owner> <repo>
OWNER=mkdir -p scripts && printf "%s" "#!/usr/bin/env bash
set -euo pipefail

# Requires gh CLI authenticated with repo scope
# Usage: ./scripts/setup-repo.sh <owner> <repo>
OWNER=${1:-}
REPO=${2:-}
if [[ -z \"$OWNER\" || -z \"$REPO\" ]]; then
  echo \"Usage: $0 <owner> <repo>\" >&2
  exit 1
fi

# Branch protection on main
# - Require PR reviews
# - Require status checks (CI)
# - Enforce for admins

echo \"Configuring branch protection for $OWNER/$REPO:main\"
gh api \
  -X PUT \
  -H \"Accept: application/vnd.github+json\" \
  \"/repos/$OWNER/$REPO/branches/main/protection\" \
  -f required_status_checks.strict=true \
  -f required_status_checks.contexts[]='build-test' \
  -f enforce_admins=true \
  -f required_pull_request_reviews.required_approving_review_count=1 \
  -F restrictions=null

# Labels
create_or_update_label() {
  local name=\"$1\"
  local color=\"$2\"
  local desc=\"$3\"
  if gh api repos/$OWNER/$REPO/labels/$(printf %s \"$name\" | sed 's/ /%20/g') >/dev/null 2>&1; then
    gh api \
      --method PATCH \
      -H \"Accept: application/vnd.github+json\" \
      /repos/$OWNER/$REPO/labels/$(printf %s \"$name\" | sed 's/ /%20/g') \
      -f new_name=\"$name\" -f color=\"$color\" -f description=\"$desc\"
  else
    gh api \
      --method POST \
      -H \"Accept: application/vnd.github+json\" \
      /repos/$OWNER/$REPO/labels \
      -f name=\"$name\" -f color=\"$color\" -f description=\"$desc\"
  fi
}

create_or_update_label \"dependencies\" \"0366d6\" \"Dependency updates\"
create_or_update_label \"security\" \"d93f0b\" \"Security-related changes\"
create_or_update_label \"ci\" \"fbca04\" \"CI/CD workflows\"
create_or_update_label \"infra\" \"5319e7\" \"Infrastructure changes\"
create_or_update_label \"bug\" \"d73a4a\" \"Something isn't working\"
create_or_update_label \"feature\" \"0e8a16\" \"New feature or request\"

echo \"Done.\"
" > scripts/setup-repo.sh && chmod +x scripts/setup-repo.sh
REPO=
if [[ -z "" || -z "" ]]; then
  echo "Usage: -- <owner> <repo>" >&2
  exit 1
fi

# Branch protection on main
# - Require PR reviews
# - Require status checks (CI)
# - Enforce for admins

echo "Configuring branch protection for /:main"
gh api   -X PUT   -H "Accept: application/vnd.github+json"   "/repos///branches/main/protection"   -f required_status_checks.strict=true   -f required_status_checks.contexts[]='build-test'   -f enforce_admins=true   -f required_pull_request_reviews.required_approving_review_count=1   -F restrictions=null

# Labels
create_or_update_label() {
  local name="mkdir -p scripts && printf "%s" "#!/usr/bin/env bash
set -euo pipefail

# Requires gh CLI authenticated with repo scope
# Usage: ./scripts/setup-repo.sh <owner> <repo>
OWNER=${1:-}
REPO=${2:-}
if [[ -z \"$OWNER\" || -z \"$REPO\" ]]; then
  echo \"Usage: $0 <owner> <repo>\" >&2
  exit 1
fi

# Branch protection on main
# - Require PR reviews
# - Require status checks (CI)
# - Enforce for admins

echo \"Configuring branch protection for $OWNER/$REPO:main\"
gh api \
  -X PUT \
  -H \"Accept: application/vnd.github+json\" \
  \"/repos/$OWNER/$REPO/branches/main/protection\" \
  -f required_status_checks.strict=true \
  -f required_status_checks.contexts[]='build-test' \
  -f enforce_admins=true \
  -f required_pull_request_reviews.required_approving_review_count=1 \
  -F restrictions=null

# Labels
create_or_update_label() {
  local name=\"$1\"
  local color=\"$2\"
  local desc=\"$3\"
  if gh api repos/$OWNER/$REPO/labels/$(printf %s \"$name\" | sed 's/ /%20/g') >/dev/null 2>&1; then
    gh api \
      --method PATCH \
      -H \"Accept: application/vnd.github+json\" \
      /repos/$OWNER/$REPO/labels/$(printf %s \"$name\" | sed 's/ /%20/g') \
      -f new_name=\"$name\" -f color=\"$color\" -f description=\"$desc\"
  else
    gh api \
      --method POST \
      -H \"Accept: application/vnd.github+json\" \
      /repos/$OWNER/$REPO/labels \
      -f name=\"$name\" -f color=\"$color\" -f description=\"$desc\"
  fi
}

create_or_update_label \"dependencies\" \"0366d6\" \"Dependency updates\"
create_or_update_label \"security\" \"d93f0b\" \"Security-related changes\"
create_or_update_label \"ci\" \"fbca04\" \"CI/CD workflows\"
create_or_update_label \"infra\" \"5319e7\" \"Infrastructure changes\"
create_or_update_label \"bug\" \"d73a4a\" \"Something isn't working\"
create_or_update_label \"feature\" \"0e8a16\" \"New feature or request\"

echo \"Done.\"
" > scripts/setup-repo.sh && chmod +x scripts/setup-repo.sh"
  local color=""
  local desc=""
  if gh api repos///labels/"" >/dev/null 2>&1; then
    gh api       --method PATCH       -H "Accept: application/vnd.github+json"       /repos///labels/""       -f new_name="" -f color="" -f description=""
  else
    gh api       --method POST       -H "Accept: application/vnd.github+json"       /repos///labels       -f name="" -f color="" -f description=""
  fi
}

create_or_update_label "dependencies" "0366d6" "Dependency updates"
create_or_update_label "security" "d93f0b" "Security-related changes"
create_or_update_label "ci" "fbca04" "CI/CD workflows"
create_or_update_label "infra" "5319e7" "Infrastructure changes"
create_or_update_label "bug" "d73a4a" "Something isn't working"
create_or_update_label "feature" "0e8a16" "New feature or request"

echo "Done."
