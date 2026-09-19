from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import os

ROOT = Path(__file__).resolve().parent

class SPAHandler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        translated = super().translate_path(path)
        return translated

    def do_GET(self):
        requested = self.path.split('?', 1)[0]
        candidate = ROOT / requested.lstrip('/')
        if requested != '/' and not candidate.exists() and '.' not in candidate.name:
            self.path = '/index.html'
        return super().do_GET()

if __name__ == '__main__':
    host = os.environ.get('HOST', '127.0.0.1')
    port = int(os.environ.get('PORT', '3000'))
    try:
        server = ThreadingHTTPServer((host, port), SPAHandler)
    except PermissionError:
        # Fallback to alternative port if 3000 is unavailable
        port = 5000
        server = ThreadingHTTPServer((host, port), SPAHandler)
    print(f'Deekshaam site running at http://localhost:{port}')
    server.serve_forever()
