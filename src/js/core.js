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

})(typeof self !== 'undefined' ? self : this, function (init)
{ // Welcome to the factory.
  "use strict";

  const root = init.root;

  // A few quick private constants for tests.
  const O='object', F='function', S='string', B='boolean', N='number',
        U='undefined', SY='symbol', BI='bigint';

  // Check for non-null objects (i.e. not null).
  function isObj(v) { return (typeof v === O && v !== null); }

  // Check for a "complex" value (i.e. object or function).
  function isComplex(v) { return (typeof v === F || isObj(v)); }

  // A function to check if a value is undefined or null.
  function isNil(v) { return (v === undefined || v === null); }

  // A function to check for any non-null, non-undefined value.
  function notNil(v) { return (v !== undefined && v !== null); }

  // A function to check if passed object is an Arguments object.
  function isArguments(item) 
  {
    return Object.prototype.toString.call(item) === '[object Arguments]';
  }

  // See if an object is an instance.
  function isInstance(v, what, needProto=false) 
  {
    if (!isObj(v)) return false; // Not an object.
    if (needProto && (typeof v.prototype !== O || v.prototype === null))
    { // Has no prototype.
      return false;
    }

    if (typeof what !== F || !(v instanceof what)) return false;

    // Everything passed.
    return true;
  }

  function Enum (obj, opts={})
  {
    if (!isObj(obj))
    {
      throw new Error("Non-object passed to Lum.Enum");
    }

    let useSymbols     = false, 
        globalSymbol   = false, 
        useNameAsValue = false, 
        lockEnum       = true,
        useLock        = false;

    if (typeof opts.globals === B)
    { // Use of globals automatically assumes use of symbols.
      useSymbols = globalSymbol = opts.globals;
    }
    
    if (typeof opts.symbols === B)
    { // We can use symbols without globals.
      useSymbols = opts.symbols;
    }
    else if (typeof opts.symbols === S && opts.symbols[0].toUpperCase() === 'G')
    { // Another way to set both useSymbols and globalSymbol all at once.
      useSymbols = globalSymbol = true;
    }

    if (typeof opts.strings === B)
    {
      useNameAsValue = opts.strings;
    }

    if (opts.lock === true)
    { 
      useLock = true;
    }
    else if (opts.lock === false)
    {
      lockEnum = false;
    }

    const anEnum = {};

    function getVal (name, def)
    {
      if (useSymbols)
      { // We want to use symbols.
        if (globalSymbol)
        {
          return Symbol.for(name);
        }
        else
        {
          return Symbol(name);
        }
      }
      else
      { // Just gonna use simple auto-incrementing integers.
        return def;
      }
    }

    if (Array.isArray(obj))
    { // An array of strings is expected.
      for (let i = 0; i < obj.length; i++)
      {
        const prop = obj[i];
        if (typeof prop !== S)
        {
          throw new Error("Non-string passed in Lum.Enum object");
        }
        const val = useNameAsValue ? prop : i;
        anEnum[prop] = getVal(prop, val);
      }
    }
    else
    { // An object mapping of property name to value.
      for (let prop in obj)
      {
        const val = obj[prop];
        const name = (typeof val === S) ? val : prop;
        anEnum[prop] = getVal(name, val);
      }
    }

    if (lockEnum)
    {
      return useLock ? lock(anEnum) : Object.freeze(anEnum);
    }

    return anEnum;
  }

  // Supported modes for the clone() method.
  const CLONE = Enum(['DEF','JSON','FULL','ALL']);

  // Create a magic Descriptor object used by our internal functions.
  function descriptor(desc, accessorSafe, addBools)
  {
    if (typeof desc === B)
    { // This is a special case.
      accessorSafe = desc;
      addBools = true;
      desc = {};
    }

    if (!isObj(desc)) 
      throw new Error("First parameter (desc) must be a descriptor template object");

    if (!Object.isExtensible(desc))
      throw new Error("First parameter (desc) must not be locked, sealed, frozen, etc.");

    if (typeof accessorSafe !== B)
    { // Auto-detect accessorSafe value based on the existence of 'writable' property.
      accessorSafe = (desc.writable === undefined);
    }
    
    // Add a function or other property.
    function add(name, val)
    {
      Object.defineProperty(desc, name, {value: val, configurable: true});
    }

    add('accessorSafe', accessorSafe);

    add('setValue', function (val, noClean)
    {
      if (this.get !== undefined || this.set !== undefined)
      {
        console.error("Accessor properties already defined", this);
        //throw new Error("Accessor properties already defined, cannot set value");
      }

      this.value = val;
      
      return this;
    });

    if (accessorSafe)
    {
      function validate ()
      {
        if (this.value !== undefined)
        { 
          console.error("Data 'value' property defined", this);
          //throw new Error("Data value property already defined, cannot set accessors");
        }

        for (const arg of arguments)
        { // All accessor arguments must be functions.
          if (typeof arg !== F) throw new Error("Parameter must be a function");
        }
      }

      add('setGetter', function(func)
      {
        validate.call(this, func);
        this.get = func;
        return this;
      });

      add('setSetter', function(func)
      {
        validate.call(this, func);
        this.set = func;
        return this;    
      });

      add('setAccessor', function(getter, setter)
      {
        validate.call(this, getter, setter);
        this.get = getter;
        this.set = setter;
        return this;
      });

    } // accessorSafe

    if (addBools)
    {
      function addBool(propname)
      {
        const flagname = propname[0];
        Object.defineProperty(desc, flagname,
        {
          configurable: true,
          get: function () { this[propname] = true; return this; },
        });
      }

      addBool('configurable');
      addBool('enumerable');
      addBool('writable');

    } // addBools

    return desc;
  }

  // A function to test for a descriptor, and yes we're using duck typing.
  function isDescriptor(desc)
  {
    return (typeof desc === O && typeof desc.accessorSafe === B && typeof desc.setValue === F);
  }

  function getDescriptor(desc)
  {
    return isDescriptor(desc) ? desc : descriptor(desc);
  }

  // A factory for building descriptor rules.
  const DESC =
  {
    get RO()    { return descriptor(true)  },
    get CONF()  { return descriptor(true).c  },
    get ENUM()  { return descriptor(true).e  },
    get WRITE() { return descriptor(false).w },
    get RW()    { return descriptor(false).c.w },
    get DEF()   { return descriptor(true).c.e  },
    get OPEN()  { return descriptor(false).c.e.w },
  }

  /**
   * Clone an object or function.
   *
   * @param {object|function} obj - The object we want to clone.
   * @param {object} [opts={}] - Options for the cloning process.
   * 
   * @param {number} [opts.mode=MODE_DEFAULT] - One of the `Lum._.clone.MODE_*` constants.
   *
   *   `MODE_DEFAULT`    - Shallow clone of enumerable properties for most objects.
   *   `MODE_JSON`       - Deep clone using JSON serialization (Arrays included.)
   *   `MODE_FULL`       - Shallow clone of all object properties.
   *   `MODE_ALL`        - Shallow clone of all properties (Arrays included.)
   *
   *   For any mode that doesn't saay "Arrays included", Array objects will
   *   use a shortcut technique of `obj.slice()` to create the clone.
   *
   * @param {boolean} [opts.addClone=false] - Call {@link Lum._.addClone} on the cloned object.
   *
   *   The options sent to this function will be used as the defaults in
   *   the clone() method added to the object.
   *
   * @param {boolean} [opts.addLock=false] - Call {@link Lum._.addLock} on the cloned object.
   *
   *   No further options for this, just add a lock() method to the clone.
   *
   * @return {object} - The clone of the object.
   *
   * @method Lum._.clone
   */
  function clone(obj, opts={}) 
  {
    //console.debug("Lum~clone()", obj, opts);

    if (!isComplex(obj))
    { // Doesn't need cloning.
      //console.debug("no cloning required");
      return obj;
    }

    if (!isObj(opts))
    { // Opts has to be a valid object.
      opts = {};
    }

    const mode    = typeof opts.mode      === N ? opts.mode      : CLONE.DEF;
    const reclone = typeof opts.addClone  === B ? opts.addClone  : false;
    const relock  = typeof opts.addLock   === B ? opts.addLock   : false;

    let copy;

    //console.debug("::clone", {mode, reclone, relock});

    if (mode === CLONE.JSON)
    { // Deep clone enumerable properties using JSON trickery.
      //console.debug("::clone using JSON cloning");
      copy = JSON.parse(JSON.stringify(obj));
    }
    else if (mode !== CLONE.ALL && Array.isArray(obj))
    { // Make a shallow copy using slice.
      //console.debug("::clone using Array.slice()");
      copy = obj.slice();
    }
    else
    { // Build a clone using a simple loop.
      //console.debug("::clone using simple loop");
      copy = {};

      let props;
      if (mode === CLONE.ALL || mode === CLONE.FULL)
      { // All object properties.
        //console.debug("::clone getting all properties");
        props = Object.getOwnPropertyNames(obj);
      }
      else
      { // Enumerable properties.
        //console.debug("::clone getting enumerable properties");
        props = Object.keys(obj);
      }

      //console.debug("::clone[props]", props);

      for (let p = 0; p < props.length; p++)
      {
        let prop = props[p];
        copy[prop] = obj[prop];
      }
    }

    if (reclone)
    { // Add the clone() method to the clone, with the passed opts as defaults.
      addClone(copy, opts);
    }

    if (relock)
    { // Add the lock() method to the clone.
      addLock(copy, opts);
    }

    return copy;
  }

  /**
   * Add a clone() method to an object.
   *
   * @param {object|function} obj - The object to add clone() to.
   * @param {object} [defOpts=null] Default options for the clone() method.
   *
   * If `null` or anything other than an object, the defaults will be:
   *
   * ```{mode: CLONE.DEF, addClone: true, addLock: false}```
   *
   * @method Lum._.addClone
   */
  function addClone(obj, defOpts=null)
  {
    if (!isObj(defOpts))
    { // Assign a default set of defaults.
      defOpts = {mode: CLONE.DEF, addClone: true, addLock: false};
    }

    const defDesc = getDescriptor(defOpts.cloneDesc ?? DESC.CONF);

    defDesc.setValue(function (opts)
    {
      if (!isObj(opts)) 
        opts = defOpts;
      return clone(obj, opts);
    });

    return Object.defineProperty(obj, 'clone', defDesc);
  }

  /**
   * Clone an object if it's not extensible (locked, sealed, frozen, etc.)
   *
   * If the object is extensible, it's returned as is.
   *
   * If not, if the object has a `clone()` method it will be used.
   * Otherwise use the {@link Lum._.clone} method.
   *
   * @param {object} obj - The object to clone if needed.
   * @param {object} [opts] - Options to pass to `clone()` method.
   *
   * @return {object} - Either the original object, or an extensible clone.
   *
   * @method Lum._.cloneIfLocked
   */
  function cloneIfLocked(obj, opts)
  {
    if (!Object.isExtensible(obj))
    {
      if (typeof obj.clone === F)
      { // Use the object's clone() method.
        return obj.clone(opts);
      }
      else
      { // Use our own clone method.
        return clone(obj, opts);
      }
    }

    // Return the object itself, it's fine.
    return obj;
  }

  /**
   * Lock an object using Object.freeze()
   *
   * @param {object} obj - The object we want to lock.
   * @param {boolean} [clonable=true] Pass to {@link Lum._.addClone} first?
   * @param {object} [cloneOpts=null] Options for addClone.
   * @param {boolean} [useSeal=false] Use Object.seal() instead of freeze.
   *
   * If cloneOpts is `null` then we will use the following:
   *
   * ```{mode: CLONE.DEF, addClone: true, addLock: true}```
   *
   * @return {object} The locked object.
   *
   * @method Lum._.lock
   */
  function lock(obj, clonable=true, cloneOpts=null, useSeal=false)
  {
    if (clonable)
    { // Add the clone method before freezing.
      if (!isObj(cloneOpts))
      {
        cloneOpts = {mode: CLONE.DEF, addClone: true, addLock: true};
      }
      addClone(obj, cloneOpts);
    }

    // Now freeze (or seal) the object.
    return (useSeal ? Object.seal(obj) : Object.freeze(obj));
  }

  /**
   * Add a lock() method to an object.
   *
   * Adds a wrapper version of {@link Lum._.lock} to the object as a method.
   *
   * @param {object} obj - The object we're adding lock() to.
   * @param {object} opts - Options (TODO: document this).
   *
   * @method Lum._.addLock
   */
  function addLock(obj, opts)
  {
    const defDesc = getDescriptor(opts.lockDesc ?? DESC.CONF);
    defDesc.setValue(function(obj, cloneable, cloneOpts, useSeal)
    {
      if (typeof cloneable !== B) clonable = opts.addClone ?? true;
      if (!isObj(cloneOpts)) cloneOpts = opts; // Yup, just a raw copy.
      if (typeof useSeal !== B) useSeal = opts.useSeal ?? false;
      return lock(obj, cloneable, cloneOpts, useSeal);
    });
    return Object.defineProperty(obj, 'lock', defDesc);
  }

  /**
   * The core Lum namespace.
   *
   * @namespace Lum
   *
   * Has a bunch of properties defined to be used with the various methods.
   *
   * @property {boolean} $ourselfUnwrapped - Whether `ourself()` returns the
   *                                         raw `Lum` object, or the wrapped
   *                                         `Proxy` instance. Default: `true`;
   *
   * @property {boolean} $nsSelfUnwrapped - Whether `Lum.ns.$self()` uses the
   *                                        raw or wrapped `Lum` object when
   *                                        exporting global variables.
   *                                        Default is `true` on Node.js and
   *                                        `false` anywhere else.
   */
  const Lum = 
  {
    $ourselfUnwrapped: true,
    $nsSelfUnwrapped:  init.node,
  };

  // Store loaded libraries in a private object.
  const loaded = {};

  // Pass `this` here to see if it's considered unbound.
  function unbound(whatIsThis, lumIsUnbound=false, rootIsUnbound=true)
  {
    if (whatIsThis === undefined || whatIsThis === null) return true;
    if (rootIsUnbound && whatIsThis === root) return true;
    if (lumIsUnbound && whatIsThis === Lum) return true;

    // Nothing considered unbound was `this` so we're good.
    return false;
  }

  /**
   * A magic wrapper for Object.defineProperty()
   *
   * @method Lum.prop
   *
   * Rather than documenting the arguments in the usual manner, I'm
   * going to simply show all of the ways this method can be called.
   * 
   * Anywhere the `target` parameter is shown, this parameter can be an `object` or `function`.
   * It's the target to which we're adding new properties.
   * 
   * Anywhere the `property` parameter is shown, this parameter can be specified in two different
   * forms. The first and simplest is as a `string` in which case it's simply the name of the property we're adding.
   * The second more advanced form is as an `object`. If it is specified as an object, then it is a set of special options.
   * In this case, a property of that `property` object called `name` will be used as the name of the property.
   * If the `name` property is absent or `undefined`, it's the same as not passing the `property` parameter at all, 
   * and a *bound* function will be returned, using the custom options as its bound defaults.
   * 
   * See below the usage 
   *
   * `Lum.prop(object)`
   *
   *   Return a function that is a bound copy of this function with
   *   the object as it's first parameter.
   *
   * `Lum.prop(object, property)`
   *
   *   Add a property to the object which is mapped to a bound copy of
   *   this function with the object as it's first parameter.
   *
   * `Lum.prop(object, property, function, function)`
   *
   *   Add a getter and setter property with the default descriptor.
   *
   * `Lum.prop(object, property, function, function, object)`
   *
   *   Add a getter and setter property with specified Descriptor options.
   *   Do not use `get`, `set`, or `value` in the descriptor options.
   *
   * `Lum.prop(object, property, function, null, object)`
   *
   *   Add a getter only with specified descriptor options.
   *   Same restrictions to the descriptor options as above.
   *   You can specify `{}` as the descriptor options to use the defaults.
   *
   * `Lum.prop(object, property, null, function, object)`
   *
   *   Add a setter only with specified descriptor options.
   *   Same restrictions as above, and again you can use `{}` for defaults.
   *
   * `Lum.prop(object, property, !null)`
   *
   *   Add a property with the specified non-null value.
   *   This uses the default descriptor.
   *
   * `Lum.prop(object, property, !null, object)`
   *
   *   Add a property value with the specified descriptor options.
   *   Has the same restrictions to the descriptor options as above.
   *
   * `Lum.prop(object, property, null, object)`
   *
   *   Add a property using the descriptor object alone.
   *   This has no restrictions to the descriptor object except those
   *   enforced by Object.defineProperty() itself.
   *   There's no real benefit to this usage over Object.defineProperty(),
   *   other than being slightly shorter to type. Your choice.
   *
   */
  function prop(obj, name, arg1, arg2, arg3)
  {
    let opts;

    if (typeof name === O)
    { // A way to set some special options.
      opts = name;
      name = opts.name;
    }
    else if (unbound(this, true, true))
    { // Use the default options.
      opts = isObj(prop.options) ? prop.options : {};
    }
    else if (typeof this === O)
    { // This is already a bound copy, so `this` is the options.
      opts = this;
    }
    else 
    { // Something weird is going on here...
      throw new Error("Invalid `this` in a prop() function call");
    }

    if (name === undefined)
    { // A special case, returns a copy of this function bound to the object.
      return prop.bind(opts, obj);
    }
    else if (typeof name !== S)
    { // The property must in every other case be a string.
      throw new Error("Non-string property name passed to Lum.prop()");
    }

    let desc;

    if (arg1 === undefined && arg2 === undefined)
    { // Another special case, the property is a bound version of this.
      return prop(obj, name, prop.bind(opts, obj));
    }
    else if (typeof arg1 === F && typeof arg2 === F)
    { // A getter and setter were specified.
      desc = getDescriptor(isObj(arg3) ? cloneIfLocked(arg3) : DESC.CONF);
      desc.setAccessor(arg1, arg2);
    }
    else if (isObj(arg3))
    { // A custom descriptor for an accessor, find the accessor.
      desc = getDescriptor(cloneIfLocked(arg3));
      if (typeof arg1 === F)
      { // A getter-only accessor.
        desc.setGetter(arg1);
      }
      else if (typeof arg2 === F)
      { // A setter-only accessor.
        desc.setSetter(arg2);
      }
    }
    else
    { // Not a getter/setter, likely a standard value.
      desc = getDescriptor(isObj(arg2) ? cloneIfLocked(arg2) : DESC.CONF);
      
      if (notNil(arg1))
      { // If you really want a null 'value', use a custom descriptor.
        desc.setValue(arg1);
      }
    }

    // If we reached here, we should have a valid descriptor now.
    return Object.defineProperty(obj, name, desc);
  }

  // The very first use of prop() is to add it to Lum as a method.
  prop(Lum, 'prop', prop);

  // Now we wrap up the descriptor related methods for use outside here.
  prop(DESC, 'make', descriptor);
  prop(DESC, 'is', isDescriptor);
  prop(DESC, 'get', getDescriptor);

  // And add the CLONE enum to the clone function as the MODE property.
  prop(clone, 'MODE', CLONE);

  /**
   * Build a lazy initializer property.
   *
   * Basically the first time the property is accessed it's built.
   * Subsequent accesses will use the already built property.
   * This is an extension of the {@link Lum.prop} method.
   *
   * @param {object} obj - The object to add the property to.
   * @param {string} prop - The name of the property to add.
   * @param {function} initfunc - The function to initialize the property.
   * @param {object} [desc=DESC.CONF] The descriptor for the property.
   *
   * @return {object} The object we defined the property on.
   *
   * @method Lum.prop.lazy
   */
  function lazy(obj, name, initfunc, desc=DESC.CONF)
  {
    if (!isComplex(obj))
    {
      throw new Error("prop.lazy() obj parameter was not an object");
    }
    if (typeof name !== S)
    {
      throw new Error("prop.lazy() name parameter was not a string");
    }
    if (typeof initfunc !== F)
    {
      throw new Error("prop.lazy() initfunc parameter was not a function");
    }

    let value;

    function func()
    {
      if (value === undefined)
      {
        value = initfunc();
      }
      return value;
    }

    prop(obj, name, func, null, desc);
  }

  prop(Lum, 'lazy', lazy);
  prop(Lum, 'Enum', Enum);

  /**
   * Context object.
   *
   * Tries to determine what browser context this is loaded in.
   * And a few other useful features.
   *
   * @namespace Lum.context
   */
  const ctx = prop(Lum, 'context', init).context;
  //const ctx = Lum.context;
  prop(ctx, 'isWindow', root.window !== undefined);
  prop(ctx, 'isWorker', root.WorkerGlobalScope !== undefined);
  prop(ctx, 'isServiceWorker', root.ServiceWorkerGlobalScope !== undefined);
  prop(ctx, 'hasProxy', root.Proxy !== undefined);

  //console.debug("Lum.context", ctx, ctx.hasProxy);

  function setFlag(flags, flag, value=true)
  {
    if (typeof flags !== N) throw new Error("Flags must be number");
    if (typeof flag !== N) throw new Error("Flag must be number");

    if (value)
      flags = flags | flag;
    else
     flags = flags - (flags & flag);

    return flags;
  }

  // Similar to Enum, but represented as binary flags.
  function Flags ()
  {
    let opts = {};

    const flags = 
    {
      value: 0, 
      nextSetter: true,
      thenSetter: true,
    };

    function set(name, getter, setter=null)
    {
      prop(flags, name, getter, setter, DESC.CONF);
    }

    set('not', function()
    {
      this.nextSetter = false;
      return this;
    });

    set('is', function()
    {
      this.nextSetter = true;
      return this;
    });

    set('then', function()
    {
      this.thenSetter = this.nextSetter;
      return this;
    });

    let flagCount = 0;
    let flagIterator = 1;

    for (const flagName of arguments)
    {
      if (isObj(flagName))
      { // Not a name, but options.
        opts = flagName;
        continue;
      }
      else if (typeof flagName !== S)
      {
        throw new Error("Only strings and objects are valid argumentse");
      }

      if (flags[flagName] !== undefined)
      {
        throw new Error("Duplicate flag name "+flagName);
      }

      const flagVal = flagIterator;

      set(flagName, function()
      { // This is the recommended way to set a flag.
        setFlag(this.value, flagVal, this.nextSetter);
        this.nextSetter = this.thenSetter;
        return this;
      }, 
      function (val)
      { // Manually set the flag to a specific value.
        setFlag(this.value, flagVal, val);
      });

      flagCount++;
      flagIterator *= 2;
    }

    if (flagCount === 0)
    {
      console.error("No flag definitions found", arguments, flags);
    }
    else if (flagCount === 1)
    {
      console.warn("Only a single flag definition", arguments, flags);
    }

    return flags;
  }

  // Make 'Flags.set()` available.
  prop(Flags, 'set', setFlag);
  prop(Lum, 'Flags', Flags);

  // A private cache of wrapper objects.
  const wrappers = [];

  /**
   * A class used to create Proxy-wrapped objects.
   *
   * Meant for allowing backwards compatibility modes.
   */
  Lum.Wrapper = class
  {
    /**
     * Get a wrapper for the given object.
     *
     * If one has already been created, return it.
     * Otherwise create a new one, register it, and return it.
     *
     * @param {object} obj - The object we want to wrap.
     * @param {object} opts - If creating a new one, options to set.
     */
    static getWrapper(obj=Lum, opts=Lum.Wrapper.getWrapperOpts)
    {
      //console.debug("Wrapper.getWrapper", obj, opts);
      const isProxy = (ctx.hasProxy && isInstance(obj, Proxy, true));

      for (let i = 0; i < wrappers.length; i++)
      {
        if (isProxy)
        {
          if (wrappers[i].proxy === obj)
          { // Found an existing wrapper for the Proxy.
            return wrappers[i];
          }
        }
        else
        {
          if (wrappers[i].obj === obj)
          { // Found an existing wrapper for the raw object.
            return wrappers[i];
          }
        }
      }

      // Did not find a wrapper, let's make one.
      const wrapper = new Lum.Wrapper(obj, opts);

      wrappers.push(wrapper);

      return wrapper;
    }

    constructor(obj, opts=Lum.Wrapper.constructorOpts)
    {
      //console.debug("Wrapper~constructor()", obj, opts);
      if (!isComplex(obj))
      {
        throw new Error("Wrapper~construtor: obj was not a valid object");
      }

      this.obj = obj;
      this.defs = {};

      this.assign   = typeof opts.assign === B ? opts.assign : false;
      this.fatal    = typeof opts.fatal  === B ? opts.fatal  : false;
      this.warn     = typeof opts.warn   === B ? opts.warn   : true;
      this.useproxy = typeof opts.proxy  === B ? opts.proxy  : ctx.hasProxy;
      this.ns       = typeof opts.ns     === S ? opts.ns     : '';

      this.proxy = null;
    }

    add(prop, item)
    {
      //console.debug("Wrapper.add", prop, item, this.obj, this);

      const isDescriptor = (isObj(item) && (item.value !== undefined
        || item.get !== undefined || item.set !== undefined));

      if (this.useproxy)
      { // We'll use our internal descriptor map.
        if (isDescriptor)
        { // It's a descriptor, assign it directly.
          this.defs[prop] = item;
        }
        else if (notNil(item))
        { // It's some other value, make a minimal descriptor for it.
          this.defs[prop] = {value: item}
        }
      }
      else
      { // No proxy, we'll add the method to the object itself.
        if (this.obj[prop] === undefined)
        { // We will only add a wrapped property if it does not exist alreaday.
          if (this.assign && item.value !== undefined)
          { // Use direct assignment. Only works with descriptors with a 'value'.
            this.obj[prop] = item.value;
          }
          else
          { // Set up the property with a full descriptor.
            Lum.prop(this.obj, prop, null, item);
          }
        }
        else if (this.fatal)
        {
          throw new Error(`Cannot overwrite existing property ${prop}`);
        }
        else if (this.warn)
        {
          console.warn("Cannot overwrite existing property", prop, item);
        }
      }

    } // add()

    wrap()
    {
      if (!this.useproxy)
      { // Nothing to proxy.
        return this.obj;
      }

      if (notNil(this.proxy))
      { // Already created a Proxy.
        return this.proxy;
      }

      const hasValue = prop => 
        typeof this.defs[prop] === O && this.defs[prop].value !== undefined;

      const getValue = prop => this.defs[prop].value;

      const hasGetter = prop =>
        typeof this.defs[prop] === O && typeof this.defs[prop].get === F; 

      const getGetter = prop => this.defs[prop].get;

      const hasSetter = prop =>
        typeof this.defs[prop] === O && typeof this.defs[prop].set === F;

      const getSetter = prop => this.defs[prop].set

      let proxy = new Proxy(this.obj, 
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
            return getValue(prop);
          }
          else if (hasGetter(prop))
          { // A getter method, pass through.
            return getGetter(prop).call(target);
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
            return getSetter(prop).call(target, value);
          }
          else
          { // A final fallback to the target again.
            target[prop] = value;
            return true;
          }
        },
      }); // new Proxy

      // Cache the Proxy.
      this.proxy = proxy;

      return proxy;

    } // wrap()

  } // Lum.Wrapper

  // Default options for Wrapper.getWrapper() method.
  // This is the recommended method to get a Wrapper library.
  Lum.Wrapper.getWrapperOpts = {fatal: true};

  // Default options for Wrapper() constructor.
  // This is not recommended for direct use, use getWrapper() instead.
  Lum.Wrapper.constructorOpts = {warn: true};

  // A wrapper instance for Lum itself.
  const wrap = Lum.Wrapper.getWrapper();

  /**
   * Return the Lum object itself.
   *
   * @param {boolean} [raw=Lum.$ourselfUnwrapped] Use the unwrapped Lum object?
   *
   * If false, this will return the Proxy wrapped object.
   *
   * @return object  Either the Lum object, or a Proxy of the Lum object.
   *
   * @method Lum._.ourself
   */
  function ourself(raw=Lum.$ourselfUnwrapped)
  {
    return raw ? Lum : wrap.wrap();
  }

  /**
   * @property Lum.self
   *
   * A read-only accessor that returns the output of {@link Lum._.ourself}
   */
  prop(Lum, 'self', ourself, null, DESC.CONF);

  // Internal method for adding backwards compatibility to the Lum._ property.
  function COMPAT(_)
  {
    // First lets make compatibility wrappers for each of the old DESC_* properties.
    const DESCS = ['RO','CONF','ENUM','WRITE','RW','DEF','OPEN'];

    for (const desc of DESCS)
    {
      const getter = function()
      {
        console.warn(`The DESC_${desc} constant is deprecated; use DESC.${desc} instead.`);
        return lock(DESC[desc]);
      }
      prop(_, 'DESC_'+desc, getter, null, DESC.CONF);
    }

    // And the CLONE_ variables.
    for (const cname in CLONE)
    {
      _['CLONE_'+cname] = CLONE[cname];
    }

    // Now add aliases for a few renamed functions.
    const RENAMED = 
    {
      is_obj: isObj,
      is_complex: isComplex,
      non_null: notNil,
      is_instance: isInstance,
    };

    for (const oldname in RENAMED)
    {
      _[oldname] = RENAMED[oldname];
    }

    // When all compatibility is done, return the object.
    return _;
  }

  /**
   * The Lum._ property is a (mostly) read-only collection of useful
   * constants and functions which can be imported into libraries.
   *
   * It is locked by default so it cannot be directly modified.
   * It can be extended using it's own extend(newprops) method, which will
   * add any new properties in the passed object. It WILL NOT overwrite any
   * existing properties. Once a property is added to '_', it cannot be
   * removed or replaced. This is for mostly indomitable constants only.
   *
   * A few constants and functions that might be useful:
   *
   * `O, F, S, B, N, U, SY, BI` - the Javascript type names as strings.
   * `isObj, isNul, notNil, isComplex, isInstance, isArguments` - type checks.
   * `clone, lock, addClone, addLock, cloneIfLocked` - cloning/locking methods.
   * `prop, lazy, Enum` - Same as the `Lum.*` methods of the same name.
   * `ourself` - The same as the `Lum.self()` method.
   * `DESC` - The Descriptor Factory object.
   * `CLONE` - The `clone()` mode Enum (also `clone.MODE`)
   * 
   * Some deprecated aliases that will be removed in version 5:
   * 
   * `DESC_*` - The old Descriptor constants (now deprecated.)
   * `CLONE_*` - all of the old cloning constants, see {@link Lum._.clone}.
   * `is_obj, is_complex, non_null, is_instance` - type checks.
   *
   * The use of object destructuring is recommended for importing, like:
   *
   * ```
   *  const {O,F,isObj,clone} = Lum._;
   * ```
   *
   * @namespace Lum._
   *
   * All of the `DESC_*` properties are magic Descriptor objects for use with
   * the `prop()` function. There's also a few extra properties used to change
   * the default behaviours of certain methods and functions.
   *
   * @property {object} DESC          - Descriptor Factory.
   * @property {object} DESC.RO       - Indomitable Descriptor.
   * @property {object} DESC.CONF     - Configurable Descriptor.
   * @property {object} DESC.ENUM     - Enumerable Descriptor.
   * @property {object} DESC.WRITE    - Writable Descriptor.
   * @property {object} DESC.RW       - Configurable, writable Descriptor.
   * @property {object} DESC.DEF      - Configurable, enumerable Descriptor.
   * @property {object} DESC.OPEN     - Fully changeable Descriptor.
   * @property {function} DESC.is     - Is the passed object a magic Descriptor.
   * @property {function} DESC.make   - Make a magic Descriptor object.
   * @property {function} DESC.get    - Shortcut: `(obj) => DESC.is(obj) ? obj : DESC.make(obj)`
   *
   * @see Lum._.clone
   * @see Lum.prop
   */
  prop(Lum, '_', lock(COMPAT(
  {
    // Type checking constants.
    O, F, S, B, N, U, SY, BI,
    // Type checking functions. 
    isObj, notNil: notNil, isComplex, isInstance, isArguments,
    // Low-level object utilities.
    clone, lock, addClone, addLock, cloneIfLocked, ourself, prop,
    lazy, Enum, DESC, CLONE, Flags, setFlag,

    // A method to extend the '_' property.
    extend(newprops)
    {
      const desc = Object.getOwnPropertyDescriptor(Lum, '_');
      const __ = clone(Lum._); // Clone the current '_' property.
      for (let prop in newprops)
      {
        if (__[prop] === undefined)
        { // Add a new property.
          __[prop] = newprops[prop];
        }
      }
      // Okay, now let's reassign '_' using the new value.
      prop(Lum, '_', lock(__, false), desc);
    },

  }), false), DESC.CONF); // Lum._

  //console.debug("TESTING clone == _.clone", 
  //  clone, Lum._.clone, (clone === Lum._.clone));

  /**
   * Namespace management object.
   *
   * @namespace Lum.ns
   */
  prop(Lum, 'ns', {name: 'Lum'});

  /**
   * Register a global Namespace.
   *
   * @method Lum.ns.add
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
   *   descriptor object set in `Lum.ns.add.defaultDescriptor`;
   *
   *   If this is `false` will will simply use direct assignment.
   *
   *   If this is an {object} we will use Lum.prop() with it as the descriptor.
   *
   *   If this is anything else (including null), we will set it to the
   *   value in the `Lum.ns.add.useProp` property.
   *
   * @return {object} - The last element of the namespace added.
   */
  prop(Lum.ns, 'add', function (namespaces, value, 
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

    let desc = Lum.ns.defaultDescriptor;

    if (isObj(useprop))
    { // An explicit descriptor was passed, use it.
      desc = useprop;
      useprop = true;
    }
    else if (typeof useprop !== B)
    { // Use the default useprop value.
      useprop = Lum.ns.useProp;
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

    //let dbg = {namespaces, assign, overwrite, nscount, lastns, value, useprop};
    //console.debug("Lum.ns.add", dbg);

    for (let n = 0; n < nscount; n++)
    {
      let ns = namespaces[n];
//      console.debug("Looking for namespace", n, ns, cns, cns[ns]);

      if (cns[ns] === undefined)
      { // Nothing in this namespace yet.
        if (n == lastns && notNil(value))
        { // We have a value to assign.
          assign(cns, ns, value);
//          console.debug("Assigned", ns, cns[ns], value);
        }
        else
        { // Nothing to assign, create an empty object instead.
          assign(cns, ns);
        }
      }
      else if (overwrite && n == lastns && notNil(value))
      {
        assign(cns, ns, value);
      }

      cns = cns[ns];
    }

    return cns;
  }); // Lum.ns.add()

  wrap.add('registerNamespace', Lum.ns.add);

  // API to add new child namespaces, by default under the Lum prefix.
  prop(Lum.ns, 'new', function(namespaces, value, prefix='Lum', useprop=null)
  {
    //console.debug("Lum.ns.new", namespaces, value, prefix, useprop);

    if (typeof namespaces === S)
    {
      namespaces = `${prefix}.${namespaces}`;
    }
    else if (Array.isArray(namespaces) && namespaces.length > 0)
    {
      namespaces.unshift(prefix);
    }
    else
    {
      throw new Error("namespaces must be string or array");
    }

    return Lum.ns.add(namespaces, value, false, useprop);
  });

  // Use prop() to register namespaces.
  Lum.ns.useProp = true;

  // The descriptor used by default to register namespaces.
  Lum.ns.defaultDescriptor = DESC.DEF;

  // A wrapper around `new()` to make building libraries easier.
  prop(Lum.ns, 'build', function(opts)
  {
    if (typeof opts === S)
    { // Assume it's the ns option.
      opts = {ns: opts};
    }
    else if (!isObj(opts))
    {
      throw new Error("Invalid options");
    }

    const prefix   = opts.prefix  ?? 'Lum';
    const propName = opts.addProp ?? '_add';

    const ns = opts.ns ?? opts.name ?? opts.path;

    // Build the library namespace object.
    const newNS = Lum.ns.new(ns, opts.value, prefix, opts.useProp);

    if (typeof propName === S)
    { // Add the prop wrapper.
      prop(newNS, propName);
    }

    // Finally, return the library object.
    return newNS;
  });

  /**
   * Get a namespace.
   *
   * @method Lum.ns.get
   *
   * @param {string|array} namespaces  A namespace definition.
   * @param {boolean} [logerror=false] Log errors for missing namespaces?
   *
   * @return {mixed} The namespace if it exists, or `undefined` if it doesn't.
   */
  prop(Lum.ns, 'get', function (namespaces, logerror=false)
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
  });

  wrap.add('getNamespace', Lum.ns.get);

  /**
   * See if a namespace exists.
   *
   * @method Lum.ns.has
   *
   * @param {string|array} namespaces  A namespace definition.
   * @param {boolean} [logerror=false] Log errors for missing namespaces?
   *
   * @return {boolean} Does the namespace exist?
   */
  prop(Lum.ns, 'has', function (namespaces, logerror=false)
  {
    return (Lum.ns.get(namespaces, logerror) !== undefined);
  });

  wrap.add('hasNamespace', Lum.ns.has);

  /**
   * Check for needed namespaces.
   *
   * @param {...string} Any arguments are the names of namespaces we need.
   *
   * @return {Lum} - The Lum core object.
   *
   * @throw Error - If a required namespace is missing, an error is thrown.
   *
   * @method Lum.ns.need
   */
  prop(Lum.ns, 'need', function ()
  {
    for (let n = 0; n < arguments.length; n++)
    {
      let ns = arguments[n];
      if (!Lum.ns.has(ns))
      {
        throw new Error("Missing required namespace/library: "+JSON.stringify(ns));
      }
    }
    return ourself();
  });

  wrap.add('needNamespaces', Lum.ns.need);
  wrap.add('needNamespace',  Lum.ns.need);

  /**
   * Export a global namespace to another global namespace.
   *
   * @param {string|strings[]} source  The namespace to export.
   * @param {string|strings[]} target  The target namespace.
   * @param {boolean} [overwrite=false]
   */
  prop(Lum.ns, 'export', function (source, target, overwrite=false)
  {
    if (!overwrite && Lum.ns.has(target))
    {
      console.error("Will not overwrite namespace", target);
      return;
    }
    let ns = Lum.ns.get(source, true);
    if (ns === undefined)
    { // Nothing to export, goodbye.
      return;
    }
    return Lum.ns.add(target, ns, overwrite);
  });

  wrap.add('exportNamespace', Lum.ns.export);

  /**
   * Make a link to a library/function into another namespace.
   *
   * @method Lum.ns.link
   *
   * As an example, if there's a global function called base91() and we want to
   * make an alias to it called Lum.Base91.mscdex() then we'd call:
   *
   *  Lum.ns.link(self.base91, 'Base91.mscdex');
   *
   * @param {object|function} obj - The library/function we're linking to.
   * @param {string} target - The namespace within {prefix} we're assigning to.
   * @param {boolean} [overwrite=false] Overwrite existing target namespace?
   * @param {string} [prefix="Lum."] Prefix for the namespace target.
   *
   * @return Lum  The core Lum library is returned for chaining purposes.
   */
  prop(Lum.ns, 'link', function (obj, target, overwrite=false, prefix="Lum.")
  {
    Lum.ns.add(prefix+target, obj, overwrite);
    return ourself();
  });

  // Register a global variable (or multiple) for Lum itself.
  prop(Lum.ns, '$self', function ()
  {
    const self = Lum.$nsSelfUnwrapped ? Lum : wrap.wrap();
    const args = Array.prototype.slice.call(arguments);

    if (args.length === 0) args[0] = 'Lum'; // Default name.
    
    for (let i = 0; i < args.length; i++)
    {
      Lum.ns.add(args[i], self);
    }
  });

  const LIB_TYPES = Enum(
  [
    'NULL',
    'LUM',
    'ROOT',
    'NS',
    'ARGS',
  ], 
  {
    strings: true
  });

  /**
   * Lum library manager.
   *
   * @method Lum.lib
   *
   * Usage: At the very top of library files, instead of wrapping the library
   * in a self executing block, use `Lum.lib(name, opts, func);` instead.
   * The `func` should be the same as the one that used to be in the block.
   *
   * @param {string} name - The name of the library we are registering.
   *                        This will be passed to `Lum.lib.mark()` when
   *                        the library and its dependencies are loaded.
   *
   * @param {object} opts - Options for dependencies, etc.
   *                        If this is an `Array` we assume it's `opts.deps`
   *
   * @param {Array}  [opts.deps] Check if the librarise have been loaded.
   *                             If already loaded, we're good. 
   *                             Otherwise we will try to load them with 
   *                             `Lum.load.modules()` (assuming that the
   *                             filename is `libraryname.js`).
   *                             When the `Lum.load.modules()` has finished 
   *                             loading all modules,
   *                             we'll pass this to `Lum.lib.need()` to ensure
   *                             they loaded properly.
   *
   * @param {Array}  [opts.jq]   Just like `opts.deps` but for jQuery plugins.
   *                             That is currently all the `*.jq.js` files.
   *                             Do not specify the `.jq.js` part.
   * 
   * @param {object|string} [opts.ns] If specified, this will be passed as the
   *                                  arguments to a `Lum.ns.build()` call.
   *
   * @param {string} [opts.this] The `this` in the `func` will be set to:
   *
   *                             - `Lum.lib.TYPE.NULL` -- Plain old `null`.
   *                             - `Lum.lib.TYPE.LUM`  -- The `Lum` object.
   *                             - `Lum.lib.TYPE.ROOT` -- The `root` object.
   *                             - `Lum.lib.TYPE.NS`   -- The `ns` object.
   *                             - `Lum.lib.TYPE.ARGS` -- The `arguments` passed.
   * 
   *                             Default is `NS ?? LUM`.
   * 
   * @param {Array} [opts.args] The arguments passed to the registration function.
   *                            An array of `Lum.lib.TYPE` values, in the order
   *                            they should be passed to the method.
   *                            Default is `[LUM, ARGS]`.
   * 
   * @param {function} func - The library registration function.
   *                          This does all the rest of building the library.
   *                          
   * @namespace Lum.lib
   */
  prop(Lum, 'lib', function (name, opts, func)
  {
    if (typeof name !== S) throw new Error("name must be a string");
    if (typeof opts !== O) throw new Error("opts must be an object");
    if (typeof func !== F) throw new Error("func must be a function");

    let nsObj = null;

    if (Array.isArray(opts))
    {
      opts = {deps: opts};
    }

    if (Array.isArray(opts.deps))
    {
      const needed = opts.deps;
      const missing = Lum.lib.checkList(...needed);
      if (missing.length > 0)
      { // Oh dear, let's try loading them.
        Lum.load.modules(...missing);
        setTimeout(() => Lum.ns.need(missing), 250);
      }
    }

    if (Array.isArray(opts.jq))
    {
      const needed = opts.jq;
      const missing = Lum.jq.checkList(...needed);
      if (missing.length > 0)
      {
        if (missing.includes('jQuery'))
        {
          throw new Error("jQuery is not loaded, but is required");
        }
        const toLoad = missing.map(dep => dep + '.jq');
        Lum.load.modules(...toLoad);
        setTimeout(() => Lum.jq.need(missing), 250);
      }
    }

    if (notNil(opts.ns))
    {
      nsObj = Lum.ns.build(opts.ns);
    }

    let thisObj = nsObj ?? Lum;

    const libArgs = arguments;

    function getThis(thisType, def)
    {
      switch(thisType)
      {
        case LIB_TYPES.NULL:
          return null;
        case LIB_TYPES.LUM:
          return Lum;
        case LIB_TYPES.ROOT:
          return root;
        case LIB_TYPES.NS:
          return nsObj;
        case LIB_TYPES.ARGS:
          return libArgs;
        default:
          return def;
      }
    }

    if (isComplex(opts.this))
    {
      thisObj = opts.this;
    }
    else if (typeof opts.this === S)
    {
      thisObj = getThis(opts.this, thisObj);
    }

    let funcArgs = [];

    if (Array.isArray(opts.args))
    {
      for (const arg of opts.args)
      {
        if (isComplex(arg))
        {
          funcArgs.push(arg);
        }
        else if (typeof arg === S)
        {
          const argVal = getThis(arg);
          if (argVal !== undefined)
          { // Anything other than undefined is just fine.
            funcArgs.push(argVal);
          }
        }
      }
    }

    if (funcArgs.length === 0)
    { // Use defaults.
      funcArgs.push(Lum, nsObj, libArgs);
    }

    // Okay, now we call the function!
    return (func.apply(thisObj, funcArgs) ?? nsObj ?? Lum);
  });

  prop(Lum.lib, 'TYPE', LIB_TYPES);

  /**
   * Mark a library as loaded.
   *
   * @param {string} lib  The name of the library we are marking as loaded.
   */
  prop(Lum.lib, 'mark', function (lib)
  {
    loaded[lib] = true;
    return ourself();
  });

  wrap.add('markLib', Lum.lib.mark);

  /**
   * See if a library is loaded.
   *
   * @param {string} lib - The name of the library we are looking for.
   *
   * @return {bool} - If the library is loaded or not.
   */
  prop(Lum.lib, 'has', function (lib)
  {
    return loaded[lib] ?? false;
  });

  wrap.add('hasLib', Lum.lib.has);

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
  prop(Lum.lib, 'check', function ()
  {
    for (let l = 0; l < arguments.length; l++)
    {
      const lib = arguments[l];
      if (typeof lib === S && !loaded[lib])
      {
        return lib;
      }
    }
  });

  wrap.add('checkLibs', Lum.lib.check);

  /**
   * A version of `check()` that returns a list of missing
   * dependencies. If all are there it'll return an
   * empty array.
   */
  prop(Lum.lib, 'checkList', function ()
  {
    const missing = [];
    for (let l = 0; l < arguments.length; l++)
    {
      const lib = arguments[l];
      if (typeof lib === S && !loaded[lib])
      {
        if (!missing.includes(lib))
        {
          missing.push(lib);
        }
      }
    }
    return missing;
  });

  /**
   * Run checkLibs; if it returns a string, throw a fatal error.
   */
  prop(Lum.lib, 'need', function ()
  {
    const result = Lum.lib.check.apply(Lum.lib, arguments);
    if (typeof result === S)
    {
      throw new Error("Missing required Lum library: "+result);
    }
    return ourself();
  });

  wrap.add('needLibs', Lum.lib.need);
  wrap.add('needLib', Lum.lib.need);

  /**
   * Run checkLibs; return false if the value was a string, or true otherwise.
   */
  prop(Lum.lib, 'want', function ()
  {
    const result = Lum.lib.check.apply(Lum.lib, arguments);
    return (typeof result !== S);
  });

  wrap.add('wantLibs', Lum.lib.want);

  /**
   * Get a list of loaded libraries.
   */
  prop(Lum.lib, 'list', function ()
  {
    return Object.keys(loaded);
  });

  /**
   * jQuery library helper.
   *
   * @namespace Lum.jq
   */
  prop(Lum, 'jq', function()
  {
    if (arguments.length === 0)
    {
      return Lum.jq.get();
    }
    else 
    {
      return Lum.jq.check(...arguments);
    }
  });

  /**
   * Get jQuery itself.
   *
   * If Lum.jq.$ is assigned, we return it.
   * Otherwise we return root.jQuery.
   */
  prop(Lum.jq, 'get', function ()
  {
    return (typeof Lum.jq.$ === 'object') ? Lum.jq.$ : root.jQuery;
  });

  /**
   * Check for needed jQuery plugins.
   */
  prop(Lum.jq, 'check', function ()
  {
    const $ = Lum.jq.get();

    if (typeof $ === U)
    {
      return 'jQuery';
    }

    for (let l = 0; l < arguments.length; l++)
    {
      const lib = arguments[l];
      if ($.fn[lib] === undefined)
      {
        return lib;
      }
    }
  });

  wrap.add('checkJq', Lum.jq.check);

  /**
   * Check for needed jQuery plugins.
   */
     prop(Lum.jq, 'checkList', function ()
     {
       const $ = Lum.jq.get();
   
       if (typeof $ === U)
       { // This is not good!
         return ['jQuery'];
       }

       const missing = [];
   
       for (let l = 0; l < arguments.length; l++)
       {
         const lib = arguments[l];
         if ($.fn[lib] === undefined)
         {
           missing.push(lib);
         }
       }

       return missing;
     });

  /**
   * Run checkJq; if it returns a string, throw a fatal error.
   */
  prop(Lum.jq, 'need', function ()
  {
    const result = Lum.jq.check(...arguments);
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
    return ourself();
  });

  wrap.add('needJq', Lum.jq.need);

  /**
   * Run checkJq; return false if the value was a string, or true otherwise.
   */
  prop(Lum.jq, 'want', function ()
  {
    const result = Lum.jq.check(...arguments);
    return (typeof result !== S);
  });

  wrap.add('wantJq', Lum.jq.want);

  /**
   * See if a passed object is a jQuery instance.
   */
  prop(Lum.jq, 'is', function (obj)
  {
    const $ = Lum.jq.get();
    return isInstance(obj, $);
  });

  /**
   * Get jQuery wrapped element(s).
   *
   * @param {mixed} el  The element or jQuery selector.
   *
   *  If an `object` may be either a jQuery object (in which case it's returned
   *  as is, as it's already in the appropriate format), or a DOM Element, in
   *  which case we wrap the element with jQuery.
   *
   *  If a `string` it's assumed to be a jQuery selector statement, or raw
   *  HTML that will be converted into a jQuery wrapped element.
   *
   * @return {jQuery|null}  Will be `null` if `el` was not a valid value.
   *
   * Will also be `null` is jQuery is not found.
   *
   */
  prop(Lum.jq, 'wrap', function (el)
  {
    const $ = Lum.jq.get();
    if (!$) return null; // No jQuery, cannot continue.

    if (typeof el === S)
    { // A string is easy.
      return $(el);
    }
    else if (Lum.jq.is(el))
    { // It's already a jQuery object, return it as is.
      return el;
    }
    else if (isInstance(el, root.Element))
    { // It's a DOM Element, wrap it.
      return $(el);
    }
    else
    { // Sorry, we don't know how to handle this.
      return null;
    }
  });

  /**
   * Get a jQuery event property with transparent `originalEvent` handling.
   */
  prop(Lum.jq, 'eventProp', function (ev, prop, oeFirst=false)
  {
    const hasOE = isObj(ev.originalEvent);

    if (hasOE && oeFirst)
    {
      const oeVal = ev.originalEvent[prop];
      if (notNil(oeVal))
      {
        return oeVal;
      }
    }

    const evVal = ev[prop];
    if (notNil(evVal))
    {
      return evVal;
    }

    if (hasOE && !oeFirst)
    {
      const oeVal = ev.originalEvent[prop];
      if (notNil(oeVal))
      {
        return oeVal;
      }
    }
  });

  /**
   * Look for the `dataTransfer` event property.
   */
  prop(Lum.jq, 'dataTransfer', function (ev)
  {
    return Lum.jq.eventProp(ev, 'dataTransfer', true);
  });

  // A list of valid Lum.load modes.
  const LUM_LOAD_MODES = ['auto','data','js'];
  if (ctx.isBrowser) 
    LUM_LOAD_MODES.push('css');

  // Default Lum.load settings.
  const LUM_LOAD_DEFAULTS =
  {
    mode: 'auto',
    func: null,
    loc:  (ctx.isBrowser ? document.head : null),
    validate: true,
    scriptAttrs: {},
    linkAttrs: {},
    modulePrefix: '/scripts/nano/',
    moduleSuffix: '.js',
  }

  // Validators when setting values.
  const LUM_LOAD_VALID =
  {
    mode: (val) => (typeof val === S && LUM_LOAD_MODES.includes(val)),
    func: (val) => (typeof val === F || val === null),
    loc:  function(val)
    {
      if (ctx.isBrowser)
      {
        if (val instanceof Element)
        { // We're good.
          return true;
        }
        else if (Lum.jq.is(val) && val.length > 0)
        { // It's a jQuery selector.
          return val[0];
        }
      }
      else
      { // In any other context, 'loc' is not used.
        return false;
      }
    },
    validate: (val) => (typeof val === B),
    scriptAttrs: isObj,
    linkAttrs: isObj,
  }

  // Error information when validation fails.
  const LUM_LOAD_INVALID =
  {
    mode: ["Must be one of: ", LUM_LOAD_MODES],
    func: ["Must be a function or null"],
    loc:  [(ctx.isBrowser 
      ? "Must be an Element object instance, or a jQuery result with a single matching element" 
      : "Is not supported in this context")],
    validate: ["Must be a boolean value"],
  }

  { // Now we'll assign some extra settings for prefixes and suffixes.

    const AUTO = 'auto';
    const MOD  = 'module';

    const IS_STRING = (val) => (typeof val === S);
    const IS_STRING_HELP = ["Must be a string"];
    const LUM_LOAD_PATH_OPTS = ['Prefix', 'Suffix'];

    for (let mode of LUM_LOAD_MODES)
    {
      if (mode === AUTO)
      { // The auto mode has no options, but module mode does.
        mode = MOD;
      }

      for (const optType of LUM_LOAD_PATH_OPTS)
      {
        const opt = mode + optType;
        if (mode !== MOD)
        { // The default for path options is an empty string.
          LUM_LOAD_DEFAULTS[opt] = '';
        }
        LUM_LOAD_VALID[opt] = IS_STRING;
        LUM_LOAD_INVALID[opt] = IS_STRING_HELP;
      }
    }

    // Now for the special 'module*' load mode.
    for (const optType of LUM_LOAD_PATH_OPTS)
    {
      const opt = 'module' + optType;
      LUM_LOAD_VALID[opt] = IS_STRING;
      LUM_LOAD_INVALID[opt] = IS_STRING_HELP;
    }

  } // Prefix/suffix assignment block.
  
  // The function that does the validation.
  function validateLoadSetting(prop, value, reportInvalid, reportUnknown)
  {
    if (typeof LUM_LOAD_VALID[prop] === F)
    { // Call the validator, which will return `true`, `false`, or in some cases, a new valid value.
      const isValid = LUM_LOAD_VALID[prop].call(Lum.load, value)
      if (reportInvalid && isValid === false)
      { // Did not pass the test.
        const help = LUM_LOAD_INVALID[prop];
        console.error("Invalid value for setting", prop, value, ...help);
      }
      return isValid;
    }
    else if (reportUnknown)
    {
      console.error("Unknown setting");
    }
    return false;
  }

  /**
   * A simple resource loader.
   * 
   * In any context it can load JS files and data files.
   * In a browser context it can also load CSS stylesheets, and HTML fragments.
   * Replaces the old 'load.js' library which is now empty.
   */
  prop(Lum, 'load', function()
  {
    return Lum.load.globalContext.load(...arguments);
  });

  // Used by the loader functions to determine how to get secondary arguments.
  prop(Lum.load, 'isLoadSettings', false);

  // Make a new clone, and pass all arguments to it's `loadUsing()` method.
  function loadFromSetting ()
  {
    return this.clone().loadUsing(...arguments);
  }

  // Look for resources to load using the current settings.
  function loadUsingSetting ()
  {
    for (const a=0; a < arguments.length; a++)
    {
      const arg = arguments[a];

      if (arg === null || arg === undefined) continue; // These are invalid values for the loader.

      let url = null;

      // See if the argument is one of detectable option values.
      const foundSetting = this.setValue(arg);
      if (foundSetting)
      { // Settings were found and changed, time to move on.
        continue;
      }

      if (isObj(arg))
      { 
        if (Array.isArray(arg))
        { // An array of sub-arguments will get its own settings context.
          this.loadFrom(...arg);
          continue; // Now we're done.
        }

        // Check for settings we can set.
        this.set(arg, this.validate, false);

        // Look for mode-specific things.
        for (const mode of LUM_LOAD_MODES)
        {
          if (mode === 'auto') continue; // Nothing applicable to 'auto' mode here.

          if (Array.isArray(arg[mode]))
          { // An array of further options applicable to that mode.
            const subLoader = this.clone();
            const subArgs = arg[mode];
            subLoader.set({mode}, false);
            subLoader.loadUsing(...subArgs)
          }
        }

        // Finally, if there is a 'url' property, set our URL.
        if (typeof arg.url === S)
        {
          url = arg;
        }

      }
      else if (typeof arg === S)
      { // This is the only valid argument type left.
        url = arg;
      }
      
      if (typeof url === S)
      { // Okay, time to pass it on to a loader method.
        let loaderFunc;
        if (this.mode === 'auto')
        { // Determine the loader to use based on the extension.
          if (url.endsWith('.js'))
          {
            loaderFunc = Lum.load.js;
          }
          else if (ctx.isBrowser && url.endsWith('.css'))
          {
            loaderFunc = Lum.load.css;
          }
          else
          {
            loaderFunc = Lum.load.data;
          }
        } 
        else
        { // Use a directly specified loading mode.
          loaderFunc = Lum.load[this.mode];
        }
        loaderFunc.call(this, url);
      }

    }
  }

  // The `settings.set()` method, assigned by the `setupSettings()` function.
  // Allows us to set a bunch options all at once, and validate the values.
  function changeSettings (opts, validate, reportUnknown=true)
  {
    if (!isObj(opts))
    {
      throw new Error("set opts must be an object");
    }

    if (typeof validate !== B)
    {
      validate = this.validate;
    }

    for (const prop in opts)
    {
      if (LUM_LOAD_MODES.includes(prop)) continue; // Skip mode properties.

      let val = opts[prop];
      let okay = true;

      if (validate)
      { // Let's get the value.
        okay = validateLoadSetting(prop, val, true, reportUnknown);
        if (typeof okay !== B)
        { // A replacement value was passed.
          val = okay;
          okay = true;
        }
      }

      if (okay)
      { // Assign the setting.
        this[prop] = val;
      }
    }
  } // changeSettings()

  // The `settings.setValue()` method, assigned by the `setupSettings()` function.
  // Will return the name of a matching setting if one was found, or `null` otherwise.
  function updateMatchingSetting(value)
  {
    const DETECT_SETTINGS = ['mode', 'func', 'loc'];
    for (const prop in DETECT_SETTINGS)
    {
      const okay = validateLoadSetting(prop, value, false, false);
      if (okay !== false)
      { // Something other than false means a setting was found.
        if (okay !== true)
        { // Something other than true means a custom value was returned.
          value = okay;
        }
        this[prop] = value;
        return prop;
      }
    }

    // If we made it here, nothing matched.
    return null;
  }

  // The function to initialize a `Lum.load()` *settings object*.
  function setupSettings (settings)
  {
    if (!isObj(settings))
    {
      throw new Error("Settings must be an object");
    }

    // Yee haa.
    prop(settings, 'isLoadSettings', true);

    // Clone this *settings object* and run `setupSettings()` on the clone.
    prop(settings, 'clone', function()
    {      
      return setupSettings(clone(this));;
    });

    // Add a `set()` method that handles validation automatically.
    prop(settings, 'set', changeSettings);

    // Add a `setValue()` method that detects the type of value and sets an appropriate setting.
    prop(settings, 'setValue', updateMatchingSetting);

    // Load resources from a clone of these settings.
    prop(settings, 'loadFrom', loadFromSetting);

    // Load resources using these settings.
    prop(settings, 'loadUsing', loadUsingSetting);

    // Return the settings object.
    return settings;
  }

  // Global load defaults. Should only be changed via `Lum.load.set()`
  prop(Lum.load, 'globalContext', setupSettings({}));

  /**
   * Update global settings for the `Lum.load()` method.
   */
  prop(Lum.load, 'set', function (opts, validate)
  {
    return Lum.load.globalContext.set(opts, validate);
  });

  /**
   * Reset the global settings for the `Lum.load()` method.
   */
  prop(Lum.load, 'reset', function()
  {
    Lum.load.set(LUM_LOAD_DEFAULTS, false);
  });

  Lum.load.reset(); // Set the defaults now.

  function getLoaderOpts(caller, args, objAttr)
  {
    let opts;
    if (typeof args[0] === O && typeof args[0].url === S)
    { // Named options can be passed directly.
      opts = args[0];
    }
    else if (caller.isLoadSettings && typeof args[0] === S)
    { // We get all our options from the current settings object.
      opts = caller;
      opts.url = args[0];
    }
    else
    { // Loop the arguments to look for more options.
      opts = {};
      for (const arg of args)
      {
        if (opts.url === undefined && typeof arg === S)
        {
          opts.url = arg;
        }
        else if (opts.func === undefined && typeof arg === F)
        {
          opts.func = arg;
        }
        else if (opts.loc === undefined && arg instanceof Element)
        {
          opts.loc = arg;
        }
        else if (opts.loc === undefined && Lum.jq.is(arg) && arg.length > 0)
        {
          opts.loc = arg[0];
        }
        else if (opts[objAttr] === undefined && isObj(arg))
        {
          opts[objAttr] = arg;
        }
        else
        {
          console.error("Unknown or invalid parameter", arg, caller, args, objAttr);
        }
      }
    }

    if (!(typeof opts.url === S))
    {
      throw new Error("Could not find a valid 'url' parameter");
    }

    if (ctx.isBrowser && !isInstance(opts.loc, Element))
    { // Let's add the default loc.
      opts.loc = document.head;
    }

    return opts;
  }

  /**
   * Load JS
   */
  prop(Lum.load, 'js', function ()
  { 
    const opts = getLoaderOpts(this, arguments, 'scriptAttrs');

    const prefix = opts.jsPrefix || '';
    const suffix = opts.jsSuffix || '';

    const url = prefix + opts.url + suffix;

    if (ctx.isBrowser)
    {
      const script = document.createElement('script');
      if (typeof opts.scriptAttrs === O)
      {
        for (const attr in opts.scriptAttrs)
        {
          script[attr] = opts.scriptAttrs[attr];
        }
      }
      script.src = url;
      if (typeof opts.func === F)
      {
        script.onload = opts.func;
        script.onreadystatechange = opts.func;
      }
      opts.loc.appendChild(script);
    }
    else if (ctx.isWorker)
    { // A Worker or ServiceWorker.
      self.importScripts(url);
      if (typeof opts.func === F)
      {
        opts.func.call(opts);
      }
    }
    else if (ctx.node)
    { // Node works differently.
      if (Lum.load.$required === undefined)
      {
        Lum.load.$required = {};
      }
      const lib = Lum.load.$required[opts.url] = require(url);
      if (typeof opts.func  === F)
      {
        opts.func.call(opts, lib, Lum);
      }
    }
    else 
    {
      console.error("Lum.load.js() is not supported in this context", arguments, this, ctx, Lum);
    }
  });

  /**
   * Load CSS
   */
  prop(Lum.load, 'css', function ()
  {
    if (ctx.isBrowser)
    {
      const opts = getLoaderOpts(this, arguments, 'linkAttrs');

      const prefix = opts.cssPrefix || '';
      const suffix = opts.cssSuffix || '';

      const url = prefix + opts.url + suffix;

      const link = document.createElement('link');
      if (typeof opts.linkAttrs === 0)
      {
        for (const attr in opts.linkAttrs)
        {
          link[attr] = opts.linkAttrs[attr];
        }
      }
      link.rel = 'stylesheet';
      link.type = 'text/css';
      link.href = url;
      loc.appendChild(link);
      if (typeof opts.func === F)
      {
        opts.func.call(opts, link);
      }
    }
    else 
    {
      console.error("Lum.load.css() is not supported in this context", arguments, this, ctx, Lum);
    }
  });

  /**
   * Load arbitrary data, uses the Fetch API.
   */
  prop(Lum.load, 'data', function ()
  {
    if (typeof root.fetch !== F)
    {
      throw new Error("The Fetch API is not supported, cannot continue");
    }

    const opts = getLoaderOpts(this, arguments, 'fetch');

    const prefix = opts.dataPrefix || '';
    const suffix = opts.dataSuffix || '';

    const url = prefix + opts.url + suffix;

    const init = opts.fetch ?? {};

    const promise = fetch(url, init);
    if (typeof opts.func === F)
    { // The function handles both success and failure.
      return promise.then(function(response)
      {
        return opts.func.call(opts, response, true);
      }, 
      function(err)
      {
        return opts.func.call(opts, err, false);
      });
    }
    else 
    { // Return the fetch promise.
      return promise;
    }
  });

  /**
   * A convenience method for loading Lum.js modules.
   * This isn't an actual loader mode.
   */
  prop(Lum.load, 'modules', function(...modules)
  {
    return Lum.load(
    {
      jsPrefix: this.modulePrefix, 
      jsSuffix: this.moduleSuffix,
      js: modules,
    });
  })

  /**
   * Get a stacktrace. Differs from browser to browser.
   */
  prop(Lum, 'stacktrace', function (msg)
  {
    return (new Error(msg)).stack.split("\n");
  });

  /**
   * Abstract classes for Javascript.
   */
  prop(Lum, 'AbstractClass', class
  {
    /**
     * You must override the constructor.
     */
    constructor()
    {
      const name = this.constructor.name;
      throw new Error(`Cannot create instance of abstract class ${name}`);
    }

    /**
     * If you want to mark a method as abstract use this.
     */
    $abstract(name)
    {
      throw new Error(`Abstract method ${name}() was not implemented`);
    }

  });

  // Return the wrapped object.
  return wrap.wrap();

}));

