/**
 * Core utilities used by other Nano libraries.
 *
 * This is mandatory for most Nano v1.5 libraries.
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
   * A wrapper console.error() that falls back to console.log()
   */
  Nano.warn = function ()
  {
    if (console.error !== undefined)
    {
      console.error.apply(console, arguments);
    }
    else
    {
      console.log.apply(console, arguments);
    }
  }

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

  /**
   * Register a global Namespace.
   */
  Nano.registerNamespace = function (namespaces)
  {
    if (typeof namespaces === 'string')
    {
      namespaces = namespaces.split('.');
    }
    var cns = root;
    for (var n in namespaces)
    {
      var ns = namespaces[n];
      if (cns[ns] === undefined)
      {
        cns[ns] = {};
      }
      cns = cns[ns];
    }
  }

  /**
   * See if a global Namespace is registered.
   */
  Nano.hasNamespace = function (namespaces, logerror)
  {
    if (typeof namespaces === 'string')
    {
      namespaces = namespaces.split('.');
    }
    var cns = root;
    for (var n in namespaces)
    {
      var inns = namespaces[n];
      if (!Array.isArray(inns))
      {
        inns = [inns];
      }
      for (var i in inns)
      {
        var ns = inns[i];
        if (cns[ns] === undefined)
        {
          if (logerror)
          {
            console.log("Required namespace not found", namespaces);
          }
          return false;
        }
      }
      cns = cns[ns];
    }
    return true;
  }

  /**
   * See if a value is set, and if not, return a default value.
   */
  Nano.getDef = function (opt, defvalue)
  {
    if (opt === undefined || opt === null)
      return defvalue;
    return opt;
  }

  Nano.getOpt = function (opts, optname, defvalue)
  {
    if (opts[optname] === undefined)
      return defvalue;
    return opt;
  }

})(window);

