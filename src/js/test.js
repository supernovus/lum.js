// A compatibility testing script with custom library loader.
// Not for use outside of the v5:/index.html file.

// The fake global object library.
const Lum = require('@lumjs/global-object');

const {def,S,isObj} = Lum._;

const jq = 'jquery';
const jqui = 'jquery-ui';
const riot2 = 'render/riot2';

// A fake package to give us a list of CryptoJS libs.
const cryptoList = Object.keys(require('@lumjs/crypto-js-list'));

globalThis.lt = function()
{ // Try to figure out what the user is looking for.
  let search = false;

  /*function fullList()
  {
    console.log(loaders.$indexedList);
  }*/

  if (arguments.length === 0)
  { // Show a list of libraries.
    return loaders.$indexedList;
  }
  else
  {
    for (const lib of arguments)
    {
      if (isObj(lib))
      { // An object is assumed to be a list of deps.
        loadDeps(lib);
      }
      else if (lib === '.')
      {
        return loaders.$indexedList;
      }
      else if (lib === '?')
      {
        search = !search;
      }
      else if (search)
      {
        return loaders.$orderedList.filter(item => item.includes(lib));
      }
      else 
      { // Look for the lib in our lists.
        let found = false;
        for (const lname in loaders)
        {
          const loader = loaders[lname];
          if (loader.list.includes(lib))
          {
            found = true;
            tryLoad(loader, lib);
            break;
          }
        }
        if (!found)
        {
          console.error(`Could not find '${lib}', use '.' for a list`);
        }
      }
    } // for lib in arguments
  }
} // lt()

// Loaders for specific components.
const loaders = 
{
  lum: 
  {
    dir: 'scripts/nano/',
    list:
    [
      'arrayutils', 'contextmenu', 'css', 'debug', 'deprecated', 'editor', 
      'elementeditor', 'encode', 'expression', 'format_json', 'format_xml', 
      'grid', 'hash', 'helpers', 'helpers/extend', 'listing', 'modal',
      'modelapi', 'modelapi/ws_model', 'momental', 'notifications', 'oquery',
      'pager', 'promise', 'render/riot1', riot2, 'service_worker',
      'tabpanes', 'tax', 'userdata', 'uuid', 'validation', 'viewcontroller',
      'webservice', 'webservice/compat', 'whenready', 'whenreceived',
    ],
    libDeps:
    {
      contextmenu: {ext: [jq]},
      debug: {ext: [jq], lum: ['hash']},
      editor: 
      {
        ext: [jq], 
        ace: ['ace'], 
        cjs: ['core', 'enc-base64', 'enc-utf8'],
      },
      elementeditor: {ext: [jq]},
      encode: {cjs: ['crypto-js']},
      format_json: {ext: [jq]},
      format_xml: {ext: [jq]},
      grid: {ext: [jqui]},
      'helpers/extend': {lum: ['helpers']},
      listing: {ext: [jq], lum: ['hash', 'pager', riot2]},
      modal: {ext: [jqui]},
      modelapi: {lum: ['debug'], jq: ['exists', 'json']},
      'modelapi/ws_model': {lum: ['modelapi', 'webservice', 'promise']},
      momental: {ext: ['luxon']},
      notifications: {ext: [jq, 'sprintf']},
      pager: {ext: [jq]},
      tabpanes: {ext: [jq], lum: ['hash']},
      validation: {ext: [jq]},
      viewcontroller: {ext: [riot2], lum: ['debug']},
      webservice: {ext: [jq]},
      'webservice/compat': {lum: ['webservice']},
    },
  },
  jq:
  {
    allDeps: {ext: [jq]},
    dir: 'scripts/nano/',
    ext: '.jq.js',
    list: 
    [
      'change_type', 'disabled', 'exists', 'json', 'selectboxes', 'xmlns',
    ],
  },
  ext:
  {
    dir: 'scripts/ext/',
    list: 
    [
      'clipboard', 'easel', 'feature', jq, jqui,
      'luxon', 'moment', 'require', 'sprintf', 'stacktrace',
    ],
    libDeps: 
    {
      'jquery-ui': {ext: ['jquery']},
    },
  },
  cjs: 
  {
    dir: 'scripts/crypto/', 
    def: 'crypto-js',
    list: cryptoList,
  },
  ace:
  {
    dir: 'scripts/ace/src-min-noconflict/',
    def: 'ace',
    list: ['ace'], // Just use Ace's autoloading.
  },
}

def(loaders, '$indexedList', {});
def(loaders, '$orderedList', []);

function loadDeps(deps)
{
  for (const subloader in deps)
  {
    const subdeps = deps[subloader];
    lt[subloader](...subdeps);
  }
}

function tryLoad(loader, lib)
{
  if (!loader.$loaded[lib])
  {
    if (loader.allDeps)
    { // The loader itself has deps, make sure they're loaded first.
      loadDeps(loader.allDeps);
    }
    if (loader.libDeps && loader.libDeps[lib])
    { // This library has deps, make sure they're loaded first.
      loadDeps(loader.libDeps[lib]);
    }
    // Now load the library itself.
    const ext = loader.ext ?? '.js'
    Lum.load.js(loader.dir+lib+ext);
    loader.$loaded[lib] = true;
  }
}

// Now let's set up the loaders.
for (const lname in loaders)
{
  const loader = loaders[lname];
  def(loader, '$loaded', {}); // A cache of loaded libraries.

  // Create the loader function.
  lt[lname] = function()
  {
    if (arguments.length > 0)
    {
      let search = false;
      for (const lib of arguments)
      {
        if (isObj(lib))
        { // Again, an object is deps.
          loadDeps(lib);
        }
        else if (lib === '.')
        {
          return loader.list;
        }
        else if (lib === '?')
        { // Toggle search mode.
          search = !search;
        }
        else if (search)
        {
          return loader.list.filter(item => item.includes(lib));
        }
        else
        { // The regular load routine.
          tryLoad(loader, lib);
        }
      }
    }
    else if (typeof loader.def === S)
    { // Load the default lib.
      tryLoad(loader, loader.def);
    }
    else 
    {
      console.warn("no default lib; use '.' for a list, or '?' to search");
    }
  }

  // Populate the full library lists.
  loaders.$indexedList[lname] = loader.list;
  loaders.$orderedList.push(...loader.list);

} // for lname in loaders
