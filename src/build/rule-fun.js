// A few helper functions for the rules.js configuration file.
const core = require('@lumjs/core');
const {needObj,isObj,def} = core.types;

// Make a library def.
function lib(ld)
{
  if (!ld.$setup)
  { 
    if (!isObj(ld.deps)) ld.deps = {};

    def(ld, 'npm', (name, dd, wd) => npm(name, dd, ld, wd));
    def(ld, 'lum', (name, dd, wd) => lum(name, dd, ld, wd));

    def(ld, '$setup', true);
  }
  return ld;
}

// Make a dependency def.
function dep(dd, ld)
{
  if (!dd.$lib)
  {
    if (dd.package === undefined) 
      dd.package = true;

    def(dd, 'npm', (name, nd) => ld.npm(name, nd));
    def(dd, 'lum', (name, nd) => ld.lum(name, nd));

    def(dd, '$lib', ld);
  }
  return dd;
}

// A package in npm.
function npm(name, ddef={}, ldef={}, wantdep=false)
{
  lib(ldef);
  dep(ddef, ldef);
  ldef.deps[name] = ddef;
  return wantdep ? ddef : ldef;
}
exports.npm = npm;

// A single new @lumjs library replaced the old script library.
function lum(name, ...args)
{
  return npm('@lumjs/'+name, ...args);
}
exports.lum = lum;

// A jQuery plugin moved to the `@lumjs/jquery-plugins` package.
exports.jqplugin = function(name)
{
  const exps = {};
  exps['./plugin/'+name] = `./lib/plugin/${name}.js`;
  return lum('jquery-plugins', {package: false, exports: exps});
}

// An exported module moved to the @lumjs/compat[/v4] package.
exports.v4compat = function(name, anon)
{
  const exps = {};
  exps['./v4/'+name] = `./lib/v4/${name}.js`;
  return lum('compat', {package: false, exports: exps, anon});
}

// Build the package info for the global-object package.
exports.globalPackageInfo = function(bundled)
{
  const si = require('../../package.json');
  const pi = 
  {
    name: '@lumjs/global-object', 
    version: si.version,
    dependencies: {}
  };

  const pre = '@lumjs/';

  // A list of external packages we're bundling.
  for (const id of bundled)
  {
    const pkg = pre+id;
    pi.dependencies[pkg] = si.dependencies[pkg];
  }
  
  return pi;
}

function cryptoModule(deps, name, subns)
{
  const mod  = (name === '.' ? '' : './')+name;
  const path = (name === '.' ? './index.js' : `./${name}.js`);
  const ns = 'CryptoJS'+subns;
  const pkgName = 'crypto-js/'+name;
  deps[pkgName] = 
  {
    external: {ns, mod, path}
  }
}

exports.cryptoJS = function(deps, modList)
{
  needObj(deps, 'deps must be an object');
  needObj(modList, 'modList must be an object');

  for (const modName in modList)
  {
    const modProp = modList[modName];
    cryptoModule(deps, modName, modProp);
  }

  return deps;
}
