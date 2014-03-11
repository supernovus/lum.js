/**
 * Core utilities used by other Nano libraries.
 */

(function (root)
{
  "use strict";

  /** 
   * Set up the Nano namespace.
   */
  if (root.Nano === undefined)
    root.Nano = {};

  /**
   * Extend function. 
   */
  Nano.extend = function (base, sub, methods)
  {
    sub.prototype = Object.create(base.prototype);
    if (methods)
    {
      for (var name in methods)
      {
        sub.prototype[name] = methods[name];
      }
    }
    return sub;
  }

  /**
   * Add a "magical" function to a JS object.
   * These functions are marked as indomitable, do not affect
   * enumeration, and are ignored by JSON.
   */
  Nano.addProperty = function (object, pname, pfunc, opts)
  {
    if (opts === undefined || opts === null)
      opts = {};
    var props =
    {
      value:         pfunc,
      enumerable:    'enumerable'   in opts ? opts.enumerable   : false,
      configurable:  'configurable' in opts ? opts.configurable : false,
      writable:      'writable'     in opts ? opts.writable     : false,
    }; 
    Object.defineProperty(object, pname, props);
  }

  /**
   * Clone a simple object, using a simple JSON chain.
   */
  Nano.clone = function clone (object)
  {
    return JSON.parse(JSON.stringify(object));
  }

})(window);

