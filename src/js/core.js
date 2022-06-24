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

})(typeof self !== 'undefined' ? self : this, 
function (init)
{ // Welcome to the factory.
  "use strict";

  const root = init.root;

  function NYI(fatal=true) 
  { 
    const msg = "Not yet implemented";
    if (fatal)
      throw new Error(msg);
    else
      console.error(msg);
  }

  // A few quick private constants for tests.
  const O='object', F='function', S='string', B='boolean', N='number',
        U='undefined', SY='symbol', BI='bigint', ARG='arguments', NULL='null';

  // Javascript types as returned by `typeof` operator.
  const JS_TYPES = [O, B, N, BI, S, SY, F, U];

  // Special types that require different tests.
  const SPECIAL_TYPES = [ARG, NULL];

  // Check for non-null objects (i.e. not null).
  function isObj(v) { return (typeof v === O && v !== null); }

  // Check for a "complex" value (i.e. object or function).
  function isComplex(v) { return (typeof v === F || isObj(v)); }

  // A function to check if a value is undefined or null.
  function isNil(v) { return (v === undefined || v === null); }

  // A function to check for any non-null, non-undefined value.
  function notNil(v) { return (v !== undefined && v !== null); }

  // Check for a scalar value (i.e. not complex, not nil.)
  function isScalar(v) { return (notNil(v) && !isComplex(v)); }

  // A function to check for non-empty Arrays.
  function nonEmptyArray(array)
  {
    return (Array.isArray(array) && array.length > 0);
  }

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

  // Require an object, or throw an error.
  function needObj (v, allowFunc=false, msg=null)
  {
    if (allowFunc && isComplex(v)) return;
    if (isObj(v)) return;

    if (typeof msg !== S)
    { // Use a default message.
      msg = "Invalid object";
      if (allowFunc)
        msg += " or function";
    }
    throw new TypeError(msg);
  }

  // Need a value of a certain type or throw an error.
  function needType (type, v, allowNull=false, msg=null)
  {
    if (typeof type !== S 
      || (!JS_TYPES.includes(type) && !SPECIAL_TYPES.includes(type)))
    {
      throw new TypeError(`Invalid type ${JSON.stringify(type)} specified`);
    }

    if (typeof allowNull === S && msg === null)
    { // Message was passed without allowNull.
      msg = allowNull;
      allowNull = false;
    }
    
    if (!allowNull && type === O)
    { // Pass it on to needObj() which rejects null.
      return needObj(v, false, msg);
    }

    if (type === NULL && v === null) return; // It was null.
    if (type === ARG && isArguments(v)) return; // It was an 'arguments' object.
    if (typeof v === type) return; // We're good to go.

    if (typeof msg !== S)
    { // Use a default message.
      msg = `Invalid ${type} value`;
    }

    throw new TypeError(msg);
  }

  /**
   * Get a property descriptor.
   * 
   * This is like `Object.getOwnPropertyDescriptor`, except that method
   * fails if the property is inhereted. This method will travel through
   * the entire prototype chain until it finds the descriptor.
   * 
   * @param {object|function} obj - Object to find a property in.
   * @param {string} prop - Name of the property we want the descriptor of.
   * @param {mixed} [defval] The fallback value if no descriptor is found.  
   * 
   * @returns {mixed} - The descriptor if found, `defval` if not.
   */
  function getProperty(obj, prop, defval)
  {
    if (!isComplex(obj)) throw new TypeError("Target must be an object or function");
    // Yeah it looks like an infinite loop, but it's not.
    while (true)
    {
      const desc = Object.getOwnPropertyDescriptor(obj, prop);
      if (isObj(desc))
      { // Found it.
        return desc;
      }

      // Didn't find it, so let's try the next object in the prototype chain.
      obj = Object.getPrototypeOf(obj);
      if (!isComplex(obj))
      { // We've gone as far up the prototype chain as we can, bye now!
        return defval;
      }
    }
  }

  function SOA(name, err=true)
  {
    const msg = (typeof name === S) 
      ? name + ' ' + this.message 
      : this.message;
    return err ? (new TypeError(msg)) : msg;
  }
  SOA.message = "must be a string or non-empty array";
  Object.defineProperty(SOA, 'toString',
  {
    configurable: true,
    value: function() { return this.message; }
  });

  function nsString(ns, name='Namespace')
  {
    if (nonEmptyArray(ns))
    {
      return ns.join('.');
    }
    else if (typeof ns !== S)
    {
      throw SOA(name);
    }
    return ns;
  }

  function nsArray(ns, name='Namespace')
  {
    if (typeof ns === S)
    {
      return ns.split('.');
    }
    else if (!nonEmptyArray(ns)) 
    {
      throw SOA(name);
    }
    return ns;
  }

  // Used internally, and exported as `Lum.opt.getPath`
  function getObjectPath(obj, proppath, logerror=false)
  {
    needObj(obj);

    proppath = nsArray(proppath);
  
    for (let p = 0; p < proppath.length; p++)
    {
      const propname = proppath[p];
      if (obj[propname] === undefined)
      { // End of search, sorry.
        if (logerror)
        {
          console.error("Object property path not found", 
            propname, p, proppath, obj);
        }
        return undefined;
      }
      obj = obj[propname];
    }

    return obj;
  }

  // Used internally, and exported as `Lum.ns.get`
  function getNamespace(namespaces, logerror=false)
  {
    return getObjectPath(root, namespaces, logerror);
  }

  /**
   * Get the locale/language string.
   * 
   * 1. If `navigator.language` exists it will be used.
   * 2. If `Intl` exists it will be used.
   * 3. If neither of those exist, uses `'en-US'` as a default.
   * 
   * @returns string - The locale/language string.
   * 
   * @method Lum._.getLocale
   */
  function getLocale()
  {
    if (isObj(root.navigator) && typeof root.navigator.language === S)
    {
      return root.navigator.language;
    }
    else if (isObj(root.Intl))
    {
      try 
      {
        const lang = root.Intl.DateTimeFormat().resolvedOptions().locale;
        return lang;
      }
      catch (err)
      {
        console.warn("Attempt to get locale from Intl failed", err);
      }
    }

    // A last-ditch fallback.
    return 'en-US';
  }

  /**
   * Make the first character of a string uppercase.
   * 
   * @param {string} string - The input string.
   * @param {boolean} [lcrest=false] Make the rest of the string lowercase? 
   * @param {string} [locale=getLocale()] The locale/language of the string.
   * 
   * @returns string - The output string.
   * 
   * @method Lum._.ucfirst
   */
  function ucfirst ([ first, ...rest ], lcrest = false, locale = getLocale())
  {
    first = first.toLocaleUpperCase(locale);
    rest  = rest.join('');
    if (lcrest)
    {
      rest = rest.toLocaleLowerCase(locale);
    }
    return first + rest;
  }

  /**
   * Make the first character of each *word* in a string uppercase.
   *  
   * @param {string} string - The input string. 
   * @param {boolean} [unicode=false] Use Unicode words? (Only uses ASCII words otherwise)
   * @param {boolean} [lcrest=false] Make the rest of each word lowercase? 
   * @param {string} [locale=getLocale()] The locale/language of the string. 
   * 
   * @returns {string} - The output string.
   * 
   * @method Lum._.ucwords
   */
  function ucwords(string, unicode = false, lcrest = false, locale = getLocale())
  {
    const regex = unicode ? /[0-9\p{L}]+/ug : /\w+/g;
    return string.replace(regex, word => ucfirst(word, lcrest, locale));
  }

  class InternalObjectId
  {
    constructor(propname)
    {
      if (typeof propname !== S)
      {
        throw new TypeError("Property name must be a string");
      }

      this.id = Math.floor(Math.random() * Date.now());
      this.propertyName = propname;
    }

    tag(obj)
    {
      const desc = {configurable: true, value: this.id};
      return Object.defineProperty(obj, this.propertyName, desc);
    }

    is(obj)
    {
      return (isComplex(obj) && obj[this.propertyName] === this.id)
    }

    isFunction()
    {
      const oid = this;
      return function(obj) { return oid.is(obj); }
    }
  }

  const ENUM_ID = new InternalObjectId('$LumEnum');

  function Enum (spec, opts={})
  {
    if (!isObj(spec))
    {
      throw new TypeError("Enum spec must be an object");
    }
    if (!isObj(opts))
    {
      throw new TypeError("Enum options must be an object")
    }

    const anEnum = ENUM_ID.tag({});

    function getVal (name, def)
    {
      if (opts.symbols)
      { // We want to use symbols.
        if (opts.globals)
        {
          return Symbol.for(name);
        }
        else
        {
          return Symbol(name);
        }
      }
      else
      { // Use the default.
        return def;
      }
    }

    function addVal(pName, sName, inVal)
    {
      const desc = {configurable: true, enumerable: true};
      desc.value = getVal(sName, inVal);
      Object.defineProperty(anEnum, pName, desc);
    }

    if (Array.isArray(spec))
    { // An array of strings is expected.
      let counter = opts.counter ?? 1;

      for (let i = 0; i < spec.length; i++)
      {
        const name = spec[i];
        if (typeof name !== S)
        {
          throw new TypeError("Non-string passed in Lum.Enum object");
        }

        const val 
          = opts.strings 
          ? name 
          : (opts.flags ? counter : i);

        addVal(name, name, val);

        if (opts.flags)
        { // Increment the binary flag counter.
          counter *= 2;
        }
      }
    }
    else
    { // An object mapping of property name to value.
      for (const pName in spec)
      {
        const val = spec[pName];
        const sName = (typeof val === S) ? val : pName;
        addVal(pName, sName, val);
      }
    }

    if (notNil(opts.lock))
    { // Use lock.
      let lockOpts;
      if (Array.isArray(opts.lock))
      {
        lockOpts = opts.lock;
      }
      else if (isObj(opts.lock))
      {
        lockOpts = [true, opts.lock, false];
      }
      else if (typeof opts.lock === B)
      {
        lockOpts = [opts.lock, null, false];
      }
      else 
      {
        lockOpts = [true, null, false];
      }
      return lock(anEnum);
    }
    else if (!opts.open) 
    { // Use Object.freeze()
      return Object.freeze(anEnum);
    }

    return anEnum;
  }

  function setFlag(flags, flag, value=true)
  {
    if (typeof flags !== N) throw new TypeError("Flags must be number");
    if (typeof flag !== N) throw new TypeError("Flag must be number");

    if (value)
      flags = flags | flag;
    else
     flags = flags - (flags & flag);

    return flags;
  }

  function allFlags()
  {
    const flags = 0;
    for (const arg of arguments)
    {
      if (typeof arg !== N)
      {
        throw new TypeError("Arguments must be numbers");
      }
      flags = flags | arg;
    }
    return flags;
  }

  const DESC_ID = new InternalObjectId('$LumDescriptor');
  const DESC_ADD = Enum(['ONE','SHORT', 'SET'], {flags: true});

  // Create a magic Descriptor object used by our internal functions.
  function descriptor(desc, opts={})
  {
    if (!isObj(opts)) throw new TypeError("Options must be an object");

    if (typeof desc === B)
    { // This is a special case.
      opts.accessorSafe = desc;
      opts.add = DESC_ADD.ONE;
      desc = {};
    }

    if (!isObj(desc)) 
      throw new TypeError("First parameter (desc) must be a descriptor template object");

    if (!Object.isExtensible(desc))
      throw new RangeError("First parameter (desc) must not be locked, sealed, frozen, etc.");

    const accessorSafe = (typeof opts.accessorSafe === B) 
      ? opts.accessorSafe
      : (desc.writable === undefined);
    
    DESC_ID.tag(desc);

    // Add a function or other property.
    function add(name, val)
    {
      Object.defineProperty(desc, name, {value: val, configurable: true});
    }

    // Add a getter.
    function accessor(name, getter, setter)
    {
      const adef = {configurable: true};
      if (typeof getter === F) adef.get = getter;
      if (typeof setter === F) adef.set = setter;
      Object.defineProperty(desc, name, adef);
    }

    add('accessorSafe', accessorSafe);

    add('whenDone', function(func)
    {
      if (typeof func === F)
      {
        add('done', func);
      }
      return this;
    });

    if (typeof opts.done === F)
    {
      desc.whenDone(opts.done);
    }

    add('setValue', function (val, noClean)
    {
      if (this.get !== undefined || this.set !== undefined)
      {
        console.error("Accessor properties already defined", this);
      }
      else
      {
        this.value = val;
      }
      
      return this;
    });

    if (accessorSafe)
    {
      function validate ()
      {
        if (this.value !== undefined)
        { 
          console.error("Data 'value' property defined", this);
          return false;
        }

        for (const arg of arguments)
        { // All accessor arguments must be functions.
          if (typeof arg !== F) throw new TypeError("Parameter must be a function");
        }

        return true;
      }

      add('setGetter', function(func)
      {
        if (validate.call(this, func))
          this.get = func;
        return this;
      });

      add('setSetter', function(func)
      {
        if (validate.call(this, func))
          this.set = func;
        return this;    
      });

      add('setAccessor', function(getter, setter)
      {
        if (validate.call(this, getter, setter))
        {
          this.get = getter;
          this.set = setter;
        }
        return this;
      });

    } // accessorSafe

    if (opts.add)
    {
      const addTypes 
        = (typeof opts.add === N) 
        ? opts.add 
        : DESC_ADD.SET;

      function addBool(propname)
      {
        const setBool = function() 
        { 
          this[propname] = true; 
          return this; 
        }

        if (addTypes & DESC_ADD.ONE)
        {
          const aname = propname[0];
          accessor(aname, setBool);
        }
        if (addTypes & DESC_ADD.SHORT)
        {
          const aname = propname.substring(0,4);
          accessor(aname, setBool);
        }
        if (addTypes & DESC_ADD.SET)
        {
          const aname = 'set'+ucfirst(propname);
          accessor(aname, setBool);
        }
      }

      addBool('configurable');
      addBool('enumerable');
      addBool('writable');

    } // addBools

    // Is the descriptor ready to be used?
    accessor('isReady', function()
    {
      return doesDescriptor(this);
    });

    return desc;
  }

  function getDescriptor(desc)
  {
    return DESC_ID.is(desc) ? desc : descriptor(desc);
  }

  function doesDescriptor(obj)
  {
    if (isObj(obj))
    {
      const hasValue    = (obj.value !== undefined);
      const hasGetter   = (typeof obj.get === F);
      const hasSetter   = (typeof obj.set === F);
      const hasWritable = (obj.writable !== undefined);

      if (hasValue && !hasGetter && !hasSetter)
      { // We have a value, and no getter or setter.
        return true;
      }
      else if ((hasGetter || hasSetter) && !hasValue && !hasWritable)
      { // We have a getter or setter, and no value or writable properties.
        return true;
      }
    }

    // Nothing matched, not a valid descriptor rule.
    return false;
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

  // Supported modes for the clone() method.
  const CLONE = Enum(['DEF','JSON','FULL','ALL']);

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
    $jqPluginSuffix:   '.jq',
    $wrapBackupPrefix: 'orig$',
  };

  /**
   * Track if libraries, plugins, or whatever are loaded.
   * 
   * Automatically manages events that are trigged on load.
   * Also will automatically run events assigned *after* the 
   * desired item has been loaded.
   * 
   * Can handle custom tests in addition to the default
   * test which simply see's if the `loadTracker.mark()`
   * method has been called for the specified name.
   * 
   * @class Lum.LoadTracker
   */
  class LoadTracker
  {
    /**
     * Build a LoadTracker
     * 
     * @param {object} [opts] - Named options for custom behaviours.
     * 
     * @param {function} [opts.or] A custom test for `is()` method.
     *   If this returns true, `is()` will return true immediately.
     *   Mutually exclusive with the `opts.and` option.
     * 
     *   The function will have `this` set to the `LoadTracker` instance.
     *   It will be passed the same arguments sent to the `is()` method.
     *   The function must return a boolean value indicating if the item
     *   is considered *loaded* for the purposes of this loader instance.
     * 
     * @param {function} [opts.and] A custom test for `is()` method.
     *   If this returns false, `is()` will return false immediately.
     *   Mutually exclusive with the `opts.or` option.
     * 
     *   The same function notes as `opts.or` apply to this as well.
     * 
     * @param {boolean} [opts.before=false] When to run the custom test.
     *   If `true` the custom test is run before the standard test.
     *   If `false` the custom test is run after the standard test.
     * 
     *   If `opts.or` was used, and whichever test is ran first returns 
     *   `true`, the other test won't be run at all.
     * 
     *   Likewise, if `opts.and` was used, and whichever test is ran first
     *   returns `false`, the other test won't be run at all.
     *
     * @param {function} [opts.check] A custom test for the `check*` methods.
     *   If specified, this will be ran *before* checking the rest of the
     *   arguments. The first parameter passed to the function is a boolean,
     *   indicating if only a single return value is expected; `checkOne()` 
     *   passes `true` while `checkAll()` passes false. All subsequent
     *   parameters will be the arguments passed to the calling method.
     *   The function will have `this` set to the `LoadTracker` instance.
     * 
     *   When called from `checkOne()` if it returns a string, that will
     *   be returned as the missing item name. Return nil if no errors.
     * 
     *   When called from `checkAll()` if it returns an Array, all items
     *   from that array will be added to the list of missing items, and
     *   then the regular `checkAll()` logic will continue. If however it
     *   returns a string, then that will be returned as the sole item in
     *   the missing list without running any further `checkAll()` logic.
     *   Return nil or an *empty* array if no errors.
     * 
     */
    constructor(opts={})
    {
      needObj(opts);

      prop(this, '$loaded', {}); // List of loaded libraries.
      prop(this, '$onload', {}); // Events to trigger when libraries are loaded.

      let isTest = false, testOr = false;
      if (typeof opts.or === F)
      { // A test that can override 
        isTest = opts.or;
        testOr = true;
      }
      else if (typeof opts.and === F)
      {
        isTest = opts.and;
        testOr = false;
      }
      
      prop(this, '$isTest',  isTest);
      prop(this, '$isOr',    testOr);
      prop(this, '$is1st',   opts.before ?? false);
      prop(this, '$check',   opts.check  ?? false);
      prop(this, '$typeOne', opts.type   ?? 'item');
      prop(this, '$typeAll', opts.types  ?? this.$typeOne + 's');
      
    }

    /**
     * Assign a callback function to be called.
     * 
     * All callbacks for a given `name` will be ran when
     * that `name` has been passed to `mark()` or `call()`.
     * 
     * @param {string}   name  - The name of the item to be loaded.
     * @param {function} event - The callback function.
     *  
     * @returns {boolean} - Is the method call deferred?
     *   If `true` the `name` has not been marked as loaded, so the
     *   method has been added to a queue that will be called
     */
    on(name, event)
    {
      needType(S, name,  "Name must be a string");
      needType(F, event, "Event must be a function");

      if (!Array.isArray(this.$onload[name]))
      { // Add an array of events.
        prop(this.$onload, name, []);
      }

      this.$onload[name].push(event);

      if (this.is(name))
      { // Execute the function right now.
        event.call(Lum, name, false);
        return false;
      }

      return true;
    }

    /**
     * Mark an item as loaded.
     * 
     * @param {string} name - Item being marked as loaded.
     * @param {boolean} [call=true]     Also call `call()` method?
     * @param {boolean} [skipTest=true] Passed to `call()` method.
     */
    mark(name, call=true, skipTest=true)
    { 
      prop(this.$loaded, name, true);
      if (call)
      {
        this.call(name, skipTest);
      }
    }

    /**
     * Call all of the callback function for an item.
     * 
     * @param {string} name - The name of the item. 
     * @param {boolean} [skipTest=false] Skip the `is()` test?
     *  If `false` we call `this.is(name)` and will only continue
     *  if it returns a true value. If `true` we call without testing.
     *  
     * @returns {boolean} - If the events were called or not.
     */
    call(name, skipTest=false)
    {
      if (!skipTest && !this.is(name))
      { // Okay, we cannot call if the item isn't loaded.
        console.error("Cannot call events if item is not loaded", name, this);
        return false;
      }

      if (Array.isArray(this.$onload[name]))
      {
        for (const event of this.$onload[name])
        {
          event.call(Lum, name, true);
        }
      }

      return true;
    }

    /**
     * Check if the item is loaded.
     * 
     * @param {string} name - The item to check.
     * @returns {boolean}
     */
    is(name)
    {
      if (typeof name !== S)
      {
        console.error("Name must be a string", name);
        return false;
      }

      let okay = false;

      const hasTest = (typeof this.$isTest === F);
      const test1st = this.$is1st;
      const testOr  = this.$isOr;

      // A test that indicates we can return `okay` value.
      const done = () => (!hasTest || (testOr && okay) || (!testOr && !okay));

      if (hasTest && test1st)
      { // A custom test that is called before the normal test.
        okay = this.$isTest(...arguments);
        console.debug("is:before", okay, this);
        if (done()) return okay;
      }

      // Call the normal test, is the name marked?
      okay = (this.$loaded[name] ?? false);
      if (done()) return okay;

      if (hasTest && !test1st)
      { // A custom test that is called after the normal test.
        okay = this.$isTest(...arguments);
        console.debug("is:after", okay, this);
      }

      return okay;
    }

    /**
     * Get a list of loaded items.
     * 
     * This only includes items that have been marked using the
     * `mark()` method.
     * 
     * @param {boolean|function} [sort=false] Should we sort the results?
     *   If this is `true` we use the default sorting algorithm.
     *   If this is a function, it's passed to the `array.sort()` method.
     *   Any other value and the list will be in the order returned
     *   by the `Object.keys()` method.
     * 
     * @returns {Array} The list of loaded items.
     */
    list(sort=false)
    {
      let list = Object.keys(this.$loaded);
      if (sort === true)
      { // If sort is boolean true, use default sorting algorithm.
        list.sort();
      }
      else if (typeof sort === F)
      { // A custom sort function.
        list.sort(sort);
      }
      return list;
    }

    /**
     * The same output as `list(false)` but as a readonly accessor property.
     */
    get keys()
    {
      return Object.keys(this.$loaded);
    }

    /**
     * Return the first item that isn't loaded.
     * 
     * @param {string} ...names - Any items you want to look for.
     * 
     * @returns {string|undefined} If no items are missing, will be undefined.
     */
    checkOne()
    {
      if (typeof this.$check === F)
      {
        const check = this.$check(true, ...arguments);
        console.debug("checkOne:$check", check, this);
        if (typeof check === S && check.trim() !== '')
        { // A non-empty string was passed.
          return check;
        }
      }

      for (const lib of arguments)
      {
        if (!this.is(lib))
        {
          return lib;
        }
      }
    }

    /**
     * Return a full list of any missing items.
     * 
     * @param {string} ...names - Any items you want to look for.
     * 
     * @returns {Array} A list of missing items.
     */
    checkAll()
    {
      const missing = [];

      if (typeof this.$check === F)
      {
        const check = this.$check(false, ...arguments);
        console.debug("checkAll:$check", check, this);
        if (Array.isArray(check))
        { // May have missing items, or be empty.
          missing.push(...check);
        }
        else if (typeof check === S)
        { // A string indicates we can continue no further.
          missing.push(check);
          return missing;
        }
      }

      for (const lib of arguments)
      {
        if (!this.is(lib))
        {
          missing.push(lib);
        }
      }

      return missing;
    }

    /**
     * Setup a namespace object with wrapper methods.
     * 
     * @param {object} ns - The namespace object, may also be a function. 
     * @param {object} [names] A map of alternate names for the methods.
     * 
     * The default method names are:
     * 
     * `mark`     → Call `lt.mark`, returns `ourself()`.
     * `has`      → Proxy `lt.is`.
     * `check`    → Proxy `lt.checkOne`.
     * `checkAll` → Proxy `lt.checkAll`.
     * `list`     → Proxy `lt.list`.
     * `need`     → Call `check`, if any missing, throw Error.
     * `want`     → Call `check`, return true if all are loaded, false if not.
     * `onLoad`   → Proxy `on`.
     * 
     * If any of the method names are already present, they will be skipped.
     * 
     */
    setupNamespace(ns, names={})
    {
      needObj(ns, true, "Invalid namespace object");
      needObj(names, false, "Names must be an object");

      const thisLoad = this; // Contextual instance reference.
      let propName;          // Will be set by hasnt() closure.

      const getname = (name) => names[name] ?? name;

      const hasnt = (name) => 
      {
        propName = getname(name);
        return (ns[propName] === undefined);
      }

      const addfunc = (func) => prop(ns, propName, func);
      const addgetter = (func) => prop(ns, propName, func, null, DESC.CONF);

      // Options for need() and want().
      const loadOpts = prop(ns, '$loadOpts', 
      {
        checkAll: false,
        warnings: false,
      }).$loadOpts;

      if (hasnt('mark'))
      {
        addfunc(function()
        {
          thisLoad.mark(...arguments);
          return ourself();
        });
      }
      
      if (hasnt('has'))
      {
        addfunc(function()
        {
          return thisLoad.is(...arguments);
        });
      }

      if (hasnt('check'))
      {
        addfunc(function()
        {
          return thisLoad.checkOne(...arguments);
        })
      }

      if (hasnt('checkAll'))
      {
        addfunc(function()
        {
          return thisLoad.checkAll(...arguments);
        });
      }

      if (hasnt('list'))
      {
        addfunc(function()
        {
          return thisLoad.list(...arguments);
        });
      }

      if (hasnt('missing'))
      {
        addfunc(function(
        {
          fatal = false, 
          all   = loadOpts.checkAll, 
          warn  = loadOpts.warnings, 
          ok    = this,
        },
          ...items)
        {
          const thisCheck = all ? getname('checkAll') : getname('check');
          const result = ns[thisCheck](...items);

          if (typeof result === S 
            || (all && Array.isArray(result) && result.length > 0))
          { // There are missing libraries.
            const typeName = all ? thisLoad.$typeAll : thisLoad.$typeOne;
            const missing = fatal ? JSON.stringify(result) : result;

            if (fatal)
            {
              throw new Error(`Missing required ${typeName}: ${missing}`);
            }
            else 
            {
              if (warn)
              {
                console.warn("Missing", typeName, missing);
              }
              return false;
            }
          }

          // If we reached here, nothing was reported as missing.
          return ok;
        });
      }

      if (hasnt('need'))
      {
        addfunc(function()
        {
          const missing = getname('missing');
          return ns[missing]({fatal: true, ok: ourself()}, ...arguments);
        });
      }

      if (hasnt('want'))
      {
        addfunc(function()
        {
          const missing = getname('missing');
          return ns[missing]({fatal: false, ok: true}, ...arguments);
        });
      }

      if (hasnt('all'))
      {
        addgetter(function()
        {
          loadOpts.checkAll = true;
          return ns;
        });
      }

      if (hasnt('one'))
      {
        addgetter(function()
        {
          loadOpts.checkAll = false;
          return ns;
        });
      }

      if (hasnt('showWarnings'))
      {
        addfunc(function(val)
        {
          if (typeof val === B)
          {
            loadOpts.warnings = val;
            return this;
          }
          else 
          {
            return loadOpts.warnings;
          }
        });
      }

      if (hasnt('onLoad'))
      {
        addfunc(function()
        {
          return thisLoad.on(...arguments);
        });
      }

    }
  }

  prop(Lum, 'LoadTracker', LoadTracker);

  // A tag for jQuery if it's missing.
  const JQTAG = 'jQuery';

  // Store loaded libraries in a private object.
  // Using all default tests for this one.
  const loaded = new LoadTracker({type: 'library', types: 'libraries'});

  // Ditto for Lum-specific jQuery libraries.
  // But with some custom tests.
  const jqLoaded = new LoadTracker(
  {
    type:  'jQuery library',
    types: 'jQuery libraries',
    or: function(name)
    { // See if a jQuery function handler by that name exists.
      const $ = Lum.jq.get();
      //console.debug("jqLoaded:$isTest[or]", $, this);
      if (typeof $ !== F || !isObj($.fn)) return false;
      return ($.fn[name] !== undefined);
    },
    check: function()
    { // We don't actually care about the arguments in this one.
      const $ = Lum.jq.get();
      //console.debug("jqLoader:$check", $, this);
      if (typeof $ !== F || !isObj($.fn))
      { // Missing jQuery itself!
        return JQTAG;
      }
    },
  });

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

    const isUnbound = unbound(this, true, true);

    if (typeof name === O)
    { // A way to set some special options.
      opts = name;
      name = opts.name;
    }
    else if (isUnbound)
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
    else if (DESC_ID.is(arg1) && arg2 === undefined)
    { // Yet another special case.
      if (arg1.isReady)
      { // Already has a value or get/set properties assigned.
        desc = arg1;
      }
      else 
      { // We'll need to call setValue(), setGetter(), etc, then done().
        return arg1.whenDone(function()
        {
          return prop(obj, name, this);
        });
      }
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
  prop(DESC, 'is',   DESC_ID.isFunction());
  prop(DESC, 'get',  getDescriptor);
  prop(DESC, 'does', doesDescriptor);
  prop(DESC, 'ADD',  DESC_ADD);

  // And add the CLONE enum to the clone function as the MODE property.
  prop(clone, 'MODE', CLONE);

  // And a test for Enums.
  prop(Enum, 'is', ENUM_ID.isFunction());

  /**
   * Build a lazy initializer property.
   *
   * Basically the first time the property is accessed it's built.
   * Subsequent accesses will use the already built property.
   * This is an extension of the {@link Lum.prop} method.
   *
   * @param {object} obj - The object to add the property to.
   * @param {string} name - The name of the property to add.
   * @param {function} initfunc - The function to initialize the property.
   * 
   *   This function will have `this` set to the `obj` parameter.
   *   It will also be passed `name` as the sole parameter.
   * 
   * @param {mixed} [onset] How to handle assignment.
   * 
   *   If this is `true` then the new value will be assigned directly,
   *   skipping the initialization process entirely.
   * 
   *   If this is `false` then any attempt at assignment will throw
   *   a `ReferenceError` with a message indicating the property is read-only.
   * 
   *   If this is a `function` it will take two arguments, the
   *   first being the value that is trying to be assigned, and
   *   the second being the currently assigned value.
   *   As with any getter or setter, `this` will be the `obj` itself.
   *   The function must return the value to be assigned.
   *   If it returns `undefined`, then the value was not valid,
   *   and will not be assigned.
   * 
   *   If this is anything else, assignment will do nothing at all.
   * 
   * @param {object} [desc=DESC.CONF] The Descriptor for the property.
   *
   * @return {object} The object we defined the property on.
   *
   * @method Lum.prop.lazy
   */
  function lazy(obj, name, initfunc, onset, desc=DESC.CONF)
  {
    if (!isComplex(obj))
    {
      throw new TypeError("obj parameter was not an object");
    }
    if (typeof name !== S)
    {
      throw new TypeError("name parameter was not a string");
    }
    if (typeof initfunc !== F)
    {
      throw new TypeError("initfunc parameter was not a function");
    }

    let value;
    let setter = null;

    function getter()
    {
      if (value === undefined)
      {
        value = initfunc.call(this, name);
      }
      return value;
    }

    if (onset === true)
    { // Allow direct assignment.
      setter = function(newval)
      {
        value = newval;
      }
    }
    else if (onset === false)
    { // Throw an error on assignment.
      setter = function()
      {
        throw new ReferenceError("The "+name+" property is read-only");
      }
    }
    else if (typeof onset === F)
    { // A proxy method for assignment.
      setter = function(newval)
      {
        const setval = onset.call(this, newval);
        if (setval !== undefined)
        {
          value = setval;
        }
      }
    }

    prop(obj, name, getter, setter, desc);
  }

  // Gotta be one of the greatest lines...
  prop(prop, 'lazy', lazy);

  /**
   * Context object.
   * 
   * @namespace Lum.context
   * 
   * Offers some insight into the current JS context.
   * 
   */
  const ctx = prop(Lum, 'context', init).context;

  prop(ctx, 'isWindow', !init.node && root.window !== undefined);
  prop(ctx, 'isWorker', !init.node && root.WorkerGlobalScope !== undefined);
  prop(ctx, 'isServiceWorker', !init.node && root.ServiceWorkerGlobalScope !== undefined);
  prop(ctx, 'isBrowser', ctx.isWindow || ctx.isWorker);

  // Does the global object/property exist?
  function hasRoot(ns)
  {
    if (typeof hasRoot[ns] === B) return hasRoot[ns];
    const result = (getNamespace(ns) !== undefined);
    prop(hasRoot, ns, result);
    return result;
  }

  // Build some common has items.
  for (const what of ['Proxy','Promise','Reflect','fetch'])
  {
    hasRoot(what);
  }

  prop(ctx, 'has', hasRoot);

  console.debug("Lum.context", ctx);

  /**
   * If `Lum.Wrapper` is loaded, get wrapper for `Lum`.
   * 
   * @returns {Lum.Wrapper|undefined}
   */
  prop(Lum, 'getWrapper', function()
  {
    if (typeof Lum.Wrapper === F)
    {
      return Lum.Wrapper.getWrapper(Lum);
    }
  });

  /**
   * Return the Lum object itself.
   *
   * @param {boolean} [raw=Lum.$ourselfUnwrapped] Use the unwrapped Lum object?
   *
   * If false, this will return the Proxy wrapped object (if available.)
   *
   * @return object - Either the Lum object, or a Proxy of the Lum object.
   *
   * @method Lum._.ourself
   * 
   */
  function ourself(raw=Lum.$ourselfUnwrapped)
  {
    if (raw) return Lum;
    const wrapper = Lum.getWrapper();
    return (isObj(wrapper)) ? wrapper.wrap() : Lum;
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
   * A few constants and functions that might be useful:
   *
   * `O, F, S, B, N, U, SY, BI` - the Javascript type names as strings.
   * `ARG, NULL` - Special Javascript types as strings.
   * `isObj, isNul, notNil, isComplex, isInstance, isArguments` - type checks.
   * `nonEmptyArray, isScalar` - more type checks.
   * `isEnum, isDescriptor` - Lum specific type checks.
   * `clone, lock, addClone, addLock, cloneIfLocked` - cloning/locking methods.
   * `setFlag, allFlags` - Binary flag manipulation.
   * `getLocale, ucfirst, ucwords` - Locale aware helper functions.
   * `getProperty` - A smart wrapper to get a property descriptor.
   * `unbound` - See if a function is *bound* or not.
   * `prop` - The `Lum.prop()` function, includes `prop.lazy()` as well.
   * `Enum` - A generator for Enum structures, `Enum.is` is alias to `isEnum`.
   * `DESC` - The Descriptor Factory object (see below.)
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
   * All of the `DESC.*` properties are magic Descriptor objects for use with
   * the `prop()` function. There's also a few helper methods.
   *
   * @property {object} DESC          - Descriptor Factory.
   * 
   * @property {object} DESC.RO       - Indomitable Descriptor.
   * @property {object} DESC.CONF     - Configurable Descriptor.
   * @property {object} DESC.ENUM     - Enumerable Descriptor.
   * @property {object} DESC.WRITE    - Writable Descriptor.
   * @property {object} DESC.RW       - Configurable, writable Descriptor.
   * @property {object} DESC.DEF      - Configurable, enumerable Descriptor.
   * @property {object} DESC.OPEN     - Fully changeable Descriptor.
   * 
   * @property {function} DESC.is     - Is the passed object a magic Descriptor.
   * @property {function} DESC.make   - Make a magic Descriptor object.
   * @property {function} DESC.get    - Shortcut: `(obj) => DESC.is(obj) ? obj : DESC.make(obj)`
   * @property {function} DESC.does   - Does the object have valid descriptor properties.
   * 
   * @see Lum._.clone
   * @see Lum.prop
   */
  prop(Lum, '_', lock(COMPAT(
  {
    // Type checking constants.
    O, F, S, B, N, U, SY, BI, ARG, NULL,
    JS_TYPES, SPECIAL_TYPES,
    // Type checking functions. 
    isObj, notNil: notNil, isComplex, isInstance, isArguments,
    nonEmptyArray, isScalar, needObj, needType,
    // Low-level object utilities.
    clone, lock, addClone, addLock, cloneIfLocked, ourself, prop,
    Enum, DESC, CLONE, setFlag, allFlags, ucfirst, ucwords,
    getLocale, InternalObjectId, unbound, getProperty, NYI,

    // A method to extend the '_' property.
    extend(newprops, overwrite=false)
    {
      const desc = Object.getOwnPropertyDescriptor(Lum, '_');
      const __ = clone(Lum._); // Clone the current '_' property.
      for (let prop in newprops)
      {
        if (overwrite || __[prop] === undefined)
        { // Add a new property.
          __[prop] = newprops[prop];
        }
        else 
        {
          console.error("Cannot overwrite existing Lum._ property", prop, this, arguments);
        }
      }
      // Okay, now let's reassign '_' using the new value.
      prop(Lum, '_', lock(__, false), desc);
    },

  }), false), DESC.CONF); // Lum._

  /**
   * Get options in various forms.
   * 
   * @param {object} opts - Named options
   * 
   * @param {object} [opts.obj]  An object to look for a property in.
   *   Will be passed to `Lum.opt.get()`. Must also specify `opts.prop`.
   * 
   * @param {string} [opts.prop] Property to look for in the object.
   *   Must be specified with `opts.obj`.
   * 
   * @param {*} [opts.val] Value to test using `Lum.opt.val()`
   *   Only used if `opts.obj` and `opts.prop` were not specified, 
   *   or invalid values.
   * 
   * @param {function} [opts.lazy] A function to return the default value.
   * 
   * @param {*} [opts.lazyThis] Will be used as `this` in `opts.lazy`.
   * 
   * @param {*} [opts.default] The default value to use.
   *   Only used if `opts.lazy` was not used.
   * 
   * @param {boolean} [opts.allowNull] Should `null` values be considered set?
   *   Default `true` if `opts.obj` was used, or `false` otherwise.
   * 
   * @returns {*} See `Lum.opt.val` and `Lum.opt.get` for details.
   * 
   * @method Lum.opt
   */
  prop(Lum, 'opt', function(opts)
  {
    needObj(opts);

    let isLazy, def;
    if (typeof opts.lazy === F)
    { // Lazy function was specified.
      isLazy = true;
      def    = opts.lazy;
    }
    else
    { // Not using lazy default values.
      isLazy = false;
      def    = opts.default;
    }

    if (isObj(opts.obj) && typeof opts.prop === S)
    { // Redirecting to Lum.opt.get()
      const {obj,prop} = opts;
      const allowNull  = opts.allowNull ?? true;
      const lazyThis   = opts.lazyThis  ?? obj;
      return Lum.opt.get(obj, prop, def, allowNull, isLazy, lazyThis);
    }
    else
    { // Redirecting to Lum.opt.val()
      const val       = opts.val;
      const allowNull = opts.allowNull ?? false;
      const lazyThis  = opts.lazyThis  ?? null;
      return Lum.opt.val(val, def, allowNull, isLazy, lazyThis);
    }
  });

  /**
   * See if a value is set, and if not, return a default value.
   *
   * @param {*} opt - The value we are testing.
   * @param {*} defvalue - The default value if opt was null or undefined.
   *
   * @param {boolean} [allowNull=false] If true, allow null to count as "set".
   * @param {boolean} [isLazy=false]    If true, and `defvalue` is a function,
   *                                    use the value from the function as 
   *                                    the default.
   * @param {object} [lazyThis=null]    If `isLazy` is true, this object will
   *                                    be used as `this` for the function.
   *
   * @return {*} Either the specified `opt` value or the default value.
   * 
   * @method Lum.opt.val
   */
  prop(Lum.opt, 'val', 
  function (opt, defvalue, allowNull=false, isLazy=false, lazyThis=null)
  {
    if (typeof opt === U || (!allowNull && opt === null))
    { // The defined value was not "set" as per our rules.
      if (isLazy && typeof defvalue === F)
      { // Get the default value from a passed in function.
        return defvalue.call(lazyThis);
      }
      return defvalue;
    }

    return opt;
  });
  
  prop(Lum.opt, 'needObj', needObj);
  prop(Lum.opt, 'needType', needType);
  prop(Lum.opt, 'getPath', getObjectPath);

  /**
   * See if a property in an object is set.
   *
   * If it is, return the property, otherwise return a default value.
   * This uses the {Lum.opt.val} method, and as such supports the same options.
   * However read the parameters carefully, as the defaults may be different!
   *
   * @param {object} obj     - An object to test for a property in.
   * @param {string} optname - The property name we're checking for.
   * @param {*} defvalue     - The default value.
   *
   * @param {bool}   [allowNull=true] Same as val(), but the default is `true`.
   * @param {bool}   [isLazy=false]   Same as val().
   * @param {object} [lazyThis=opts]  Same as val().
   *
   * @return {*} Either the property value, or the default value.
   * 
   * @method Lum.opt.get
   */
  prop(Lum.opt, 'get', 
  function (obj, optname, defvalue, allowNull=true, isLazy=false, lazyThis=obj)
  {
    needObj(obj);
    needType(S, optname);
    return Lum.opt.val(obj[optname], defvalue, allowNull, isLazy, lazyThis);
  });

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
    namespaces = nsArray(namespaces);

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

    let dbg = {namespaces, assign, overwrite, nscount, lastns, value, useprop};
    console.debug("Lum.ns.add", dbg, arguments);

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

  // API to add new child namespaces, by default under the Lum prefix.
  prop(Lum.ns, 'new', function(namespaces, value, prefix='Lum', useprop=null)
  {
    console.debug("Lum.ns.new", {namespaces, value, prefix, useprop}, arguments);
    const PRE = 'Prefix';
    const NS  = 'Namespace';

    if (typeof namespaces === S)
    {
      prefix = nsString(prefix, PRE);
      namespaces = `${prefix}.${namespaces}`;
    }
    else if (nonEmptyArray(namespaces))
    {
      prefix = nsArray(prefix, PRE);
      namespaces.unshift(...prefix);
    }
    else
    {
      throw SOA(NS);
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
    console.debug("Lum.ns.build", opts, arguments);
    const INVOPTS = "Options must be an object or string";

    if (typeof opts === S)
    { // Assume it's the ns option.
      opts = {ns: opts};
    }
    else if (!isObj(opts))
    {
      throw new TypeError(INVOPTS);
    }

    const prefix   = opts.prefix  ?? 'Lum';
    const addProp  = opts.addProp ?? '_add';
    const subProp  = opts.subProp;

    const ns = opts.ns ?? opts.name ?? opts.path;

    // Build the library namespace object.
    const newNS = Lum.ns.new(ns, opts.value, prefix, opts.useProp);

    if (typeof addProp === S && newNS[addProp] === undefined)
    { // Add a method to add new properties.
      prop(newNS, addProp);
    }

    if (typeof subProp === S && newNS[subProp] === undefined)
    { // Add a method to add nested namespaces.
      prop(newNS, subProp, function (subOpts)
      {
        if (typeof subOpts === S)
        {
          subOpts = {ns: subOpts};
        }
        else if (!isObj(subOpts))
        {
          throw new TypeError(INVOPTS);
        }

        // Yeah we're forcing the use of string prefixes here.
        subOpts.prefix = nsString(prefix) + '.' + nsString(ns);
        
        const moreProps = {addProp, subProp};
        for (const key in moreProps)
        {
          if (subOpts[key] === undefined)
          {
            subOpts[key] = moreProps[key];
          }
        }
        
        return Lum.ns.build(subOpts);
      });
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
  prop(Lum.ns, 'get', getNamespace);

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
   * @return {object} The core Lum library is returned for chaining purposes.
   */
  prop(Lum.ns, 'link', function (obj, target, overwrite=false, prefix="Lum.")
  {
    Lum.ns.add(prefix+target, obj, overwrite);
    return ourself();
  });

  // Register a global variable (or multiple) for Lum itself.
  prop(Lum.ns, '$self', function ()
  {
    const self = ourself(Lum.$nsSelfUnwrapped);
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
    'SELF',
    'LUM',
    'WRAP',
    'ROOT',
    'NS',
    'JQ',
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
   * in a self executing block, use `Lum.lib(opts, func);` instead.
   * The `func` should be the same as the one that used to be in the block.
   *
   * @param {object} [opts] - Library configuration settings.
   *   If this is passed as a `string` it's assumed to be `opts.name`.
   *
   * @param {string|Array} [opts.name] - The name of the library.
   *   This will be passed to `Lum.lib.mark()` when the library and its 
   *   dependencies are loaded. You can use an array to specify aliases.
   * 
   * @param {Array} [opts.deps] Check if the libraries have been loaded.
   * 
   * @param {Array|boolean} [opts.jq] Check if the jQuery libraries are loaded.
   *   If specified as an empty array or `true` then it simply ensures that
   *   the main jQuery library itself has been loaded.
   * 
   * @param {Array} [opts.needs] Check if the specified namespaces exist.
   * 
   * @param {object|string} [opts.ns] Call `Lum.ns.build()` and pass this.
   * 
   * @param {object} [opts.assign] Alternative namespace assignment.
   *   This assignment is done *after* the `func` has been called, and
   *   uses the return value from the function as the namespace object.
   *   This is useful in cases where the namespace is a `class` definition.
   *
   * @param {string} [opts.this] The `this` in the `func` will be set to:
   *
   *   - `Lum.lib.TYPE.NULL` -- Plain old `null`.
   *   - `Lum.lib.TYPE.SELF` -- The `ourself()` value.
   *   - `Lum.lib.TYPE.LUM`  -- The unwrapped `Lum` object. 
   *   - `Lum.lib.TYPE.WRAP` -- The wrapped `Lum` `Proxy`.
   *   - `Lum.lib.TYPE.ROOT` -- The `root` object.
   *   - `Lum.lib.TYPE.NS`   -- The `ns` object (if `opts.ns` was used).
   *   - `Lum.lib.TYPE.JQ`   -- The jQuery object (if `opts.jq` was used).
   *   - `Lum.lib.TYPE.ARGS` -- The `arguments` passed.
   * 
   *   Default is `NS ?? SELF`.
   * 
   * @param {Array} [opts.args] The arguments for the registration function.
   *   An array of `Lum.lib.TYPE` values, in the order they should be passed 
   *   to the function. 
   *   
   *   The default depends on the other options passed.
   * 
   *   - If neither `opts.ns` or `opts.jq`: `[SELF, ARGS]`;
   *   - If `opts.ns` but not `opts.jq`: `[SELF, NS, ARGS]`;
   *   - If `opts.jq` but not `opts.ns`: `[SELF, JQ, ARGS]`;
   *   - If both `opts.ns` and `opts.jq`: `[SELF, NS, JQ, ARGS]`;
   * 
   * @param {string} [opts.return] What should this method return?
   * 
   * @param {function} func - The library registration function.
   *                          This does all the rest of building the library.
   * 
   * @return {mixed} Return value from `func` if non-nil, or `ourself()`.                   
   */
  prop(Lum, 'lib', function (opts, func)
  {
    if (typeof opts === S)
    { // Name of library passed instead of options.
      opts = {name: opts};
    }
    else if (typeof opts === F)
    { // Options are optional, or may be after the function.
      const _opts = isObj(func) ? func : {};
      func = opts;
      opts = _opts;
    }
    else if (!isObj(opts))
    { // Assume no options. Weird, but whatever.
      opts = {};
    }

    // One last crucial type check.
    if (typeof func !== F) throw new TypeError("func must be a function");

    let nsObj = null;

    if (Array.isArray(opts.deps))
    {
      const needed = opts.deps;
      Lum.lib.need(...needed);
    }

    if (Array.isArray(opts.needs))
    {
      const needed = opts.needs;
      Lum.ns.need(...needed);
    }

    let $ = null;

    if (Array.isArray(opts.jq))
    {
      const needed = opts.jq;
      Lum.jq.need(...needed);
      $ = Lum.jq.get();
    }
    else if (opts.jq === true)
    {
      Lum.jq.need();
      $ = Lum.jq.get();
    }

    if (notNil(opts.ns))
    {
      nsObj = Lum.ns.build(opts.ns);
    }

    let thisObj = nsObj ?? ourself();

    const libArgs = arguments;

    function getThis(thisType, def)
    {
      switch(thisType)
      {
        case LIB_TYPES.NULL:
          return null;
        case LIB_TYPES.SELF:
          return ourself();
        case LIB_TYPES.LUM:
          return Lum;
        case LIB_TYPES.WRAP:
          return wrap;
        case LIB_TYPES.ROOT:
          return root;
        case LIB_TYPES.NS:
          return nsObj;
        case LIB_TYPES.JQ:
          return $;
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
    { // Use defaults based on other options.
      funcArgs.push(ourself());
      if (isComplex(nsObj))
        funcArgs.push(nsObj);
      if (typeof $ === F)
        funcArgs.push($);
      funcArgs.push(libArgs);
    }

    // Okay, now we call the function!
    const retVal = func.apply(thisObj, funcArgs);

    let aopts = null;
    if (typeof opts.assign === S)
    { // A different kind of namespace assignment.
      aopts = {ns: opts.assign, addProp: false};
    }
    else if (isObj(opts.assign))
    {
      aopts = clone(opts.assign);
      if (aopts.addProp === undefined)
        aopts.addProp = false;
    }

    if (isObj(aopts))
    { // Okay, let's do this.
      if (isNil(retVal))
        throw new TypeError("function did not return object to assign");
      aopts.value = retVal;
      Lum.ns.build(aopts);
    }

    // Now mark the name(s) as loaded.
    if (typeof opts.name === S)
    {
      Lum.lib.mark(opts.name);
    }
    else if (Array.isArray(opts.name))
    {
      for (const name of opts.name)
      {
        Lum.lib.mark(name);
      }
    }

    // And now we're done.
    return (retVal ?? Lum);
  });

  prop(Lum.lib, 'TYPE', LIB_TYPES);

  // Add the methods handled by the LoadTracker.
  loaded.setupNamespace(Lum.lib);

  const JQ_TYPES = Enum(
  [
    'NULL',
    'SELF',
    'LUM',
    'WRAP',
    'ROOT',
    'JQ',
    'ARGS',
  ], 
  {
    strings: true
  });
  
  /**
   * jQuery library helper.
   *
   * @method Lum.jq
   *
   * Usage: At the very top of jQuery plugins, instead of wrapping the library
   * in a self executing block, use `Lum.jq(opts, func);` instead.
   * The `func` should be the same as the one that used to be in the block.
   *
   * @param {object} opts - Library configuration settings.
   *   If this is passed as a `string` it's assumed to be `opts.name`.
   *
   * @param {string|Array} opts.name - The name of the library.
   *   This will be passed to `Lum.jq.mark()` when the library and its 
   *   dependencies are loaded. You can use an array to specify aliases.
   * 
   * @param {Array} [opts.deps] Check if the libraries have been loaded.
   * 
   * @param {Array} [opts.jq] Check if other jQuery libraries are loaded.
   * 
   * @param {Array} [opts.needs] Check if the specified namespaces exist.
   *
   * @param {string} [opts.this] The `this` in the `func` will be set to:
   *
   *   - `Lum.jq.TYPE.NULL` -- Plain old `null`.
   *   - `Lum.jq.TYPE.SELF` -- The `ourself()` value.
   *   - `Lum.jq.TYPE.LUM`  -- The unwrapped `Lum` object. 
   *   - `Lum.jq.TYPE.WRAP` -- The wrapped `Lum` `Proxy`.
   *   - `Lum.jq.TYPE.ROOT` -- The `root` object.
   *   - `Lum.jq.TYPE.JQ`   -- The jQuery library.
   *   - `Lum.jq.TYPE.ARGS` -- The `arguments` passed.
   * 
   *   Default is `JQ`.
   * 
   * @param {Array} [opts.args] The arguments for the registration function.
   *   An array of `Lum.jq.TYPE` values, in the order they should be passed 
   *   to the function. 
   *   
   *   Default is `[SELF, JQ, ARGS]`.
   * 
   * @param {function} func - The library registration function.
   *                          This does all the rest of building the library.
   * 
   * @return {mixed} Return value from `func` if non-nil, or `ourself()`.    
   */
  prop(Lum, 'jq', function(opts, func)
  {
    const $ = Lum.jq.get();
    if ($ === undefined)
    {
      throw new Error("jQuery is required but not found");
    }

    if (typeof opts === S)
    {
      opts = {name: opts}
    }
    else if (typeof opts === F)
    {
      const _opts = isObj(func) ? func : {};
      func = opts;
      opts = _opts;
    }
    else if (!isObj(opts))
    { // Assume no options. Weird, but whatever.
      opts = {};
    }

    // One last crucial type check.
    if (typeof func !== F) throw new TypeError("func must be a function");    

    if (Array.isArray(opts.deps))
    {
      const needed = opts.deps;
      Lum.lib.need(...needed);
    }

    if (Array.isArray(opts.needs))
    {
      const needed = opts.needs;
      Lum.ns.need(...needed);
    }

    if (Array.isArray(opts.jq))
    {
      const needed = opts.jq;
      Lum.jq.need(...needed);
    }

    let thisObj = $;

    const libArgs = arguments;

    function getThis(thisType, def)
    {
      switch(thisType)
      {
        case JQ_TYPES.NULL:
          return null;
        case JQ_TYPES.SELF:
          return ourself();
        case JQ_TYPES.LUM:
          return Lum;
        case JQ_TYPES.WRAP:
          return wrap;
        case JQ_TYPES.ROOT:
          return root;
        case JQ_TYPES.JQ:
          return $;
        case JQ_TYPES.ARGS:
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
      funcArgs.push(ourself(), $, libArgs);
    }

    // Okay, now we call the function!
    const retVal = func.apply(thisObj, funcArgs);

    // Now mark the name(s) as loaded.
    if (typeof opts.name === S)
    {
      Lum.jq.mark(opts.name);
    }
    else if (Array.isArray(opts.name))
    {
      for (const name of opts.name)
      {
        Lum.jq.mark(name);
      }
    }

    // And now we're done.
    return (retVal ?? Lum);
  });

  // Like the loader.
  prop(Lum.jq, 'TYPE', JQ_TYPES);

  /**
   * Get jQuery itself.
   *
   * If Lum.jq.$ is assigned, we return it.
   * Otherwise we return root.jQuery.
   */
  prop(Lum.jq, 'get', function ()
  {
    return (typeof Lum.jq.$ === F) ? Lum.jq.$ : root.jQuery;
  });

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
   * Will also be `null` if jQuery is not found.
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

  // Add the methods handled by the LoadTracker.
  jqLoaded.setupNamespace(Lum.jq);

  // A list of valid Lum.load modes.
  const LUM_LOAD_MODES = ['auto','data','js'];
  if (ctx.isWindow) 
    LUM_LOAD_MODES.push('css');

  // Default Lum.load settings.
  const LUM_LOAD_DEFAULTS =
  {
    mode: 'auto',
    func: null,
    loc:  (ctx.isWindow ? document.head : null),
    validate: true,
    usePromise: ctx.has.Promise,
    useReadyState: false,
    useOnLoad: true,
    scriptProps: {},
    scriptAttrs: {},
    linkProps:   {},
    linkAttrs:   {},
    modulePrefix: '/scripts/nano/',
    moduleSuffix: '.js',
  }

  // Which properties should always check for defaults?
  const LUM_LOAD_DEFAULT_OPTS = 
  [
    'usePromise', 'useReadyState', 'useOnLoad',
  ];

  // Validators when setting values.
  const LUM_LOAD_VALID =
  {
    mode: (val) => (typeof val === S && LUM_LOAD_MODES.includes(val)),
    func: (val) => (typeof val === F || val === null),
    loc:  function(val)
    {
      if (ctx.isWindow)
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
    loc:  [(ctx.isWindow 
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
    return Lum.load.globalContext.loadFrom(...arguments);
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
    for (let a=0; a < arguments.length; a++)
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
          else if (ctx.isWindow && url.endsWith('.css'))
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

    // Get a plain object with a specified subset of our properties.
    prop(settings, 'extract', function()
    {
      const set = {};
      for (const arg of arguments)
      {
        if (typeof arg === S)
        {
          set[arg] = this[arg];
        }
        else 
        {
          throw new TypeError("Property names must be strings");
        }
      }
      return set;
    });

    // Given an object and a list of properties, if the object does not
    // have the said properties, set them from the settings.
    prop(settings, 'populate', function(obj, ...props)
    {
      if (!isObj(obj)) throw new TypeError("");
    })

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

  function getLoaderOpts(caller, args, objProps, objAttrs)
  {
    const DEFS = LUM_LOAD_DEFAULT_OPTS;
    const GC = Lum.load.globalContext;
    let opts;

    if (typeof args[0] === O && typeof args[0].url === S)
    { // Named options can be passed directly.
      opts = args[0];
      for (const opt of DEFS)
      {
        if (opts[opt] === undefined)
        { // Use the global context for default values.
          opts[opt] = GC[opt];
        }
      }
    }
    else if (caller.isLoadSettings && typeof args[0] === S)
    { // We get all our options from the current settings object.
      opts = caller;
      opts.url = args[0];
    }
    else
    { // Loop the arguments to look for more options.
      opts = GC.extract(...DEFS);

      const hasProps = typeof objProps === S;
      const hasAttrs = typeof objAttrs === S;

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
        else if (hasProps && opts[objProps] === undefined && isObj(arg))
        { // First time we see a raw object, it's Element properties.
          opts[objProps] = arg;
        }
        else if (hasAttrs && opts[objAttrs] === undefined && isObj(arg))
        { // The second time we see a raw object, it's Element attributes.
          opts[objAttrs] = arg;
        }
        else
        {
          console.error("Unknown or invalid parameter", 
            arg, caller, args, objProps, objAttrs);
        }
      }
    }

    if (!(typeof opts.url === S))
    {
      throw new Error("Could not find a valid 'url' parameter");
    }

    if (ctx.isWindow && !isInstance(opts.loc, Element))
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
    const opts = getLoaderOpts(this, arguments, 'scriptProps', 'scriptAttrs');

    const prefix = opts.jsPrefix || '';
    const suffix = opts.jsSuffix || '';

    const url = prefix + opts.url + suffix;

    // TODO: support usePromise in a few forms.

    if (ctx.isWindow)
    {
      const script = document.createElement('script');
      if (typeof opts.scriptProps === O)
      {
        for (const prop in opts.scriptProps)
        {
          script[prop] = opts.scriptProps[prop];
        }
      }
      if (typeof opts.scriptAttrs === O)
      {
        for (const attr in opts.scriptAttrs)
        {
          script.setAttribute(attr, opts.scriptAttrs[attr]);
        }
      }
      if (typeof opts.func === F)
      {
        script.$lumLoadOptions = opts;
        if (opts.useOnLoad)
          script.onload = opts.func;
        if (opts.useReadyState)
          script.onreadystatechange = opts.func;
      }
      script.src = url;
      opts.loc.appendChild(script);
      if (typeof opts.func === F && !opts.useOnLoad && !opts.useReadyState)
      {
        opts.func.call(Lum, opts);
      }
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
      console.error("Lum.load.js() is not supported in this context", 
        arguments, this, ctx, Lum);
    }
  });

  /**
   * Load CSS
   */
  prop(Lum.load, 'css', function ()
  {
    // TODO: support usePromise in a few forms.

    if (ctx.isWindow)
    {
      const opts = getLoaderOpts(this, arguments, 'linkProps', 'linkAttrs');

      const prefix = opts.cssPrefix || '';
      const suffix = opts.cssSuffix || '';

      const url = prefix + opts.url + suffix;

      const link = document.createElement('link');
      if (typeof opts.linkProps === O)
      {
        for (const prop in opts.linkProps)
        {
          link[prop] = opts.linkProps[prop];
        }
      }
      if (typeof opts.linkAttrs === O)
      {
        for (const attr in opts.linkAttrs)
        {
          link.setAttribute(attr, opts.linkAttrs[attr]);
        }
      }
      link.rel = 'stylesheet';
      link.type = 'text/css';
      if (typeof opts.func === F)
      {
        link.$lumLoadOptions = opts;
        if (opts.useOnLoad)
          link.onload = opts.func;
        if (opts.useReadyState)
          link.onreadystatechange = opts.func;
      }
      link.href = url;
      loc.appendChild(link);
      if (typeof opts.func === F && !opts.useOnLoad && !opts.useReadyState)
      {
        opts.func.call(opts, link);
      }
    }
    else 
    {
      console.error("Lum.load.css() is not supported in this context", 
        arguments, this, ctx, Lum);
    }
  });

  /**
   * Load arbitrary data, uses the Fetch API.
   */
  prop(Lum.load, 'data', function ()
  {
    if (!ctx.has.fetch)
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
    // TODO: support usePromise 
    return Lum.load(
    {
      jsPrefix: this.globalContext.modulePrefix, 
      jsSuffix: this.globalContext.moduleSuffix,
      js: modules,
    });
  });

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

    //--- Wrapper class (move into 'wrapper' library in next release)

  // A helper function to get a backup name if necessary.
  prop(Lum, '$backupName', function(prop)
  {
    return Lum.$wrapBackupPrefix + prop;
  });

  // A private cache of wrapper objects.
  const wrappers = [];

  /**
   * A class used to create Proxy-wrapped objects.
   *
   * Meant for allowing backwards compatibility modes.
   */
  class LumWrapper
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
      const isProxy = (ctx.has.Proxy && isInstance(obj, Proxy, true));

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
        throw new TypeError("Wrapper~construtor: obj was not a valid object");
      }

      this.obj = obj;
      this.defs = {};

      this.fatal          = opts.fatal          ?? false;
      this.warn           = opts.warn           ?? true;
      this.useproxy       = opts.proxy          ?? ctx.has.Proxy;
      this.enumerable     = opts.enumerable     ?? false;

      this.proxy = null;
    }

    add(prop, item)
    {
      if (isNil(item))
      {
        throw new TypeError("Cannot assign an undefined or null value");
      }

      if (!doesDescriptor(item))
      { // The item passed is not a descriptor, so it's a value.
        item = {value: item, configurable: true, enumerable: this.enumerable}
      }

      //console.debug("Wrapper.add", prop, item, this.obj, this);

      if (this.obj[prop] !== undefined)
      { // An existing property was found as well.
        const backupName = Lum.$backupName(prop);
        if (this.defs[backupName] === undefined)
        { // Let's make a backup of the original property.
          const existing = getProperty(this.obj, prop);
          if (notNil(existing))
          {
            if (!existing.configurable)
            {
              if (this.warn || this.fatal)
              {
                console.error("Existing property is not configurable", 
                  existing, arguments, this);
              }
              if (this.fatal)
              {
                throw new Error(`Cannot configure ${prop}`);
              }
            }

            // Okay, assign the backup copy.
            this.defs[backupName] = existing;
            if (!this.useproxy)
            { // Add the backup to the object itself as well.
              Lum.prop(this.obj, backupName, null, existing);
            }
          }
          else
          {
            if (this.warn || this.fatal)
            {
              console.error("No property descriptor found", arguments, this);
            }
    
            if (this.fatal)
            {
              throw new Error(`Cannot overwrite/shadow property ${prop}`);
            }
          }
        }
      }

      this.defs[prop] = item;
      if (!this.useproxy)
      { // Add it directly to the object as well.
        Lum.prop(this.obj, prop, null, item);
      }

    } // add()

    del(prop)
    {
      if (this.defs[prop] === undefined)
      {
        const msg = `No ${prop} was found in this wrapper`;
        if (this.warn)
        {
          console.error(msg);
        }
        else if (this.fatal)
        {
          throw new Error(msg);
        } 
      }
    
      // Bye bye.
      delete(this.defs[prop]);

      const backupName = Lum.$backupName(prop);
      if (this.defs[backupName] !== undefined)
      { // A backup of the original was found.
        if (!this.useproxy)
        { // Restore the original property.
          prop(this.obj, prop, null, this.defs[backupName]);          
          // Remove the backup property from the object.
          delete(this.obj[backupName]);
        }
        // And remove the backup def.
        delete(this.defs[backupName]);
      }
      else if (!this.useproxy)
      { // No backup to restore, so just remove the property.
        delete(this.obj[prop]);
      }
    }

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
          if (hasValue(prop))
          { // A static value, send it along.
            return getValue(prop);
          }
          else if (hasGetter(prop))
          { // A getter method, pass through.
            return getGetter(prop).call(target);
          }
          else if (prop in target)
          { // It exists in the target.
            return target[prop];
          }
        },
        // Setter trap.
        set(target, prop, value, receiver)
        {
          if (hasSetter(prop))
          { // A setter method, pass through.
            return getSetter(prop).call(target, value);
          }
          else
          { // Try direct assignment instead.
            target[prop] = value;
            return true;
          }
        },
      }); // new Proxy

      // Cache the Proxy.
      this.proxy = proxy;

      return proxy;

    } // wrap()

    get length()
    {
      return Object.keys(this.defs).length;
    }

  } // Lum.Wrapper

  // And assign it to it's external name.
  prop(Lum, 'Wrapper', LumWrapper);

  // Default options for Wrapper.getWrapper() method.
  // This is the recommended method to get a Wrapper library.
  Lum.Wrapper.getWrapperOpts = {fatal: true};

  // Default options for Wrapper() constructor.
  // This is not recommended for direct use, use getWrapper() instead.
  Lum.Wrapper.constructorOpts = {warn: true};

  // A wrapper instance for Lum itself.

  //--- End of Wrapper class definition.

  //--- Wrapped compatibility methods.

  loaded.on('wrapper', function ()
  {
    console.debug("loaded::on<wrapper>", arguments, this);

    const wrap = Lum.Wrapper.getWrapper();

    wrap.add('registerNamespace', Lum.ns.add);
    wrap.add('getNamespace', Lum.ns.get);
    wrap.add('hasNamespace', Lum.ns.has);
    wrap.add('needNamespaces', Lum.ns.need);
    wrap.add('needNamespace',  Lum.ns.need);
    wrap.add('exportNamespace', Lum.ns.export);

    wrap.add('markLib', Lum.lib.mark);
    wrap.add('hasLib', Lum.lib.has);
    wrap.add('checkLibs', Lum.lib.check);
    wrap.add('needLibs', Lum.lib.need);
    wrap.add('needLib', Lum.lib.need);
    wrap.add('wantLibs', Lum.lib.want);

    wrap.add('checkJq', Lum.jq.check);
    wrap.add('needJq', Lum.jq.need);
    wrap.add('wantJq', Lum.jq.want);
  });

  // We haven't moved the wrapper library yet, so mark it now.
  loaded.mark('wrapper');

  //--- Now, return the wrapped object if available.
  return ourself(false);

}));

