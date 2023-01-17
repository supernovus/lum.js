#!/usr/bin/env node
/** 
 * Custom setup script.
 * 
 * Currently just downloads any deps not in either npm or bower.
 * Requires Node v18 or higher for native `fetch()` API.
 */

const fs = require('node:fs');
const sources = require('./undeps.json');

for (const dest in sources)
{
  const src = sources[dest];
  const file = fs.createWriteStream(dest);
  fetch(src)
    .then((res) => res.text())
    .then((text) => {file.write(text); file.close();})
}
