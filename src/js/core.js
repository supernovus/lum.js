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
  function is_obj(v) { return (typeof v === O && v !== null); }

  // Check for a "complex" value (i.e. object or function).
  function is_complex(v) { return (typeof v === F || is_obj(v)); }

  // A function to check for any non-null, non-undefined value.
  function non_null(v) { return (v !== undefined && v !== null); }

  // See if an object is an instance.
  function is_instance(v, what, needProto=false) 
  {
    if (!is_obj(v)) return false;
    if (needProto && (typeof v.prototype !== 'object' || v.prototype === null))
    { // Has no prototype.
      return false;
    }

    if (typeof what === F && !(v instanceof what)) return false;

    // Everything passed.
    return true;
  }

  // Constants for the clone() method.
  const CLONE_DEF  = 0,
        CLONE_JSON = 1,
        CLONE_FULL = 2,
        CLONE_ALL  = 3;

  /**
   * Clone an object or function.
   *
   * @param {object|function} obj - The object we want to clone.
   * @param {object} [opts={}] Options for the cloning process.
   * 
   * @param {number} [opts.mode=CLONE_DEF] One of the `Lum._.CLONE_*` constants.
   *
   *   `CLONE_DEF`    - Shallow clone of enumerable properties for most objects.
   *   `CLONE_JSON`   - Deep clone using JSON serialization (Arrays included.)
   *   `CLONE_FULL`   - Shallow clone of all object properties.
   *   `CLONE_ALL`    - Shallow clone of all properties (Arrays included.)
   *
   *   For any mode that doesn't saay "Arrays included", Array objects will
   *   use a shortcut technique of `obj.slice()` to create the clone.
   *
   * @param {boolean} [opts.addClone=false] Call {@link Lum._.addClone} on the cloned object.
   *
   *   The options sent to this function will be used as the defaults in
   *   the clone() method added to the object.
   *
   * @param {boolean} [opts.addLock=false] Call {@link Lum._.addLock} on the cloned object.
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

    if (!is_complex(obj))
    { // Doesn't need cloning.
      //console.debug("no cloning required");
      return obj;
    }

    if (!is_obj(opts))
    { // Opts has to be a valid object.
      opts = {};
    }

    const mode    = typeof opts.mode     === N  ? opts.mode : CLONE_DEF;
    const reclone = typeof opts.addClone === B ? opts.addClone : false;
    const relock  = typeof opts.addLock  === B ? opts.addLock  : false;

    let copy;

    //console.debug("::clone", {mode, reclone, relock});

    if (mode === CLONE_JSON)
    { // Deep clone enumerable properties using JSON trickery.
      //console.debug("::clone using JSON cloning");
      copy = JSON.parse(JSON.stringify(obj));
    }
    else if (mode !== CLONE_ALL && Array.isArray(obj))
    { // Make a shallow copy using slice.
      //console.debug("::clone using Array.slice()");
      copy = obj.slice();
    }
    else
    { // Build a clone using a simple loop.
      //console.debug("::clone using simple loop");
      copy = {};

      let props;
      if (mode === CLONE_ALL || mode === CLONE_FULL)
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
      addLock(copy);
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
   * ```{mode: CLONE_DEF, addClone: true, addLock: false}```
   *
   * @method Lum._.addClone
   */
  function addClone(obj, defOpts=null)
  {
    if (!is_obj(defOpts))
    { // Assign a default set of defaults.
      defOpts = {mode: CLONE_DEF, addClone: true, addLock: false};
    }

    return Object.defineProperty(obj, 'clone',
    {
      value: function (opts=defOpts)
      {
        return clone(obj, opts);
      }
    });
  }

  /**
   * Clone an object if it's not extensible (locked, sealed, frozen, etc.)
   *
   * If the object is extensible, it's returned as is.
   *
   * If not, if the object has a clone() method it will be used.
   * Otherwise use the {@link Lum._.clone} method with default options.
   *
   * @param {object} obj - The object to clone if needed.
   *
   * @return {object} Either the original object, or an extensible clone.
   *
   * @method Lum._.cloneIfLocked
   */
  function cloneIfLocked(obj)
  {
    if (!Object.isExtensible(obj))
    {
      if (typeof obj.clone === F)
      { // Use the object's clone() method.
        return obj.clone();
      }
      else
      { // Use our own clone method.
        return clone(obj);
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
   * ```{mode: CLONE_DEF, addClone: true, addLock: true}```
   *
   * @return {object} The locked object.
   *
   * @method Lum._.lock
   */
  function lock(obj, clonable=true, cloneOpts=null, useSeal=false)
  {
    if (clonable)
    { // Add the clone method before freezing.
      if (!is_obj(cloneOpts))
      {
        cloneOpts = {mode: CLONE_DEF, addClone: true, addLock: true};
      }
      addClone(obj, cloneOpts);
    }

    // Now freeze (or seal) the object.
    return (useSeal ? Object.seal(obj) : Object.freeze(obj));
  }

  /**
   * Add a lock() method to an object.
   *
   * Adds a bound version of {@link Lum._.lock} to the object as a method.
   *
   * @param {object} - The object we're adding lock() to.
   *
   * @method Lum._.addLock
   */
  function addLock(obj)
  {
    return Object.defineProperty(obj, 'lock', lock.bind(null, obj));
  }

  const DESC_RO    = lock({}),
        DESC_CONF  = lock({configurable:true}),
        DESC_ENUM  = lock({enumerabe:true}),
        DESC_WRITE = lock({writable:true}),
        DESC_RW    = lock({configurable:true,writable:true}),
        DESC_DEF   = lock({configurable:true,enumerable:true}),
        DESC_OPEN  = lock({configurable:true,enumerable:true,writable:true});

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

  /**
   * A magic wrapper for Object.defineProperty()
   *
   * @method Lum.prop
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
   *   Add a getter and setter property with specified Descriptor options.
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
  function prop(obj, name, arg1, arg2, arg3)
  {
    if (name === undefined)
    { // A special case, returns a copy of this function bound to the object.
      return prop.bind(Lum, obj);
    }
    else if (typeof name !== S)
    { // The property must in every other case be a string.
      throw new Error("Non-string property passed to Lum.prop()");
    }

    let desc = {};

    if (arg1 === undefined && arg2 === undefined)
    { // Another special case, the property is a bound version of this.
      return prop(obj, name, prop(obj));
    }
    else if (typeof arg1 === F && typeof arg2 === F)
    { // A getter and setter were specified.
      if (is_obj(arg3))
      { // A custom descriptor.
        desc = cloneIfLocked(arg3);
      }
      desc.get = arg1;
      desc.set = arg2;
    }
    else if (is_obj(arg3))
    { // A custom descriptor for an accessor, find the accessor.
      desc = cloneIfLocked(arg3);
      if (typeof arg1 === F)
      { // A getter-only accessor.
        desc.get = arg1;
      }
      else if (typeof arg2 === F)
      { // A setter-only accessor.
        desc.set = arg2;
      }
    }
    else
    { // Not a getter/setter, likely a standard value.
      if (is_obj(arg2))
      { // A set of options to replace the descriptor.
        desc = cloneIfLocked(arg2);
      }
      
      if (non_null(arg1))
      { // If you really want a null 'value', use a custom descriptor.
        desc.value = arg1;
      }
    }

    // If we reached here, we should have a valid descriptor now.
    return Object.defineProperty(obj, name, desc);
  }

  // The very first use of prop() is to add it to Lum as a method.
  prop(Lum, 'prop', prop);

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
   * @param {object} [desc=DESC_CONF] The descriptor for the property.
   *
   * @return {object} The object we defined the property on.
   *
   * @method Lum.prop.lazy
   */
  function lazy(obj, name, initfunc, desc=DESC_CONF)
  {
    if (!is_complex(obj))
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

  function makeEnum (obj, useSymbols=false, globalSymbol=false)
  {
    if (!is_obj(obj))
    {
      throw new Error("Non-object passed to Lum.makeEnum");
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
          throw new Error("Non-string passed in Lum.makeEnum object");
        }
        anEnum[prop] = getVal(prop, i);
      }
    }
    else
    { // An object mapping of property name to value.
      for (let prop in obj)
      {
        const val = obj[prop];
        anEnum[prop] = getVal(val, val);
      }
    }

    return anEnum;
  }

  prop(Lum, 'makeEnum', makeEnum);

  /**
   * Context object.
   *
   * Tries to determine what browser context this is loaded in.
   * And a few other useful features.
   *
   * @namespace Lum.context
   */
  prop(Lum, 'context', init);
  const ctx = Lum.context;
  lazy(ctx, 'isWindow', () => root.window !== undefined);
  lazy(ctx, 'isWorker', () => root.WorkerGlobalScope !== undefined);
  lazy(ctx, 'isServiceWorker', 
    () => root.ServiceWorkerGlobalScope !== undefined);
  lazy(ctx, 'hasProxy', () => root.Proxy !== undefined);

  console.debug("Lum.context", ctx, ctx.hasProxy);

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
      const isProxy = (ctx.hasProxy && is_instance(obj, Proxy, true));

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
      if (!is_complex(obj))
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

      const isDescriptor = (is_obj(item) && (item.value !== undefined
        || item.get !== undefined || item.set !== undefined));

      if (this.useproxy)
      { // We'll use our internal descriptor map.
        if (isDescriptor)
        { // It's a descriptor, assign it directly.
          this.defs[prop] = item;
        }
        else if (non_null(item))
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

      if (non_null(this.proxy))
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
  prop(Lum, 'self', ourself, null, DESC_CONF);

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
   * `is_obj, non_null, is_complex, is_instance` - type checking methods.
   * `clone, lock, addClone, addLock, cloneIfLocked` - cloning/locking methods.
   * `ourself` - the `ourself()` function.
   * `DESC_*` - all of the descriptor constants.
   * `CLONE_*` - all of the cloning constants, see {@link Lum._.clone}.
   *
   * The use of object destructuring is recommended for importing, like:
   *
   * ```
   *  const {O,F,is_obj,clone} = Lum._;
   * ```
   *
   * @namespace Lum._
   *
   * All of the `DESC_*` properties are locked Descriptor options for use with
   * the `prop()` function. There's also a few extra properties used to change
   * the default behaviours of certain methods and functions.
   *
   * @property {object} DESC_RO       - Indomitable Descriptor.
   * @property {object} DESC_CONF     - Configurable Descriptor.
   * @property {object} DESC_ENUM     - Enumerable Descriptor.
   * @property {object} DESC_WRITE    - Writable Descriptor.
   * @property {object} DESC_RW       - Configurable, writable Descriptor.
   * @property {object} DESC_DEF      - Configurable, enumerable Descriptor.
   * @property {object} DESC_OPEN     - Fully changeable Descriptor.
   *
   * @see Lum._.clone
   * @see Lum.prop
   */
  prop(Lum, '_', lock(
  {
    // Type checking constants and functions.
    O, F, S, B, N, U, SY, BI, is_obj, non_null, is_complex, is_instance,
    // Low-level object utilities.
    clone, lock, addClone, addLock, cloneIfLocked, ourself,
    // Descriptor constants.
    DESC_RO, DESC_CONF, DESC_ENUM, DESC_WRITE, DESC_RW, DESC_DEF, DESC_OPEN,
    // Cloning constants.
    CLONE_DEF, CLONE_JSON, CLONE_FULL, CLONE_ALL,

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

  }, false), DESC_CONF); // Lum._

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

    if (is_obj(useprop))
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

    let dbg = {namespaces, assign, overwrite, nscount, lastns, value, useprop};
    console.debug("Lum.ns.add", dbg);

    for (let n = 0; n < nscount; n++)
    {
      let ns = namespaces[n];
//      console.debug("Looking for namespace", n, ns, cns, cns[ns]);

      if (cns[ns] === undefined)
      { // Nothing in this namespace yet.
        if (n == lastns && non_null(value))
        { // We have a value to assign.
          assign(cns, ns, value);
//          console.debug("Assigned", ns, cns[ns], assign);
        }
        else
        { // Nothing to assign, create an empty object instead.
          assign(cns, ns);
        }
      }
      else if (overwrite && n == lastns && non_null(value))
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
    console.debug("Lum.ns.new", namespaces, value, prefix, useprop);

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
  Lum.ns.defaultDescriptor = DESC_DEF;

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

  /**
   * Lum library manager.
   *
   * @namespace Lum.lib
   */
  prop(Lum, 'lib', {});

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
   * @param {string} lib  The name of the library we are looking for.
   */
  prop(Lum.lib, 'has', function (lib)
  {
    return loaded[lib];
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
  prop(Lum, 'jq', {});

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
   * Run checkJq; if it returns a string, throw a fatal error.
   */
  prop(Lum.jq, 'need', function ()
  {
    const result = Lum.jq.check.apply(Lum.jq, arguments);
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
    const result = Lum.jq.check.apply(Lum.jq, arguments);
    return (typeof result !== S);
  });

  wrap.add('wantJq', Lum.jq.want);

  /**
   * See if a passed object is a jQuery instance.
   */
  prop(Lum.jq, 'is', function (obj)
  {
    const $ = Lum.jq.get();
    return is_instance(obj, $);
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
    else if (is_instance(el, root.Element))
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
    const hasOE = is_obj(ev.originalEvent);

    if (hasOE && oeFirst)
    {
      const oeVal = ev.originalEvent[prop];
      if (non_null(oeVal))
      {
        return oeVal;
      }
    }

    const evVal = ev[prop];
    if (non_null(evVal))
    {
      return evVal;
    }

    if (hasOE && !oeFirst)
    {
      const oeVal = ev.originalEvent[prop];
      if (non_null(oeVal))
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

  /**
   * Get a stacktrace. Differs from browser to browser.
   * 
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

