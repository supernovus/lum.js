(function(Nano)
{
  "use strict";

  if (Nano === undefined)
  {
    throw new Error("Missing Lum core");
  }

  Nano.needLibs('tests');

  /*
   * In this file, we register all of our current test sets.
   *
   * They aren't loaded immediately, but instead will be loaded on demand.
   *
   * Because of the nature of this script, it needs to be loaded AFTER we
   * have initialized the Nano.Tests instance. The default test templates will
   * do this automatically.
   */

  let testSuite = Nano.Tests.getInstance();

  // A quick function to make a data set.
  testSuite.makePeople = function (opts={})
  {
    let people = 
    [
      {
        name: 'Bob',
        age: 40,
      },
      {
        name: 'Lisa',
        age: 25,
      },
      {
        name: 'Kevin',
        age: 18,
      },
      {
        name: 'Sarah',
        age: 13,
      },
    ];

    if (opts.withRecursion)
    {
      people[0].kids = [people[2],people[3]];
      people[1].kids = [people[3]];
      people[2].kids = [];
      people[3].kids = [];
      people[0].parents = [];
      people[1].parents = [];
      people[2].parents = [people[0]];
      people[3].parents = [people[0],people[1]];
    }
    else if (opts.withReferences)
    {
      people[0].kids = [2,3];
      people[1].kids = [3];
      people[2].kids = [];
      people[3].kids = [];
      people[0].parents = [];
      people[1].parents = [];
      people[2].parents = [0];
      people[3].parents = [0,1];
    }
    else if (opts.withNames)
    {
      people[0].kids = [people[2].name,people[3].name];
      people[1].kids = [people[3].name];
      people[2].kids = [];
      people[3].kids = [];
      people[0].parents = [];
      people[1].parents = [];
      people[2].parents = [people[0].name];
      people[3].parents = [people[0].name,people[1].name];
    }

    return people;
  }

  const L = '@';          // Where our library scripts are found.
  const T = '@tests/';    // The folder the test scripts are stored in.
  const S = '@@scripts/'; // The 'scripts' folder root.
  const E = S + 'ext/';   // The 'external' scripts folder.

  let ext = '.js'; // Default file extension for our scripts.

  // For most Nano libraries, this will work.
  function test (lib, name, deps=[])
  {
    deps.push(L+lib+ext);
    deps.push(T+lib+ext);
    return testSuite.addSet(lib, name, deps);
  }

  // For jQuery plugins, this is probably your best bet.
  function testjq (lib, name, deps=[])
  {
    let ext = '.jq.js'; // We use a different file extension.
    deps.push(L+lib+ext);
    deps.push(T+lib+ext);
    return testSuite.addSet(lib+'_jq', name, deps);
  }

  // For plugins/extensions to our own libraries, this is the way to go.
  // This requires the parent TestSet to be passed as the first parameter.
  function testext (mainlib, plugin, name, deps=[])
  {
    let pluginId = mainlib.id+'_'+plugin;
    deps.unshift(mainlib);
    deps.push(L+mainlib.id+'/'+plugin+ext);
    deps.push(T+pluginId+ext);
    return testSuite.addSet(pluginId, name, deps);
  }

  // A couple of external deps.
  //let jqui = E+'jquery-ui.js';
  //let spf = E+'sprintf.js';

  // And now the main part, register our tests.
  // I'm putting everything below even if I don't plan on writing the
  // tests for them right away. I can leave things commented out until I'm
  // ready to write tests. 

  let core = test('core',  'Core');
  let helpers = test('helpers', 'Helpers');
  testext(helpers, 'extend', '.extend');
  let hash = test('hash', 'URL Hash');
  test('arrayutils', 'Array Utils');
  //testjq('changetype', 'jQuery Change Type');
  //test('contextmenu', 'Context Menu');
  test('css', 'CSS');
  //test('debug', 'Debug');
  testjq('disabled', 'jQuery Disabled');
  /* -- FUTURE TEST
    test('editor', 'Editor',
    [
      S+'ace/src-min-noconflict/ace.js',
      S+'crypto/components/core-min.js',
      S+'crypto/components/enc-base64-min.js',
    ]);
  */
  let existsjq = testjq('exists', 'jQuery Exists');
  test('expression', 'Expression');
  test('format_json', 'Format JSON');
  test('format_xml', 'Format XML');
  test('oquery', 'oQuery');
  //test('grid', 'Grid', [core]);
  let jsonjq = testjq('json', 'jQuery JSON');
  //let pager = test('pager', 'Pager');
  //let riot_tmpl = testSuite.addSet('riot_tmpl', 'Riot 2 Templates', ['@riot.tmpl.js', '@tests/riot_tmpl.js']);
  //let riot_render = testSuite.addSet('riot_render', 'Riot 1 Templates', ['@riot.render.js', '@tests/riot_render.js']);
  //test('listing', 'Listing', [pager, riot_tmpl]);
  //test('modal', 'Modal Dialog', [jqui]);
  let observ = test('observable', 'Observable');
  let prom = test('promise', 'Nano Promise');
  //let ws = test('webservice', 'Webservice', [core]);
  //testext(ws, 'compat', 'Webservice Compat');
  let modelapi = test('modelapi', 'Model API', [core,hash,existsjq,jsonjq]);
  //testext(modelapi, 'ws_model', 'Model WS Plugin', [prom]);
  //test('notifications', 'Notifications', [core, spf]);
  //testjq('selectboxes', 'jQuery Select Boxes');
  test('tax', 'Tax Calculator');
  //test('userdata', 'User Data');
  //test('uuid', 'UUIDs');
  //test('validation', 'Validation'); 
  test('viewcontroller', 'View Controller', [observ, modelapi]);
  //testjq('xmlns', 'jQuery XML Namespaces');

  // Add more tests as we add/change libraries.

})(window.Lum);