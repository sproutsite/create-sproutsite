# Deine Website

Diese Website verwendet das Standard-Theme von Sproutsite und einen deutschen Inhaltsstarter. Die deutsche Startseite liegt direkt unter `/`.

```sh
npm install
npm run dev
```

Wenn der Generator die Abhängigkeiten bereits installiert hat, entfällt `npm install`.

- `src/content/site.yaml` und `site.de.yaml`: Name, Produktionsadresse, Navigation und Footer. Halte beide Dateien synchron.
- `src/content/pages/page.yaml` und `page.de.yaml`: Titel und Beschreibung für die Startseite. Halte beide Metadaten-Dateien synchron.
- `src/content/pages/hero.de.md`: Einleitung und sichtbare H1.
- Nummerierte `.de.md`- und `.de.mdx`-Dateien: einzelne Inhaltsbereiche ab `01`.
- `AGENTS.md`: Regeln für die redaktionelle Arbeit mit einem externen Coding-Agenten.

Die `.de`-Dateien und die ergänzenden Basis-Metadaten folgen dem Sprachvertrag der bestehenden Sproutsite-Version. Es wird keine englische Website erzeugt. Bei einer neuen Seite lege einen Ordner mit `page.yaml`, `page.de.yaml`, optionalem `hero.de.md` und nummerierten deutschen Sections an. Ergänze bei Bedarf die Navigation in beiden Website-Konfigurationen. MDX kann dokumentierte Komponenten aus `sproutsite/components` verwenden.

```sh
npm run check
npm run build
npm run preview
```

Setze vor der Veröffentlichung die echte Produktionsadresse. Lade den gesamten `dist/`-Ordner hoch. Er enthält `sitemap.xml`, `404.html` und `500.html`; die Fehlerseiten müssen zusätzlich beim Hosting eingerichtet werden. Der Starter enthält keine Blogartikel. Sproutsite erzeugt derzeit eine leere Blogübersicht und kann vor leeren Blog-Collections warnen. Dies ist eine bekannte Einschränkung der Bibliothek und verhindert den Build nicht.

Sproutsite bleibt eine installierte Abhängigkeit; das Theme wird nicht kopiert. Committe nach der Installation auch `package-lock.json`. Der Starter begrenzt Sproutsite-Updates auf die getestete `0.5.x`-Reihe. Prüfe Änderungen, bevor du darüber hinaus aktualisierst.

Das Website-Paket ist privat, um eine versehentliche npm-Veröffentlichung zu verhindern. Über die Lizenz deiner eigenen Inhalte entscheidest du selbst. Sproutsite und die ursprünglichen Startervorlagen stehen unter Apache-2.0; für die mitgelieferten Dateien liegen LICENSE-SPROUTSITE und NOTICE-SPROUTSITE bei. Lizenzen von Abhängigkeiten und Markenrechte bleiben getrennt.

[Dokumentation](https://sproutsite.dev/de/dokumentation/) · [Komponenten](https://sproutsite.dev/de/showcase/)
