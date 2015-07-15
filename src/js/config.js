(function(requirejs, root)
{
  root.NanoRequire = {};

  root.NanoRequire.baseUrl = 'scripts';

  root.NanoRequire.paths = 
  {
    ace:         'ace/src-min-noconflict/ace',
    crypto-core: 'crypto/components/core-min',
    base64:      'crypto/components/enc-base64-min',
  };

  root.NanoRequire.add = function (basedir, pathspec)
  {
    for (var i in pathspec)
    {
      var path = pathspec[i];
      var ptype = typeof path;
      if (ptype === 'string')
      {
        paths[path] = basedir + '/' + path;
      }
      else if (ptype === 'object')
      {
        if (0 in path && 1 in path)
        {
          root.NanoRequire.paths[path[1]] = basedir + '/' + path[0];
        }
        else if ('file' in path && 'name' in path)
        {
          root.NanoRequire.paths[path.name] = basedir + '/' + path.file;
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

  root.NanoRequire.refresh = function ()
  {
    requirejs.config({
      baseUrl: root.NanoRequire.baseUrl,
      paths:   root.NanoRequire.paths,
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

  root.NanoRequire.add('nano', nanojs);
  root.NanoRequire.add('ext',  extjs);

  root.NanoRequire.refresh();

})(requirejs, window);
