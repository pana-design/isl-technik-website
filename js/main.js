/* ==========================================================================
   ISL TECHNIK — Scroll-Engine
   Ein einziger requestAnimationFrame-Loop treibt alle Sections.
   Jede gepinnte Karte bekommt --p (0 → 1) als CSS-Variable; sämtliche
   Animationen lesen nur diesen Wert. Dadurch bleibt das JS klein und jede
   Section ist einzeln abschaltbar.
   ========================================================================== */
(() => {
  "use strict";

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
  const touch = matchMedia("(hover:none)").matches;
  const narrow = () => matchMedia("(max-width:63.99rem)").matches;

  /* Alle Clips entstehen hier: iOS Safari spielt dynamisch erzeugte Videos
     nur mit gesetzten Attributen (muted/playsinline als Attribut, nicht
     nur als Property) ohne Geste ab. */
  const mkVideo = cls => {
    const v = document.createElement("video");
    if (cls) v.className = cls;
    v.muted = true; v.playsInline = true; v.preload = "auto";
    v.setAttribute("muted", ""); v.setAttribute("playsinline", "");
    v.setAttribute("webkit-playsinline", ""); v.setAttribute("aria-hidden", "true");
    return v;
  };
  /* iOS laedt Videodaten erst, wenn einmal play() lief — fuer die per
     Scroll gescrubbten Clips also kurz anspielen und sofort anhalten. */
  const prime = v => {
    const pr = v.play();
    if (pr && pr.then) pr.then(() => v.pause()).catch(() => {});
  };

  /* ---------- 1 · Karten und ihre Spacer verknuepfen ---------- */
  // Jede Karte klebt bei top:gap und bleibt liegen, bis die naechste sie
  // ueberdeckt. Der Spacer dahinter liefert den Scrollweg, ueber den --p laeuft.
  const absTop = el => { let y = 0; while (el) { y += el.offsetTop; el = el.offsetParent; } return y; };

  const cards = [...document.querySelectorAll(".card[data-scroll]")].map(el => ({
    el,
    pin: el.querySelector(".pin"),
    spacer: document.querySelector(`.spacer[data-for="${el.id}"]`),
    top: 0, travel: 0, last: -1
  }));

  function measure() {
    // --gap ist ein clamp() — parseFloat liefert dafuer NaN. Der aufgeloeste
    // Wert steht im `top` der gepinnten Karten (sticky), sonst Notwert.
    let gap = 16;
    for (const c of cards) {
      const t = parseFloat(getComputedStyle(c.el).top);
      if (isFinite(t)) { gap = t; break; }
    }
    for (const c of cards) {
      c.top = absTop(c.el) - gap;
      c.travel = c.spacer ? c.spacer.offsetHeight : 0;
    }
    // Umschaltpunkte der Wetter-Buehne kommen aus dem CSS (--wx-a/--wx-b,
    // mobil frueher als am Desktop), damit Clip und Ueberblendung zusammenpassen
    if (wxCard) {
      const cs = getComputedStyle(wxCard.el);
      wxA = parseFloat(cs.getPropertyValue("--wx-a")) || 0.36;
      wxB = parseFloat(cs.getPropertyValue("--wx-b")) || 0.66;
    }
  }

  /* ---------- 2 · Mehrstufige Sections registrieren ---------- */
  const groups = [];
  const registerGroup = (cardEl, sel, opts = {}) => {
    const card = cards.find(c => c.el === cardEl);
    if (!card) return;
    const items = [...cardEl.querySelectorAll(sel)];
    if (items.length) groups.push({ card, items, hold: opts.hold ?? 0.08, lastIdx: -1, scrub: !!opts.scrub });
  };

  const systems = document.querySelector("#systeme");
  if (systems) {
    registerGroup(systems, ".systems__shot", { scrub: true });
    registerGroup(systems, ".systems__text");
    registerGroup(systems, "#sysCards .glass");
  }
  const voices = document.querySelector("#stimmen");
  if (voices) registerGroup(voices, ".voice");

  const sysBars = [...document.querySelectorAll("#sysProgress .systems__bar i")];

  /* ---------- 2b-wx · Wetter-Buehne (#lichtschacht) ----------
     Drei Zustaende als Clips: Laub faellt aufs Gitter, Nacht mit Spinne,
     Sturm und Regen. Die Ueberblendung der Ebenen macht das CSS ueber --p;
     hier wird nur der passende Clip erzeugt, gestartet und pausiert.
     Laub und Nacht spielen einmal durch und bleiben auf dem letzten Frame
     stehen, der Regen loopt (data-loop). Mobil (kein Spacer) laeuft nichts —
     dort steht das statische Laub-Bild. */
  const wxCard = cards.find(c => c.el.id === "lichtschacht");
  const wxPhases = wxCard ? [...wxCard.el.querySelectorAll(".wx__phase")] : [];
  const wxFrame = wxCard ? wxCard.el.querySelector(".wx__frame") : null;
  let wxCur = -1;                       // Phase, die gerade laeuft (-1: keine)
  let wxA = 0.36, wxB = 0.66;           // Schwellen, siehe measure()
  const wxVideo = ph => {
    if (!clipReady || !ph) return;
    if (ph.dataset.clipOn) return;
    ph.dataset.clipOn = "1";
    const v = mkVideo();
    v.loop = ph.dataset.loop === "1";
    // Handy: leichte 640px-Variante (data-clip-m), sonst der volle Clip
    v.src = (narrow() && ph.dataset.clipM) ? ph.dataset.clipM : ph.dataset.clip;
    v.addEventListener("loadeddata", () => {
      if (wxPhases[wxCur] === ph) v.play().catch(() => {});
    }, { once: true });
    ph.appendChild(v);
  };
  const wxTick = () => {
    if (!wxCard || wxCard.travel <= 4 || !wxPhases.length || !wxFrame) return;
    const p = wxCard.last < 0 ? 0 : wxCard.last;
    const idx = p < wxA + 0.02 ? 0 : p < wxB + 0.02 ? 1 : 2;
    // Laden, sobald die Karte in Reichweite kommt (aktuelle + naechste Phase)
    const r = wxCard.el.getBoundingClientRect();
    const near = r.bottom > -200 && r.top < innerHeight * 1.5;
    if (near) { wxVideo(wxPhases[idx]); wxVideo(wxPhases[idx + 1]); }
    // Abspielen aber erst, wenn die Buehne wirklich im Bild ist — sonst ist
    // das Laub laengst gefallen, bevor jemand hinschaut (der Clip lief
    // frueher schon los, waehrend die Karte noch weit unter dem Bildrand lag).
    const f = wxFrame.getBoundingClientRect();
    const seen = near && f.bottom > 0 && f.top < innerHeight - f.height * 0.6;
    const want = seen ? idx : -1;
    if (want === wxCur) return;
    wxCur = want;
    wxPhases.forEach((ph, i) => {
      const v = ph.querySelector("video");
      if (!v) return;
      if (i === want) {
        if (v.readyState >= 2) { try { v.currentTime = 0; } catch (e) {} }
        v.play().catch(() => {});
      } else v.pause();
    });
  };

  /* ---------- 2b · Produktclips am Scroll ----------
     Jeder Schritt bekommt seinen eigenen Clip. Der Teilfortschritt innerhalb
     des Schrittes setzt direkt die Abspielposition — das Produkt bewegt sich
     also genau so weit, wie gescrollt wird. Geladen wird erst kurz davor. */
  const clipReady = !reduced && !(navigator.connection || {}).saveData;

  // Sobald Clips laufen duerfen, zeigt jeder Schritt von Anfang an das
  // Startbild seines Clips (Poster) statt des Produktfotos. Vorher stand das
  // Foto, bis der Clip geladen war — auf dem Handy sah man dadurch beim
  // Durchscrollen sekundenlang die alten Fotos, dann sprang das Rendering rein.
  // Das Foto bleibt im Markup als Rueckfall (kein JS, Datensparmodus, reduzierte Bewegung).
  if (clipReady) document.querySelectorAll(".systems__shot[data-clip-poster] img").forEach(img => {
    img.removeAttribute("srcset"); img.removeAttribute("sizes");
    img.src = img.closest(".systems__shot").dataset.clipPoster;
    img.classList.add("systems__poster");
  });

  const ensureClip = fig => {
    if (!clipReady || !fig || fig.dataset.clipOn) return null;
    const src = fig.dataset.clip;
    if (!src) return null;
    fig.dataset.clipOn = "1";
    const v = mkVideo("systems__clip");
    v.dataset.scrub = "1";
    if (fig.dataset.clipPoster) v.poster = fig.dataset.clipPoster;
    v.src = src;
    v.addEventListener("loadeddata", () => {
      fig.classList.add("has-clip");
      onScroll();                       // Position sofort nachziehen
    }, { once: true });
    fig.appendChild(v);
    if (touch) { v.load(); prime(v); }
    return v;
  };

  // Alle Produktclips vorab laden, sobald die Systeme-Karte in Reichweite
  // kommt — nacheinander, damit sie sich auf dem Handy nicht die Bandbreite
  // streitig machen. Bisher lud jeder Clip erst, wenn sein Schritt dran war.
  if (systems && clipReady && "IntersectionObserver" in window) {
    const figs = [...systems.querySelectorAll(".systems__shot[data-clip]")];
    const io = new IntersectionObserver(entries => {
      if (!entries.some(e => e.isIntersecting)) return;
      io.disconnect();
      let i = 0;
      const next = () => {
        if (i >= figs.length) return;
        const fig = figs[i++];
        const v = ensureClip(fig) || fig.querySelector("video.systems__clip");
        if (!v || v.readyState >= 2) { next(); return; }
        let done = false;
        const go = () => { if (done) return; done = true; next(); };
        v.addEventListener("loadeddata", go, { once: true });
        v.addEventListener("error", go, { once: true });
        setTimeout(go, 4000);           // haengt ein Clip, trotzdem weitermachen
      };
      next();
    }, { rootMargin: "150% 0px" });
    io.observe(systems);
  }

  const scrubClip = (g, idx, local) => {
    if (!clipReady) return;
    // aktuellen und naechsten Schritt vorbereiten
    ensureClip(g.items[idx]);
    ensureClip(g.items[idx + 1]);
    const v = g.items[idx].querySelector("video.systems__clip");
    if (!v || v.readyState < 2 || !isFinite(v.duration)) return;
    const t = local * Math.max(0, v.duration - 0.06);
    // Schwelle klein halten: das Lerp liefert viele feine Schritte,
    // die der Clip alle mitgehen soll — sonst ruckelt das Scrubbing.
    // Exakt auf den Frame — kein fastSeek: das landet in Safari/Firefox nur
    // auf Keyframes. Die Clips tragen auf jedem zweiten Frame einen Keyframe
    // (siehe _tools/_reenc-kf.mjs), damit ist exaktes Suchen ueberall billig.
    if (Math.abs(v.currentTime - t) > 0.008) v.currentTime = t;
  };

  /* ---------- 2b-hero · Katzen-Clip im Hero ----------
     Der Clip (Start- und End-Frame identisch → nativer nahtloser Loop)
     liegt deckungsgleich ueber dem Startbild. Er laeuft nur, solange der
     Hero im Blick ist; ohne clipReady bleibt das Standbild stehen. */
  const heroHouse = document.getElementById("heroHouse");
  let hv = null, heroSeen = false, heroCovered = false;
  // Mobil klebt der Hero hinter dem ganzen Stapel — der Observer sieht ihn
  // dann dauerhaft. Verdeckt ihn die naechste Karte, wird pausiert.
  const stackRest = document.querySelector(".stack__rest");
  const heroSync = () => {
    if (!hv) return;
    const want = heroSeen && !heroCovered;
    if (want && hv.paused) hv.play().catch(() => {});
    else if (!want && !hv.paused) hv.pause();
  };
  if (heroHouse && heroHouse.dataset.clip && clipReady) {
    // Sofort laden statt erst beim Sichtbarwerden: Wer auf der Seite ankommt,
    // soll den Hund direkt in Bewegung sehen. Der Clip (v7) laeuft ab Frame 1
    // los und Start-=Endframe sind identisch — nativ loopen, KEIN Zeitsprung
    // (ein currentTime-Skip macht den Umlauf sichtbar).
    hv = mkVideo("hero__clip");
    hv.loop = true;
    hv.defaultPlaybackRate = 0.75; // Laden setzt playbackRate auf default zurueck
    hv.playbackRate = 0.75;   // gemuetliches Schlendertempo
    hv.src = heroHouse.dataset.clip;
    hv.addEventListener("playing", () => hv.classList.add("is-on"));
    // vor der Hint-Ebene einhaengen — Geist-Overlay und Lupe
    // muessen ueber dem Video liegen
    heroHouse.insertBefore(hv, heroHouse.querySelector(".hero__h--hint"));
    const heroIO = new IntersectionObserver(entries => {
      for (const e of entries) { heroSeen = e.isIntersecting; heroSync(); }
    }, { threshold: 0.2 });
    heroIO.observe(heroHouse);
  }

  /* ---------- 2c · Footer-Szene: Katze kommt heim (Endlos-Look) ----------
     Der Clip liegt als Hintergrund unten im Footer. Poster darunter ist die
     LEERE Szene — identisch mit Anfangs- und Endzustand des Clips (Katze
     drin, Schutz zu). Der Loop springt deshalb nie sichtbar: Nach dem Ende
     bleibt das Schlussbild kurz stehen, blendet unmerklich auf die leere
     Szene und beim Neustart taucht nur die Katze weich am linken Rand auf,
     als kaeme die naechste gerade vorbeispaziert. */
  const outro = document.getElementById("footerScene");
  let ov = null, outroWant = false;
  if (outro && clipReady) {
    let again = 0, fade = 0;
    const stopReplay = () => { clearTimeout(again); clearTimeout(fade); };
    const runFromStart = () => {
      try { ov.currentTime = 0; } catch (err) {}
      ov.play().catch(() => {});           // "playing"-Listener blendet ein
    };
    const outroIO = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (e.isIntersecting) {
          outroWant = true;
          if (!ov) {
            ov = mkVideo();
            ov.style.opacity = "0";
            ov.src = outro.dataset.clip;
            ov.addEventListener("playing", () => { ov.style.opacity = "1"; });
            ov.addEventListener("ended", () => {
              again = setTimeout(() => {
                ov.style.opacity = "0";     // unmerklich: Endbild ≈ leere Szene
                fade = setTimeout(runFromStart, 750);
              }, 1600);
            });
            outro.appendChild(ov);
          }
          stopReplay();
          if (ov.paused) runFromStart();
        } else if (ov) {
          outroWant = false;
          stopReplay();
          if (!ov.paused) ov.pause();
          try { ov.currentTime = 0; } catch (err) {}
          ov.style.opacity = "0";           // naechster Besuch startet weich
        }
      }
    }, { threshold: 0.45 });
    // Beobachtet wird der Footer, nicht die Szene selbst — die reicht
    // inzwischen bis hinter das Kontaktformular hinauf und wuerde den
    // Clip sonst viel zu frueh starten.
    outroIO.observe(document.querySelector(".footer") || outro);
  }

  /* ---------- 2d · Touch-Unlock ----------
     Im Stromsparmodus verweigert iOS play() ohne Geste. Die erste
     Beruehrung ist diese Geste: alles, was laufen soll, einmal anstossen. */
  if (touch && clipReady) {
    addEventListener("touchend", () => {
      document.querySelectorAll("video[data-scrub]").forEach(v => { if (v.paused) prime(v); });
      heroSync();
      if (ov && outroWant && ov.paused) ov.play().catch(() => {});
      wxCur = -1; wxTick();            // laufende Wetter-Phase neu anstossen
    }, { once: true, passive: true });
  }

  /* ---------- 3 · Der eine Loop ---------- */
  // Der rohe Scrollwert wird nicht direkt uebernommen, sondern pro Frame
  // weich nachgezogen (zeitbasiertes Lerp). Clips, Fortschrittsbalken und
  // Blenden laufen dadurch butterweich, auch wenn Mausrad oder Trackpad in
  // groben Spruengen scrollen — das "smooth scrubbing" der Referenz.
  let ticking = false;
  let lastT = 0;
  // Ist der Smooth-Scroll aktiv (3b), ist scrollY selbst schon geglaettet —
  // die Effekte duerfen dann straffer folgen, sonst daempft es doppelt.
  let glideOn = false;

  function frame(now) {
    ticking = false;
    if (now === undefined) now = performance.now();
    const dt = Math.min(0.05, lastT ? (now - lastT) / 1000 : 0.016);
    lastT = now;
    const k = reduced ? 1 : 1 - Math.exp(-dt * (glideOn ? 18 : touch ? 14 : 9));
    const y = scrollY;
    let moving = false;

    for (const c of cards) {
      let p = 0;
      if (c.travel > 4) {
        p = clamp((y - c.top) / c.travel);
      } else {
        // Karte ohne eigenen Scrollweg: Fortschritt ueber die Sichtbarkeit
        const r = c.el.getBoundingClientRect();
        p = clamp((innerHeight - r.top) / (innerHeight + r.height));
      }
      let s = c.last < 0 ? p : c.last + (p - c.last) * k;
      if (Math.abs(p - s) < 0.0006) { s = p; } else { moving = true; }
      if (s !== c.last) {
        c.el.style.setProperty("--p", s.toFixed(4));
        if (c.pin) c.pin.style.setProperty("--p", s.toFixed(4));
        c.last = s;
      }
    }

    // Mehrstufige Sections durchschalten
    for (const g of groups) {
      const p = g.card.last < 0 ? 0 : g.card.last;
      const n = g.items.length;
      // Am Anfang und Ende etwas Ruhe lassen, damit erster und letzter Schritt
      // lesbar stehen bleiben — die Referenz macht das genauso.
      const eff = clamp((p - g.hold) / (1 - g.hold * 2));
      const idx = Math.min(n - 1, Math.floor(eff * n));
      if (g.lastIdx !== idx) {
        g.items.forEach((el, i) => el.classList.toggle("is-active", i === idx));
        g.lastIdx = idx;
      }
      if (g.scrub) scrubClip(g, idx, clamp(eff * n - idx));
      if (g.card.el.id === "systeme" && sysBars.length === n) {
        for (let i = 0; i < n; i++) {
          sysBars[i].style.width = (clamp(eff * n - i) * 100).toFixed(1) + "%";
        }
      }
    }

    wxTick();

    if (hv && stackRest) {
      const covered = stackRest.getBoundingClientRect().top <= 8;
      if (covered !== heroCovered) { heroCovered = covered; heroSync(); }
    }

    // Solange der geglaettete Wert dem Ziel hinterherlaeuft, weiterticken
    if (moving && !ticking) { ticking = true; requestAnimationFrame(frame); }
  }

  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(frame); }
  }
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", () => { measure(); onScroll(); }, { passive: true });

  /* ---------- 3b · Smooth-Scroll (Referenz-Feel) ----------
     Das Mausrad springt nicht mehr hart: jedes Rad-Event setzt nur ein
     Ziel, ein rAF-Lerp faehrt die echte Scrollposition weich dorthin
     (Lenis-Prinzip). Weil wirklich gescrollt wird, funktionieren
     Sticky-Pins, Nav-Collapse und Anker unveraendert. Scrollleiste,
     Tastatur und Touch bleiben nativ; bei prefers-reduced-motion oder
     Touch-Geraeten passiert nichts. */
  if (!reduced && matchMedia("(hover:hover) and (pointer:fine)").matches) {
    const glide = { target: 0, cur: 0, t: 0 };
    const maxY = () => document.documentElement.scrollHeight - innerHeight;
    // Innere Scrollbereiche (z. B. FAQ-Liste, Menue-Panel) behalten ihr
    // natives Radverhalten
    const innerScroller = t => {
      for (let el = t; el && el !== document.body; el = el.parentElement) {
        if (!(el instanceof Element)) break;
        const o = getComputedStyle(el).overflowY;
        if ((o === "auto" || o === "scroll") && el.scrollHeight > el.clientHeight + 1) return true;
      }
      return false;
    };
    const step = now => {
      const dt = Math.min(0.05, (now - glide.t) / 1000 || 0.016);
      glide.t = now;
      glide.cur += (glide.target - glide.cur) * (1 - Math.exp(-dt * 10));
      if (Math.abs(glide.target - glide.cur) < 0.5) { glide.cur = glide.target; glideOn = false; }
      // behavior:'instant' umgeht das CSS scroll-behavior:smooth — sonst
      // wuerde jeder Frame-Schritt eine eigene Glaettung starten und die
      // Seite kaeme kaum vom Fleck
      scrollTo({ top: glide.cur, left: 0, behavior: "instant" });
      if (glideOn) requestAnimationFrame(step);
    };
    addEventListener("wheel", e => {
      if (e.ctrlKey || e.defaultPrevented || innerScroller(e.target)) return; // Zoom & innere Scroller
      e.preventDefault();
      const unit = e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? innerHeight : 1;
      if (!glideOn) { glide.cur = scrollY; glide.target = scrollY; }
      glide.target = clamp(glide.target + e.deltaY * unit, 0, maxY());
      if (!glideOn) { glideOn = true; glide.t = performance.now(); requestAnimationFrame(step); }
    }, { passive: false });
    // Fremd-Scroll waehrend des Gleitens (Scrollbar, Anker, Tastatur):
    // Ziel uebernehmen statt dagegen anzukaempfen
    addEventListener("scroll", () => {
      if (glideOn && Math.abs(scrollY - glide.cur) > 2) { glide.cur = glide.target = scrollY; }
    }, { passive: true });
  }

  /* ---------- 4 · Einblendungen ---------- */
  // Werte aus der Referenz gemessen: 25 % Sichtbarkeit, -10 % Rand, einmalig
  const reveals = document.querySelectorAll(".reveal");
  if (reduced) {
    reveals.forEach(el => el.classList.add("is-in"));
  } else {
    const io = new IntersectionObserver((entries, obs) => {
      for (const e of entries) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); obs.unobserve(e.target); }
      }
    }, { threshold: 0.25, rootMargin: "0px 0px -10% 0px" });
    reveals.forEach(el => io.observe(el));
  }

  /* ---------- 4b · FAQ-Marquee ----------
     Die Karten je Set verdreifachen (damit ein Set auch sehr breite
     Screens fuellt) und das Duplikat-Set fuer die nahtlose Schleife
     anhaengen. Erst dann startet die CSS-Animation (.is-ready) —
     ohne JS stehen die Karten einfach still. */
  const faqRows = document.getElementById("faqRows");
  if (faqRows) {
    faqRows.querySelectorAll(".faq__track").forEach(track => {
      const set = track.querySelector(".faq__set");
      set.innerHTML += set.innerHTML + set.innerHTML;
      const dup = set.cloneNode(true);
      dup.setAttribute("aria-hidden", "true");
      track.appendChild(dup);
    });
    if (!reduced) faqRows.classList.add("is-ready");
  }

  /* ---------- 5 · Zahlen hochzählen & Balken füllen ---------- */
  const animateValue = el => {
    const target = parseFloat(el.dataset.count);
    if (reduced) { el.textContent = target; return; }
    const dur = 1100, t0 = performance.now();
    const tick = now => {
      const t = clamp((now - t0) / dur);
      // ease-out wie die Referenz: cubic-bezier(.16,1,.3,1) ≈ 1-(1-t)^3
      el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3)));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const valueIO = new IntersectionObserver((entries, obs) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const el = e.target;
      if (el.dataset.count !== undefined) animateValue(el);
      if (el.dataset.fill !== undefined) el.style.width = el.dataset.fill;
      obs.unobserve(el);
    }
  }, { threshold: 0.4 });
  document.querySelectorAll("[data-count],[data-fill]").forEach(el => valueIO.observe(el));

  /* ---------- 5b · Live-Aufmass ----------
     Das Pendant zum tickenden bpm-Wert der Referenz: die Zahl "misst" alle
     paar Sekunden eine neue Elementbreite und zaehlt weich dorthin.
     Tickt nur, solange die Sektion sichtbar ist. */
  const mm = document.getElementById("mmLive");
  if (mm) {
    const fmt = n => n.toLocaleString("de-DE");
    if (reduced) {
      mm.textContent = fmt(1450);
    } else {
      let cur = 1450, timer = 0;
      const remeasure = () => {
        const target = 480 + Math.round(Math.random() * 1920);
        const from = cur, t0 = performance.now(), dur = 850;
        const tick = now => {
          const t = clamp((now - t0) / dur);
          cur = Math.round(from + (target - from) * (1 - Math.pow(1 - t, 3)));
          mm.textContent = fmt(cur);
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      };
      const mmIO = new IntersectionObserver(entries => {
        for (const e of entries) {
          if (e.isIntersecting) {
            if (!timer) { remeasure(); timer = setInterval(remeasure, 2600); }
          } else if (timer) { clearInterval(timer); timer = 0; }
        }
      }, { threshold: 0.2 });
      mmIO.observe(mm);
    }
  }

  /* ---------- 6 · Navigation ---------- */
  const nav = document.getElementById("nav");
  const burger = document.getElementById("burger");
  const menu = document.getElementById("menu");

  let navLast = null, lastY = 0, hidden = false;
  const isMobile = () => matchMedia("(max-width:63.99rem)").matches;
  const navUpdate = () => {
    const y = scrollY;
    // Referenz (sensiq.co, live gemessen): die Leiste kollabiert erst nach
    // gut 200px Scrollweg — nicht schon beim ersten Radtick
    const collapsed = y > 220;
    if (collapsed !== navLast) { nav.classList.toggle("is-collapsed", collapsed); navLast = collapsed; }

    // Mobil: beim Runterscrollen ausblenden, beim Hochscrollen zeigen.
    // Sonst steht die helle Leiste ueber dunklen Karten und dem Footer.
    if (isMobile()) {
      const down = y > lastY + 6, up = y < lastY - 6;
      if (down && y > 200 && !hidden && !menu.classList.contains("is-open")) {
        nav.classList.add("is-hidden"); hidden = true;
      } else if ((up || y < 120) && hidden) {
        nav.classList.remove("is-hidden"); hidden = false;
      }
    } else if (hidden) { nav.classList.remove("is-hidden"); hidden = false; }
    lastY = y;
  };
  addEventListener("scroll", navUpdate, { passive: true });
  navUpdate();

  const closeMenu = () => {
    menu.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
    burger.setAttribute("aria-label", "Menü öffnen");
  };
  burger.addEventListener("click", () => {
    const open = menu.classList.toggle("is-open");
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Menü schließen" : "Menü öffnen");
  });
  menu.addEventListener("click", e => { if (e.target.tagName === "A") closeMenu(); });
  addEventListener("keydown", e => { if (e.key === "Escape") closeMenu(); });
  document.addEventListener("click", e => {
    if (menu.classList.contains("is-open") && !menu.contains(e.target) && !burger.contains(e.target)) closeMenu();
  });

  /* ---------- 6b · Hero: Lupe ----------
     Die Lupe existiert nur am Zeiger: Sie erscheint, sobald die Maus eine
     der drei Oeffnungen (Balkontuer, Fenster, Lichtschacht) erreicht, und
     ersetzt dort den Cursor (cursor:none im CSS).
     Ueberall sonst bleibt der ganz normale Mauszeiger — keine
     Vorfuehrrunde mehr. Auf Touch-Geraeten gibt es keine Lupe; dort schliesst
     der Schutz beim Scrollen (CSS ueber --p, siehe Stylesheet). */
  (() => {
    const hero = document.getElementById("hero");
    const house = document.getElementById("heroHouse");
    const lens = document.getElementById("heroLens");
    if (!hero || !house || !lens) return;
    if (reduced) return;

    const fine = matchMedia("(hover:hover) and (pointer:fine)").matches;

    let ow = 200;
    const sizeLens = () => {
      const r = house.getBoundingClientRect();
      ow = Math.round(Math.min(Math.max(r.width * 0.17, 140), 240));
      hero.style.setProperty("--ovw", ow + "px");
      hero.style.setProperty("--hw", Math.round(r.width) + "px");
      hero.style.setProperty("--hh", Math.round(r.height) + "px");
    };
    sizeLens();
    addEventListener("resize", sizeLens, { passive: true });

    /* Die Lupe erscheint nicht ueberall auf dem Haus, sondern nur an den
       drei Oeffnungen: Balkontuer, Fenster und Lichtschacht. Die Zonen sind
       Anteile der Bildflaeche (0..1), MARGIN ist der Annaeherungsrand —
       erst wer mit der Maus auf eine Oeffnung zusteuert, bekommt das Glas. */
    const ZONES = [
      { x0: .295, y0: .450, x1: .455, y1: .740 },  /* Balkontuer   */
      { x0: .540, y0: .500, x1: .655, y1: .685 },  /* Fenster      */
      { x0: .520, y0: .645, x1: .730, y1: .835 },  /* Lichtschacht */
    ];

    /* Touch: der Scrollweg ersetzt die Maus (Stand 05.09.2026).
       Die Lupe wandert nicht mehr nacheinander von Oeffnung zu Oeffnung —
       sobald der Nutzer scrollt, stehen DREI Lupen gleichzeitig auf
       Balkontuer, Fenster und Lichtschacht (die zwei zusaetzlichen sind
       Klone von #heroLens, ohne Etikett) und bleiben stehen, solange das
       Haus im Blick ist. Beim Weiterscrollen verschwinden sie, und der
       Schutz faehrt ueber --zu von oben nach unten zu (CSS, hero__h--hint)
       — das Haus ist geschlossen, bevor die Systeme kommen.
       Scrollweg = bis die Bildoberkante den oberen Rand erreicht (im
       Fluss) bzw. der Spacer (gepinnt, grosse Tablets). */
    if (!fine) {
      const LENS_ON = 0.02, LENS_OFF = 0.70;     // Lupen sichtbar
      const ZU_A = 0.64, ZU_B = 0.96;            // Schutz faehrt zu
      /* Mitte der Oeffnung als Bildanteil (x, y) und Glasgroesse relativ
         zur Basis — Fenster und Lichtschacht liegen eng beieinander,
         deshalb kleinere Glaeser, der Schacht etwas nach rechts unten. */
      const SPOTS = [
        [.400, .585, 1.00],   /* Balkontuer   */
        [.595, .540, 0.80],   /* Fenster      */
        [.650, .750, 0.88],   /* Lichtschacht */
      ];
      const lenses = [lens];
      for (let i = 1; i < SPOTS.length; i++) {
        const c = lens.cloneNode(true);
        c.removeAttribute("id");
        c.classList.add("hero__lens--copy", "hero__lens--" + (i + 1));
        const tag = c.querySelector(".hero__lens-tag");
        if (tag) tag.remove();
        house.appendChild(c);
        lenses.push(c);
      }
      const place = () => {
        const r = house.getBoundingClientRect();
        const base = Math.round(Math.min(Math.max(r.height * 0.24, 80), 120));
        SPOTS.forEach(([fx, fy, k], i) => {
          const l = lenses[i];
          l.style.setProperty("--ovw", Math.round(base * k) + "px");
          l.style.setProperty("--lx", (fx * r.width).toFixed(1) + "px");
          l.style.setProperty("--ly", (fy * r.height).toFixed(1) + "px");
        });
      };
      let span = 200;
      const sizeSpan = () => {
        const sp = document.querySelector('.spacer[data-for="hero"]');
        const t = sp ? sp.offsetHeight : 0;
        if (t > 4) { span = t; return; }             // gepinnt
        let y = 0; for (let e = house; e; e = e.offsetParent) y += e.offsetTop;
        span = Math.max(200, Math.round(y));         // im Fluss
      };
      const wipe = () => {
        const p = Math.min(1, Math.max(0, scrollY / span));
        const z = Math.min(1, Math.max(0, (p - ZU_A) / (ZU_B - ZU_A)));
        const zu = z * z * (3 - 2 * z);              // weich anfahren und ankommen
        hero.style.setProperty("--zu", zu.toFixed(3));
        const on = p > LENS_ON && p < LENS_OFF;
        hero.classList.toggle("is-revealing", on);
        hero.classList.toggle("is-lens", on);
      };
      const all = () => { sizeSpan(); place(); wipe(); };
      all();
      addEventListener("load", () => { sizeLens(); all(); }, { once: true });
      addEventListener("resize", all, { passive: true });
      addEventListener("scroll", wipe, { passive: true });
      return;
    }

    /* Straffes Nachziehen — der Cursor ist ausgeblendet, die Lupe ist der
       Zeiger. Zu viel Easing wuerde sich dann wie Eingabeverzoegerung anfuehlen. */
    const EASE = 0.38, SETTLED = 0.3;
    let tx = 0, ty = 0, cx = 0, cy = 0;
    let running = false, primed = false;

    const paint = () => {
      lens.style.setProperty("--lx", cx.toFixed(1) + "px");
      lens.style.setProperty("--ly", cy.toFixed(1) + "px");
    };
    const loop = () => {
      running = true;
      const dx = tx - cx, dy = ty - cy;
      cx += dx * EASE; cy += dy * EASE;
      paint();
      if (Math.abs(dx) < SETTLED && Math.abs(dy) < SETTLED) { running = false; return; }
      requestAnimationFrame(loop);
    };
    const kick = () => { if (!running) requestAnimationFrame(loop); };

    const MARGIN = .025;
    const nearZone = (fx, fy) => ZONES.some(z =>
      fx >= z.x0 - MARGIN && fx <= z.x1 + MARGIN &&
      fy >= z.y0 - MARGIN && fy <= z.y1 + MARGIN);

    /* Die Textebene liegt ueber dem Haus und faengt die Mausereignisse ab —
       deshalb lauscht der Hero und prueft selbst, wo der Zeiger steht. Nur
       an einer der Oeffnungen erscheint die Lupe (und ersetzt den Cursor,
       Klasse is-lens); ueberall sonst bleibt der normale Zeiger. */
    const off = () => {
      primed = false;
      hero.classList.remove("is-revealing", "is-lens");
    };
    hero.addEventListener("pointermove", e => {
      const r = house.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      const inside = x >= 0 && y >= 0 && x <= r.width && y <= r.height
        && nearZone(x / r.width, y / r.height);
      if (!inside) { off(); return; }
      tx = x; ty = y;
      if (!primed) { primed = true; cx = tx; cy = ty; paint(); }
      hero.classList.add("is-revealing", "is-lens");
      kick();
    }, { passive: true });
    hero.addEventListener("pointerleave", off, { passive: true });
  })();

  /* ---------- 7 · Start ---------- */
  measure();
  frame();
  addEventListener("load", () => { measure(); frame(); });
})();

/* Kontaktformular: kontakt.php leitet bei einem Fehler auf /?fehler=…#kontakt zurueck —
   dann den Hinweis ueber dem Absenden-Knopf einblenden. */
(() => {
  const err = document.getElementById('form-fehler');
  if (err && new URLSearchParams(location.search).has('fehler')) err.hidden = false;
})();
