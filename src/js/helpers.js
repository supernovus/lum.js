/*
 * Core utilities used by other Lum libraries.
 */

(function (Lum)
{
  "use strict";

  if (Lum === undefined)
  {
    throw new Error("Missing Lum core");
  }

  Lum.markLib('helpers');

  /**
   * A way to handle Mixins/Traits.
   *
   * This is basically a magic wrapper around copyInto() which we use
   * instead of Object.assign() as we don't want to overwrite properties
   * by default. See {@link Lum.copyInto} for the valid parameters.
   *
   * This does a bit of magic before passing it's parameters to copyInto().
   * As it's designed to extend the class prototype and only the prototype,
   * it will see if anything passed to it is a function/class and if so, it
   * will automatically use the prototype of the function/class. If you want
   * to copy static class properties, use copyInto() directly instead of this.
   */
  Lum.addTraits = function (target, ...inSources)
  {
    var outSources = [];

    function unwrap (what)
    {
      if (typeof what === 'function' && typeof what.prototype === 'object')
      {
        return what.prototype;
      }
      else if (typeof what === 'object')
      {
        return what;
      }
      else
      {
        throw new Error("Invalid function/object passed to addTraits()");
      }
    }

    target = unwrap(target); // Ensure the target is an object.

    for (var s in inSources)
    {
      var source = inSources[s];
      if (typeof source === 'boolean')
      { // Booleans are a special case used by copyInto()
        outSources.push(source);
      }
      else
      { // Anything else needs to be unwrapped.
        outSources.push(unwrap(source));
      }
    }

    return Lum.copyInto(target, outSources);
  }

  /**
   * Copy properties between objects. Can be used for mixins/traits.
   *
   * This calls
   *  Lum.copyProperties(source, target, {default: true, overwrite: overwrite})
   * for each of the sources specified (with the current overwrite value.)
   *
   * @param  {object|function} target   The target we are copying into.
   * @param {...(object|function|boolean)} sources The sources we copy from.
   *
   * If a source is a boolean, it changes the 'overwrite' behavior for any
   * objects/functions following it. If 'overwrite' is true, existing
   * properties with the same name already in the target will be overwritten.
   * If 'overwrite' is false (the default) then they will not be overwritten.
   *
   */
  Lum.copyInto = function (target, ...sources)
  {
    var overwrite = false;
//    console.log("Lum.copyInto()", target, sources);
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
        Lum.copyProperties(source, target, {default: true, overwrite: overwrite});
      }
      else
      {
        throw new Error("Invalid function/object passed to copyInto()");
      }
    }
    return target;
  }

  /**
   * Copy properties from one object to another.
   *
   * @param {object|function} source  The object to copy properties from.
   * @param {object|function} target  The target to copy properties to.
   * @param {object} propOpts  Options, see below.
   *
   * If propOpts is anything other than a non-null object, it's the same as
   * passing {default: true}.
   *
   * Options supported:
   *
   *  default:   boolean      If true, copy enumerable properties.
   *  all:       boolean      If true, copy ALL properties.
   *  props:     array        A list of properties to copy.
   *  overrides: object       A map of descriptor overrides for properties.
   *  overwrite: boolean      Overwrite existing properties if true.
   *  exclude:   array        A list of properties NOT to copy.
   * 
   * If 'props' is set, it overrides all other options for which properties
   * to copy. If 'all' is true, all properties including special ones will
   * be copied. If 'default' is true, all enumerable properties will be copied.
   * If none of those are specified, but 'overrides is set,
   * only the properties named in the 'overrides' will be copied.
   *
   * Be very careful with 'overwrite', it's a dangerous option.
   *
   * @return void
   */
  Lum.copyProperties = function (source, target, propOpts)
  {
    if (propOpts === null || typeof propOpts !== 'object')
      propOpts = {default: true};

    var defOverrides = 'overrides' in propOpts ? propOpts.overrides : {};
    var overwrite    = 'overwrite' in propOpts ? propOpts.overwrite : false;

    var exclude = Array.isArray(propOpts.exclude) ? propOpts.exclude : null;

    var propDefs;

    if (propOpts.props && Array.isArray(propOpts.props))
    {
      propDefs = propOpts.props;
    }
    else if (propOpts.all)
    {
      propDefs = Object.getOwnPropertyNames(source); 
    }
    else if (propOpts.default)
    {
      propDefs = Object.keys(source);
    }
    else if (propOpts.overrides)
    {
      propDefs = Object.keys(propOpts.overrides);
    }

    if (!propDefs)
    {
      console.error("Could not determine properties to copy", propOpts);
      return;
    }

    // For each propDef found, add it to the target.
    for (var p = 0; p < propDefs.length; p++)
    {
      var prop = propDefs[p];
      if (exclude && exclude.indexOf(prop) !== -1)
        continue; // Excluded property.
      var def = Object.getOwnPropertyDescriptor(source, prop)
      if (def === undefined) continue; // Invalid property.
      if (prop in defOverrides && typeof defOverrides[prop] === 'object')
      {
        for (var key in defOverrides[prop])
        {
          var val = defOverrides[prop][key];
          def[key] = val;
        }
      }
      if (overwrite || target[prop] === undefined)
      { // Property doesn't already exist, let's add it.
        Object.defineProperty(target, prop, def);
      }
    }
  }

  /**
   * A wrapper around Object.defineProperty() that assigns a value to
   * the property.
   *
   * DEPRECATED: Use Lum.prop() from core.js instead.
   *
   * @param object object    The object we are adding a property to.
   * @param string name      The property name.
   * @param mixed  val       The value we are assigning to the property.
   * @param mixed  opts      See below for valid values.
   *
   * The 'opts' if specified can be the boolean true, in which case the
   * property will be configurable later, or can be an object with:
   *
   *  'configurable'   Should this property be configurable (default: false).
   *  'enumerable'     Should this property be enumerable (default: false).
   *  'writable'       Should this property be writable (default: false).
   *
   */
  Lum.addProperty = function (object, name, val, opts)
  {
    let msg = 'Lum.addProperty(object, name, val';
    let func;

    if (opts === true)
    {
      msg += ', true)';
      func = function()
      {
        return Lum.prop(object, name, val, {configurable: true});
      }
    }
    else if (typeof opts === 'object' && opts !== null)
    { 
      msg += ', opts)';
      func = function()
      {
        return Lum.prop(object, name, val, opts);
      }
    }
    else
    {
      msg += ')';
      func = function() 
      {
        return Lum.prop(object, name, val);
      }
    }

    return Lum.deprecated(msg, func);
  }

  /**
   * A wrapper around Object.defineProperty() that assigns an accessor to
   * the property.
   *
   * DEPRECATED: Use Lum.prop() from core.js instead.
   *
   * @param object   object    The object we are adding an accessor to.
   * @param string   name      The property name for the accessor.
   * @param function getter    The getter function for the accessor.
   * @param function setter    The setter function for the accessor.
   * @param mixed    opts      See below for valid values.
   *
   * The 'opts' if specified can be the boolean true, in which case the
   * property will be configurable later, or can be an object with:
   *
   *  'configurable'   Should this property be configurable (default: false).
   *  'enumerable'     Should this property be enumerable (default: false).
   *
   */
  Lum.addAccessor = function (object, name, getter, setter, opts)
  {
    let msg = 'Lum.addAccessor(object, name, getter, setter';
    let func;

    if (opts === true)
    { 
      msg += ', true)';
      func = function() {
        return Lum.prop(object, name, getter, setter, {configurable: true});
      }
    }
    else if (typeof opts === 'object' && opts !== null)
    { 
      msg += ', opts)';
      func = function() {
        return Lum.prop(object, name, getter, setter, opts);
      }
    }
    else
    { 
      msg += ')';
      func = function() {
        return Lum.prop(object, name, getter, setter);
      }
    }

    return Lum.deprecated(msg, func);
  }

  /**
   * Add 'addProperty' and 'addAccessor' helpers to the object directly.
   *
   * Like the above two methods, this is DEPRECATED. Use Lum.prop() instead.
   */
  Lum.addMetaHelpers = function (object, configurable)
  {
    Lum.deprecated('Lum.addMetaHelpers(object, configurable)',
      'Lum.prop(object, "prop"); // See Lum.prop() for details');

    Lum.addProperty(object, 'addProperty', function (pn,pf,opts)
    {
      Lum.addProperty(this, pn, pf, opts);
    }, configurable);

    Lum.addProperty(object, 'addAccessor', function (pn, gf, sf, opts)
    {
      Lum.addAccessor(this, pn, gf, sf, opts);
    }, configurable);
  }

  /**
   * Clone a simple object, using a simple JSON chain.
   *
   * Can also clone extended properties that aren't serialized in JSON.
   *
   * @param {object}                object           Object to clone.
   * @param {boolean|array|object}  copyProperties   See below.
   *
   * @return {object}  A clone of the object.
   *
   * If copyProperties is defined, and is a non-false value, then we'll
   * call Lum.copyProperties(object, clone, copyProperties);
   */
  Lum.clone = function clone (object, copyProperties)
  {
    var clone = JSON.parse(JSON.stringify(object));
    if (copyProperties)
    {
      Lum.copyProperties(object, clone, copyProperties);
    }
    return clone;
  }

  /**
   * See if a value is set, and if not, return a default value.
   *
   * @param {any}    opt        The value we are testing.
   * @param {any}    defvalue   The default value if opt was null or undefined.
   *
   * @param {bool}   allowNull  If true, allow null to count as "set".
   *                            Default is false.
   * @param {bool}   isLazy     If true, and defvalue is a function, return
   *                            the value from the function as the default.
   *                            No parameters are passed to the function.
   *                            Default is false.
   * @param {object} lazyThis   If specified, and isLazy is true, this object
   *                            will be used as the `this` for the function.
   *                            The default is null, i.e. no `this` context.
   *
   * @return {any}   Either the specified `opt` value or the default value.
   */
  Lum.getDef = function (opt, defvalue, allowNull=false, isLazy=false,
    lazyThis=null)
  {
    if (opt === undefined || (!allowNull && opt === null))
    { // The defined value was not "set" as per our rules.
      if (isLazy && typeof defvalue === "function")
      { // Get the default value from a passed in function.
        return defvalue.call(lazyThis);
      }
      return defvalue;
    }

    return opt;
  }

  function needObj (obj)
  {
    if (typeof obj !== "object" || obj === null)
    {
      throw new Error("Invalid object");
    }
  }
  Lum.needObj = needObj;

  const JS_TYPES =
  [
    "object", "boolean", "number", "bigint", "string",
    "symbol", "function", "undefined",
  ];

  function needType (type, val, passObject=false)
  {
    if (typeof type !== "string" || !JS_TYPES.includes(type))
    {
      throw new Error("Invalid type "+JSON.stringify(type)+" specified");
    }
    
    if (passObject && type === "object")
    { // Pass it on to needObj() which rejects null.
      return needObj(val);
    }

    if (typeof val !== type)
    {
      throw new Error(`Invalid ${type} value`);
    }
  }
  Lum.needType = needType;

  /**
   * See if a property in an object is set.
   *
   * If it is, return the property, otherwise return a default value.
   * This uses the getDef() method, and as such supports the same options.
   * However read the parameters carefully, as the defaults may be different!
   *
   * @param {object}  opts       An object to test for a property in.
   * @param {string}  optname    The property name we're checking for.
   * @param {any}     defvalue   The default value.
   *
   * @param {bool}    allowNull  Same as getDef, but the default is true.
   * @param {bool}    isLazy     Same as getDef.
   * @param {object}  lazyThis   Same as getDef.
   *
   * @return {any}  Either the property value, or the default value.
   */
  Lum.getOpt = function (opts, optname, defvalue, 
    allowNull=true, isLazy=false, lazyThis=null)
  {
    needObj(opts);
    needType("string", optname);
    return Lum.getDef(opts[optname], defvalue, allowNull, isLazy, lazyThis);
  }

  /**
   * Get a property from a nested data structure.
   * Based on the same way we handle namespaces.
   */
  Lum.getNested = function (obj, proppath)
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

})(window.Lum);

