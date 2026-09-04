#!/usr/bin/env python3
"""Upload von dist/ per FTPS auf den All-Inkl-Webspace.

Zugangsdaten kommen aus .ftp-allinkl.env im Projektordner (nicht versioniert):
    FTP_HOST=w01ae49d.kasserver.com
    FTP_USER=w01ae49d
    FTP_PASS=…
    FTP_DIR=/            # Dokumentenwurzel der Domain laut KAS

Aufrufe:
    python3 _tools/deploy-allinkl.py --list          # nur verbinden und Zielordner anzeigen
    python3 _tools/deploy-allinkl.py --dry-run       # zeigt, was hochgeladen wuerde
    python3 _tools/deploy-allinkl.py                 # laedt dist/ hoch (ueberschreibt gleichnamige Dateien)

Es wird nichts auf dem Server geloescht. Alte Dateien der Baustellenseite
bleiben liegen, bis sie von Hand entfernt werden (--list zeigt sie)."""
import os, sys, ssl, ftplib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / 'dist'
ENV = ROOT / '.ftp-allinkl.env'

def load_env():
    cfg = {}
    if ENV.exists():
        for line in ENV.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, v = line.split('=', 1); cfg[k.strip()] = v.strip().strip('"').strip("'")
    for k in ('FTP_HOST', 'FTP_USER', 'FTP_PASS', 'FTP_DIR'):
        cfg.setdefault(k, os.environ.get(k, ''))
    cfg['FTP_DIR'] = cfg['FTP_DIR'] or '/'
    missing = [k for k in ('FTP_HOST', 'FTP_USER', 'FTP_PASS') if not cfg[k]]
    if missing:
        sys.exit(f'Fehlt in {ENV.name} oder Umgebung: {", ".join(missing)}')
    return cfg

def connect(cfg):
    ctx = ssl.create_default_context()
    ftp = ftplib.FTP_TLS(context=ctx, timeout=60)
    ftp.connect(cfg['FTP_HOST'], 21)
    ftp.login(cfg['FTP_USER'], cfg['FTP_PASS'])
    ftp.prot_p()          # Datenverbindung ebenfalls verschluesselt
    ftp.encoding = 'utf-8'
    ftp.cwd(cfg['FTP_DIR'])
    return ftp

def remote_listing(ftp, path='.'):
    out = []
    try:
        for name, facts in ftp.mlsd(path):
            if name in ('.', '..'): continue
            out.append((name, facts.get('type', '?'), facts.get('size', '')))
    except ftplib.error_perm:
        ftp.retrlines(f'LIST {path}', lambda l: out.append((l, '', '')))
    return out

def ensure_dir(ftp, rel, made):
    if rel in ('', '.') or rel in made: return
    parent = str(Path(rel).parent)
    ensure_dir(ftp, parent, made)
    try: ftp.mkd(rel)
    except ftplib.error_perm: pass   # existiert schon
    made.add(rel)

def main():
    args = set(sys.argv[1:])
    cfg = load_env()
    if not DIST.exists() and '--list' not in args:
        sys.exit('dist/ fehlt — zuerst: node _tools/build.mjs')
    ftp = connect(cfg)
    print(f'Verbunden mit {cfg["FTP_HOST"]}, Zielordner {ftp.pwd()}')
    if '--list' in args:
        for name, typ, size in sorted(remote_listing(ftp)):
            print(f'  {typ:5} {size:>10}  {name}')
        ftp.quit(); return
    files = sorted(p for p in DIST.rglob('*') if p.is_file() and p.name != '.DS_Store')
    total = sum(p.stat().st_size for p in files)
    print(f'{len(files)} Dateien, {total/1e6:.1f} MB' + (' (Trockenlauf)' if '--dry-run' in args else ''))
    made = set()
    for i, p in enumerate(files, 1):
        rel = p.relative_to(DIST).as_posix()
        print(f'  [{i:3}/{len(files)}] {rel}  ({p.stat().st_size/1e3:.0f} kB)')
        if '--dry-run' in args: continue
        ensure_dir(ftp, str(Path(rel).parent), made)
        with p.open('rb') as fh:
            ftp.storbinary(f'STOR {rel}', fh)
    ftp.quit()
    print('Fertig.' if '--dry-run' not in args else 'Trockenlauf beendet — nichts hochgeladen.')

if __name__ == '__main__':
    main()
