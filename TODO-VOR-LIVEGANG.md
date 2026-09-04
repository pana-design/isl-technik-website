# TODO vor dem Livegang — ISL TECHNIK

Diese Liste muss **vollständig abgehakt** sein, bevor die Seite öffentlich erreichbar wird.
Stand: 24.08.2026

---

## 🔴 Rechtlich zwingend

- [ ] **Kundenstimmen ersetzen.** Die drei Zitate in `index.html` (Abschnitt `#stimmen`) sind
      Beispieltexte. Die sichtbare Kennzeichnung („Beispieltext · echte Kundenstimme folgt")
      wurde am 04.09.2026 auf Wunsch entfernt — die Zitate sehen jetzt wie echte Bewertungen aus,
      sind es aber nicht. Erfundene Bewertungen sind nach **Anhang Nr. 23b UWG** unzulässig und
      abmahnfähig — das Risiko trägt der Betreiber.
      → Echte, freigegebene Stimmen einsetzen (Text, Name, Ort, ggf. Foto).
      → Falls keine vorliegen: Abschnitt entfernen statt Platzhalter zu veröffentlichen.
      → AUCH die Avatar-Fotos (img/produkte/avatar-*.webp, KI-generierte Stockfotos) und die
        fiktiven Namen/Orte (Markus B./Friedberg, Sabine K./Gersthofen, Julia M./Königsbrunn)
        sind Platzhalter vom 03.09.2026 und müssen mit den echten Stimmen ersetzt werden.

- [ ] **Impressum gegenprüfen** (`impressum.html`, neu geschrieben am 04.09.2026, ohne Platzhalter).
      Angenommen: nicht im Handelsregister eingetragener Betrieb mit den Inhabern Dennis Vetter
      und Dominik Hayda; Abschnitte Registereintrag/USt-IdNr./Handwerkskammer daher weggelassen
      (sind nur Pflicht, wenn vorhanden). Vom Betreiber bestätigen lassen:
      → Rechtsform: GbR (dann Firmierung „… Vetter & Hayda GbR" ergänzen), Einzelunternehmen
        (dann nur der eine Inhaber) oder GmbH/UG (dann Registergericht + HRB-Nummer + Geschäftsführer).
      → USt-IdNr. vorhanden? Dann Abschnitt „Umsatzsteuer-ID" ergänzen.
      → In der Handwerksrolle eingetragen (z. B. Rollladen- und Sonnenschutztechnik)? Dann
        Handwerkskammer für Schwaben, Berufsbezeichnung und Verleihungsstaat ergänzen.
      → Der Link zur EU-OS-Plattform wurde entfernt — die Plattform ist seit 20.07.2025 abgeschaltet.

- [ ] **Datenschutzerklärung prüfen lassen** (`datenschutz.html`) — AVV mit All-Inkl im KAS
      abschließen (Hosting-Absatz ist bereits auf All-Inkl umgestellt, 04.09.2026).

- [ ] **Bildrechte klären.** Alle Produkt**fotos** stammen von Schlotterer. Schriftliche
      Nutzungsfreigabe als Partnerbetrieb einholen.
      → Entschärft: Die sieben Produkt**clips** in `img/systeme/` sind eigene CGI-Renderings
        (keine Fremdrechte). Sobald ein Clip lädt, ersetzt er das Foto — die Fotos tragen
        also nur noch als Rückfall (kein JS, Datensparmodus, reduzierte Bewegung).
      → Ebenso das Hero-Haus (`img/produkte/haus4-*.webp`): eigenes Rendering.

---

## 🟠 Inhaltlich zu klären

- [ ] **Telefonnummer bestätigen.** Im vorhandenen Material kursieren **drei** Nummern:
      - `0160 92726131` ← aktuell eingesetzt (sichtbarer Text auf isl-technik.de)
      - `+49 151 44519103` (tel:-Link derselben Seite — weicht ab!)
      - `+49 (241) 3185-7620` (Onepage, Vorwahl **Aachen** — offensichtlich Template-Platzhalter)
      Betrifft: `index.html` (Hero, FAQ, Kontakt, Footer), `impressum.html`, JSON-LD.

- [ ] **Formular testen.** Das Formular läuft über `kontakt.php` (PHP `mail()` auf All-Inkl) und
      schickt an info@isl-technik.de. Nach dem ersten Deploy eine Testabsendung machen; kommt der
      rote Hinweis statt danke.html, im KAS prüfen, ob das Postfach existiert und PHP-Mail erlaubt ist.

- [ ] **Foto Lichtschachtabdeckung.** Es existiert **kein einziges echtes Foto** dieses Produkts,
      obwohl es eines der beiden Kernprodukte im Logo ist. Aktuell KI-generiert
      (`img/produkte/lichtschacht-*.webp`).
      → Bei nächster Montage ein echtes Foto machen lassen und ersetzen. Das ist die
      wirkungsvollste Einzelverbesserung an der Seite.

- [ ] **Technische Daten.** Falls Maße, Belastbarkeit oder Gewebe-Kennwerte genannt werden sollen,
      Werte vom Kunden liefern lassen. Es wurden bewusst keine erfunden.

- [ ] **Gründungsjahr / Projektzahl.** Die Onepage nannte „80123456789 Jahre Erfahrung" (kaputter
      Platzhalter) und „98 % Kundenvertrauen" (unbelegt). Beides wurde durch belegbare Fakten
      ersetzt (35 km · 2 Hersteller · 3 Schritte · 0 Subunternehmer). Falls echte Zahlen
      vorliegen, können sie diese ersetzen.

---

## 🟡 Technisch vor dem Schalten

- [ ] **`noindex` entfernen.** In `index.html`, `impressum.html`, `datenschutz.html`:
      `<meta name="robots" content="noindex,nofollow">` → `index,follow`
      (bzw. Zeile entfernen). **Ohne diesen Schritt findet Google die Seite nie.**

- [ ] **Canonical-URL prüfen** in `index.html` → `https://isl-technik.de/`

- [ ] **Baustellenseite ersetzen.** Wird durch den ersten Deploy überschrieben (siehe
      `DEPLOY-ALLINKL.md`); übrig gebliebene alte Dateien im KAS-Dateimanager löschen.

- [ ] Testabsendung des Formulars kommt bei `info@isl-technik.de` an
- [ ] `tel:` und `mailto:` auf einem echten Handy antippen
- [ ] Scrollverhalten auf einem echten Mittelklasse-Android prüfen

---

## Prüfskripte

```bash
python3 -m http.server 8080          # lokal starten
node check.mjs ./shots               # 8 Auflösungen: Überlauf, H1-Deckelung, Sticky
node vcheck.mjs                      # Abschneiden in gepinnten Karten
node scroll.mjs                      # kompletter Scrollverlauf als Screenshots
```

Referenz-Screenshots zum Abgleich liegen in `ref/`.

---

## 📱 Mobil / iOS (ergänzt 28.08.2026)

- [ ] **Hoster muss HTTP-Range-Requests für MP4 liefern** (`Accept-Ranges: bytes`, Antwort 206).
      iOS Safari spielt Videos sonst **gar nicht** ab — Desktop-Browser sind da tolerant, deshalb
      fällt es lokal nicht auf. Prüfen mit `curl -I -H "Range: bytes=0-99" https://<domain>/img/produkte/hero-hund.mp4`
      → muss `HTTP/… 206` liefern.
- [ ] **Auf einem echten iPhone testen** (Safari, einmal auch im Stromsparmodus): Katze im Hero
      und Footer läuft, Systeme scrubben beim Scrollen, Wetter-Bühne spielt die drei Clips,
      Scroll-Lupe im Hero wandert Tür → Fenster → Lichtschacht. Die Umsetzung wurde nur in
      Chromium- und WebKit-Emulation geprüft (kein iOS-Gerät verfügbar).
