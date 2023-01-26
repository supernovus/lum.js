// Boring script is boring

globalThis.lt = 
{
  ace()
  {
    Lum.load.js('scripts/ace/src-min-noconflict/ace.js');
  },
}

// The rest use a common function style.
const loaders = 
{
  ext: 'scripts/ext/',
  lum: 'scripts/nano/',
  cjs: 'scripts/crypto/',
}

for (const lname in loaders)
{
  const ldir = loaders[lname];
  lt[lname] = function()
  {
    for (const lib of arguments)
    {
      Lum.load.js(ldir+lib+'.js');
    }
  }
}
