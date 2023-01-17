//(function()
{ // Lum.js v5 wrapped external library.
  globalThis[theTemplate.getConf('global')].define(
    theTemplate.getVar('pkg'), 
    theTemplate.getVar('mod'), 
    theTemplate.getVar('path'),
  ).register(function (module)
  { // This assumes the external library exports a global namespace.
    module.exports = theTemplate.getVar('ns', true);
  });
  
}
//)();

