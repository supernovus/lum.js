// The `_` helper definition.
const core = require('@lumjs/core'); 
const {B,isObj,isComplex,notNil,isInstance,def} = core.types;
const {prop,descriptors} = require('@lumjs/compat/v4');

/**
 * The Lum._ property is a collection of useful
 * constants and functions which can be imported into libraries.
 * 
 * In `v4` this was an locked object that could only be modified
 * using its own internal `extend()` method. In `v5` I've left it
 * unlocked, and the `extend()` method simply copies items into it.
 *
 * A few constants and functions that might be useful:
 *
 * `O, F, S, B, N, U, SY, BI` - the Javascript type names as strings.
 * `TYPES` - All the above, plus special types and pseudo-types.
 * `TYPE_LIST` - A flat list of all string values from `TYPES`.
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
 * `DESC` - The Descriptor Factory object.
 * `CLONE` - The `clone()` mode Enum (also `clone.MODE`)
 * 
 * Some deprecated aliases that should be replaced:
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
 * @namespace module:@lumjs/global-object._
 * 
 */
const _ = {prop};

/**
 * Extend the `_` object.
 * 
 * @param {...(object|boolean)} args 
 * 
 * If the arg is a `boolean` it changes the current `overwrite` setting 
 * (default `false`).
 * 
 * If it is an `object` any property in it will be added to `_`.
 * 
 * @method module:@lumjs/global-object._.extend
 */
def(_, 'extend', function(...args)
{
  let overwrite = false;
  for (arg of args)
  {
    if (typeof arg === B)
    { // Change the overwrite option.
      overwrite = arg;
    }
    else if (isObj(arg))
    {
      for (let prop in arg)
      {
        if (overwrite || _[prop] === undefined)
        { // Add a new property.
          this[prop] = arg[prop];
        }
        else 
        {
          console.error("Cannot overwrite existing Lum._ property", prop, arg, this, arguments);
        }
      }
    }
  }
}); // extend()

_.extend(core.types, core.obj, core.flags, core.strings, core.meta,
{
  context: core.context, 
  TYPE_LIST: core.types.TYPES.list,
  DESC: descriptors.DESC,
  Enum: core.Enum,
});

// First lets make compatibility wrappers for each of the old DESC_* properties.
const DESCS = ['RO','CONF','ENUM','WRITE','RW','DEF','OPEN'];

for (const desc of DESCS)
{
  const getter = function()
  {
    console.warn(`The DESC_${desc} constant is deprecated; use DESC.${desc} instead.`);
    return lock(descriptors.DESC[desc]);
  }
  def(_, 'DESC_'+desc, {get: getter, enumerable: true});
}

// And the CLONE_ variables.
for (const cname in core.obj.CLONE)
{
  _['CLONE_'+cname] = core.obj.CLONE[cname];
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

module.exports = _;
