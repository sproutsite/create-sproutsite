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
- Numbered `.md` and `.mdx` files: individual content sections, starting at `01`.
- `AGENTS.md`: guidance for editorial work with an external coding agent.

To add a page, create a directory containing `page.yaml`, an optional hero and numbered sections. Add a navigation link in `site.yaml` if needed. MDX can use documented components from `sproutsite/components`.

```sh
npm run check
npm run build
npm run preview
```

Set your real production URL before deployment. Deploy the complete `dist/` directory. It contains `sitemap.xml`, `404.html` and `500.html`; configure your host to use the error documents. This starter has no blog articles; Sproutsite currently generates an empty blog overview and may warn about empty blog collections. This is a known library limitation and does not prevent a build.

Sproutsite remains an installed dependency, not a copied theme. Commit `package-lock.json` after installation. The starter restricts Sproutsite upgrades to the tested `0.5.x` line; review version changes before upgrading beyond it.

The website package is private to prevent accidental npm publication. Your own content remains yours; choose its licensing separately. Sproutsite and the original starter templates are Apache-2.0; see LICENSE-SPROUTSITE and NOTICE-SPROUTSITE for the supplied starter files. Dependency licenses and trademark rights remain separate.

[Documentation](https://sproutsite.dev/documentation/) · [Components](https://sproutsite.dev/showcase/)
