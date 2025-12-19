#!/bin/bash
# Universal release script for npm, Python, Rust, etc.
# Usage: ./scripts/release.sh [patch|minor|major|X.Y.Z]

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

info() { echo -e "${GREEN}✓${NC} $1"; }
error() { echo -e "${RED}✗${NC} $1"; exit 1; }
warn() { echo -e "${YELLOW}!${NC} $1"; }

# Parse version argument
VERSION_ARG="${1:-patch}"

# Detect project type
detect_project_type() {
    if [ -f "package.json" ]; then
        echo "npm"
    elif [ -f "pyproject.toml" ]; then
        echo "python"
    elif [ -f "Cargo.toml" ]; then
        echo "rust"
    else
        error "Unknown project type. Need package.json, pyproject.toml, or Cargo.toml"
    fi
}

PROJECT_TYPE=$(detect_project_type)
info "Detected project type: $PROJECT_TYPE"

# Step 1: Check working directory is clean
info "Checking working directory..."
if [[ -n $(git status --porcelain) ]]; then
    error "Working directory not clean. Commit or stash changes first."
fi

# Step 2: Check git sync
info "Checking git sync..."
git remote update > /dev/null 2>&1
LOCAL=$(git rev-parse @)
REMOTE=$(git rev-parse '@{u}')
if [ "$LOCAL" != "$REMOTE" ]; then
    error "Git not synced with remote. Pull or push first."
fi

# Step 3: Run tests
info "Running tests..."
case $PROJECT_TYPE in
    npm)
        if grep -q '"test"' package.json; then
            npm test || error "Tests failed"
        else
            warn "No test script found, skipping tests"
        fi
        ;;
    python)
        if [ -f "pyproject.toml" ] && grep -q 'pytest' pyproject.toml; then
            uv run pytest || error "Tests failed"
        else
            warn "No pytest found, skipping tests"
        fi
        ;;
    rust)
        cargo test || error "Tests failed"
        ;;
esac

# Step 4: Bump version and create tag
info "Bumping version..."
case $PROJECT_TYPE in
    npm)
        npm version "$VERSION_ARG" --no-git-tag-version
        NEW_VERSION=$(node -p "require('./package.json').version")
        git add package.json package-lock.json 2>/dev/null || git add package.json
        git commit -m "Release v$NEW_VERSION"
        git tag "v$NEW_VERSION"
        ;;
    python)
        # For Python, expect manual version bump or use a tool
        if [ "$VERSION_ARG" = "patch" ] || [ "$VERSION_ARG" = "minor" ] || [ "$VERSION_ARG" = "major" ]; then
            error "For Python projects, specify exact version: ./scripts/release.sh 1.2.3"
        fi
        NEW_VERSION="$VERSION_ARG"
        # Update version in pyproject.toml
        sed -i.bak "s/^version = .*/version = \"$NEW_VERSION\"/" pyproject.toml
        rm -f pyproject.toml.bak
        git add pyproject.toml
        git commit -m "Release v$NEW_VERSION"
        git tag "v$NEW_VERSION"
        ;;
    rust)
        if [ "$VERSION_ARG" = "patch" ] || [ "$VERSION_ARG" = "minor" ] || [ "$VERSION_ARG" = "major" ]; then
            error "For Rust projects, specify exact version: ./scripts/release.sh 1.2.3"
        fi
        NEW_VERSION="$VERSION_ARG"
        # Update version in Cargo.toml
        sed -i.bak "s/^version = .*/version = \"$NEW_VERSION\"/" Cargo.toml
        rm -f Cargo.toml.bak
        cargo check > /dev/null 2>&1  # Update Cargo.lock
        git add Cargo.toml Cargo.lock
        git commit -m "Release v$NEW_VERSION"
        git tag "v$NEW_VERSION"
        ;;
esac

info "Version bumped to v$NEW_VERSION"

# Step 5: Push
info "Pushing to remote..."
git push
git push origin "v$NEW_VERSION"

# Step 6: Create GitHub release
info "Creating GitHub release..."
if command -v gh >/dev/null 2>&1; then
    gh release create "v$NEW_VERSION" --generate-notes
    info "GitHub release created!"
else
    warn "GitHub CLI not found. Create release manually:"
    echo "  gh release create v$NEW_VERSION --generate-notes"
fi

# Step 7: Publish to registry
info "Publishing to registry..."
case $PROJECT_TYPE in
    npm)
        npm publish
        info "Published to npm!"
        ;;
    python)
        uv build
        uvx twine upload dist/*
        info "Published to PyPI!"
        ;;
    rust)
        cargo publish
        info "Published to crates.io!"
        ;;
esac

info "Release v$NEW_VERSION complete!"
