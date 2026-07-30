# Changelog

## [1.1.7] - 2026-07-31

### Changed
- **Automated Release Publishing:**
  - Configured GitHub Actions to automatically publish releases directly (`draft: false`) without requiring manual approval in the GitHub dashboard.

---

## [1.1.6] - 2026-07-31

### Fixed
- **CI Release Consolidation:**
  - Restructured GitHub Actions release workflow into a two-stage pipeline (`build` -> `release`) to prevent duplicate Draft releases from concurrent OS builds.
  - Guaranteed all platform installers (Windows, macOS, Linux) are published into a single GitHub release page.

---

## [1.1.5] - 2026-07-31

### Fixed
- **CI Build & Packaging Fixes:**
  - Fixed an issue where `discord-rpc` missing error occurred on launch by ensuring it's bundled in dependencies with safe try-catch wrapper.
  - Resolved `register-scheme` native build failures on GitHub Actions runners.
  - Standardized output artifact filenames (`VoxMate-Windows-1.1.5.exe`, `VoxMate-macOS-1.1.5.dmg`, `VoxMate-Linux-1.1.5.AppImage`).
  - Fixed Windows icon format (`icon.ico`) and Linux icon requirements.

---

## [1.1.4] - 2026-07-31

### Added
- **Multi-Platform Support & Automated Release Pipeline:**
  - Added cross-platform folder opening (`shell.openPath`) for seamless compatibility with macOS and Linux.
  - Added macOS manual update handling in `autoUpdater.js` to redirect users to GitHub Releases on new versions.
  - Added GitHub Actions workflow (`.github/workflows/deploy.yml`) for automated multi-platform (Windows, macOS, Linux) releases on tag push.

---

## [1.1.3] - 2026-07-31

### Fixed
- Fixed an issue where enabled UserScript custom settings entries were omitted from the F1 settings menu or shortcut key triggers.
- Ensured all active UserScript settings are 100% reliably registered and rendered in the in-game settings menu and keybind handlers.

---

## [1.1.2] - 2026-07-31

### Added
- **Global Shortcut Key Assignment:**
  - Added dedicated keybind buttons for all built-in settings and UserScript settings in the F1 menu.
  - Added `getAllKeybinds` IPC handler to fetch and persist all saved shortcut keys (`keybind_${settingId}`) independently from setting values.
  - Added dynamic keybind auto-loader (`loadAllSavedKeybinds`) on startup to ensure all shortcuts are active after restart.

### Fixed
- **UserScript Keybind Persistence & Execution Validation:**
  - Fixed an issue where saved UserScript shortcut keys did not work after client restart.
  - Fixed an issue where setting boolean values (`true`/`false`) corrupted keybind button text (`TRUE`/`FALSE`).
  - Fixed an issue where disabled UserScripts responded to shortcut keys; keybind triggers now validate script ownership (`_scriptFile`) and script enabled state.

### Improved & Redesigned
- Small UI Fix

---

## [1.1.1] - 2026-07-28

### Added
- Added support for custom UserScript tabs in the settings sidebar.
- Added proper rendering for custom UserScript settings within their dedicated tab content.

### Fixed
- Fixed issues where custom UserScript tabs did not appear or switch correctly.
- Fixed problems with custom settings not displaying in the expected menu area.

### Improved
- Improved the visual consistency of custom settings rows so they match the built-in settings UI more closely.
- Updated the installed UserScripts list to use Material Symbols instead of emoji indicators.
- Expanded the UserScript API documentation with clearer examples for tabs, categories, controls, and events.

---

## [1.1.0] - 2026-07-XX

### Added
- Introduced a modular architecture and improved settings UI framework.
- Added support for configurable Chromium flags, system management services, and custom crosshair / HUD features.
- Added a game preload bridge with enhanced UI and CSS management features.
