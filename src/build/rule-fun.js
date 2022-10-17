// A few helper functions for the rules.js configuration file.
const core = require('@lumjs/core');
const {needObj} = core.types;

// A package in npm.
function npm(name, opts={})
{
  const libdef = {deps: (opts.deps ?? {})};
  const depdef = {package: (opts.package ?? true)};
  if ('exports' in opts) depdef.exports = opts.exports;
  if ('anon' in opts) depdef.anon = opts.anon;
  libdef.deps[name] = depdef;
  return libdef;
}
exports.npm = npm;

// A single new @lumjs library replaced the old script library.
function lum(name, opts={})
{
  return npm('@lumjs/'+name, opts);
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
