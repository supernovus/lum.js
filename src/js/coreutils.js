/**
 * Core utilities used by other Nano libraries.
 */

"use strict";

/**
 * Extend function, not really needed with ES6.
 */
export function extendObject (base, sub, methods)
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
export function addProperty (object, pname, pfunc, opts)
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
export function clone (object)
{
  return JSON.parse(JSON.stringify(object));
}

