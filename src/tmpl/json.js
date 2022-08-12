(function()
{ // Lum.js v5 wrapped library JSON file.
  globalThis[theTemplate.getConf('global')].define(
    theTemplate.getVar('pkg'), 
    theTemplate.getVar('mod'), 
    theTemplate.getVar('path'),
  ).register(function (module)
  {
    module.exports = theTemplate.getVar('text', true);
  });
})();

