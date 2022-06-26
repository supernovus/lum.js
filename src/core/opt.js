//++ core/opt ++//

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
 
//-- core/opt --//
