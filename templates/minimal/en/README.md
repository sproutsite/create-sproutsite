# Your website

This website uses Sproutsite's default theme and an English content starter.

```sh
npm install
npm run dev
```

If dependencies were installed by the generator, skip `npm install`.

- `src/content/site.yaml`: website name, production URL, navigation and footer.
- `src/content/pages/page.yaml`: homepage title and description for search and browser metadata.
- `src/content/pages/hero.md`: introductory hero and visible H1.
- `src/content/pages/_assets/hero.jpg`: the local hero picture, referenced as `./_assets/hero.jpg` by the hero's `background-image`. Replace this file or use another relative local image; do not use a `/images/` URL here. `classes: null` removes the default decorative waves while retaining the small hero layout.
- `public/branding/`: neutral logo, favicon, app icons and sharing image. Replace the files or change `branding` in `site.yaml`. Keep `logo.showName: true` to show your website name beside the symbol, and adjust the sharing-image alternative text to describe your own image.
- Numbered `.md` and `.mdx` files: individual content sections, starting at `01`.
- `AGENTS.md`: guidance for editorial work with an external coding agent.

To add a page, create a directory containing `page.yaml`, an optional hero and numbered sections. Add a navigation link in `site.yaml` if needed. MDX can use documented components from `sproutsite/components`.

```sh
npm run check
npm run build
npm run preview
```

Set your real production URL before deployment. Deploy the complete `dist/` directory. It contains `sitemap.xml`, `404.html` and `500.html`; configure your host to use the error documents. This starter contains no blog articles; blog routes and collection behavior are supplied by the installed library.

The artwork belongs to your project's files. Sproutsite package updates do not replace it. The hero uses the local content copy, not `public/images/hero.jpg`; that public copy is also supplied as part of the neutral source set. Preserve `public/LICENSE.txt` and `public/NOTICE.txt` when redistributing the supplied Apache-2.0 artwork. No visible attribution or Sproutsite wordmark is required. Review appearance, contrast and sharing previews after replacing artwork.

Sproutsite remains an installed dependency, not a copied theme. Commit `package-lock.json` after installation. The starter restricts Sproutsite upgrades to the tested `0.5.x` line; review version changes before upgrading beyond it.

The website package is private to prevent accidental npm publication. Your own content remains yours; choose its licensing separately. Sproutsite and the original starter templates are Apache-2.0; see LICENSE-SPROUTSITE and NOTICE-SPROUTSITE for the supplied starter files. Dependency licenses and trademark rights remain separate.

[Documentation](https://sproutsite.dev/documentation/) · [Components](https://sproutsite.dev/showcase/)
