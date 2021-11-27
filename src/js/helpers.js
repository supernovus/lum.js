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

  // TODO: Finish porting this to the new API.

  // Import certain constants.
  const {O,F,S,B,N,U,BI,SY,is_obj,clone,CLONE_JSON} = Lum._;
  const prop = Lum.prop;
  const dep = Lum.deprecated;
  const wrap = dep.addWrapped;

  // Setup our library namespace, and mark the 'helpers' library as loaded.
  const lib = Lum.lib.mark('helpers').ns.new('obj');

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
   *
   * @param {object|function} target - The target we are copying into.
   * @param {...*} sources - 
   */
  Lum.addTraits = function (target, ...inSources)
  {
    var outSources = [];

    function unwrap (what)
    {
      if (typeof what === F && typeof what.prototype === O)
      {
        return what.prototype;
      }
      else if (is_obj(what))
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
      if (typeof source === B || typeof source === S)
      { // A special option statement, push it directly.
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
   * For each of the sources specified, this will call:
   *
   *  ```Lum.copyProperties(source, target, opts)```
   *
   * The current `opts` can be changed dynamically using special statements.
   * See below for details on the statements to make that work.
   * The default `opts` is `{default: true, overwrite: false}`
   *
   * @param  {object|function} target - The target we are copying into.
   * @param {...*} sources - The sources to copy from, and options.
   *
   * If a source is a boolean, it will reset the `opts.overwrite` property.
   *
   * If a source is the string 'default' we set the `opts` to:
   *   `{default: true, overwrite: opts.overwrite}`
   *
   * If a source is the string 'all' we set the `opts` to:
   *   `{all: true, overwrite: opts.overwrite}`
   *
   * If a source is an object with a property of `__copy_opts` which is `true`
   * then the `opts` will be set to the source itself.
   *
   * If a source is an object with a property of `__copy_opts` which is an
   * `object` then the `opts` will be set to the object, and the rest of
   * the properties from the source will be copied as usual.
   *
   * If the source is any other object or function, it will be considered a
   * valid source for copyProperties() to copy into the `target`.
   *
   * Any other source will be invalid and will throw an Error.
   *
   * @return {object|function}  The `target` will be returned.
   *
   */
  Lum.copyInto = function (target, ...sources)
  {
    let opts = {default: true, overwrite: false}; // default opts.

//    console.debug("Lum.copyInto()", target, sources);

    for (let s in sources)
    {
      let source = sources[s];
      const stype = typeof source;
//      console.debug("source", source, stype);
      if (stype === B)
      {
        opts.overwrite = source;
      }
      else if (stype === S)
      {
        if (source === 'default')
        {
          opts = {default: true, overwrite: opts.overwrite};
        }
        else if (source === 'all')
        {
          opts = {all: true, overwrite: opts.overwrite};
        }
      }
      else if (stype === O || stype === F)
      {
//        console.debug("copying properties", source);
        if (source.__copy_opts === true)
        { // Source is copy options.
          opts = source;
          continue; // Nothing more to do here.
        }
        else if (is_obj(source.__copy_opts))
        { // Copy options included in source.
          opts = source.__copy_opts;
          source = clone(source); // Make a copy of the source.
          delete(source.__copy_opts); // Remove the __copy_opts.
        }

        // Copy the properties.
        Lum.copyProperties(source, target, opts);
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
   * @param {object|function} source - The object to copy properties from.
   * @param {object|function} target - The target to copy properties to.
   * @param {object} [propOpts] Options for how to copy properties.
   * @param {boolean} [propOpts.default=true] Copy only enumerable properties.
   * @param {boolean} [propOpts.all=false] Copy ALL object properties.
   * @param {Array} [propOpts.props] A list of properties to copy.
   * @param {object} [propOpts.overrides] Descriptor overrides for properties.
   * @param {boolean} [propOpts.overwrite=false] Overwrite existing properties.
   * @param {Array} [propOpts.exclude] A list of properties NOT to copy.
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
   * @deprecated Use {@link Lum.prop} from core.js instead.
   *
   * @param {object} object - The object we are adding a property to.
   * @param {string} name - The property name.
   * @param {*} val - The value we are assigning to the property.
   * @param {object|boolean} [opts] If boolean uses `{configurable: opts}`;
   *
   * @param {boolean} [opts.configurable=false] Property is configurable?
   * @param {boolean} [opts.enumerable=false] Property is enumerable?
   * @param {boolean} [opts.writable=false] Property is writable?
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
   * @deprecated Use {@link Lum.prop} from core.js instead.
   *
   * @param {object} object - The object we are adding an accessor to.
   * @param {string} name - The property name for the accessor.
   * @param {function} getter - The getter function for the accessor.
   * @param {function} setter - The setter function for the accessor.
   * @param {object|boolean} [opts] If boolean uses `{configurable: opts}`;
   *
   * @param {boolean} [opts.configurable=false] Property is configurable?
   * @param {boolean} [opts.enumerable=false] Property is enumerable?
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
    else if (is_obj(opts))
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
   * @deprecated See {@link Lum.prop} instead, it's just better.
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
   * Clone a simple object, using the {@link Lum._.clone} function.
   *
   * By default it uses Lum._.CLONE_JSON mode for cloning, but this can
   * be adjusted as desired by passing a `cloneOpts.mode` option.
   *
   * Can also clone extended properties that aren't serialized in JSON.
   *
   * @param {object} object The object or function to clone.
   *
   * @param {object} [copyProperties] Use {@link Lum.copyProperties} as well.
   *
   *   If copyProperties is defined, and is a non-false value, then we'll
   *   call Lum.copyProperties(object, clone, copyProperties);
   *
   *   It's called after the regular cloning, so only properties that weren't
   *   added during the cloning process will be added here. Useful for certain
   *   special properties which might not otherwise get added.
   *
   * @param {object} [cloneOpts] Options to send to {@link Lum._clone}
   *
   *   This can be any options supported by the {@link Lum._.clone} function.
   *
   * @return {object}  A clone of the object.
   *
   */
  Lum.clone = function(object, copyProperties, cloneOpts)
  {
    if (!is_obj(cloneOpts))
    {
      cloneOpts = {mode: CLONE_JSON};
    }

    //console.debug("Lum.clone", object, copyProperties, cloneOpts);

    let copy = clone(object, cloneOpts);

    //console.debug("Lum.clone:copy", copy);

    if (copyProperties)
    {
      Lum.copyProperties(object, copy, copyProperties);
    }

    return copy;
  }

  /**
   * See if a value is set, and if not, return a default value.
   *
   * @param {*} opt - The value we are testing.
   * @param {*} defvalue - The default value if opt was null or undefined.
   *
   * @param {boolean} [allowNull=false] If true, allow null to count as "set".
   * @param {boolean} [isLazy=false] If true, and defvalue is a function, use
   *                             the value from the function as the default.
   *                             No parameters are passed to the function.
   * @param {object} [lazyThis=null] If isLazy is true, this object
   *                             will be used as the `this` for the function.
   *
   * @return {*} Either the specified `opt` value or the default value.
   */
  Lum.getDef = function (opt, defvalue, allowNull=false, isLazy=false,
    lazyThis=null)
  {
    if (opt === undefined || (!allowNull && opt === null))
    { // The defined value was not "set" as per our rules.
      if (isLazy && typeof defvalue === F)
      { // Get the default value from a passed in function.
        return defvalue.call(lazyThis);
      }
      return defvalue;
    }

    return opt;
  }

  // TODO: document this.
  function needObj (obj)
  {
    if (!is_obj(obj))
    {
      throw new Error("Invalid object");
    }
  }
  Lum.needObj = needObj;

  const JS_TYPES = [O, B, N, BI, S, SY, F, U];

  function needType (type, val, passObject=false)
  {
    if (typeof type !== S || !JS_TYPES.includes(type))
    {
      throw new Error("Invalid type "+JSON.stringify(type)+" specified");
    }
    
    if (passObject && type === O)
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
   * This uses the {Lum.getDef} method, and as such supports the same options.
   * However read the parameters carefully, as the defaults may be different!
   *
   * @param {object} opts - An object to test for a property in.
   * @param {string} optname - The property name we're checking for.
   * @param {*} defvalue - The default value.
   *
   * @param {bool} [allowNull=true] Same as getDef, but the default is true.
   * @param {bool} [isLazy=false] Same as getDef.
   * @param {object} [lazyThis=null] Same as getDef.
   *
   * @return {any}  Either the property value, or the default value.
   */
  Lum.getOpt = function (opts, optname, defvalue, 
    allowNull=true, isLazy=false, lazyThis=null)
  {
    needObj(opts);
    needType(S, optname);
    return Lum.getDef(opts[optname], defvalue, allowNull, isLazy, lazyThis);
  }

  /**
   * Get a property from a nested data structure.
   * Based on the same way we handle namespaces.
   *
   * @todo document this
   */
  Lum.getNested = function (obj, proppath)
  {
    if (typeof proppath === S)
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

