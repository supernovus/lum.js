#!/usr/bin/env node

// TODO: More error checking, validation, etc.

const VERSION = '4';

const VERBOSE_OPTION =
{
  alias: 'v',
  describe: 'Enable more verbose output.',
  type: 'boolean',
  default: false,
}

const TAG_META = "@metadata";
const TAG_PARENT = "@parent";

var terser = require('terser');
var http = require('http-request');
var fs = require('fs');
var path = require('path');
var compareVer = require('compare-versions');

var scriptroot = 'scripts/';
var jsroot = scriptroot+'ext/';

var styleroot = 'style/';
var cssroot = styleroot+'ext/';

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

var installed_conf = 'conf/installed_deps.json';
var installed = {};
try
{
  var stat = fs.lstatSync(installed_conf);
  if (stat.isFile())
  {
    installed = require('../'+installed_conf);
  }
}
catch (e) {}

var sourceCache = {};

require('yargs')
  .version(VERSION)
  .command('install [singledep]', 'Install dependencies', (yargs) =>
  {
    var opts = yargs
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
    var suite = argv.all ? 'all' : argv.suite;
    var sources = get_sources(suite);
    if (argv.singledep)
    {
      var depname = argv.singledep;
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
    var opts = yargs
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
        var depname = argv.singledep;
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

function get_sources (suite)
{
  if (sourceCache[suite] === undefined)
  {
    sourceCache[suite] = require('../conf/sources/'+suite+'.json');

    let includes = null; // If @metadata.include is set, it'll go here.

    for (var depname in sourceCache[suite])
    {
      var dep = sourceCache[suite][depname];

      if (depname === TAG_META)
      { // Metadata is handled separately.
        if (typeof dep.includes === 'object')
        { // It should be an array of suites to include.
          includes = dep.includes;
        }
        // Nothing else is used in the metadata.
        continue;
      } // if dep == @metadata

      // We're going to mark the suite down in the dep for later reference.
      dep.suite = suite;

      if (dep['@parent'] !== undefined)
      { // This dependency has a parent object.
        var parentName = dep['@parent'];
        var parentDep = sourceCache[suite][parentName];
        for (var prop in parentDep)
        {
          if (dep[prop] === undefined)
          {
            dep[prop] = parentDep[prop];
          }
        }
      } // if dep.@parent

    } // for dep in deps

    if (typeof includes === 'object' && includes !== null)
    { // Includes were found in the metadata, let's include them.
      for (var i in includes)
      {
        let sources = get_sources(includes[i]);
        for (var depname in sources)
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

function make_json_ver_handler (finfo, processing, argv)
{
  return function (err, res)
  {
    var string = res.buffer.toString();
    var json = JSON.parse(string);
    if (json !== undefined && json.version !== undefined)
    {
      finfo.version = json.version;
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
    if (typeof source.version === 'string')
    {
      finfo.version = source.version;
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
            finfo.version = version;
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
      func += "l.link("+from+","+to+overwrite+");\n";
      func += "}"+onError+"})(window.Lum)";

      // Okay, now append the generated function to the string.
      string += func;
    }

    var file = fs.createWriteStream(dest);
    if (source.uglify)
    {
  //    console.log('string>>>'+string);
      var output = terser.minify(string);
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
  }
}

function download_deps (sources, argv)
{ 
  mkdir(scriptroot);
  mkdir(jsroot);
  mkdir(styleroot);
  mkdir(cssroot);
  
  var processing = {count: 0, upgrade: false};
  for (var sfile in sources)
  {
    if (sfile !== TAG_META)
    { // Anything other than the metadata should be a dependency file.
      download_dep(sfile, sources, argv, processing);
    }
  }
} // function download_deps()

function download_dep (sfile, sources, argv, processing, finfo)
{
  if (processing === undefined)
    processing = {count: 1, upgrade: false};
  else if (!processing.upgrade)
    processing.count++;

  var source = sources[sfile];

  if (finfo === undefined)
  {
    if (installed[sfile] === undefined)
    {
      finfo = installed[sfile] = {from: source.suite};
    }
    else
    {
      finfo = installed[sfile];
    }
  }

  var dest;
  if (source.css)
  {
    dest = cssroot+sfile;
  }
  else
  {
    dest = jsroot+sfile;
  }
  console.log("Checking for "+dest);
  var exists = false;
  if (!argv.force && !processing.upgrade)
  {
    try
    {
      var stat = fs.lstatSync(dest);
      exists = stat.isFile();
    }
    catch (e) {}
  }
  if (!exists)
  {
    console.log(" --> Downloading "+source.url);
    //http.get(source.url, make_handler(source, dest));
    var getOpts =
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
}

function upgrade_dep (depname, argv, processing)
{
  //console.log("upgrade_dep", depname, argv, processing);
  if (processing === undefined)
    processing = {count: 1, upgrade: true};
  else
    processing.count++;
  
  var finfo = installed[depname];
  var suite = finfo.from;
  var sources = get_sources(suite);
  var source = sources[depname];
  if (source === undefined)
  { // It's been removed.
    delete(installed[depname]);
    return;
  }
  var download = false;
  var deferredProcessing = false;

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
    var jsonUrl = source.version.json;
    var jsonHandler = function (err, res)
    {
      var download = false;
      var string = res.buffer.toString();
      var json = JSON.parse(string);
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
  var processing = {count: 0, upgrade: true};
  for (var depname in installed)
  {
    upgrade_dep(depname, argv, processing);
  }
}

//download_deps();

