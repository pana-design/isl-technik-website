/* Build fuer den Webspace (All-Inkl, frueher Netlify): kopiert nur die Seite nach dist/.
   - HTML-Seiten aus der Liste unten
   - css/, js/, fonts/ komplett
   - aus img/ nur, was in HTML/CSS/JS referenziert wird (?v=… wird ignoriert)
   - _deploy/* verbatim (.htaccess, kontakt.php immer; robots.txt, sitemap.xml nur mit LIVE=1)
   Aufruf: node _tools/build.mjs   (laeuft ohne Abhaengigkeiten) */
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync, statSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { createHash } from 'crypto';
const ROOT = new URL('..', import.meta.url).pathname.replace(/%20/g, ' ');
const DIST = join(ROOT, 'dist');
const PAGES = ['index.html', 'impressum.html', 'datenschutz.html', 'danke.html'].filter(f => existsSync(join(ROOT, f)));
const ALL_DIRS = ['css', 'js', 'fonts'];

rmSync(DIST, { recursive: true, force: true }); mkdirSync(DIST, { recursive: true });
const copy = rel => { const src = join(ROOT, rel), dst = join(DIST, rel); mkdirSync(dirname(dst), { recursive: true }); cpSync(src, dst); return statSync(src).size; };

let bytes = 0, n = 0;
for (const f of PAGES) { bytes += copy(f); n++; }
for (const d of ALL_DIRS) { cpSync(join(ROOT, d), join(DIST, d), { recursive: true }); }
// Vorschau (Standard): Suchmaschinen komplett aussperren, keine Sitemap.
// Livegang: LIVE=1 node _tools/build.mjs  -> robots.txt/sitemap.xml aus _deploy/
const LIVE = process.env.LIVE === '1';
// .htaccess und kontakt.php (All-Inkl) kommen immer mit; robots.txt/sitemap.xml nur bei LIVE.
const SEO = new Set(['robots.txt', 'sitemap.xml']);
for (const f of readdirSync(join(ROOT, '_deploy'))) {
  if (f === '.DS_Store' || (SEO.has(f) && !LIVE)) continue;
  cpSync(join(ROOT, '_deploy', f), join(DIST, f)); n++;
}
if (!LIVE) { writeFileSync(join(DIST, 'robots.txt'), 'User-agent: *\nDisallow: /\n'); n++; }

// referenzierte Bilder/Clips einsammeln
const sources = [...PAGES, 'css/style.css', 'js/main.js'].map(f => readFileSync(join(ROOT, f), 'utf8')).join('\n');
const refs = new Set();
for (const m of sources.matchAll(/img\/[\w./-]+\.(?:webp|png|jpe?g|svg|gif|mp4|webm|ico)/g)) refs.add(m[0]);
const missing = [];
for (const rel of [...refs].sort()) {
  if (!existsSync(join(ROOT, rel))) { missing.push(rel); continue; }
  bytes += copy(rel); n++;
}
// Cache-Busting: .htaccess cacht /img/* ein Jahr "immutable". Wird eine Datei
// unter gleichem Namen ersetzt, saehen Rueckkehrer sonst die alte Version.
// Deshalb bekommt in dist/ jede img-Referenz ?v=<Inhalts-Hash> angehaengt —
// aendert sich der Inhalt, aendert sich die URL, der Cache ist automatisch frisch.
// Manuelle ?v=N im Quelltext werden dabei ersetzt (Quelldateien bleiben unberuehrt).
const hashes = {};
for (const rel of refs) if (existsSync(join(ROOT, rel)))
  hashes[rel] = createHash('md5').update(readFileSync(join(ROOT, rel))).digest('hex').slice(0, 8);
const VERS = /(img\/[\w./-]+\.(?:webp|png|jpe?g|svg|gif|mp4|webm|ico))(\?v=[\w.-]*)?/g;
for (const rel of [...PAGES, 'css/style.css', 'js/main.js']) {
  const p = join(DIST, rel); if (!existsSync(p)) continue;
  writeFileSync(p, readFileSync(p, 'utf8').replace(VERS, (m, f) => hashes[f] ? `${f}?v=${hashes[f]}` : f));
}
// Dasselbe fuer CSS und JS: .htaccess cacht sie einen Tag. Der manuelle Stempel
// ?v=N im Quelltext wurde bei Aenderungen nicht mitgezogen — Handys zeigten
// nach einem Deploy tagelang das alte Stylesheet (04.09.2026). Der Hash wird
// NACH der img-Ersetzung gebildet, damit er die fertige dist-Datei beschreibt.
const ASSETS = /((?:css|js)\/[\w.-]+\.(?:css|js))(\?v=[\w.-]*)?/g;
const assetHash = {};
for (const rel of ['css/style.css', 'js/main.js']) {
  const p = join(DIST, rel); if (!existsSync(p)) continue;
  assetHash[rel] = createHash('md5').update(readFileSync(p)).digest('hex').slice(0, 8);
}
for (const rel of PAGES) {
  const p = join(DIST, rel); if (!existsSync(p)) continue;
  writeFileSync(p, readFileSync(p, 'utf8').replace(ASSETS, (m, f) => assetHash[f] ? `${f}?v=${assetHash[f]}` : m));
}
// Bericht
const walk = d => readdirSync(join(ROOT, d), { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]);
const unused = walk('img').filter(f => !refs.has(f));
const distSize = (() => { let s = 0; const w = d => { for (const e of readdirSync(d, { withFileTypes: true })) { const p = join(d, e.name); e.isDirectory() ? w(p) : s += statSync(p).size; } }; w(DIST); return s; })();
console.log(LIVE ? 'LIVE-Build (robots erlaubt, Sitemap dabei)' : 'VORSCHAU-Build (robots.txt: Disallow /, keine Sitemap)');
console.log(`dist/: ${n} Dateien + css/js/fonts, ${(distSize / 1e6).toFixed(1)} MB gesamt`);
console.log(`img referenziert: ${refs.size} Dateien — nicht referenziert (bleiben draussen): ${unused.length}`);
if (missing.length) { console.error('FEHLT im Projekt:', missing.join(', ')); process.exit(1); }
