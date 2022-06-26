//++ core/clone ++//

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

  //-- core/clone --//