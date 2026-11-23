# Publishing create-sproutsite

Version 0.1.0 was first published to npm on 2026-11-17. Preparation and dry runs do not authorize publication. Publishing, creating a remote repository, pushing and tagging each require an explicit maintainer request.

## Prepare locally

Use the Node.js version in `.nvmrc` (24.22.2) and npm. From the generator checkout:

```sh
nvm use
npm ci
npm publish --dry-run --access public --registry=https://registry.npmjs.org/
```

The dry run invokes `prepublishOnly`: formatting, TypeScript checks, unit tests and the packed starter test. The starter test checks release-version consistency, archive contents, installation of published dependencies, and English/German website checks and builds at `/` and `/demo/`. Its child npm processes explicitly disable inherited dry-run mode so local test archives and installations are real. The outer publication remains a dry run. Do not use `--ignore-scripts` for this verification.

Keep `package.json`, both root version entries in `package-lock.json`, `VERSION` and the dated release entry in `CHANGELOG.md` consistent. For subsequent releases, choose a new generator version; published version 0.1.0 cannot be overwritten. The Sproutsite dependency range has its own version and must stay at the range tested by the starter checks.

Review the dry-run file list and package metadata. The archive should contain only `package.json`, README, CHANGELOG, LICENSE, NOTICE, THIRD_PARTY_NOTICES, the compiled CLI and the minimal templates. It must exclude source, tests, scripts, developer configuration, local secrets and installed dependencies. There are no runtime dependencies. Preserve the Apache license and notices.

To retain a local archive for inspection after the checks pass:

```sh
npm pack
tar -tzf create-sproutsite-0.1.9.tgz
```

`npm pack` rebuilds the CLI but does not run the full release checks. The generated archive is ignored by Git. No archive command publishes anything.

## Import and verify the starter snapshot

Sproutsite owns the starter sources in `starters/minimal/`. The generator's pinned source is commit `b1a92b871dc61ab746b9bbfce054a341c8e2c624`, recorded in `scripts/import-starter.ts` and the generated `templates/minimal/asset-source.json`. The importer reads committed Git blobs, so the upstream checkout's current branch and working files do not affect the result. It preserves placeholders and reads the public asset manifest and files, the upstream license and starter notice, and the skill and agent configuration at the same commit. The Claude skill is materialized as a regular copy of the Codex skill. The preview projects in `artifacts/starter/` are generated output.

```sh
npm run starter:import
npm run starter:import -- --check
```

These commands default to the sibling Sproutsite repository. Use `--source /absolute/path/to/sproutsite` for another checkout containing the pinned commit. For a refresh, review the upstream changes, update the pin, and run the import. Review any obsolete files reported by the importer before removing them. Commit the resulting snapshot alongside the pin change when requested. Keep the website dependency range and Astro peers compatible with the imported templates. Update sources upstream and preserve the reviewed asset bytes, including license text.

The importer reuses the asset manifest and hash verification from `starter-assets:check`. The existing `starter-assets:sync` command is also available for reviewing a separate installed or extracted Sproutsite package. That workflow can record a reviewed archive SHA-256 and use `SPROUTSITE_TEST_PACKAGE` for an isolated fixture run. The pinned import records commit provenance for the shipped snapshot.

Run `npm run prepublishOnly` before releasing. The starter test checks the packed files and builds English and German projects at `/` and `/demo/` with both installation modes. To check parity with a published generator, download its archive to a review directory outside the checkout and pass it to the test:

```sh
npm pack create-sproutsite@0.1.9 --ignore-scripts --pack-destination /absolute/review-directory --registry=https://registry.npmjs.org/
SPROUTSITE_STARTER_BASELINE=/absolute/review-directory/create-sproutsite-0.1.9.tgz npm run test:starter
```

The comparison runs both archives with identical inputs for each language and installation mode. It checks generated paths and bytes, including hidden skills and MCP files, assets, and any generated lockfile. It excludes the installed `node_modules` tree. The starter test also verifies both MCP configurations, byte-exact public assets, and the localized output of the current archive.

## Check npm access

These commands only read registry information:

```sh
npm whoami --registry=https://registry.npmjs.org/
npm view create-sproutsite name version dist-tags --json --registry=https://registry.npmjs.org/
```

An E404 response means the package is not publicly visible to the current caller; it does not reserve the name or guarantee publication permission. Confirm the publishing account and its npm authentication requirements before publication. Do not add credentials to the repository.

The source repository is [sproutsite/create-sproutsite](https://github.com/sproutsite/create-sproutsite). Keep `origin` and the `repository` and `bugs` entries in `package.json` pointed at that repository. Check `git remote -v` before pushing.

## Publish only when explicitly requested

Review and commit the intended release files before publication. Rerun the dry run if package files change. Once the maintainer explicitly authorizes publication, run from the reviewed checkout:

```sh
npm publish --access public --registry=https://registry.npmjs.org/
```

Complete npm's authentication challenge if requested. Do not bypass lifecycle checks. This command publishes a public package; a dry run does not perform this step.

After successful publication, verify registry metadata and the user entry point from a temporary directory outside this checkout:

```sh
npm view create-sproutsite@0.1.9 version dist-tags dist.integrity --json --registry=https://registry.npmjs.org/
npm create sproutsite@0.1.9 smoke-website -- --language en --yes --no-install
```

Only after publication is verified, update README's publication status and local archive guidance to describe the released package. Create or push Git tags only when explicitly requested. Record any failed publication accurately; do not retry blindly if the registry may already contain the intended version.
