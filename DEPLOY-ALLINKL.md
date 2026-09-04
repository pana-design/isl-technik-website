# Deploy auf All-Inkl — ISL TECHNIK

Die Seite ist statisch (plus `kontakt.php` für das Formular). `node _tools/build.mjs`
baut den Ordner `dist/` — nur HTML, css/, js/, fonts/, `.htaccess`, `kontakt.php` und
die tatsächlich referenzierten Bilder/Clips (~27 MB). Backups, Quellen, Werkzeuge und
Screens bleiben draußen. Jede Bild-, CSS- und JS-Referenz in dist/ bekommt `?v=<Inhalts-Hash>`,
damit ersetzte Dateien trotz Cache (Bilder ein Jahr, CSS/JS ein Tag) sofort frisch geladen werden.

## Laufender Betrieb: Push → automatisch online
1. Änderung lokal machen, kurz prüfen (`python3 serve.py` oder `python3 -m http.server 8080`).
2. `git add -A && git commit -m "…" && git push`
3. GitHub Actions („Deploy zu All-Inkl“) baut `dist/` und lädt es per FTPS hoch — dauert
   ca. 1–2 Minuten. Status: GitHub → Actions.

Ohne Push geht es auch von Hand: Zugangsdaten in `.ftp-allinkl.env` eintragen
(Vorlage unten, Datei ist gitignored), dann `node _tools/build.mjs` und
`python3 _tools/deploy-allinkl.py` (`--list` zeigt nur den Zielordner, `--dry-run` nur die Liste).

```
FTP_HOST=w01ae49d.kasserver.com
FTP_USER=…
FTP_PASS=…
FTP_DIR=/
```

## Einmalige Einrichtung
- Repo: github.com/pana-design/isl-technik-website (privat), Remote per SSH (`git@github.com:…`).
- GitHub → Repo → Settings → Secrets and variables → Actions → **Secrets**:
  `FTP_HOST`, `FTP_USER`, `FTP_PASS`, `FTP_DIR` (siehe Kommentar in `.github/workflows/deploy.yml`).
- `FTP_DIR` = Dokumentenwurzel der Domain. Im KAS unter **Domain → isl-technik.de → Pfad** nachsehen
  (Standard bei nur einer Domain: `/`).
- Im KAS: **Domain → SSL** ist bereits aktiv (Let's Encrypt, geprüft am 04.09.2026);
  `.htaccess` leitet http:// und www. auf https://isl-technik.de um.
- Im KAS: das Postfach `info@isl-technik.de` muss existieren — `kontakt.php` schickt die
  Anfragen dorthin und benutzt es auch als Absender (All-Inkl akzeptiert nur Domain-Adressen).

## Vorschau vs. Livegang
- **Standard = Vorschau**: `robots.txt` sperrt Suchmaschinen, keine Sitemap, alle Seiten `noindex`.
  Die Seite ist unter der Domain erreichbar, wird aber nicht in Google auftauchen.
- **Livegang**: GitHub → Settings → Secrets and variables → Actions → **Variables** → `LIVE` = `1`.
  Zusätzlich in `index.html`, `impressum.html`, `datenschutz.html` das
  `<meta name="robots" content="noindex,nofollow">` auf `index,follow` ändern, pushen.
  Vorher `TODO-VOR-LIVEGANG.md` abarbeiten.

## Nach dem ersten Deploy prüfen
- `https://isl-technik.de/` zeigt die neue Seite (Strg/Cmd+Shift+R für frischen Cache).
- Formular: Testabsendung → landet bei info@isl-technik.de, Browser landet auf danke.html.
  Falls stattdessen der rote Hinweis erscheint: PHP `mail()` hat abgelehnt — im KAS prüfen,
  ob das Postfach existiert und PHP-Mailversand für die Domain erlaubt ist.
- Range-Requests (Video auf iOS):
  `curl -I -H "Range: bytes=0-99" https://isl-technik.de/img/produkte/hero-hund.mp4` → `206`.
- Header: `curl -I https://isl-technik.de/css/style.css` → `Cache-Control: public, max-age=86400`.
- Alte Dateien der Baustellenseite, die nicht überschrieben wurden, im KAS-Dateimanager oder
  per `python3 _tools/deploy-allinkl.py --list` finden und löschen.

## Dateien
- `.github/workflows/deploy.yml` — Build + FTPS-Upload bei jedem Push auf main
- `_tools/build.mjs` — Build-Skript (ohne Abhängigkeiten, Node 20)
- `_tools/deploy-allinkl.py` — manueller FTPS-Upload als Rückfall
- `_deploy/.htaccess` — HTTPS/www-Umleitung, Cache- und Sicherheits-Header, MIME-Typen
- `_deploy/kontakt.php` — Formularversand per PHP mail()
- `_deploy/robots.txt`, `_deploy/sitemap.xml` — nur bei `LIVE=1`
- `danke.html` — Zielseite nach dem Absenden des Formulars
