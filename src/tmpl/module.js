//(function()
{ // Lum.js v5 wrapped library module.
  globalThis[theTemplate.getConf('global')].define(
    theTemplate.getVar('pkg'), 
    theTemplate.getVar('mod'), 
    theTemplate.getVar('path'),
  ).register(function (module)
  {
    const require = module.require; // A `require()` method for the module.
    let exports = module.exports;   // The default `exports` object, may be overridden.
    // Now the actual wrapped module code:
    theTemplate.getVar('text', true);
  });

}
//)();
