/*
 * Core utilities used by other Lum libraries.
 */

(function (root)
{
  "use strict";

  if (root.Lum !== undefined)
  {
    console.warn("Lum already loaded.");
    return;
  }

  /** 
   * The global Lum namespace.
   *
   * @namespace Lum
   */
  root.Lum = {_loaded:{}};

  /**
   * Register a global Namespace.
   *
   * @param {string|string[]} namespaces  The namespace we are registering.
   *
   * Generally passed as a single string like:
   *
   * `'MyCompany.MyApp.MyPage'`
   *
   * It will create a global object called `MyCompany` with a child
   * object called `MyApp` with a child object called `MyPage`.
   *
   * You can also pass an array of strings representing the namespace path.
   * So the above would be passed as:
   *
   * `['MyCompany','MyApp','MyPage']`
   *
   * The latter syntax may be slightly faster, but it looks more cumbersome.
   * The choice is yours.
   *
   * @param {mixed} [assign] Assign to the last element of the namespace.
   * @param {boolean} [overwrite=false] Overwrite the last element if it exists.
   *  Only applicable if assign was used.
   *
   * @return {object}  The last element of the namespace added.
   */
  Lum.registerNamespace = function (namespaces, assign, overwrite=false)
  {
    if (typeof namespaces === 'string')
    {
      namespaces = namespaces.split('.');
    }
    var cns = root;
    var nscount = namespaces.length;
    var lastns = nscount - 1;
//    console.debug("registerNamespace", namespaces, assign, overwrite, nscount, lastns);
    for (var n = 0; n < nscount; n++)
    {
      var ns = namespaces[n];
//      console.debug("Looking for namespace", n, ns, cns, cns[ns]);
      if (cns[ns] === undefined)
      {
        if (n == lastns && assign !== undefined)
        {
          cns[ns] = assign;
//          console.debug("Assigned", ns, cns[ns], assign);
        }
        else
        {
          cns[ns] = {};
        }
      }
      else if (overwrite && n == lastns && assign !== undefined)
      {
        cns[ns] = assign;
      }
      cns = cns[ns];
    }
    return cns;
  }

  /**
   * Get a namespace.
   *
   * @param {string|array} namespaces  A namespace definition.
   * @param {boolean} [logerror=false] Log errors for missing namespaces?
   *
   * @return {mixed} The namespace if it exists, or `undefined` if it doesn't.
   */
  Lum.getNamespace = function (namespaces, logerror=false)
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
        if (logerror)
        {
          console.error("Required namespace not found", namespaces);
        }
        return undefined;
      }
      cns = cns[ns];
    }
    return cns;
  }

  /**
   * See if a namespace exists.
   *
   * @param {string|array} namespaces  A namespace definition.
   * @param {boolean} [logerror=false] Log errors for missing namespaces?
   *
   * @return {boolean} Does the namespace exist?
   */
  Lum.hasNamespace = function (namespaces, logerror=false)
  {
    return (this.getNamespace(namespaces, logerror) !== undefined);
  }

  /**
   * Check for needed namespaces.
   *
   * Any arguments are the names of namespaces we need.
   */
  Lum.needNamespaces = Lum.needNamespace = function ()
  {
    for (let n = 0; n < arguments.length; n++)
    {
      let ns = arguments[n];
      if (!this.hasNamespace(ns))
      {
        throw new Error("Missing required namespace/library: "+JSON.stringify(ns));
      }
    }
  }

  /**
   * Export a global namespace to another global namespace.
   *
   * @param {string|strings[]} source  The namespace to export.
   * @param {string|strings[]} target  The target namespace.
   * @param {boolean} [overwrite=false]
   */
  Lum.exportNamespace = function (source, target, overwrite=false)
  {
    if (!overwrite && this.hasNamespace(target))
    {
      console.error("Will not overwrite namespace", target);
      return;
    }
    let ns = this.getNamespace(source, true);
    if (ns === undefined)
    { // Nothing to export, goodbye.
      return;
    }
    return this.registerNamespace(target, ns, overwrite);
  }

  /**
   * Make a link to a library/function into the Lum namespace.
   *
   * Unlike raw calls to registerNamespace() or exportNamespace(), this
   * automatically assumes we want to add the link to the 'Lum' global
   * namespace by default.
   *
   * As an example, if there's a global function called base91() and we want to
   * make an alias to it called Lum.Base91.mscdex() then we'd call:
   *
   *  Lum.link(window.base91, 'Base91.mscdex');
   *
   * @param {object|function} obj  The library/function we're linking to.
   * @param {string} target  The namespace within {prefix} we're assigning to.
   * @param {boolean} [overwrite=false]  Overwrite existing target namespace?
   * @param {string} [prefix="Lum."]  Prefix for the namespace target.
   *
   * @return Lum  The core Lum library is returned for chaining purposes.
   */
  Lum.link = function (obj, target, overwrite=false, prefix="Lum.")
  {
    this.registerNamespace(prefix+target, obj, overwrite);
    return this;
  }

  /**
   * Make a global alias to ourself.
   */
  Lum.exportAlias = function (target, overwrite=false)
  {
    this.registerNamespace(target, this, overwrite);
    return this;
  }

  /**
   * Mark a library as loaded.
   *
   * @param {string} lib  The name of the library we are marking as loaded.
   */
  Lum.markLib = function (lib)
  {
    this._loaded[lib] = true;
    return this;
  }

  /**
   * See if a library is loaded.
   *
   * @param {string} lib  The name of the library we are looking for.
   */
  Lum.hasLib = function (lib)
  {
    return this._loaded[lib];
  }

  /**
   * Check for loaded libraries. 
   *
   * They must have been marked as loaded to pass the test.
   *
   * Any arguments are the names of libraries we need.
   *
   * Returns the name of the first missing library, or undefined if all
   * requested libraries are loaded.
   */
  Lum.checkLibs = function ()
  {
    for (let l = 0; l < arguments.length; l++)
    {
      const lib = arguments[l];
      if (typeof lib === 'string' && !this._loaded[lib])
      {
        return lib;
      }
    }
  }

  /**
   * Run checkLibs; if it returns a string, throw a fatal error.
   */
  Lum.needLibs = Lum.needLib = function ()
  {
    const result = Lum.checkLibs.apply(this, arguments);
    if (typeof result === 'string')
    {
      throw new Error("Missing required Lum library: "+result);
    }
    return this;
  }

  /**
   * Run checkLibs; return false if the value was a string, or true otherwise.
   */
  Lum.wantLibs = function ()
  {
    const result = Lum.checkLibs.apply(this, arguments);
    return (typeof result !== 'string');
  }

  /**
   * Check for needed jQuery plugins.
   */
  Lum.checkJq = function ()
  {
    if (root.jQuery === undefined)
    {
      return 'jQuery';
    }

    let $ = root.jQuery;

    for (let l = 0; l < arguments.length; l++)
    {
      let lib = arguments[l];
      if ($.fn[lib] === undefined)
      {
        return lib;
      }
    }
  }

  /**
   * Run checkJq; if it returns a string, throw a fatal error.
   */
  Lum.needJq = function ()
  {
    const result = Lum.checkJq.apply(this, arguments);
    if (typeof result === 'string')
    {
      if (result === 'jQuery')
      {
        throw new Error("Missing jQuery");
      }
      else
      {
        throw new Error("Missing required jQuery plugin: "+result);
      }
    }
    return this;
  }

  /**
   * Run checkJq; return false if the value was a string, or true otherwise.
   */
  Lum.wantJq = function ()
  {
    const result = Lum.checkJq.apply(this, arguments);
    return (typeof result !== 'string');
  }

  // If 'window.Nano' does not already exist, create it.
  Lum.exportAlias('Nano');

})(window);

