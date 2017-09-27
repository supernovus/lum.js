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
   * Extend a new class using a parent base class.
   *
   * @param {function} baseclass The base class we are extending from.
   *
   * @param {function|null} [subclass] The sub class we are creating.
   *
   * @param {boolean} copyall If true, copy all public properties from the
   *                          base class to the sub-class. (default false.)
   *
   * @return {function} The new class after extending has been completed.
   *
   * If the 'subclass' parameter is undefined or null, we will create a default
   * function that simply calls the base class constructor with all arguments
   * passed as is. This allows for easy construction of child classes:
   *
   *   var childclass = Nano.extend(parentclass);
   *
   * or if you want to copy public properties from the base class that aren't
   * in the prototype, then:
   *
   *   var childclass = Nano.extend(parentclass, null, true);
   *
   * If you need to specify your own child class constructor,
   * make sure it calls any necessary parent constructors.
   */
  Nano.extend = function (base, sub, copyall)
  {
//    console.error("Nano.extend()", base, sub, copyall);
    if (typeof base !== 'function')
    {
      Nano.warn("Nano.extend(base): base passed was not function", arguments);
      return;
    }

    if (sub === undefined || sub === null)
    {
      sub = function ()
      {
        var args = Array.prototype.slice.call(arguments);
        base.apply(this, args);
      }
//      console.log("Generated empty child", sub);
    }
    else if (typeof sub !== 'function')
    {
      Nano.warn("Nano.extend(base, sub): sub passed was not function", arguments);
      return;
    }

    sub.prototype = Object.create(base.prototype);

    if (copyall)
    {
      Nano.copy(sub, base);
    }

    return sub;
  }

  /**
   * Copy public properties between objects. Can be used for mixins.
   *
   * @param  {object|function} target   The target we are copying into.
   * @params {...(object|function|boolean)} sources The sources we copy from.
   * If a source is a boolean, it changes the 'overwrite' behavior for any
   * objects/functions following it. If 'overwrite' is true, existing
   * properties with the same name already in the target will be overwritten.
   * If 'overwrite' is false (the default) then they will not be overwritten.
   *
   */
  Nano.copy = function (target)
  {
    var overwrite = false;
    var sources = Array.prototype.slice.call(arguments, 1);
//    console.log("Nano.copy()", target, sources);
    for (var s in sources)
    {
      var source = sources[s];
      var stype = typeof source;
//      console.log("source", source, stype);
      if (stype === 'boolean')
      {
        overwrite = source;
      }
      else if (stype === 'object' || stype === 'function')
      {
//        console.log("copying properties", source);
        for (var prop in source)
        {
          if (overwrite || target[prop] === undefined)
          {
//            console.log("copying", prop, source[prop]);
            target[prop] = source[prop];
          }
        }
      }
    }
  }

  /**
   * A wrapper around Object.defineProperty() that assigns a value to
   * the property. It can be a static value, or a function.
   */
  Nano.addProperty = function (object, pname, pfunc, opts)
  {
    if (opts === undefined || opts === null)
      opts = {};
    var props =
    {
      value:         pfunc,
      enumerable:    ('enumerable'   in opts ? opts.enumerable   : false),
      configurable:  ('configurable' in opts ? opts.configurable : false),
      writable:      ('writable'     in opts ? opts.writable     : false),
    }; 
    Object.defineProperty(object, pname, props);
  }

  /**
   * A wrapper around Object.defineProperty() that assigns a getter and
   * setter to the property. The getter and setting must be functions.
   */
  Nano.addAccessor = function (object, pname, gfunc, sfunc, opts)
  {
    if (opts === undefined || opts === null)
      opts = {};
    var props =
    {
      get:          gfunc,
      set:          sfunc,
      enumerable:   ('enumerable'   in opts ? opts.enumerable   : false),
      configurable: ('configurable' in opts ? opts.configurable : false),
    };
    Object.defineProperty(object, pname, props);
  }

  /**
   * Clone a simple object, using a simple JSON chain.
   */
  Nano.clone = function clone (object, copyProperties)
  {
    var clone = JSON.parse(JSON.stringify(object));
    if (copyProperties)
    {
      for (var prop in copyProperties)
      {
        var configurable = copyProperties[prop];
        if (clone[prop] === undefined)
        {
          var opts = {configurable: configurable};
          Nano.addProperty(clone, prop, object[prop], opts);
        }
      }
    }
    return clone;
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
            Nano.warn("Required namespace not found", namespaces);
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

  /**
   * See if a property exists in an object. 
   * If it do, return the property.
   * If it doesn't, return a default value.
   */
  Nano.getOpt = function (opts, optname, defvalue)
  {
    if (opts[optname] === undefined)
      return defvalue;
    return opts[optname];
  }

  /**
   * Get a property from a nested data structure.
   * Based on the same way we handle namespaces.
   */
  Nano.getNested = function (obj, proppath)
  {
    if (typeof proppath === 'string')
    {
      proppath = proppath.split('.');
    }
    for (var p = 0; p < proppath.length; p++)
    {
      var propname = proppath[p];
      if (obj[propname] === undefined)
      { // End of search, sorry.
        return undefined;
      }
      obj = obj[propname];
    }
    return obj;
  }

})(window);

