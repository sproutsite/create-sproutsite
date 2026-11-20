# Changelog

All notable changes are documented here using Keep a Changelog and Semantic Versioning.

## [Unreleased]

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
