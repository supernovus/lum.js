
const core = require('@lumjs/core');
const LoadTracker = require('@lumjs/compat/v4/loadtracker');
const {ourself,Lum} = require('./self');
const {Enum,def} = core;
const {S,F,isObj,isComplex,notNil} = core.types;

// A tag for jQuery if it's missing.
const JQTAG = 'jQuery';

// Ditto for Lum-specific jQuery libraries.
// But with some custom tests.
const jqLoaded = new LoadTracker(
{
  type:  'jQuery library',
  types: 'jQuery libraries',
  or: function(name)
  { // See if a jQuery function handler by that name exists.
    const $ = jq.get();
    //console.debug("jqLoaded:$isTest[or]", $, this);
    if (typeof $ !== F || !isObj($.fn)) return false;
    return ($.fn[name] !== undefined);
  },
  check: function()
  { // We don't actually care about the arguments in this one.
    const $ = jq.get();
    //console.debug("jqLoader:$check", $, this);
    if (typeof $ !== F || !isObj($.fn))
    { // Missing jQuery itself!
      return JQTAG;
    }
  },
});

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
function jq(opts, func)
{
  const $ = jq.get();
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
    lib.need(...needed);
  }

  if (Array.isArray(opts.needs))
  {
    const needed = opts.needs;
    ns.need(...needed);
  }

  if (Array.isArray(opts.jq))
  {
    const needed = opts.jq;
    jq.need(...needed);
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
    jq.mark(opts.name);
  }
  else if (Array.isArray(opts.name))
  {
    for (const name of opts.name)
    {
      jq.mark(name);
    }
  }

  // And now we're done.
  return (retVal ?? Lum);
} // jq()

// Like the loader.
def(jq, 'TYPE', JQ_TYPES);

/**
 * Get jQuery itself.
 *
 * If Lum.jq.$ is assigned, we return it.
 * Otherwise we return root.jQuery.
 */
def(jq, 'get', function ()
{
  return (typeof Lum.jq.$ === F) ? Lum.jq.$ : root.jQuery;
});

/**
 * See if a passed object is a jQuery instance.
 */
def(jq, 'is', function (obj)
{
  const $ = jq.get();
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
def(jq, 'wrap', function (el)
{
  const $ = jq.get();
  if (!$) return null; // No jQuery, cannot continue.

  if (typeof el === S)
  { // A string is easy.
    return $(el);
  }
  else if (jq.is(el))
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
def(jq, 'eventProp', function (ev, prop, oeFirst=false)
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
def(jq, 'dataTransfer', function (ev)
{
  return jq.eventProp(ev, 'dataTransfer', true);
});

// Add the methods handled by the LoadTracker.
jqLoaded.setupNamespace(jq);

// Export it.
module.exports = jq;

const ns = require('./ns');
const lib = require('./lib');