# Changelog

All notable changes are documented here using Keep a Changelog and Semantic Versioning.

## [Unreleased]

## [0.4.0] - 2026-11-28

### Added

- Ship optional Pagefind search in all four starter variants. Enable it with `search.enabled` in `site.yaml` to add a header search button and generate `dist/pagefind/`. Search follows the active language and supports deployment under a base path.

### Changed

- Import the starter from Sproutsite `0.5.38` and use `sproutsite@~0.5.38` in generated sites.

## [0.3.1] - 2026-11-26

### Fixed

- Let `background-position` and `background-position-mobile` override the starter's bottom-center placement for hero and footer images.

### Changed

- Import the starter from Sproutsite `0.5.36` and use `sproutsite@~0.5.36` in generated sites.

## [0.3.0] - 2026-11-25

### Added

- Generate an English-first bilingual starter with `--language en --bilingual`. English is served at `/`, German at `/de/`, and the language switcher links the paired About pages.

### Changed

- Import starter templates, artwork, and license notices from Sproutsite `0.5.35` and use `sproutsite@~0.5.35` in generated sites.
- Configure hero and footer background images in `site.yaml` and remove the duplicate hero image from page content.

## [0.2.0] - 2026-11-23

### Added

- Generate a bilingual starter with `--language de --bilingual`. German is served at `/`, English at `/en/`, and the language switcher links the paired About pages.
- Import starter templates, assets, licenses, and agent files from a pinned Sproutsite commit. Verify the packaged starter builds and compare monolingual output with the published 0.1.9 archive.

## [0.1.9] - 2026-11-22

### Added

- Bundle the Sproutsite page editing skill and MCP configuration for Codex and Claude Code in both starters.

## [0.1.8] - 2026-11-21

### Changed

- Set American English (en-US) as the default spelling convention for English content in the project and both starter guides.

## [0.1.7] - 2026-11-21

### Added

- Generate a local theme that extends Sproutsite's default theme and selects the starter's Header and Footer. Use Sproutsite `~0.5.29` and keep the existing appearance, site CSS and neutral assets.

## [0.1.6] - 2026-11-21

### Added

- Generate typed local Header and Footer components using Sproutsite `~0.5.28`. Register them independently in Astro and delegate to the default components to preserve the starter layout and navigation.

## [0.1.5] - 2026-11-21

### Added

- Generate a website-owned stylesheet with an inactive Card example and register it through Sproutsite `~0.5.27` for CSS customization of the default theme.

## [0.1.4] - 2026-11-21

### Changed

- Updated generated websites to Sproutsite `~0.5.25` and migrated locale settings to `i18n`, external-link settings to `links.external`, and global hero settings to `hero`.
- Kept complete English and German base configurations in `site.yaml`; the German `site.de.yaml` now contains only optional overrides. Objects inherit individual fields and lists replace inherited lists.
- Documented the nested blog settings and global hero defaults using the bundled `/images/hero.jpg`, while preserving local hero images, existing content filenames and root routes.

## [0.1.3] - 2026-11-20

### Added

- Bundled reviewed neutral branding, icons, sharing artwork and a local hero image from Sproutsite's public starter-assets contract, including unchanged license notices and SHA-256 provenance.
- Added repeatable asset synchronization and verification, plus packed EN/DE checks for both installation modes at root and subpath deployments.

### Changed

- Updated the generated website dependencies to Sproutsite `~0.5.24`, Astro `^7.4.12` and MDX `^8.1.6` to support the reviewed starter-assets export and compatible peers.

### Fixed

- Copy static templates and binary artwork byte for byte; restrict token substitution to the intended text templates and reject symlink ancestors in target paths.

## [0.1.2] - 2026-11-18

### Changed

- Updated README branding and added npm version, license, Node.js and documentation badges.
- Added official website, getting-started documentation and source-code links, and removed the first-release-only version note.

## [0.1.1] - 2026-11-17

### Changed

- Updated the README and release guidance to reflect the successful first npm publication and use the current archive and verification examples.
- Excluded JetBrains IDE project configuration from Git.

### Fixed

- Made the CLI version test compare against VERSION instead of a hard-coded release number.

## [0.1.0] - 2026-11-17

### Added

- Added a TypeScript project initializer with interactive and unattended modes, website-name and language selection, and optional npm installation.
- Added minimal English and German Astro starters using published Sproutsite, a shared hero, Markdown/MDX sections and localized editorial guidance.
- Added overwrite and symlink protection, safe metadata handling, isolated unit tests and packed-CLI installation/build checks for both languages and deployment bases.
