const fs = require('node:fs');
const Path = require('node:path');

const core = require('@lumjs/core');
const {S,N,B,needObj,needType,isObj,nonEmptyArray} = core.types;

const {loadFile} = require('./sources');
const Template = require('./template');

const {minify} = require('terser');

const ENC = 'utf8';

const MOD = 'module.js';
const SCR = 'script.js';
const JSN = 'json.js';
const EXT = 'external.js';
const AKA = 'alias.js';

const RESERVED = ['source', 'prepend', 'append', 'output'];

const LIBDIR = './node_modules/';
const PKGINFO = './package.json';

const NEED_O = ' must be an object';
const NEED_P = ' must be a path to a directory';

class Assembler
{
  constructor(conf)
  {
    needObj(conf, 'conf'+NEED_O);
    needObj(conf.scripts, 'conf.scripts'+NEED_O);
    needType(S, conf.scripts.source, 'conf.scripts.source'+NEED_P);
    needType(S, conf.scripts.output, 'conf.scripts.output'+NEED_P);

    this.conf = conf;
    this.scriptDir = conf.scripts.source;
    this.outDir = conf.scripts.output;
    this.prependAll = conf.scripts.prepend ?? [];
    this.appendAll = conf.scripts.append ?? [];
    
    this.tmpl = new Template(conf); // Top-level template.

    this.moduleCache = {};

    this.verbose = conf.verbose ?? 1;
  }

  /**
   * Get the actual text content of a script.
   * @param {*} file 
   * @returns {string}
   */
  loadScript(file)
  {
    const filename = Path.join(this.scriptDir, file);
    return loadFile(filename);
  }

  /**
   * Get the actual text content of a package module.
   * @param {string} pkg 
   * @param {string} path 
   * @returns {string}
   */
  loadModule(pkg, path, root=LIBDIR)
  {
    const filename = Path.join(root, pkg, path);
    return loadFile(filename);
  }

  /**
   * Given a definition object, get the text associated with it.
   * @param {object} def 
   * @returns {string}
   */
  loadContent(def)
  {
    needObj(def, 'load def must be an object');

    if (this.verbose > 2)
    {
      const info = {adding: def};
      console.log(info);
    }

    if ('file' in def)
    {
      return loadFile(def.file);
    }
    if ('tmpl' in def)
    {
      return this.tmpl.parseFile(def.tmpl);
    }
    if ('pkg' in def && 'path' in def)
    {
      return this.loadModule(def.pkg, def.path, def.root);
    }
    if ('script' in def)
    {
      return this.loadScript(def.script);
    }

    throw new Error("Could not determine item type");
  }

  /**
   * Get the package information.
   * @param {string} pkg 
   * @param {object} [opts]
   * @returns {object}
   */
  getPackageInfo(pkg, opts={})
  {
    const text = this.loadModule(pkg, PKGINFO, opts.root);
    if (text)
      return JSON.parse(text);
    else
      throw new Error("Could not load package.json for "+pkg);
  }

  getExports(info, opts={})
  {
    if (typeof info === S)
    { // Assume the package name was specified.
      info = this.getPackageInfo(info, opts);
    }
    
    if (!isObj(info))
    {
      throw new Error("Invalid package info");
    }

    let exps;
    if (isObj(info.exports))
    {
      exps = info.exports;
    }
    else if (typeof info.exports === S)
    {
      exps = {'.': info.exports};
    }
    else if (typeof info.main === S)
    {
      let main = info.main;
      if (!main.startsWith('./'))
      {
        main = './'+main;
      }
      exps = {'.': main};
    }
    else 
    {
      exps = {'.': './index.js'};
    }

    return exps;
  }

  buildPackageJson(pkg, info, opts={})
  {
    needType(S, pkg, 'package name must be a string');
    
    if (!isObj(info))
    {
      info = this.getPackageInfo(pkg, opts);
    }

    const safeFields = 
    [ // An minimal set of fields to copy.
      'name', 'version', 'dependencies',
    ];

    const pi = {};
    for (const field of safeFields)
    {
      pi[field] = info[field];
    }

    const text = JSON.stringify(pi);

    return this.tmpl.getTemplate(JSN, {pkg, mod: PKGINFO, path: PKGINFO, text});
  }

  /**
   * Get a wrapped script.
   * @param {string} file 
   * @returns {string}
   */
  getScript(file)
  {
    const text = this.loadScript(file);
    return this.tmpl.getTemplate(SCR, {file, text});
  }

  /**
   * Get a wrapped module from a package.
   * @param {string} pkg
   * @param {?string} mod 
   * @param {string} path
   * @param {?string} [srcPkg=pkg]
   * @param {?string} [root]
   * @returns {string}
   */
  getModule(pkg, mod, path, srcPkg=pkg, root)
  {
    const hasPath = (typeof path === S);

    if (hasPath && this.moduleCache[`${pkg}::${path}`])
    { // We've seen this path already.
      return this.tmpl.getTemplate(AKA, {pkg, mod, path});
    }

    if (hasPath)
    {
      this.moduleCache[`${pkg}::${path}`] = (mod ?? '.');
    }

    const text = this.loadModule(srcPkg, path, root);
    return this.tmpl.getTemplate(MOD, {pkg, mod, path, text});
  }

  /**
   * Build a dependency package, with all necessary modules included.
   * @param {string} pkg 
   * @param {object} def
   * @returns {string} 
   */
  buildPackage(pkg, def)
  {
    if (isObj(def.external))
    { // External libraries use a different template.
      const extDef = def.external;
      needType(S, extDef.ns, 'external.ns must be a string');
      const extScope =
      {
        pkg,
        ns:   extDef.ns,
        mod:  extDef.mod  ?? '.',
        path: extDef.path ?? null,
      }
      return this.tmpl.getTemplate(EXT, extScope);
    }

    const self = this;
    let out = '';

    let pkgExports = false, pkgJson = true, pkgInfo;

    if (isObj(def.package))
    { // A way to set individual setttings.
      pkgExports = def.package.exports ?? false;
      pkgJson    = def.package.json    ?? true;
      pkgInfo    = def.package.info;
    }
    else if (typeof def.package === B)
    { // A way to set both settings at once.
      pkgExports = pkgJson = def.package;
    }

    const srcPkg = def.use ?? pkg;

    function addExports(exps)
    {
      for (const mod in exps)
      {
        if (mod === PKGINFO) continue; // Skip package.json
        const path = exps[mod];
        if (mod.includes('*') || path.includes('*'))
        {
          console.warn("Cannot compile wildcard exports yet", mod, path, pkg, def);
          continue;
        }
        out += self.getModule(pkg, mod, path, srcPkg, def.root);
      }
    }

    if (this.verbose > 1)
    {
      const info = {bundling: srcPkg};
      if (srcPkg !== pkg) info.as = pkg;
      if (this.verbose > 2) info.def = def;
      console.log(info);
    }

    if (isObj(def.exports))
    { // Explicit exports.
      addExports(def.exports);
    }

    if (pkgExports || pkgJson)
    { // Something requiring the package.json is being used.
      const info = pkgInfo ?? this.getPackageInfo(srcPkg, def);

      if (pkgExports)
      { // We're going to get a list of exports from the 'package.json'.
        const exps = this.getExports(info, def);
        if (isObj(exps))
        {
          addExports(exps);
        }
      }

      if (pkgJson)
      { // Include a super-minimalist version of the package.json
        out += this.buildPackageJson(pkg, info, def);
      }
    }

    if (nonEmptyArray(def.anon))
    { // Non-exported (package-local) modules.
      for (const path of def.anon)
      {
        out += this.getModule(pkg, null, path, srcPkg, def.root);
      }
    }

    return out;
  }

  /**
   * Build an individual script and any dependencies.
   * @param {string} name
   * @param {object} def 
   * @returns {string}
   */
  buildScript(name, def)
  {
    const self = this;
    let out = '';

    function addContent(aList)
    { // Look for a list of content items to add.
      if (nonEmptyArray(aList))
      {
        for (const anItem of aList)
        {
          out += self.loadContent(anItem);
        }
      }
    }

    addContent(this.prependAll);
    addContent(def.prepend);

    if (isObj(def.deps))
    { // Dependencies are next.
      for (const pkgName in def.deps)
      {
        const pkgDef = def.deps[pkgName];
        out += this.buildPackage(pkgName, pkgDef);
      }
    }

    // The script itself, kinda important, right?
    out += this.getScript(name);

    addContent(def.append);
    addContent(this.appendAll);

    // And that should be everything.

    return out;
  }

  async compile(opts)
  {
    let minOpts = null;
    if (isObj(opts))
    {
      if (typeof opts.verbose === N)
        this.verbose = opts.verbose;
      if (isObj(opts.minify))
        minOpts = opts.minify;
    }
    for (const name in this.conf.scripts)
    {
      if (RESERVED.includes(name)) continue;
      const def = this.conf.scripts[name];
      if (this.verbose > 0)
      {
        const info = {compiling: name};
        if (this.verbose > 2) info.def = def;
        console.log(info);
      }

      const outfile = Path.join(this.outDir, name);
      const outdir = Path.dirname(outfile);
      if (!fs.existsSync(outdir))
        fs.mkdirSync(outdir, {recursive: true});

      let content = this.buildScript(name, def);

      if (isObj(minOpts))
      {
        const minified = await minify(content, minOpts);
        if (minified && minified.code)
        { // Use the minified version.
          content = minified.code;
        }
      }

      fs.writeFileSync(outfile, content, ENC);
      
      if (this.verbose > 0)
      {
        const info = {wrote: outfile};
        if (this.verbose > 3) info.content = content;
        console.log(info);
      }
    }
  }

}

// Export the class.
module.exports = Assembler;
