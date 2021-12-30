#!/usr/bin/env node

// TODO: More refactoring and cleanup for upcoming v5 release which will
// likely be the final version of the Lum.js library collection as I'm 
// planning to move to using separate modules for the individual libraries.

// If possible, replace this script with a set of gulp plugins and hooks in
// the gulpfile.js as I'd originally planned (but at the time could not
// figure out how to get http requests working from within gulp or grunt.)

const VERSION = '4';

const VERBOSE_OPTION =
{
  alias: 'v',
  describe: 'Enable more verbose output.',
  type: 'boolean',
  default: false,
}

const TAG_META   = "@metadata";    // Suite metadata tag.
const TAG_PARENT = "@parent";      // Dependency parent tag.

const {minify} = require('terser');
const http = require('http-request');
const fs = require('fs');
const path = require('path');
const compareVer = require('compare-versions');

const scriptroot = 'scripts/';
const jsroot = scriptroot+'ext/';

const styleroot = 'style/';
const cssroot = styleroot+'ext/';

// The 'version' property can be in three forms:
//  1. A string. In which case it's considered the version.
//  2. An object with a 'json' property. 
//     This should be a URL to a package.json file containing a 'version'.
//  3. An object with 'regex' and 'match' properties.
//     The regex searches through the source file, and the match will be
//     the version if found.
//
// We'll record the versions in conf/installed_deps.json which will be in
// the .gitignore file.

const PC = './';
const PP = '../';

// Look for an include file, and try to load it with require().
function try_include (file, defval)
{
  if (typeof file === 'string')
  {
    try
    {
      let stat = fs.lstatSync(PC+file);
      if (stat.isFile())
      {
        return require(PP+file);
      }
    }
    catch (e) {}
  }
  else if (typeof file === 'object' && Array.isArray(file))
  { // Try multiple files, the first one to be found and load, wins.
    for (let f of file)
    {
      let val = try_include(f, defval);
      if (val !== defval)
      { // Found something valid.
        return val;
      }
    }
  }

  return defval;
}

const installed_conf = 'conf/installed_deps.json';
const installed = try_include(installed_conf, {});

const lum_core_files =
[
  'scripts/nano/core.js',
  'src/js/core.js',
];

const Lum = try_include(lum_core_files);

if (Lum === undefined)
{ // That's unfortunate.
  throw new Error("Could not load Lum core library");
}

const sourceCache = {};      // Cache of sources from each suite.

require('yargs')
  .version(VERSION)
  .command('install [singledep]', 'Install dependencies', (yargs) =>
  {
    const opts = yargs
      .positional('singledep',
      {
        describe: 'Install only the specified dependency.',
        type: 'string'
      })
      .option('suite',
      {
        alias: 's',
        describe: 'Suite of deps to install from.',
        type: 'string',
        default: 'main',
      })
      .option('all',
      {
        alias: 'A',
        describe: 'Install from all registered suites.',
        type: 'boolean',
        default: false,
      })
      .option('force',
      {
        alias: 'f',
        describe: 'Install even if already downloaded.',
        type: 'boolean',
        default: false,
      })
      .option('verbose', VERBOSE_OPTION);
    return opts;
  },
  (argv) =>
  {
    const suite = argv.all ? 'all' : argv.suite;
    const sources = get_sources(suite);
    if (argv.singledep)
    {
      const depname = argv.singledep;
      if (depname in sources)
      {
        download_dep(depname, sources, argv);
      }
      else
      {
        console.log("No such dependency", depname);
      }
    }
    else
    {
      download_deps(sources, argv);
    }
  })
  .command('upgrade [singledep]', 'Upgrade dependencies', (yargs) =>
  {
    const opts = yargs
      .positional('singledep', 
      {
        describe: 'Upgrade only the specified dependency.',
        type: 'string',
      })
      .option('verbose', VERBOSE_OPTION);
    return opts;
  },
  (argv) =>
  {
    if (Object.keys(installed).length === 0)
    {
      console.log("No packages installed, nothing to upgrade.");
    }
    else
    {
      if (argv.singledep)
      {
        const depname = argv.singledep;
        if (depname in installed)
        {
          upgrade_dep(depname, argv);
        }
        else
        {
          console.log("No installed dependency found", depname);
        }
      }
      else
      {
        upgrade_deps(argv);
      }
    }
  })
  .demandCommand()
  .help()
  .argv;

function setup_source (dep)
{
  //let ap = Lum.prop(dep);
  // Eventually do something here.
  return dep;
}

function get_sources (suite)
{
  if (sourceCache[suite] === undefined)
  {
    sourceCache[suite] = require(`../conf/sources/${suite}.json`);

    let includes = null; // If @metadata.include is set, it'll go here.

    for (const depname in sourceCache[suite])
    {
      const dep = sourceCache[suite][depname];

      if (depname === TAG_META)
      { // Metadata is handled separately.
        if (typeof dep.includes === 'object')
        { // It should be an array of suites to include.
          includes = dep.includes;
        }
        // Nothing else is used in the metadata.
        continue;
      } // if dep == @metadata

      // We're going to add 'name' and 'suite' properties for later reference.
      dep.name  = depname;
      dep.suite = suite;

      // Add any extra methods.
      setup_source(dep);

      if (typeof dep[TAG_PARENT] !== 'string')
      { // This dependency has a parent, expand the parent.
        const parentName = dep[TAG_PARENT];
        if (typeof sourceCache[suite][parentName] === 'object')
        {
          const parentDep = sourceCache[suite][parentName];
          dep[TAG_PARENT] = parentDep; // Replace the name with the object.
          for (const prop in parentDep)
          { // Copy non-existent properties from the parent.
            if (dep[prop] === undefined)
            {
              dep[prop] = parentDep[prop];
            }
          }
        } // if parent found
      } // if dep.@parent

    } // for dep in deps

    if (typeof includes === 'object' && includes !== null)
    { // Includes were found in the metadata, let's include them.
      for (const i in includes)
      {
        let sources = get_sources(includes[i]);
        for (const depname in sources)
        {
          if (sourceCache[suite][depname] === undefined)
          { // That dep is not already in the sources, add it now.
            sourceCache[suite][depname] = sources[depname];
          }
        }
      }
    }

  } // if sourceCache is undefined

  return sourceCache[suite];
}

function mkdir (path)
{
  try
  {
    fs.mkdirSync(path);
  }
  catch (e) {
    if (e.code != 'EEXIST') throw e;
  }
}

function save_installed ()
{
  var json = JSON.stringify(installed);
  fs.writeFileSync(installed_conf, json, 'utf8');
}

function try_save (processing)
{
  if (processing.count === 0)
  {
    save_installed();
  }
}

function make_json_ver_handler (src, finfo, processing, argv)
{
  return function (err, res)
  {
    var string = res.buffer.toString();
    var json = JSON.parse(string);
    if (json !== undefined && json.version !== undefined)
    {
      finfo.version = src.$ver = json.version;
      if (src[TAG_PARENT] && !src[TAG_PARENT].$ver)
      {
        src[TAG_PARENT].$ver = json.version;
      }
    }
    processing.count--;
    try_save(processing);
  }
}

function download_json_ver (jsonUrl, handler, argv)
{
  var getOpts =
  {
    url: jsonUrl,
  };
  if (argv.verbose)
  {
    getOpts.progress = function (current, total)
    {
      console.log(' Downloaded %d bytes of %d of a version file', current, total);
    }
  }
  http.get(getOpts, handler);
}

function make_handler (source, dest, finfo, processing, argv)
{
  return function (err, res)
  {
    console.log("Downloaded", dest, err);
    if (err)
    {
      console.log(err);
      return;
    }
    var string = res.buffer.toString();
    var deferredProcessing = false;

    const srcParent = source[TAG_PARENT];

    if (typeof source.$ver === 'string')
    {
      finfo.version = source.$ver;
    }
    if (typeof source.version === 'string')
    {
      finfo.version = source.version;
    }
    else if (srcParent && typeof srcParent.$ver === 'string')
    { // Cached version from parent.
      finfo.version = source.$ver = srcParent.$ver;
    }
    else if (typeof source.version === 'object')
    {
      console.log(" Looking for version using ", source.version);
      if (source.version.json)
      {
        deferredProcessing = true;
        var jsonUrl = source.version.json;
        var jsonHandler = make_json_ver_handler(finfo, processing, argv);
        download_json_ver(jsonUrl, jsonHandler, argv);
      }
      else if ('regex' in source.version && 'match' in source.version)
      {
        var regex = new RegExp(source.version.regex);
        var matches = string.match(regex);
        if (matches)
        {
          var version = matches[source.version.match];
          if (version !== undefined)
          { // We found a version, yay!
            finfo.version = source.$ver = version;
            if (srcParent && !srcParent.$ver)
            { // There is a parent, but no cached version.
              srcParent.$ver = version;
            }
          }
        }
      }
    }

    if (typeof source.append === 'string')
    { // Append a string.
      string += source.append;
    }

    if (typeof source.alias === 'object' 
      && typeof source.alias.from === 'string'
      && typeof source.alias.to === 'string')
    { // Append a special function to create an alias.
      // Only works if core.js was loaded before the external dependency,
      // otherwise no alias will be made.
      let from = source.alias.from;
      let to = source.alias.to;

      // Add {"overwrite": true} to force the link even if it already exists.
      let overwrite = source.alias.overwrite ? ',true' : '';

      // Add {"error": true} to make the library report an error if the Lum
      // library wasn't found. Otherwise it will simple fail silently.
      let onError = source.alias.error 
        ? "\nelse {\nconsole.error('Lum not found');\n}\n"
        : "\n";

      let func = "(function(l) {\nif (l !== undefined) {\n";
      func += "l.ns.link("+from+","+to+overwrite+");\n";
      func += "}"+onError+"})(window.Lum)";

      // Okay, now append the generated function to the string.
      string += func;
    }

    var file = fs.createWriteStream(dest);
    if (false && source.uglify) // disabling minify for now.
    {
  //    console.log('string>>>'+string);
      let output = minify(string);
      if (output && output.code)
      {
//        console.log('minified>>>'+output.code);
        console.log("Writing minified file.");
        file.write(output.code);
      }
      else
      {
        console.error("Error minifying file", output);
      }
    }
    else
    {
      console.log("Writing downloaded file.");
      file.write(string);
    }
    file.close();

    if (!deferredProcessing)
    { // We're done processing this file.
      processing.count--;
      try_save(processing);
    }

  } // handler function

} // make_handler()

function download_deps (sources, argv)
{ 
  mkdir(scriptroot);
  mkdir(jsroot);
  mkdir(styleroot);
  mkdir(cssroot);
  
  const processing = {count: 0, upgrade: false};
  for (let sfile in sources)
  {
    if (sfile !== TAG_META)
    { // Anything other than the metadata should be a dependency file.
      download_dep(sfile, sources, argv, processing);
    }
  }
} // download_deps()

function download_dep (sfile, sources, argv, processing, finfo)
{
  const source = sources[sfile];

  if (processing === undefined)
    processing = {count: 1, upgrade: false};
  else if (!processing.upgrade)
    processing.count++;

  if (finfo === undefined)
  {
    if (installed[sfile] === undefined)
    {
      finfo = installed[sfile] = {from: source.suite};
    }
    else
    {
      finfo = installed[sfile];
      if (typeof finfo.from !== source.suite)
      { // The suite has changed, or the dep was installed prior to tracking.
        finfo.suite = source.suite;
      }
    }
  }

  let dest;
  if (source.css)
  {
    dest = cssroot+sfile;
  }
  else
  {
    dest = jsroot+sfile;
  }
  console.log("Checking for "+dest);

  let exists = false;
  if (!argv.force && !processing.upgrade)
  {
    try
    {
      exists = fs.lstatSync(dest).isFile();
    }
    catch (e) {}
  }

  if (!exists)
  {
    console.log(" --> Downloading "+source.url);
    //http.get(source.url, make_handler(source, dest));
    const getOpts =
    {
      url: source.url,
    };
    if (argv.verbose)
    {
      getOpts.progress = function (current, total)
      {
        console.log(' ['+sfile+'] Downloaded %d bytes of %d', current, total);
      }
    }
    http.get(getOpts, make_handler(source, dest, finfo, processing, argv));
  }
  else
  { // Skip it.
    processing.count--;
  }

  try_save(processing);

} // download_dep()

function upgrade_dep (depname, argv, processing)
{
  //console.log("upgrade_dep", depname, argv, processing);
  if (processing === undefined)
    processing = {count: 1, upgrade: true};
  else
    processing.count++;
  
  const finfo = installed[depname];
  const suite = finfo.from;
  const sources = get_sources(suite);
  const source = sources[depname];
  if (source === undefined)
  { // It's been removed.
    delete(installed[depname]);
    return;
  }

  let download = false;
  let deferredProcessing = false;

  if (typeof source.version === 'string')
  { // Look at the version info
    if (!finfo.version || compareVer(source.version, finfo.version) === 1)
    { // New version needed.
      download = true;
    }
  }
  else if (typeof source.version === 'object' && source.version.json)
  { // We'll download the JSON version file.
    deferredProcessing = true;
    const jsonUrl = source.version.json;
    const jsonHandler = function (err, res)
    {
      let download = false;
      const string = res.buffer.toString();
      const json = JSON.parse(string);
      if (json !== undefined && json.version !== undefined)
      {
        if (!finfo.version || compareVer(json.version, finfo.version) === 1)
        {
          download = true;
        }
      }
      else
      {
        download = true;
      }

      if (download)
      {
        download_dep(depname, sources, argv, processing, finfo);
      }
      else
      {
        processing.count--;
        try_save(processing);
      }
    }
    download_json_ver(jsonUrl, jsonHandler, argv);
  }
  else
  { // No way of testing this without downloading.
    download = true;
  }

  if (!deferredProcessing)
  {
    if (download)
    { // Okay, let's download this.
      download_dep(depname, sources, argv, processing, finfo);
    }
    else
    { // We're done.
      processing.count--;
      try_save(processing);
    }
  }
}

function upgrade_deps (argv)
{
  const processing = {count: 0, upgrade: true};
  for (const depname in installed)
  {
    upgrade_dep(depname, argv, processing);
  }
}

//download_deps();

