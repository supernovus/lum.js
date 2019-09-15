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
   * Make a global alias to ourself.
   */
  Lum.exportAlias = function (target, overwrite=false)
  {
    this.registerNamespace(target, this, overwrite);
  }

  /**
   * Mark a library as loaded.
   *
   * @param {string} lib  The name of the library we are marking as loaded.
   */
  Lum.markLib = function (lib)
  {
    this._loaded[lib] = true;
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
   * Check for needed libraries. 
   *
   * They must have been marked as loaded to pass the test.
   *
   * Any arguments are the names of libraries we need.
   */
  Lum.needLibs = function ()
  {
    for (let l = 0; l < arguments.length; l++)
    {
      let lib = arguments[l];
      if (!this._loaded[lib])
      {
        throw new Error("Missing required library: "+lib);
      }
    }
  }

  /**
   * Check for needed jQuery plugins.
   */
  Lum.needJq = function ()
  {
    if (root.jQuery === undefined)
    {
      throw new Error("Missing jQuery");
    }
    let $ = root.jQuery;
    for (let l = 0; l < arguments.length; l++)
    {
      let lib = arguments[l];
      if ($.fn[lib] === undefined)
      {
        throw new Error("Missing required jQuery plugin: "+lib);
      }
    }
  }

  // If 'window.Nano' does not already exist, create it.
  Lum.exportAlias('Nano');

})(window);

