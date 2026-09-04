#!/usr/bin/env python3
"""Entwicklungsserver ohne Caching — sonst zeigt der Browser alte Staende.
Beherrscht Range-Requests, sonst laesst sich in Videos nicht springen
(die Produktclips werden per Scroll durchgescrubbt)."""
import http.server, socketserver, sys, os, re, socket

class Dev(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        self.send_header("Accept-Ranges", "bytes")
        super().end_headers()

    def log_message(self, *a): pass

    def send_head(self):
        rng = self.headers.get("Range")
        if not rng:
            return super().send_head()
        path = self.translate_path(self.path)
        if os.path.isdir(path):
            return super().send_head()
        m = re.match(r"bytes=(\d*)-(\d*)$", rng.strip())
        if not m:
            return super().send_head()
        try:
            f = open(path, "rb")
        except OSError:
            self.send_error(404, "File not found")
            return None
        size = os.fstat(f.fileno()).st_size
        first, last = m.group(1), m.group(2)
        if first == "":                       # Suffix-Range: letzte N Bytes
            length = min(int(last or 0), size)
            start = size - length
            end = size - 1
        else:
            start = int(first)
            end = int(last) if last else size - 1
            end = min(end, size - 1)
        if start >= size or start > end:
            f.close()
            self.send_response(416)
            self.send_header("Content-Range", f"bytes */{size}")
            self.end_headers()
            return None
        self.send_response(206)
        self.send_header("Content-Type", self.guess_type(path))
        self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.send_header("Content-Length", str(end - start + 1))
        self.end_headers()
        f.seek(start)
        return _Slice(f, end - start + 1)

class _Slice:
    """Liefert nur den angeforderten Ausschnitt an copyfile()."""
    def __init__(self, f, length): self.f, self.left = f, length
    def read(self, n=-1):
        if self.left <= 0: return b""
        if n is None or n < 0: n = self.left
        data = self.f.read(min(n, self.left))
        self.left -= len(data)
        return data
    def close(self): self.f.close()

port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080

class Dual(socketserver.ThreadingTCPServer):
    """IPv4 UND IPv6 auf einem Socket — iPhone-Hotspots sind oft IPv6-only."""
    address_family = socket.AF_INET6
    allow_reuse_address = True
    def server_bind(self):
        self.socket.setsockopt(socket.IPPROTO_IPV6, socket.IPV6_V6ONLY, 0)
        super().server_bind()

with Dual(("::", port), Dev) as s:
    print(f"laeuft auf http://localhost:{port}  (no-cache, Range, IPv4+IPv6)")
    s.serve_forever()
