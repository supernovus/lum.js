/*
 * Lum Core: The engine for the Lum.js library set.
 */
(function (root)
{
  "use strict";

  if (root.Lum !== undefined)
  {
    console.warn("Lum already loaded.");
    return;
  }

  // A few quick private constants for tests.
  const O='object', F='function', S='string', B='boolean', N='number';

  // A private function to check for real objects (i.e. not null).
  function is_obj(v) { return (typeof v === O && v !== null); }

  // A private function to check for any non-null, non-undefined value.
  function not_null(v) { return (v !== undefined && v !== null); }

  // Constants for the clone() method added by addClone().
  const CLONE_DEF  = 0, // Shallow clone of enumerable properties. 
        CLONE_JSON = 1, // Deep clone using JSON (Arrays included).
        CLONE_FULL = 2, // Shallow clone of all object properties.
        CLONE_ALL  = 3; // Shallow clone of all properties (Arrays included).

  // Add a 'clone()' method to an object to return either a shallow or
  // deep clone of an object. The clone will by default also be given
  // the clone() method, so clones can be infinitely recursive.
  function addClone(obj, defReclone=true, defRelock=false)
  {
    return Object.defineProperty(obj, 'clone',
    {
      value: function (mode=CLONE_DEF, reclone=defReclone, relock=defRelock)
      {
        let clone;
        if (mode === CLONE_JSON)
        { // Deep clone enumerable properties using JSON trickery.
          clone = JSON.parse(JSON.stringify(obj));
        }
        else if (mode !== CLONE_FULL && Array.isArray(obj))
        { // Make a shallow copy using slice.
          clone = obj.slice();
        }
        else
        { // Build a clone using a simple loop.
          clone = {};

          let props;
          if (mode === CLONE_ALL || mode === CLONE_FULL)
          { // All object properties.
            props = Object.getOwnPropertyNames(obj);
          }
          else
          { // Enumerable properties.
            props = Object.keys(obj);
          }

          for (let p = 0; p < props.length; p++)
          {
            let prop = props[p];
            clone[prop] = obj[prop];
          }
        }

        if (reclone)
        { // Add the clone() method to the clone.
          addClone(clone, reclone, lock);
        }

        if (relock)
        { // Add the lock() method to the clone.
          addLock(clone);
        }

        return clone;
      }
    });
  }

  // Create a frozen, but (by default) clonable constant object.
  function lock(obj, clonable=true, reclone=true, relock=true)
  {
    if (clonable)
    {
      addClone(obj, reclone, relock);
    }
    return Object.freeze(obj);
  }

  // Add a bound version of the lock function to an object.
  function addLock(obj)
  {
    return Object.defineProperty(obj, 'lock', lock.bind(null, obj));
  }

  // Constants for all common descriptor configs.
  const DESC_RO    = lock({}),
        DESC_CONF  = lock({configurable:true}),
        DESC_ENUM  = lock({enumerabe:true}),
        DESC_WRITE = lock({writable:true}),
        DESC_RW    = lock({configurable:true,writable:true}),
        DESC_DEF   = lock({configurable:true,enumerable:true}),
        DESC_OPEN  = lock({configurable:true,enumerable:true,writable:true});

  /** 
   * The global Lum namespace.
   *
   * @namespace Lum
   *
   * Can also be used as a special shortcut function in plugins.
   *
   * @param {object} opts  Options for the shortcut function usage.
   *
   *  "libs" {Array}          Apply as arguments to `needLibs()` method.
   *
   *  "jq"   {Array|true}     Call `needJq()` method:
   *                          If `Array` apply as arguments.
   *                          If `true`, call with no arguments.
   *
   *  "need" {Array}          Apply as arguments to `needNamespaces()` method.
   *
   *  "is"   {string}         Call `markLib()` with this single argument.
   *
   *  "ns"   {string|Array}   Call `registerNamespace()` method:
   *                          If `string` call with this single argument.
   *                          If `Array` apply as arguments.
   *                          NOTE: `registerNamespace()` first argument may
   *                          be an array, in order to use that optional
   *                          syntax, you'd have to use a nested array here.
   *                          e.g. `{"ns":[["name","space"], value, true]}`
   *
   * @return {mixed}  The return values depend on the options.
   *
   * If `opts.ns` was specified, return the value from `registerNamespace()`. 
   * Otherwise will return the Lum object itself.
   *
   * @throws {Error} Any errors that any of the requested methods can throw.
   */
  function Lum(opts={})
  {
    if (Array.isArray(opts.libs))
    { // Test for required Lum libraries.
      Lum.needLibs.apply(Lum, opts.libs);
    }

    if (opts.jq === true)
    { // See if jQuery is loaded.
      Lum.needJq();
    }
    else if (Array.isArray(opts.jq))
    { // See if specific jQuery extensions are loaded.
      Lum.needJq.apply(Lum, opts.jq);
    }

    if (Array.isArray(opts.need))
    { // Test for required namespaces.
      Lum.needNamespaces.apply(Lum, opts.need);
    }

    if (typeof opts.is === S)
    { // Mark the library as loaded.
      Lum.markLib(opts.is);
    }

    if (typeof opts.ns === S)
    { // A single namespace parameter.
      return Lum.registerNamespace(opts.ns);
    }
    else if (Array.isArray(opts.ns))
    { // Multiple parameters to be applied.
      return Lum.registerNamespace.apply(Lum, opts.ns);
    }
    else
    { // No ns option, we're done here.
      return Lum;
    }

  } // Lum() core function.

  // Store loaded libraries in a private object.
  const loaded = {};

  // Not using these yet, but plan to in v5.
  const wrap_defs = {}, wrap_opts = {};

  /**
   * A magic wrapper for Object.defineProperty()
   *
   * Yeah, there was the old addProperty(), addAccessor(), and addMetaHelpers()
   * methods in the helpers.js but I prefer how this is designed, and have
   * deprecated those methods (and indeed made them use this behind the scenes.)
   *
   * Rather than documenting the arguments in the usual manner, I'm
   * going to simply show all of the ways this method can be called.
   *
   * `Lum.prop(object)`
   *
   *   Return a function that is a bound copy of this function with
   *   the object as it's first parameter.
   *
   * `Lum.prop(object, string)`
   *
   *   Add a property to the object which is mapped to a bound copy of
   *   this function with the object as it's first parameter.
   *
   * `Lum.prop(object, string, function, function)`
   *
   *   Add a getter and setter property with the default descriptor.
   *
   * `Lum.prop(object, string, function, function, object)`
   *
   *   Add a getter and setter property with specified descriptor options.
   *   Do not use `get`, `set`, or `value` in the descriptor options.
   *
   * `Lum.prop(object, string, function, null, object)`
   *
   *   Add a getter only with specified descriptor options.
   *   Same restrictions to the descriptor options as above.
   *   You can specify `{}` as the descriptor options to use the defaults.
   *
   * `Lum.prop(object, string, null, function, object)`
   *
   *   Add a setter only with specified descriptor options.
   *   Same restrictions as above, and again you can use `{}` for defaults.
   *
   * `Lum.prop(object, string, !null)`
   *
   *   Add a property with the specified non-null value.
   *   This uses the default descriptor.
   *
   * `Lum.prop(object, string, !null, object)`
   *
   *   Add a property value with the specified descriptor options.
   *   Has the same restrictions to the descriptor options as above.
   *
   * `Lum.prop(object, string, null, object)`
   *
   *   Add a property using the descriptor object alone.
   *   This has no restrictions to the descriptor object except those
   *   enforced by Object.defineProperty() itself.
   *   There's no real benefit to this usage over Object.defineProperty(),
   *   other than being slightly shorter to type. Your choice.
   *
   */
  Lum.prop = function (obj, prop, arg1, arg2, arg3)
  {
    if (prop === undefined)
    { // A special case, returns a function bound to the object.
      return Lum.prop.bind(Lum, obj);
    }
    else if (typeof prop !== S)
    { // The property must in every other case be a string.
      throw new Error("Non-string property passed to Lum.prop()");
    }

    let desc = {};

    if (arg1 === undefined && arg2 === undefined)
    { // Another special case, the property is a bound version of this.
      return Lum.prop(obj, prop, Lum.prop(obj));
    }
    else if (typeof arg1 === F && typeof arg2 === F)
    { // A getter and setter were specified.
      if (is_obj(arg3))
      { // A custom descriptor.
        desc = arg3;
      }
      desc.get = arg1;
      desc.set = arg2;
    }
    else if (typeof arg1 === F && arg2 === null && is_obj(arg3))
    { // A getter without a setter.
      desc = arg3;
      desc.get = arg1;
    }
    else if (arg1 === null && typeof arg2 == F && is_obj(arg3))
    { // A setter without a getter.
      desc = arg3;
      desc.set = arg2;
    }
    else
    { // Not a getter/setter, likely a standard value.
      if (is_obj(arg2))
      { // A set of options to replace the descriptor.
        desc = arg2;
      }
      
      if (arg1 !== undefined && arg1 !== null)
      { // If you really want a null 'value', use a custom descriptor.
        desc.value = arg1;
      }
    }

    // If we reached here, we should have a valid descriptor now.
    return Object.defineProperty(obj, prop, desc);
  }

  // Exporting our static helpers via a '_' property.
  Lum.prop(Lum, '_', lock(
  {
    O, F, S, B, N, is_obj, not_null, lock, addClone, addLock,
    DESC_RO, DESC_CONF, DESC_ENUM, DESC_WRITE, DESC_RW, DESC_DEF, DESC_OPEN,
    CLONE_DEF, CLONE_JSON, CLONE_FULL, CLONE_ALL,
  }));

  // And a circular reference to the raw, un-proxied Lum object.
  Lum.prop(Lum, 'self', Lum);

  /**
   * Context object.
   *
   * Tries to determine what browser context this is loaded in.
   */
  Lum.prop(Lum, 'context',
  {
    root: root,
    isWindow: () => root.window !== undefined,
    isWorker: () => root.WorkerGlobalScope !== undefined,
    isServiceWorker: () => root.ServiceWorkerGlobalScope !== undefined,
  });

  /**
   * Namespace management object.
   */
  Lum.prop(Lum, 'ns', {});

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
   * @param {mixed} [value] Assign to the last element of the namespace.
   *
   *   If this is null or undefined, it won't be used. Anything else will be.
   *
   * @param {boolean} [overwrite=false] Overwrite the last element if it exists.
   *  
   *  Only applicable if assign was used.
   *
   * @param {mixed} [useprop=null] How to assign the added namespaces.
   *
   *   If this is `true` we will use Lum.prop() to assign them, with the
   *   descriptor object set in `Lum.registerNamespace.defaultDescriptor`;
   *
   *   If this is `false` will will simply use direct assignment.
   *
   *   If this is an {object} we will use Lum.prop() with it as the descriptor.
   *
   *   If this is anything else (including null), we will set it to the
   *   value in the `Lum.registerNamespace.useProp` property.
   *
   * @return {object}  The last element of the namespace added.
   */
  const reg = Lum.ns.register = function (namespaces, value, 
    overwrite=false, 
    useprop=null)
  {
    if (typeof namespaces === S)
    {
      namespaces = namespaces.split('.');
    }
    else if (!Array.isArray(namespaces))
    {
      throw new Error("namespaces must be string or array");
    }

    let desc = reg.defaultDescriptor;

    if (is_obj(useprop))
    { // An explicit descriptor was passed, use it.
      desc = useprop;
      useprop = true;
    }
    else if (typeof useprop !== B)
    { // Use the default useprop value.
      useprop = reg.useProp;
    }

    function assign(obj, prop, val={})
    {
      if (useprop)
      {
        Lum.prop(obj, prop, val, desc);
      }
      else
      {
        obj[prop] = val;
      }
    }

    let cns = root;
    let nscount = namespaces.length;
    let lastns = nscount - 1;

//    console.debug("registerNamespace", namespaces, assign, overwrite, nscount, lastns);
    for (let n = 0; n < nscount; n++)
    {
      let ns = namespaces[n];
//      console.debug("Looking for namespace", n, ns, cns, cns[ns]);
      if (cns[ns] === undefined)
      {
        if (n == lastns && not_null(value))
        {
          assign(cns, ns, value);
//          console.debug("Assigned", ns, cns[ns], assign);
        }
        else
        {
          assign(cns, ns);
        }
      }
      else if (overwrite && n == lastns && not_null(assign))
      {
        assign(cns, ns, value);
      }  
      cns = cns[ns];
    }

    return cns;
  }

  Lum.registerNamespace = reg; // TODO: use wrap_defs instead.

  // Use prop() to register namespaces.
  reg.useProp = true;

  // The descriptor used by default to register namespaces.
  reg.defaultDescriptor = DESC_ENUM.clone();

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
    if (typeof namespaces === S)
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
   *  Lum.link(self.base91, 'Base91.mscdex');
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
   * Mark a library as loaded.
   *
   * @param {string} lib  The name of the library we are marking as loaded.
   */
  Lum.markLib = function (lib)
  {
    loaded[lib] = true;
    return this;
  }

  /**
   * See if a library is loaded.
   *
   * @param {string} lib  The name of the library we are looking for.
   */
  Lum.hasLib = function (lib)
  {
    return loaded[lib];
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
      if (typeof lib === S && !loaded[lib])
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
    if (typeof result === S)
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
    return (typeof result !== S);
  }

  /**
   * Get a list of loaded libraries. The array returned is a copy.
   */
  Lum.listLibs = function ()
  {
    return loaded.slice();
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
    if (typeof result === S)
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
    return (typeof result !== S);
  }

  /**
   * Mark a function/method/property as deprecated.
   *
   * Adds a warning to the Console that the method is deprecated.
   *
   * It can also optionally give example replacement code, and run a function 
   * that will call the replacement code automatically.
   *
   * @param {string} name  The name of the deprecated method/property/etc.
   *
   *   This should actually be the full method signature, or at least the
   *   signature matching what a call to the deprecated method made.
   *
   *   So rather than 'someOldMethod', use 'MyClass.someOldMethod(foo, bar)'
   *   as a more detailed name. This is only used in the Console warning.
   *
   *   This is the only mandatory parameter.
   *
   * @param {mixed} [replace={}]  Replacement options.
   * 
   *   If this is a {string}, it is the same as passing an {object} with
   *   the following options specified:
   *
   *     ```{msg: replace}```
   *
   *   If it is a {function}, it is the same as passing an {object} with
   *   the following options specified:
   *
   *     ```{exec: replace, msg: true, strip: true}```
   *
   *   If it is an {object}, then it will be a set of options:
   *
   *     "exec" {function}
   *
   *       If specified, this function will be called and the value returned.
   *       No paramters are passed to the function, so it should be a simple 
   *       anonymous closure which simply calls the actual replacement code.
   *
   *     "msg" {string|boolean}
   *
   *       If this is a {string} it will be added to the warning output.
   *
   *       If this is `true` and `exec` is set, we will extract the function
   *       text using `exec.toString()` and add it to the warning output.
   *
   *       In any other cases, no replacement message will be appended.
   *
   *     "strip" {boolean}
   *
   *       If this is `true`, then we will strip `'function() { return '`
   *       from the start of the function text (whitespace ignored), as well
   *       as stripping '}' from the very end of the function text.
   *
   *       This is only applicable if `exec` is set, and `msg` is `true`.
   *
   *   If the `replace` value is none of the above, it will be ignored.
   *
   * @return {mixed}  The output is dependent on the parameters passed.
   *
   * If `replace` is a function or an object with 
   *
   * In any other case the return value will be undefined.
   *
   */
  const dep = Lum.deprecated = function (name, replace={})
  {
    const DEP_MSG = ':Deprecated =>';
    const REP_MSG = ':replaceWith =>';

    if (typeof replace === S)
    { // A string replacement example only.
      replace = {msg: replace};
    }
    else if (typeof replace === F)
    { // A function replacement.
      replace = {exec: replace, msg: true, strip: true};
    }
    else if (!is_obj(replace))
    { // Not an object, that's not valid.
      replace = {};
    }

    const msgs = [DEP_MSG, name];
    const exec = (typeof replace.exec === F) 
      ? replace.exec
      : null;

    if (exec && replace.msg === true)
    { // Extract the function text.
      const strip = (typeof replace.strip === B)
        ? replace.strip
        : false;

      let methtext = replace.toString();

      if (strip)
      { // Remove wrapping anonymous closure function.
        methtext = methtext.replace(/^function\(\)\s*\{\s*(return\s*)?/, '');
        methtext = methtext.replace(/\s*\}$/, '');
      }

      // Set the replacement msg to the method text.
      replace.msg = methtext;
    }

    if (typeof replace.msg === 'string')
    { // A replacement message.
      msgs.push(REP_MSG, replace.msg);
    }

    // Show the messages.
    console.warn.apply(console, msgs);

    // Finally, call the replacement function if it was defined.
    if (exec)
    {
      return exec();
    }
  }

  /**
   * TODO: document this. Not using it yet, but v5 likely will.
   */
  dep.wrap = function (obj, defs, opts={})
  {
    const hasValue = (prop) => 
      typeof defs[prop] === O && defs[prop].value !== undefined;

    const hasGetter = (prop) =>
      typeof defs[prop] === O && typeof defs[prop].get === F; 

    const hasSetter = (prop) =>
      typeof defs[prop] === O && typeof defs[prop].set === F;

    const useProxy = typeof opts.useProxy === B ? opts.useProxy : true;
    const assignDirect 
      = typeof opts.assignDirect === B ? opts.assignDirect : false;
    
    if (useProxy && root.Proxy !== undefined)
    { // We have the Proxy object, hurray.
      return new Proxy(obj, 
      { 
        // Getter trap.
        get(target, prop, receiver)
        {
          if (prop in target)
          { // It exists in the target.
            return target[prop];
          }
          else if (hasValue(prop))
          { // A static value, send it along.
            return defs[prop].value;
          }
          else if (hasGetter(prop))
          { // A getter method, pass through.
            return defs[prop].get.call(target);
          }
        },
        // Setter trap.
        set(target, prop, value, receiver)
        {
          if (prop in target)
          { // It exists in the target. Let's hope it's writable.
            target[prop] = value;
            return true;
          }
          else if (hasSetter(prop))
          { // A setter method, pass through.
            return defs[prop].set.call(target, value);
          }
          else
          { // A final fallback to the target again.
            target[prop] = value;
            return true;
          }
        },
      }); // new Proxy
    }
    else
    { // We're going to assign the wrapper methods directly.
      for (const prop in defs)
      {
        if (obj[prop] === undefined)
        {
          if (assignDirect && hasValue(prop))
          { // We are going to use a cheap shortcut here.
            obj[prop] = defs[prop].value;
          }
          else
          { // Set up the property with a full descriptor.
            Lum.prop(obj, prop, null, defs[prop]);
          }
        }
      } // for prop
      return obj;
    }

  } // dep.wrap()

  // Now let's export Lum itself.
  Lum.registerNamespace('Lum', dep.wrap(Lum, wrap_defs, wrap_opts));

  // As well as the Nano alias if applicable.
  Lum.registerNamespace('Nano', root.Lum);

})(self);

