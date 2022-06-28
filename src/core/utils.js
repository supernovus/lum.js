//++ core/utils ++//

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
   * `isObj, isNil, notNil, isComplex, isInstance, isArguments` - type checks.
   * `nonEmptyArray, isScalar` - more type checks.
   * `isEnum, isDescriptor` - Lum specific type checks.
   * `clone, lock, addClone, addLock, cloneIfLocked` - cloning/locking methods.
   * `copyProps` - Copy properties between objects in different ways.
   * `mergeNested, syncNested` - Merge properties between objects recursively.
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
    isObj, isNil, notNil, isComplex, isInstance, isArguments,
    nonEmptyArray, isScalar, needObj, needType,
    // Low-level object utilities.
    clone, lock, addClone, addLock, cloneIfLocked, ourself, prop,
    Enum, DESC, CLONE, setFlag, allFlags, ucfirst, ucwords,
    getLocale, InternalObjectId, unbound, getProperty, NYI, copyProps,
    mergeNested, syncNested,

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

//-- core/utils --//