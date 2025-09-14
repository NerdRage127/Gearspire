# Version Management

This document explains how to manage versions in Gearspire.

## Overview

Gearspire uses a centralized version management system with automatic updates. The version is stored in `src/version.js` and displayed in the game UI.

## Current Version Format

The version follows semantic versioning (semver): `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes or major feature releases
- **MINOR**: New features that are backward compatible
- **PATCH**: Bug fixes and small improvements

## How to Update Version

### Method 1: Using npm scripts (Recommended)

```bash
# Bump patch version (1.0.3 → 1.0.4)
npm run version:patch

# Bump minor version (1.0.3 → 1.1.0)
npm run version:minor

# Bump major version (1.0.3 → 2.0.0)
npm run version:major
```

### Method 2: Using Node.js directly

```bash
# Bump patch version
node scripts/bump-version.js patch

# Bump minor version
node scripts/bump-version.js minor

# Bump major version
node scripts/bump-version.js major
```

### Method 3: Using shell script

```bash
# Bump patch version
./scripts/bump-version.sh patch

# Bump minor version
./scripts/bump-version.sh minor

# Bump major version
./scripts/bump-version.sh major
```

## What Happens When Version is Updated

1. The `src/version.js` file is automatically updated
2. The new version appears immediately in the game UI footer
3. Save compatibility is maintained through the version system
4. No manual file editing is required

## Workflow Recommendations

### For Development Updates
```bash
npm run version:patch
```

### For New Features
```bash
npm run version:minor
```

### For Major Releases
```bash
npm run version:major
```

### Complete Release Workflow
1. Make your changes
2. Test thoroughly
3. Update version: `npm run version:patch` (or minor/major)
4. Commit changes: `git add . && git commit -m "Release v1.0.4"`
5. Create tag: `git tag v1.0.4`
6. Push: `git push && git push --tags`

## Files Involved

- `src/version.js` - Central version definition
- `src/systems/ui.js` - Displays version in footer
- `scripts/bump-version.js` - Version bump utility
- `scripts/bump-version.sh` - Shell script wrapper
- `package.json` - npm scripts for version management

## Troubleshooting

### Version not updating in browser
- Hard refresh the browser (Ctrl+F5 or Cmd+Shift+R)
- Clear browser cache

### Script permissions error
```bash
chmod +x scripts/bump-version.sh
```

### Node.js not found
Make sure Node.js is installed on your system.

## Save Game Compatibility

The version system includes save game compatibility checking:
- Games are compatible if major versions match
- Minor version differences are allowed (backward compatible)
- This prevents loading incompatible save files