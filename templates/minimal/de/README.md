# Deine Website

Diese Website verwendet das Standard-Theme von Sproutsite und einen deutschen Inhaltsstarter. Die deutsche Startseite liegt direkt unter `/`.

```sh
npm install
npm run dev
```

Wenn der Generator die Abhängigkeiten bereits installiert hat, entfällt `npm install`.

- `src/content/site.yaml`: vollständige Basiskonfiguration für Name, Produktionsadresse, `i18n`, Branding, Navigation und Footer. `site.de.yaml` enthält nur optionale Abweichungen und beginnt als leeres Objekt (`{}`). Objekte erben einzelne Felder, Listen ersetzen die bisherige Liste vollständig. Eine geänderte Footer-Beschreibung erhält die geerbten Links; für geänderte Navigationslinks muss die gesamte gewünschte Liste angegeben werden.
- `src/content/pages/page.yaml` und `page.de.yaml`: Titel und Beschreibung für die Startseite. Halte beide Metadaten-Dateien synchron.
- `src/content/pages/hero.de.md`: Einleitung und sichtbare H1.
- `src/content/pages/_assets/hero.jpg`: lokales Bild der Startseite, über `background-image: ./_assets/hero.jpg` eingebunden und von Astro optimiert. Ersetze diese Datei oder verwende ein anderes relatives Inhaltsbild. Öffentliche Bildpfade werden in Sproutsite 0.5.25 ebenfalls unterstützt. `classes: null` unterdrückt geerbte globale Klassen und erhält das kleine Hero-Layout.
- `public/branding/`: neutrales Logo, Favicon, App-Icons und Vorschaubild für geteilte Links. Ersetze die Dateien oder passe `branding` in `site.yaml` an; gezielte deutsche Abweichungen gehören in `site.de.yaml`. Mit `logo.showName: true` bleibt dein Website-Name neben dem Symbol sichtbar. Passe den Alternativtext des Vorschaubilds an dein eigenes Bild an.
- Nummerierte `.de.md`- und `.de.mdx`-Dateien: einzelne Inhaltsbereiche ab `01`.
- `AGENTS.md`: Regeln für die redaktionelle Arbeit mit einem externen Coding-Agenten.

Die `.de`-Dateien und die ergänzenden Basis-Metadaten folgen dem Sprachvertrag von Sproutsite. Es wird keine englische Website erzeugt. Bei einer neuen Seite lege einen Ordner mit `page.yaml`, `page.de.yaml`, optionalem `hero.de.md` und nummerierten deutschen Sections an. Ergänze bei Bedarf die Navigation in der Basiskonfiguration `site.yaml`; `site.de.yaml` bleibt Abweichungen vorbehalten. MDX kann dokumentierte Komponenten aus `sproutsite/components` verwenden.

Für diesen deutschen Starter unter `/` stehen `i18n.locale` und `i18n.defaultLocale` auf `de`, `i18n.locales` auf `[de]`. Externe Links werden über `links.external.newTab` und `links.external.icon` eingestellt. Globale Hero-Vorgaben stehen unter `hero.classes` und `hero.background-image`; als Hintergrund ist das vorhandene `/images/hero.jpg` eingetragen. Die Startseite verwendet weiterhin ihr relatives lokales Inhaltsbild und `classes: null`. Ein zusätzlicher SVG-Hintergrund wird nicht mitgeliefert. Blog-Einstellungen werden nicht erzeugt; bei einer späteren Ergänzung verwende `blog.hero.title`, `blog.hero.eyebrow`, `blog.hero.description` und `blog.articles.heading`.

## Darstellung mit CSS anpassen

Passe das Standard-Theme in `src/styles/custom.css` an. Das auskommentierte Card-Beispiel lässt die anfängliche Darstellung unverändert. Sproutsite lädt zuerst das Standard-Theme und danach die Dateien in der Reihenfolge unter `styles` in `astro.config.ts`. Kaskade und Spezifität gelten weiterhin. Regeln in `@layer components` können gegen höhere DaisyUI- oder Utility-Ebenen verlieren. Farben und Typografie bleiben in `src/content/site.yaml`. Deine CSS-Dateien bleiben bei Paketupdates erhalten. Änderungen an eingebundenen Dateien aktualisieren die Entwicklungsvorschau. Starte den Dev-Server nach Änderungen an der Dateiliste neu. Fehlende oder ungültige CSS-Pfade führen zu einem Fehler.

```sh
npm run check
npm run build
npm run preview
```

Setze vor der Veröffentlichung die echte Produktionsadresse. Lade den gesamten `dist/`-Ordner hoch. Er enthält `sitemap.xml`, `404.html` und `500.html`; die Fehlerseiten müssen zusätzlich beim Hosting eingerichtet werden. Dieser Starter enthält keine Blogartikel. Blog-Routen und das Verhalten leerer Collections liefert die installierte Bibliothek.

Die Grafiken sind eigene Projektdateien und werden durch Sproutsite-Paketupdates nicht ersetzt. Die Startseite verwendet die lokale Inhaltskopie; `public/images/hero.jpg` liefert die globale Hero-Vorgabe. Ohne eigene Hintergrundangabe erbt eine Seite diese Vorgabe, `background-image: null` deaktiviert sie. Erhalte `public/LICENSE.txt` und `public/NOTICE.txt`, wenn du die mitgelieferten Apache-2.0-Grafiken weiterverbreitest. Sichtbare Namensnennung oder eine Sproutsite-Wortmarke sind nicht vorgeschrieben. Prüfe nach einem Austausch Darstellung, Kontraste und Link-Vorschauen.

Sproutsite bleibt eine installierte Abhängigkeit; das Theme wird nicht kopiert. Committe nach der Installation auch `package-lock.json`. Der Starter begrenzt Sproutsite-Updates auf die getestete `0.5.x`-Reihe. Prüfe Änderungen, bevor du darüber hinaus aktualisierst.

Das Website-Paket ist privat, um eine versehentliche npm-Veröffentlichung zu verhindern. Über die Lizenz deiner eigenen Inhalte entscheidest du selbst. Sproutsite und die ursprünglichen Startervorlagen stehen unter Apache-2.0; für die mitgelieferten Dateien liegen LICENSE-SPROUTSITE und NOTICE-SPROUTSITE bei. Lizenzen von Abhängigkeiten und Markenrechte bleiben getrennt.

[Dokumentation](https://sproutsite.dev/de/dokumentation/) · [Komponenten](https://sproutsite.dev/de/showcase/)
