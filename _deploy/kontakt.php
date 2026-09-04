<?php
/* Kontaktformular ISL TECHNIK — Versand per PHP mail() auf All-Inkl.
   Ersetzt Netlify Forms. Erwartet POST von index.html (#kontakt), prueft
   Honeypot + Pflichtfelder, schickt die Anfrage an EMPFAENGER und leitet
   auf danke.html weiter. Bei Fehlern zurueck zum Formular mit ?fehler=… */

$EMPFAENGER = 'info@isl-technik.de';
$ABSENDER   = 'info@isl-technik.de';   // muss eine Adresse der Domain sein (All-Inkl-Vorgabe)
$BETREFF    = 'Neue Anfrage über isl-technik.de';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') { header('Location: /#kontakt', true, 303); exit; }

$f = fn($k) => trim((string)($_POST[$k] ?? ''));
$clean = fn($s) => str_replace(["\r", "\n", "\0"], ' ', $s);

// Honeypot: Bots fuellen das unsichtbare Feld "firma" — dann still auf danke.html
if ($f('firma') !== '') { header('Location: /danke.html', true, 303); exit; }

$name    = mb_substr($clean($f('name')), 0, 120);
$telefon = mb_substr($clean($f('telefon')), 0, 60);
$leistung= mb_substr($clean($f('leistung')), 0, 120);
$anfrage = mb_substr($f('anfrage'), 0, 4000);
$einw    = $f('einwilligung') !== '';

if ($name === '' || $telefon === '' || !$einw) { header('Location: /?fehler=felder#kontakt', true, 303); exit; }

$text = "Neue Anfrage über das Kontaktformular auf isl-technik.de\n"
      . "----------------------------------------------------------\n"
      . "Name:      $name\n"
      . "Telefon:   $telefon\n"
      . "Leistung:  $leistung\n"
      . "Datum:     " . date('d.m.Y H:i') . " Uhr\n"
      . "----------------------------------------------------------\n"
      . "Anfrage:\n$anfrage\n"
      . "----------------------------------------------------------\n"
      . "Einwilligung zur Verarbeitung: ja\n"
      . "IP: " . ($_SERVER['REMOTE_ADDR'] ?? '-') . "\n";

$betreff = '=?UTF-8?B?' . base64_encode($BETREFF . ' — ' . $name) . '?=';
$headers = "From: ISL TECHNIK Website <$ABSENDER>\r\n"
         . "Content-Type: text/plain; charset=UTF-8\r\n"
         . "Content-Transfer-Encoding: 8bit\r\n"
         . "X-Mailer: isl-technik.de Kontaktformular\r\n";

$ok = @mail($EMPFAENGER, $betreff, $text, $headers, '-f' . $ABSENDER);
header('Location: ' . ($ok ? '/danke.html' : '/?fehler=versand#kontakt'), true, 303);
exit;
