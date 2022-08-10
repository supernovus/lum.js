const fs = require('fs');
const path = require('path');

const ENC = 'utf8';

// A global static registry of templates for re-use.
const fileCache = {};

// Load the file and cache it.
function loadFile(filename)
{
  if (filename in fileCache) return fileCache[filename];

  const tmpl = fs.readFileSync(filename, ENC);
  fileCache[filename] = tmpl;
  return tmpl;
}

module.exports = {fileCache, loadFile};
