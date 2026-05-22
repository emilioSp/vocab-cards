---
name: release-vocab-cards
description: Use when releasing a new version of vocab-cards — bumps version, builds the macOS DMG, tags the commit, and publishes a GitHub release.
---

# Release vocab-cards

## Steps

### 1. Confirm version

Ask the user which version to release (e.g. `0.2.0`). If not provided, read the current version from `src-tauri/tauri.conf.json` and suggest the next patch.

### 2. Bump version

Edit `src-tauri/tauri.conf.json`, field `version`.

### 3. Commit the bump

```bash
git add src-tauri/tauri.conf.json
git commit -m "chore: bump version to {version}"
```

### 4. Build

```bash
npm run tauri build
```

This takes several minutes on a first run. The DMG lands at:
```
src-tauri/target/release/bundle/dmg/vocab-cards_{version}_aarch64.dmg
```

### 5. Tag and push

```bash
git tag v{version}
git push origin main --tags
```

### 6. Create GitHub release

```bash
gh release create v{version} \
  src-tauri/target/release/bundle/dmg/vocab-cards_{version}_aarch64.dmg \
  --title "v{version}" \
  --notes "$(git log $(git describe --tags --abbrev=0 HEAD^)..HEAD --pretty=format:'- %s' | grep -v 'chore: bump version')"
```

The `--notes` auto-generates a changelog from commits since the previous tag. Adjust manually if needed before confirming.

## Notes

- App is **unsigned** — users must right-click → Open to bypass Gatekeeper on first launch.
- If the build fails with a Rust compile error, check that `npm run build` (Vite) passes first.
- The DMG filename includes the architecture (`aarch64` on Apple Silicon, `x86_64` on Intel). Use a glob if unsure: `src-tauri/target/release/bundle/dmg/*.dmg`.