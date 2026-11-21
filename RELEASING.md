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

## Review and update the neutral starter assets

The delivery copies currently come from the published `sproutsite@0.5.25` package, maintained by `ixnode` in `sproutsite/sproutsite`. This package exports `sproutsite/starter-assets`; published 0.5.23 did not. The asset manifest and artwork are unchanged from the reviewed 0.5.24 snapshot. Do not infer export availability from a local checkout's version number.

The unchanged manifest in `templates/minimal/asset-manifest.json` has SHA-256 `1cf0205f5a90c4ea8cf1be1a1b49c572b1305bcd3cb31f3ba07804225214e6f4`. It lists all 14 public files and their hashes, including the complete license and notice. `templates/minimal/asset-source.json` records the source package version, package-metadata hash, manifest hash and reviewed archive hash. The same JPEG is copied to the manifest's content destination for the hero. Assets remain authored in Sproutsite; these are delivery copies.

For a source refresh, inspect the candidate's owner, repository, public export and peer dependencies first:

```sh
npm view sproutsite@0.5.25 maintainers repository exports peerDependencies dist --json --registry=https://registry.npmjs.org/
npm pack sproutsite@0.5.25 --ignore-scripts --pack-destination /absolute/review-directory --registry=https://registry.npmjs.org/
tar -xzf /absolute/review-directory/sproutsite-0.5.25.tgz -C /absolute/review-directory
npm run starter-assets:sync -- /absolute/review-directory/package --archive /absolute/review-directory/sproutsite-0.5.25.tgz
npm run starter-assets:check -- /absolute/review-directory/package --archive /absolute/review-directory/sproutsite-0.5.25.tgz
```

Use a fresh review directory. The sync resolves the public export from the supplied package, validates safe paths and every hash, then updates only the generator's delivery copies and provenance. It does not alter the supplied package or any generated website. It never replaces artwork during end-user generation. Review `branding` against the manifest, localized sharing-image alternative text, the complete German base configuration, optional German overrides and hero frontmatter. Keep the website dependency range and Astro/MDX peers compatible. Never put local package paths into shipped templates. Preserve all asset bytes, including SVGs and license text; formatting excludes the copied public directory and manifest.

The generated configuration targets Sproutsite 0.5.25: use `i18n.locale`, `i18n.defaultLocale`, `i18n.locales`, `links.external.newTab`, `links.external.icon`, `hero.classes` and `hero.background-image`. Keep the full base in `site.yaml`; `site.de.yaml` starts as `{}` and contains only deliberate overrides. Objects inherit individual fields, while arrays replace the entire inherited list. Preserve the German root route and existing localized content/page metadata filenames. No blog configuration is emitted; future blog settings must use `blog.hero` with title, eyebrow and description plus `blog.articles.heading`. The global hero uses the supplied `/images/hero.jpg`; do not reference an additional SVG background absent from the asset manifest. The packed test also exercises partial-object inheritance, header-list replacement and the global hero fallback in a temporary German website.

Run `npm run starter-assets:check` and `npm run prepublishOnly` before releasing. The packed-archive test checks the copied public files and hero hashes after extraction, tests EN/DE with both installation flags, and builds all four websites at `/` and `/demo/`. It checks logos, favicon, app icons, absolute sharing URLs, the optimized hero and unchanged static files. `--no-install` must supply every asset without a source package, network artwork fetch or website installation.

For a future unpublished asset change, make a local archive from the reviewed Sproutsite checkout with `npm pack --ignore-scripts --pack-destination /absolute/review-directory`, extract and sync it as above, and test with:

```sh
SPROUTSITE_TEST_PACKAGE=/absolute/review-directory/sproutsite-VERSION.tgz npm run test:starter
```

This override is restricted to temporary test websites, checks the recorded archive hash and leaves their generated package manifests unchanged. It is not evidence that the new API is published. A normal registry-backed test must pass against an approved released dependency before publishing the generator. Review the final archive list; it includes manifest/provenance data and artwork under templates, but no sync scripts or tests. Website owners edit `public/branding/` and `src/content/pages/_assets/hero.jpg`; dependency updates must not overwrite those files.

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
