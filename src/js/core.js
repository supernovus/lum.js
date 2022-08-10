/*
 * Lum Core Global Object: The engine that powers the original Lum.js library set.
 *
 * Supports browsers in a Window or Worker context, 
 * AMD (RequireJS), or CommonJS (Node/Electron).
 *
 */
((function(factory)
{
  'use strict';

  const core = require('@lumjs/core');
  const ctx = core.context;

  if (ctx.AMD)
  { // Define the module.
    define(function() { return factory(core); });
  }
  else if (typeof module !== 'undefined' && ctx.isCommonJS(module))
  { // Export the module.
    module.exports = factory(core);
  }
  else
  { // In any other case, export a 'Lum' global variable.
    factory(core).initWrapper().ns.$self();
  }

})(function (core)
{ // Welcome to the factory.
  return require('@lumjs/global-object');
}));
