#!/usr/bin/env node

// TODO: More error checking, validation, etc.

const VERSION = '1.5+';

const VERBOSE_OPTION =
{
  alias: 'v',
  describe: 'Enable more verbose output.',
  type: 'boolean',
  default: false,
}

var UglifyJS = require('uglify-js');
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
    var suite = argv.suite;
    var sources = get_sources(suite);
    if (argv.singledep)
    {
      var depname = argv.singledep;
      if (depname in sources)
      {
        download_dep(depname, sources, suite, argv);
      }
      else
      {
        console.log("No such dependency", depname);
      }
    }
    else
    {
      download_deps(sources, suite, argv);
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
    for (var depname in sourceCache[suite])
    {
      var dep = sourceCache[suite][depname];
      if (dep['@parent'] !== undefined)
      {
        var parentName = dep['@parent'];
        var parentDep = sourceCache[suite][parentName];
        for (var prop in parentDep)
        {
          if (dep[prop] === undefined)
          {
            dep[prop] = parentDep[prop];
          }
        }
      }
    }
  }
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

    var file = fs.createWriteStream(dest);
    if (source.uglify)
    {
  //    console.log('string>>>'+string);
      var output = UglifyJS.minify(string);
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

function download_deps (sources, suite, argv)
{ 
  mkdir(scriptroot);
  mkdir(jsroot);
  mkdir(styleroot);
  mkdir(cssroot);
  
  var processing = {count: 0, upgrade: false};
  for (var sfile in sources)
  {
    download_dep(sfile, sources, suite, argv, processing);
  }
} // function download_deps()

function download_dep (sfile, sources, suite, argv, processing, finfo)
{
  if (processing === undefined)
    processing = {count: 1, upgrade: false};
  else if (!processing.upgrade)
    processing.count++;

  if (finfo === undefined)
  {
    if (installed[sfile] === undefined)
    {
      finfo = installed[sfile] = {from: suite};
    }
    else
    {
      finfo = installed[sfile];
    }
  }

  var source = sources[sfile];
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
  if (processing === undefined)
    processing = {count: 1, upgrade: true};
  else
    processing.count++;
  
  var finfo = installed[depname];
  var suite = finfo.from;
  var sources = get_sources(suite);
  var source = sources[depname];
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
        download_dep(depname, sources, suite, argv, processing, finfo);
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
      download_dep(depname, sources, suite, argv, processing, finfo);
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

