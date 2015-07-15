var NanoRequire = {}; // A global variable.

(function()
{ // Wrapping the rest of this in an anonymous function.

"use strict";

NanoRequire.baseUrl = 'scripts';

NanoRequire.paths = 
{
  ace:           'ace/src-min-noconflict/ace',
  'crypto-core': 'crypto/components/core-min',
  base64:        'crypto/components/enc-base64-min',
};

NanoRequire.add = function (basedir, pathspec)
{
  for (var i in pathspec)
  {
    var path = pathspec[i];
    var ptype = typeof path;
    if (ptype === 'string')
    {
      NanoRequire.paths[path] = basedir + '/' + path;
    }
    else if (ptype === 'object')
    {
      if (0 in path && 1 in path)
      {
        NanoRequire.paths[path[1]] = basedir + '/' + path[0];
      }
      else if ('file' in path && 'name' in path)
      {
        NanoRequire.paths[path.name] = basedir + '/' + path.file;
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

NanoRequire.refresh = function ()
{
  requirejs.config({
    baseUrl: NanoRequire.baseUrl,
    paths:   NanoRequire.paths,
  });
}

var nanojs = 
[
  'arrayutils','change-type.js','coreutils','debug','disabled.jq',
  'exists.jq','format_json','format_xml','json.jq','menu.jq','modal',
  'modelbase','oquery','selectboxes.jq','status','uuid','validation',
  'webservice','xmlns.jq',
];

var extjs =
[
  'bowser','jquery','jquery-migrate','json3','modernizr','moment',
  'moment-locales',['riot-core','riot'],'riot-compiler','riot-control',
  'sprintf','underscore',['uri','URI'],['uri.jq','URI.jq'],
];

NanoRequire.add('nano', nanojs);
NanoRequire.add('ext',  extjs);

NanoRequire.refresh();

})();

