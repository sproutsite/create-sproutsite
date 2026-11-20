# Sproutsite — Project Generator

[![npm version](https://img.shields.io/npm/v/create-sproutsite?logo=npm)](https://www.npmjs.com/package/create-sproutsite)
[![License](https://img.shields.io/npm/l/create-sproutsite)](LICENSE)
[![Node.js version](https://img.shields.io/node/v/create-sproutsite?logo=nodedotjs)](https://www.npmjs.com/package/create-sproutsite)
[![Documentation](https://img.shields.io/badge/docs-sproutsite.dev-0875C9)](https://sproutsite.dev/documentation/getting-started/)

Create your own Markdown-first website with Sproutsite and Astro. The generator supplies the initial configuration, a small homepage, and editorial guidance. The installed `sproutsite` library provides the default design and components. Sproutsite contains no integrated AI agent or CMS administration interface.

Requires Node.js 24 or later and npm. The starter uses `sproutsite@~0.5.24`, its public `sproutsite/starter-assets` contract and compatible Astro `^7.4.12` and MDX `^8.1.6` peers. The reviewed asset source and hashes are recorded in `templates/minimal/asset-source.json` and `asset-manifest.json`. `.nvmrc` pins Node.js 24.22.2 for generator development.

The neutral asset integration in this checkout has not yet been released as a new generator version. Use the local archive instructions below to try this work; the published generator may not include it yet.

Official website: [sproutsite.dev](https://sproutsite.dev) · [Documentation](https://sproutsite.dev/documentation/getting-started/) · [Source code](https://github.com/sproutsite/create-sproutsite)

## Create a website

The generator is available on npm as [create-sproutsite](https://www.npmjs.com/package/create-sproutsite).

```sh
npm create sproutsite@latest my-website
cd my-website
npm run dev
```

The assistant asks for the directory, English or German content, website name, and whether to install dependencies. If you skip installation, run `npm install` before `npm run dev`. The generator never publishes, deploys, or initializes a Git repository automatically.

To choose German and accept the other defaults:

```sh
npm create sproutsite@latest meine-website -- --language de --name "Meine Website" --yes
```

To create files without downloading website dependencies:

```sh
npm create sproutsite@latest my-website -- --language en --yes --no-install
```

`--yes` defaults to installing dependencies. `--no-install` overrides that. Without a terminal, provide `--yes` or all four choices (directory, name, language, install/no-install). Unknown options and invalid languages fail; existing non-empty directories, including hidden files, are never overwritten. Installation failures preserve the website files and show how to retry.

## What you edit

```text
my-website/
├── package.json
├── astro.config.ts
├── tsconfig.json
├── README.md
├── AGENTS.md
├── public/
│   ├── LICENSE.txt
│   ├── NOTICE.txt
│   ├── branding/
│   └── images/hero.jpg
└── src/
    ├── content.config.ts
    ├── pages/[...slug].astro
    └── content/
        ├── site.yaml
        └── pages/
            ├── page.yaml
            ├── hero.md
            ├── _assets/hero.jpg
            ├── 01-introduction.md
            └── 02-next-steps.mdx
```

Edit the supplied content rather than building a theme. The starter's README and AGENTS.md explain headings, numbering, links, images, component use, preview, checks and publishing. The example MDX section uses the existing Feature component. Neutral, first-party artwork is bundled; no website contact details, AI services or external font downloads are added.

The neutral logo, favicon, app icons and sharing image live in `public/branding/`. Replace those files with your own artwork, or change `branding` in `src/content/site.yaml` (both site files for German). `logo.showName: true` keeps your chosen website name beside the symbol. The sharing image alternative text is localized. Preserve `public/LICENSE.txt` and `public/NOTICE.txt` when redistributing the supplied artwork; Apache-2.0 adds no visible attribution or product-branding requirement.

The hero uses `src/content/pages/_assets/hero.jpg`, referenced as `./_assets/hero.jpg` in its frontmatter. Replace that local image or update the relative path. A `/images/` public URL does not satisfy Astro's content-image schema. The public source copy at `public/images/hero.jpg` is preserved by the upstream copy contract; changing it alone does not change the hero. `classes: null` disables the default decorative waves while retaining the starter's hero size and text. Website owners control these copies: installing or updating Sproutsite does not overwrite them, and the generator refuses populated directories.

The German starter serves German at `/`. To follow Sproutsite's existing language contract, it uses `.de.md`/`.de.mdx`, `page.de.yaml` and `site.de.yaml`, plus base `page.yaml` and `site.yaml`. Keep each metadata/configuration pair synchronized. It does not create an English website or change the library's locale conventions.

The initial URL is `https://example.com`. Replace it with the real production origin in the site configuration before deployment. Generated website packages are `private: true` to prevent accidental npm publication; this is independent of the generator's public package settings.

```sh
npm run check
npm run build
npm run preview
```

Deploy the entire `dist/` directory. Sproutsite generates assets, a sitemap, manifest, and static error documents; your hosting configuration must select the error documents. No deployment is performed by the generator.

## Local development and archive use

In this generator repository:

```sh
npm ci
npm run build
node dist/index.js /absolute/path/to/my-website
```

Alternatively, run `npm pack` and use the resulting archive without fetching a registry generator:

```sh
npm exec --yes --package=/absolute/path/to/create-sproutsite-0.1.3.tgz -- create-sproutsite /absolute/path/to/my-website --language en --yes
```

The archive includes compiled CLI code, templates and license notices. It excludes tests, build scripts, source code and development dependencies. The generator has no runtime dependencies. Its version is independent of the installed Sproutsite version.

## Develop the generator

```sh
npm ci
npm run dev -- --help
npm run format
npm run format:check
npm run check
npm test
npm run build
npm run starter-assets:check
npm run test:starter
```

`test:starter` builds and packs this generator, verifies the archived asset hashes, invokes the packed executable with npm exec, and checks English/German with both `--install` and `--no-install`. Before installing the no-install websites, it checks that all assets exist without `node_modules` or a lockfile. Each of the four websites then runs Astro checks and builds at `/` and `/demo/`. Checks cover byte-exact public files and notices, the local hero, logo and website name, favicon, app manifest, absolute sharing URL, locale, homepage/Feature content, metadata, sitemap and errors. Network access or a suitable npm cache is required. Temporary files are removed on success and retained on failure. Nothing is published.

For asset maintenance, resolve the public manifest from an installed or extracted, reviewed Sproutsite package, then run:

```sh
npm run starter-assets:sync -- /absolute/path/to/sproutsite/package --archive /absolute/path/to/sproutsite.tgz
npm run starter-assets:check -- /absolute/path/to/sproutsite/package --archive /absolute/path/to/sproutsite.tgz
```

The archive option records or checks its SHA-256; use the matching reviewed archive. This developer-only workflow validates schema, safe paths, the exact public file list and hashes before copying delivery files. It preserves the upstream manifest and license bytes. Do not edit delivery copies independently. Review branding/frontmatter against the manifest whenever updating it. Website creation never resolves the source package or downloads artwork, and has no dependency on the sibling checkout. See `RELEASING.md` for registry and local snapshot verification.

`npm pack` runs the TypeScript build. `npm run prepublishOnly` runs formatting, checking, unit tests and the full starter test without publishing. A publishing dry run still creates and installs real **local test archives**, while the outer publication remains a dry run. Actual `npm publish` always requires an explicit maintainer request and npm authentication.

Maintainers preparing an npm release should follow `RELEASING.md` in the source checkout. That guide is excluded from the npm archive.

## Scope and limitations

- A single minimal starter with either English or German, not a theme catalog or unrestricted template engine.
- This starter contains no blog articles; blog routes and collection behavior are supplied by the installed library.
- The current library's German file conventions require the paired metadata files explained above. Its existing localized validation limitations are not repaired by the generator.
- No automatic Git initialization, deployments, updates to existing websites, blog setup, multilingual website wizard, or package publication.
- The npm executable is supplied by npm create/exec. Standalone direct execution needs npm on the system; automated execution is tested on Linux with Node 24 and npm. Other operating systems require a separate acceptance run.
- Generated code and automated checks do not replace visual, accessibility, editorial, or production-host review.

## License

Apache License, Version 2.0. Copyright © 2026 Björn Hempel.

See [LICENSE](LICENSE), [NOTICE](NOTICE) and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). The software license does not grant trademark rights or assign a license to the user's own website content.

[Sproutsite](https://sproutsite.dev) · [Documentation](https://sproutsite.dev/documentation/) · [Source](https://github.com/sproutsite/create-sproutsite) · [Issues](https://github.com/sproutsite/create-sproutsite/issues)
