(function()
{
  /**
   * In this file, we register all of our current test sets.
   *
   * They aren't loaded immediately, but instead will be loaded on demand.
   *
   * Because of the nature of this script, it needs to be loaded AFTER we
   * have initialized the Nano.Tests instance. The default test templates will
   * do this automatically.
   */

  if (window.Nano === undefined || Nano.Tests === undefined)
  {
    throw new Error("Must load and initialize Nano.Tests before registration");
  }

  let testSuite = Nano.Tests.getInstance();

  // For most Nano libraries, this will work.
  function test (lib, name, deps=[], ext='.js')
  {
    deps.push('@'+lib+ext);
    deps.push('@tests/'+lib+ext);
    return testSuite.addSet(lib, name, deps);
  }

  // For jQuery plugins, this is probably your best bet.
  function testjq (lib, name, deps=[])
  {
    return test(lib, name, deps, '.jq.js');
  }

  // For plugins/extensions to our own libraries, this is the way to go.
  // This requires the parent TestSet to be passed as the first parameter.
  function testext (mainlib, plugin, name, deps=[], ext='js')
  {
    let pluginId = mainlib.id+'_'+plugin;
    deps.push(mainlib);
    deps.push('@'+mainlib.id+'/'+plugin+ext);
    deps.push('@tests/'+pluginId+ext);
    return testSuite.addSet(pluginId, name, deps);
  }

  // A couple of external deps.
  //let jqui = '../scripts/ext/jquery-ui.js';
  //let spf = '../scripts/ext/sprintf.js';

  // And now the main part, register our tests.
  // I'm putting everything below even if I don't plan on writing the
  // tests for them right away. I can leave things commented out until I'm
  // ready to write tests. 

  let core = test('coreutils',  'Core Utils');
  let hash = test('hash', 'URL Hash');
  test('arrayutils', 'Array Utils');
  //testjq('changetype', 'jQuery Change Type');
  //test('contextmenu', 'Context Menu');
  test('css', 'CSS');
  //test('debug', 'Debug');
  //testjq('disabled', 'jQuery Disabled');
  /* -- FUTURE TEST
    test('editor', 'Editor',
    [
      '../scripts/ace/src-min-noconflict/ace.js',
      '../scripts/crypto/components/core-min.js',
      '../scripts/crypto/components/enc-base64-min.js',
    ]);
  */
  //let existsjq = testjq('exists', 'jQuery Exists');
  test('expression', 'Expression');
  //test('format_json', 'Format JSON');
  //test('format_xml', 'Format XML');
  //test('grid', 'Grid');
  //let jsonjq = testjq('json', 'jQuery JSON');
  //let pager = test('pager', 'Pager');
  //let riot_tmpl = testSuite.addSet('riot_tmpl', 'Riot 2 Templates', ['@riot.tmpl.js', '@tests/riot_tmpl.js']);
  //let riot_render = testSuite.addSet('riot_render', 'Riot 1 Templates', ['@riot.render.js', '@tests/riot_render.js']);
  //test('listing', 'Listing', [pager, riot_tmpl]);
  //test('modal', 'Modal Dialog', [jqui]);
  //let observ = test('observable', 'Observable');
  //let prom = test('promise', 'Nano Promise');
  //let ws = test('webservice', 'Webservice', [core]);
  //testext(ws, 'compat', 'Webservice Compat');
  //let modelapi = test('modelapi', 'Model API', [core,hash,existsjq,jsonjq]);
  //testext(modelapi, 'ws_model', 'Model WS Plugin', [prom]);
  //test('notifications', 'Notifications', [core, spf]);
  //test('oquery', 'oQuery');
  //testjq('selectboxes', 'jQuery Select Boxes');
  //test('tax', 'Tax Calculator');
  //test('userdata', 'User Data');
  //test('uuid', 'UUIDs');
  //test('validation', 'Validation'); 
  //test('viewcontroller', 'View Controller', [core]);
  //testjq('xmlns', 'jQuery XML Namespaces');

  // Add more tests as we add/change libraries.

})();