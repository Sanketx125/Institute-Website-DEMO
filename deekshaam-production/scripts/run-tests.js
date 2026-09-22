const fs = require('fs');

const origSync = fs.realpathSync;
fs.realpathSync = function(p, opts) {
  if (typeof p === 'string' && (p === 'Z:\\' || p === 'Z:' || p === 'z:\\' || p === 'z:')) return p;
  try { return origSync(p, opts); } catch (e) { if (e && e.code === 'EPERM') return p; throw e; }
};
fs.realpathSync.native = fs.realpathSync;

require('../tests/run-integration.js');
