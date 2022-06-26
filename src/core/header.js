//++ core/header ++//

/*
 * Lum Core: The engine that powers the Lum.js library set.
 *
 * Supports browser (Window or Worker contexts) via regular script tag with a 
 * global Lum variable containing the core, or AMD loader such as RequireJS.
 *
 * Also supports CommonJS environments that allow assigning module.exports,
 * such as Node.js and Electron.js; does NOT support engines that only allow
 * you to export individual properties to the `exports` global.
 *
 * This is currently the only one of the libraries that can be loaded in
 * AMD and CommonJS environments easily. The rest were designed with just the
 * browser in mind, and require a global 'Lum' variable. At least for now.
 *
 * If you really want to use one of them, use `Lum.ns.$self()` to register
 * a global 'Lum' variable which they can find in the self/this global context.
 *
 */
((function (root, factory)
{ // The bootstrap function.
  "use strict";

  // Create an init object we'll pass to the factory.
  const init = {root};

  if (typeof define === 'function' && define.amd)
  { // AMD in use, register as anonymous module. No globals will be exported.
    init.AMD = true;
    init.node = false;
    define([], function () { return factory(init); });
  }
  else if (typeof module === 'object' && module.exports)
  { // Node.js or something similar with module.exports in use. No globals.
    init.node = true;
    init.AMD = false;
    module.exports = factory(init);
  }
  else
  { // Assume it's a browser, and then register browser globals.
    init.AMD = false;
    init.node = false;
    factory(init).ns.$self('Lum', 'Nano');
  }

})(typeof self !== 'undefined' ? self : this, 
function (init)
{ // Welcome to the factory.
  "use strict";

//-- core/header --//
