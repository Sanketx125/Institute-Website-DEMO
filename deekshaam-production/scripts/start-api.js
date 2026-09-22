const fs = require('fs');

// Monkeypatch fs.realpathSync for Windows sandbox drive mapping
const origSync = fs.realpathSync;
fs.realpathSync = function(p, opts) {
  if (typeof p === 'string' && (p === 'Z:\\' || p === 'Z:' || p === 'z:\\' || p === 'z:')) return p;
  try { return origSync(p, opts); } catch (e) { if (e && e.code === 'EPERM') return p; throw e; }
};
fs.realpathSync.native = fs.realpathSync;

const server = require('../apps/api/dist/apps/api/src/server.js');
if (server.bootstrap) {
  server.bootstrap();
}
