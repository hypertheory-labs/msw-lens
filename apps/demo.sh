#!/usr/bin/env bash
#
# Start a demo run: create a throwaway branch, scrub msw-lens generated
# artifacts from the demo apps, leaving the "just installed, no scenarios yet"
# state. Demo lens:context / lens:watch against the clean component source.
# Commit when done (optional — preserves a record), then `git switch main`.
#
# Usage:  apps/demo.sh [branch-name]
#   branch-name defaults to demo-YYYYMMDD-HHMMSS

set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

# Refuse to run with uncommitted changes — too easy to lose work.
if ! git diff-index --quiet HEAD -- 2>/dev/null; then
  echo "error: working tree has uncommitted changes. commit or stash first."
  git status --short
  exit 1
fi

branch_name="${1:-demo-$(date +%Y%m%d-%H%M%S)}"

git switch -c "$branch_name"

echo ""
echo "scrubbing msw-lens generated artifacts from demo apps…"

for app in apps/angular-demo apps/react-demo; do
  mocks_dir=""
  if [[ -d "$app/src/mocks" ]]; then
    mocks_dir="$app/src/mocks"
  elif [[ -d "$app/src/app/__mocks__" ]]; then
    mocks_dir="$app/src/app/__mocks__"
  fi

  if [[ -z "$mocks_dir" ]]; then
    echo "  $app — no mocks dir, skipping"
    continue
  fi

  # Delete per-endpoint subdirs (generated). Preserve browser.ts and handlers.ts.
  find "$mocks_dir" -mindepth 1 -maxdepth 1 -type d -exec rm -rf {} +

  # Reset handlers.ts to empty aggregator.
  cat > "$mocks_dir/handlers.ts" <<'EOF'
import { HttpHandler } from 'msw';

export const handlers: HttpHandler[] = [];
EOF

  # Remove msw-lens runtime state.
  rm -f "$mocks_dir/active-scenarios.ts"

  # Remove generated .msw-lens/ directory (gitignored, but may be present locally).
  rm -rf "$app/.msw-lens"

  echo "  $app — scrubbed ($mocks_dir/)"
done

echo ""
echo "ready. demo branch: $branch_name"
echo ""
echo "next:"
echo "  cd apps/angular-demo   # or apps/react-demo"
echo "  npm run lens:context -- src/path/to/component.ts"
echo "  # ... demo ..."
echo ""
echo "when done:"
echo "  git add -A && git commit -m 'demo: <what you showed>'   # optional record"
echo "  git switch main"
