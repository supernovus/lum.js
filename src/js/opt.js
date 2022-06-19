Lum.lib('opt', {ns: 'opt'}, 
function(Lum, optlib)
{
  "use strict";

    // Import certain constants.
    const {O,F,S,B,N,U,BI,SY,isObj} = Lum._;
  
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
   optlib.val = function (opt, defvalue, allowNull=false, isLazy=false,
    lazyThis=null)
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
  }

  // TODO: document
  function needObj (obj)
  {
    if (!isObj(obj))
    {
      throw new Error("Invalid object");
    }
  }
  optlib.needObj = needObj;

  const JS_TYPES = [O, B, N, BI, S, SY, F, U];

  // TODO: document
  function needType (type, val, allowNull=false)
  {
    if (typeof type !== S || !JS_TYPES.includes(type))
    {
      throw new Error("Invalid type "+JSON.stringify(type)+" specified");
    }
    
    if (!allowNull && type === O)
    { // Pass it on to needObj() which rejects null.
      return needObj(val);
    }

    if (typeof val !== type)
    {
      throw new TypeError(`Invalid ${type} value`);
    }
  }
  optlib.needType = needType;

  /**
   * See if a property in an object is set.
   *
   * If it is, return the property, otherwise return a default value.
   * This uses the {Lum.opt.val} method, and as such supports the same options.
   * However read the parameters carefully, as the defaults may be different!
   *
   * @param {object} opts - An object to test for a property in.
   * @param {string} optname - The property name we're checking for.
   * @param {*} defvalue - The default value.
   *
   * @param {bool} [allowNull=true] Same as val(), but the default is `true`.
   * @param {bool} [isLazy=false] Same as val().
   * @param {object} [lazyThis=null] Same as val().
   *
   * @return {any}  Either the property value, or the default value.
   */
  optlib.get = function (opts, optname, defvalue, 
    allowNull=true, isLazy=false, lazyThis=null)
  {
    needObj(opts);
    needType(S, optname);
    return optlib.val(opts[optname], defvalue, allowNull, isLazy, lazyThis);
  }

  /**
   * Get a property from a nested data structure.
   * Based on the same way we handle namespaces.
   *
   * @todo document this
   */
  optlib.getPath = function (obj, proppath)
  {
    needObj(obj);

    if (typeof proppath === S)
    {
      proppath = proppath.split('.');
    }
    else if (!Array.isArray(proppath))
    {
      throw new Error("getPath: proppath must be a string or array");
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
  
});