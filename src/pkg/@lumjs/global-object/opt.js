/**
 * Lum.opt module
 * @module @lumjs/global-object/opt
 */

const core = require('@lumjs/core');
const {F,S,needObj,needType,def} = core.types;

/**
 * Get options in various forms.
 * 
 * @param {object} opts - Named options
 * 
 * @param {object} [opts.obj]  An object to look for a property in.
 *   Will be passed to `opt.get()`. Must also specify `opts.prop`.
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
 * @returns {*} See `opt.val` and `opt.get` for details.
 * 
 * @alias module:@lumjs/global-namespace.opt
 */
function opt(opts)
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
    return core.opt.get(obj, prop, def, allowNull, isLazy, lazyThis);
  }
  else
  { // Redirecting to Lum.opt.val()
    const val       = opts.val;
    const allowNull = opts.allowNull ?? false;
    const lazyThis  = opts.lazyThis  ?? null;
    return core.opt.val(val, def, allowNull, isLazy, lazyThis);
  }
}

/**
 * Alias of `@lumjs/core.opt.val()`
 * @alias module:@lumjs/global-namespace/opt.val
 */
def(opt, 'val', core.opt.val);

/**
 * Alias of `@lumjs/core.opt.get`
 * @alias module:@lumjs/global-namespace/opt.get
 */
 def(opt, 'get', core.opt.get);

/**
 * Alias of `@lumjs/core.types.needObj()`
 * @alias module:@lumjs/global-namespace/opt.needObj
 */
def(opt, 'needObj',  needObj);

/**
 * Alias of `@lumjs/core.types.needType()`
 * @alias module:@lumjs/global-namespace/opt.needType
 */
def(opt, 'needType', needType);

/**
 * Alias of `@lumjs/core.obj.getObjectPath()`
 * @alias module:@lumjs/global-namespace/opt.getPath
 */
def(opt, 'getPath',  core.obj.getObjectPath);

// Export the function as the namespace.
module.exports = opt;