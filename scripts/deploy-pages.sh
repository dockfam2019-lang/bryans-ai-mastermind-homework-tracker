#!/usr/bin/env bash
# Publishes the app to GitHub Pages by committing the production build to the gh-pages branch.
# Uses a separate git worktree and ordinary commits (no force-push), so main is never touched.
# Usage: npm run deploy
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT=$(pwd)
NAME=$(basename -s .git "$(git remote get-url origin)")
SITE="$ROOT/.gh-pages"

BASE_PATH="/$NAME/" npm run build
touch dist/.nojekyll              # serve files exactly as built
cp dist/index.html dist/404.html  # unknown paths still open the app

git fetch -q origin gh-pages 2>/dev/null || true
rm -rf "$SITE"; git worktree prune
if git show-ref -q --verify refs/remotes/origin/gh-pages; then
  git worktree add -q -B gh-pages "$SITE" origin/gh-pages
else
  git worktree add -q --detach "$SITE"
  git -C "$SITE" checkout -q --orphan gh-pages
fi

find "$SITE" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
cp -R dist/. "$SITE/"
git -C "$SITE" add -A
if git -C "$SITE" diff --cached --quiet; then
  echo "No changes to publish."
else
  git -C "$SITE" commit -q -m "Deploy $(git rev-parse --short HEAD)"
  git -C "$SITE" push -q origin gh-pages
  echo "Published to the gh-pages branch."
fi
git worktree remove --force "$SITE"
