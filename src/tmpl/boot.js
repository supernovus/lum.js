(function()
{ // Bootstrap for the Lum.js v5 environment. 
  'use strict';

theTemplate.getTemplate('lib.js');
theTemplate.getTemplate('df.js');

  const E_NO_MODULE = 'Invalid module specified: ';
  class ModuleError extends Error 
  {
    constructor(modname)
    {
      super(E_NO_MODULE+modname);
    }
  }

  const D = '.';
  const P = '/';

  const JS = '.js';
  const EJS = '.ejs';
  const CJS = '.cjs';
  const IND = 'index';

  // A map of libraries defined in this collection.
  const libs = {};

  // Our global object.
  const Env = {};

  const RE_BACK = /\.\.\//g;
  const RE_HERE = /^\.\//; 

  // Build a new library wrapper object.
  df(Env, 'define', function(pkg, mod, path)
  {
    //console.debug('define()', {pkg, mod, path});
    if (typeof mod === S && libs[pkg] && libs[pkg].mods[mod])
    { // Cannot overwrite existing modules.
      throw new Error(`Cannot overwrite existing module ${pkg}:${mod}`);
    }

    if (typeof path === S && libs[pkg] && libs[pkg].paths[path])
    { // There's already a module for this path.
      //console.debug("existing module with the same path found");
      if (typeof mod === S)
      { // There's a module name, and its not registered yet.
        return libs[pkg].mods[mod] = libs[pkg].paths[path];
      }
      else
      { // We're not going to add a duplicate.
        throw new Error(`Cannot overwrite existing module ${pkg}::${path}`);
      }
    }

    //console.debug("Registering new Lib");
    const lib = new Lib(Env, pkg, mod, path);
    if (libs[pkg] === undefined)
      libs[pkg] = {mods:{}, paths:{}};
    if (typeof mod === S)
      libs[pkg].mods[mod] = lib;
    if (typeof path === S)
      libs[pkg].paths[path] = lib;
    return lib;
  });

  // Get a library wrapper object.
  df(Env, 'get', function (pkgname, lib)
  {
    if (typeof pkgname !== S)
      throw new TypeError("require package name must be a string");

    const dbg = {arguments};

    if (pkgname[0] === D && typeof lib === O)
    { // A sub-module of the current library, uses paths as identifiers.
      const pkg = lib.pkg;
      const libPaths = lib.path.split(P);
      dbg.libPaths = libPaths.slice(); // Shallow copy of the original.
      libPaths.pop(); // The very last path entry should always be the filename.

      // Parse '../' portions of the path.
      let path = pkgname.replaceAll(RE_BACK, function()
      {
        libPaths.pop();
        return '';
      });

      // Add our path, stripping any './' from it first.
      libPaths.push(path.replace(RE_HERE, ''));

      // Okay, now build the path name.
      path = libPaths.join(P);

      const isModule = () => (typeof libs[pkg] === O 
        && typeof libs[pkg].paths[path] === O);
      const getModule = () => libs[pkg].paths[path];

      // Now try to find the path as specified.
      if (isModule())
      { // Yay, we found it.
        return getModule();
      }

      // Add some extra debugging info.
      dbg.pkg  = pkg;
      dbg.paths = [path];

      // Let's try a few additions to the path name.
      const basePath = path;
      const pathExts = 
      [
        JS,
        P+IND+JS,
        EJS,
        P+IND+EJS,
        CJS,
        P+IND+CJS,
      ];
      for (const ext of pathExts)
      {
        path = basePath + ext;
        if (isModule())
        {
          return getModule();
        }
        dbg.paths.push(path);
      }
    }
    else
    { // A package name spec, uses exported module names as identifiers.
      // First we're going to try for the "main" module.
      let mod = D;
      let pkg = pkgname;

      const isModule = () => (typeof libs[pkg] === O 
        && typeof libs[pkg].mods[mod] === O);
      const getModule = () => libs[pkg].mods[mod];

      if (isModule())
      { // Found it.
        return getModule();
      }

      dbg.pkgs = [];
      dbg.mods = [];

      const modPaths = [D];
      const pkgPaths = pkgname.split(P);

      while (pkgPaths.length > 0)
      {
        modPaths.splice(1, 0, pkgPaths.pop())
        mod = modPaths.join(P);
        pkg = pkgPaths.join(P);
        if (isModule())
        { // Found a sub-module.
          return getModule();
        }
        dbg.mods.push(mod);
        dbg.pkgs.push(pkg);
      }
    }

    // If we reached here, no module was found.
    console.debug(dbg);
    throw new ModuleError(pkgname);
  });

  // A minimalistic version of require() with no parent package scope.
  df(Env, 'require', function(id)
  {
    const clib = Env.get(id);
    return clib.load();
  });

  // Export to the root namespace.
  df(globalThis, theTemplate.getConf('global'), Env);

})();
