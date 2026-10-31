"""Persona pass server: the real site, with every write faked.

    python scripts/qa/persona-server.py [port]     (default 8792)

Serves the repo root like GitHub Pages and injects /__qa/fake.js as the first
script of every page. That wraps window.fetch before supabase-js loads:
  - reads (GET, public_site_* and drop_in_order_public RPCs) go to live Supabase
  - inserts into audition_registrations / website_contacts / email_signups /
    site_analytics come back 201 without leaving the browser
  - the drop-in-checkout call never reaches Stripe: it returns /__qa/stripe,
    a stand-in page showing exactly what would have been sent
  - any other write is refused (403)
Every faked or refused write prints here as QA-WRITE / QA-REFUSED, so a run's
log is the proof nothing went out.

/__qa/slow/on and /__qa/slow/off toggle a slow phone (about Fast 3G: 560 ms per
request, 180 KB/s, Supabase reads held 1.8 s). Nothing is cached, so every
persona arrives as a first-time visitor. sw.js is a no-op here.
"""
import gzip
import http.server
import json
import os
import sys
import time

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8792
LATENCY = 0.56
BYTES_PER_SEC = 180 * 1024
TEXT_TYPES = {'.css': 'text/css', '.js': 'application/javascript', '.json': 'application/json',
              '.svg': 'image/svg+xml', '.txt': 'text/plain', '.xml': 'application/xml'}

FAKE_JS = r"""(function () {
  var SB = 'ipulrvhiuvgbvralybxx.supabase.co';
  var READ_RPC = /^\/rest\/v1\/rpc\/(public_site_[a-z0-9_]+|drop_in_order_public)$/;
  var FAKE_TABLE = /^\/rest\/v1\/(audition_registrations|website_contacts|email_signups|site_analytics)$/;
  var slow = document.cookie.indexOf('qa_slow=1') !== -1;
  var qa = window.__qa = { slow: slow, reads: 0, writes: [], refused: [] };
  var real = window.fetch.bind(window);
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function header(init, name) {
    var h = init && init.headers;
    if (!h) return '';
    if (typeof h.get === 'function') return h.get(name) || '';
    for (var k in h) if (k.toLowerCase() === name.toLowerCase()) return h[k];
    return '';
  }
  function record(kind, entry) {
    qa[kind].push(entry);
    try { navigator.sendBeacon('/__qa/record', JSON.stringify({ kind: kind, page: location.pathname + location.search, entry: entry })); } catch (e) {}
  }
  window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : (input && input.url) || String(input);
    var method = String((init && init.method) || (input && input.method) || 'GET').toUpperCase();
    if (url.indexOf(SB) === -1) return real(input, init);
    var path = url.split(SB)[1].split('?')[0];
    var hold = slow ? 1800 : 0;
    if (method === 'GET' || method === 'HEAD' || READ_RPC.test(path)) {
      qa.reads++;
      return wait(hold).then(function () { return real(input, init); });
    }
    var body = init && init.body, parsed;
    try { parsed = JSON.parse(body); } catch (e) { parsed = body; }
    var entry = { at: new Date().toISOString(), method: method, path: path, body: parsed };
    if (FAKE_TABLE.test(path)) {
      if (!/site_analytics$/.test(path)) record('writes', entry);
      return wait(hold + 600).then(function () {
        if (/return=representation/.test(header(init, 'Prefer'))) {
          return new Response(JSON.stringify([Object.assign({ id: 'qa-fake' }, parsed)]), { status: 201, headers: { 'Content-Type': 'application/json' } });
        }
        return new Response(null, { status: 201 });
      });
    }
    if (path === '/functions/v1/drop-in-checkout') {
      record('writes', entry);
      try { sessionStorage.setItem('qa_checkout', JSON.stringify(parsed)); } catch (e) {}
      return wait(hold + 1500).then(function () {
        return new Response(JSON.stringify({ url: location.origin + '/__qa/stripe' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      });
    }
    record('refused', entry);
    return Promise.resolve(new Response(JSON.stringify({ message: 'QA: write refused' }), { status: 403, headers: { 'Content-Type': 'application/json' } }));
  };
})();
"""

STRIPE_HTML = """<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>QA stand-in for Stripe</title>
<style>body{font:16px/1.5 system-ui,sans-serif;margin:0;padding:24px 16px;background:#f6f9fc;color:#1a1f36}
h1{font-size:20px}pre{white-space:pre-wrap;background:#fff;border:1px solid #e3e8ee;border-radius:8px;padding:12px;font-size:13px}
a{display:inline-block;margin-top:16px;color:#635bff}</style></head><body>
<h1>QA stand-in: Stripe Checkout would open here</h1>
<p>The persona server faked the drop-in-checkout call, so no order and no Stripe session exist. This is what the site sent:</p>
<pre id="b">(nothing recorded)</pre>
<a href="/schedule/?cancelled=1">Back to the site the way Stripe's back arrow returns (cancelled=1)</a>
<script>try{var b=sessionStorage.getItem('qa_checkout');if(b)document.getElementById('b').textContent=JSON.stringify(JSON.parse(b),null,2);}catch(e){}</script>
</body></html>"""

NOOP_SW = "self.addEventListener('install', function () { self.skipWaiting(); });\n"


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def slow(self):
        return 'qa_slow=1' in (self.headers.get('Cookie') or '')

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def send_text(self, code, body, ctype, extra=None):
        data = body.encode('utf-8') if isinstance(body, str) else body
        self.send_response(code)
        self.send_header('Content-Type', ctype)
        # GitHub Pages gzips text; without this the slow phone pays 6x for the CSS.
        if 'gzip' in (self.headers.get('Accept-Encoding') or ''):
            data = gzip.compress(data, 6)
            self.send_header('Content-Encoding', 'gzip')
        self.send_header('Content-Length', str(len(data)))
        for k, v in (extra or {}).items():
            self.send_header(k, v)
        self.end_headers()
        self.write_paced(data)

    def write_paced(self, data):
        if not self.slow():
            self.wfile.write(data)
            return
        step = 16 * 1024
        for i in range(0, len(data), step):
            self.wfile.write(data[i:i + step])
            self.wfile.flush()
            time.sleep(step / BYTES_PER_SEC)

    def copyfile(self, source, outputfile):
        self.write_paced(source.read())

    def do_POST(self):
        if self.path == '/__qa/record':
            n = int(self.headers.get('Content-Length') or 0)
            try:
                rec = json.loads(self.rfile.read(n) or b'{}')
                tag = 'QA-WRITE' if rec.get('kind') == 'writes' else 'QA-REFUSED'
                e = rec.get('entry') or {}
                print('%s %s %s from %s %s' % (tag, e.get('method'), e.get('path'), rec.get('page'),
                                               json.dumps(e.get('body'))[:600]), flush=True)
            except Exception as exc:
                print('QA-RECORD unreadable: %s' % exc, flush=True)
            self.send_response(204)
            self.end_headers()
            return
        self.send_error(405)

    def do_GET(self):
        if self.slow():
            time.sleep(LATENCY)
        path = self.path.split('?')[0]
        if path == '/__qa/fake.js':
            return self.send_text(200, FAKE_JS, 'application/javascript')
        if path == '/__qa/stripe':
            return self.send_text(200, STRIPE_HTML, 'text/html; charset=utf-8')
        if path in ('/__qa/slow/on', '/__qa/slow/off'):
            on = path.endswith('/on')
            self.send_response(302)
            self.send_header('Set-Cookie', 'qa_slow=%s; Path=/' % ('1' if on else '0'))
            self.send_header('Location', '/')
            self.end_headers()
            print('QA slow phone %s' % ('ON' if on else 'OFF'), flush=True)
            return
        if path == '/sw.js':
            return self.send_text(200, NOOP_SW, 'application/javascript')

        fs = self.translate_path(path)
        if os.path.isdir(fs):
            if not path.endswith('/'):
                self.send_response(301)
                self.send_header('Location', path + '/' + (('?' + self.path.split('?', 1)[1]) if '?' in self.path else ''))
                self.end_headers()
                return
            fs = os.path.join(fs, 'index.html')
        code = 200
        if not os.path.exists(fs):
            fs, code = os.path.join(ROOT, '404.html'), 404
        if fs.endswith('.html'):
            with open(fs, encoding='utf-8') as f:
                html = f.read()
            i = html.lower().find('<head>')
            if i != -1:
                html = html[:i + 6] + '<script src="/__qa/fake.js"></script>' + html[i + 6:]
            return self.send_text(code, html, 'text/html; charset=utf-8')
        ext = os.path.splitext(fs)[1].lower()
        if ext in TEXT_TYPES:
            with open(fs, 'rb') as f:
                return self.send_text(code, f.read(), TEXT_TYPES[ext])
        return super().do_GET()

    def log_message(self, fmt, *args):
        if args and str(args[1]) not in ('200', '204', '304'):
            sys.stderr.write('%s\n' % (fmt % args))


if __name__ == '__main__':
    print('persona server on http://localhost:%d (writes faked; /__qa/slow/on for the slow phone)' % PORT, flush=True)
    http.server.ThreadingHTTPServer(('127.0.0.1', PORT), Handler).serve_forever()
