// Ensure Nano global object exists.
if (window.Nano === undefined)
{
  window.Nano = {};
}

(function()
{ // Wrapping the rest of this in an anonymous function.

"use strict";

// Create a Nano.Require object that will be used to store our methods.
Nano.Require = {};

// The base URL for our scripts.
Nano.Require.baseUrl = 'scripts';

// Some initial paths for some complex external libraries.
Nano.Require.paths = 
{
  ace:           'ace/src-min-noconflict/ace',
  'crypto-core': 'crypto/components/core-min',
  base64:        'crypto/components/enc-base64-min',
};

// Add a set of libraries to a certain subfolder of the base URL.
Nano.Require.add = function (basedir, pathspec)
{
  for (var i in pathspec)
  {
    var path = pathspec[i];
    var ptype = typeof path;
    if (ptype === 'string')
    {
      Nano.Require.paths[path] = basedir + '/' + path;
    }
    else if (ptype === 'object')
    {
      if (0 in path && 1 in path)
      {
        Nano.Require.paths[path[1]] = basedir + '/' + path[0];
      }
      else if ('file' in path && 'name' in path)
      {
        Nano.Require.paths[path.name] = basedir + '/' + path.file;
      }
      else
      {
        console.log("cannot add path", path);
      }
    }
    else
    {
      console.log("unknown path type", path);
    }
  }
}

// Refresh the RequireJS configuration.
Nano.Require.refresh = function ()
{
  requirejs.config({
    baseUrl: Nano.Require.baseUrl,
    paths:   Nano.Require.paths,
  });
}

// All of our Nano.js libraries.
var nanojs = 
[
  'arrayutils','change-type.js','coreutils','debug','disabled.jq',
  'exists.jq','format_json','format_xml','json.jq','menu.jq','modal',
  'modelbase','oquery','selectboxes.jq','status','uuid','validation',
  'webservice','xmlns.jq',
];

// All of our external libraries.
var extjs =
[
  'bowser','jquery','jquery-migrate','json3','modernizr','moment',
  'moment-locales',['riot-core','riot'],'riot-compiler','riot-control',
  'sprintf','underscore',['uri','URI'],['uri.jq','URI.jq'],
];

// Let's do this.
Nano.Require.add('nano', nanojs);
Nano.Require.add('ext',  extjs);
Nano.Require.refresh();

})();

