
const core = require('@lumjs/core');
const LoadTracker = require('./loadtracker');
const {ourself,Lum} = require('./self');
const {Enum,def} = core;
const {S,F,isObj,isComplex,notNil,isNil,isArray} = core.types;
const {clone} = core.obj;

const loaded = new LoadTracker({type: 'library', types: 'libraries'});

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
function lib(opts, func)
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

  if (isArray(opts.deps))
  {
    const needed = opts.deps;
    lib.need(...needed);
  }

  if (isArray(opts.needs))
  {
    const needed = opts.needs;
    ns.need(...needed);
  }

  let $ = null;

  if (isArray(opts.jq))
  {
    const needed = opts.jq;
    jq.need(...needed);
    $ = jq.get();
  }
  else if (opts.jq === true)
  {
    jq.need();
    $ = jq.get();
  }

  if (notNil(opts.ns))
  {
    nsObj = ns.build(opts.ns);
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

  if (isArray(opts.args))
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
    ns.build(aopts);
  }

  // Now mark the name(s) as loaded.
  if (typeof opts.name === S)
  {
    lib.mark(opts.name);
  }
  else if (Array.isArray(opts.name))
  {
    for (const name of opts.name)
    {
      lib.mark(name);
    }
  }

  // And now we're done.
  return (retVal ?? Lum);
} // lib loader.
  
def(lib, 'TYPE', LIB_TYPES);
  
// Add the methods handled by the LoadTracker.
loaded.setupNamespace(lib);

// Internal API not meant for outside use.
def(lib, 'toCore', function(lib, mark=true)
{
  if (mark)
    lib.mark(lib);
  console.error(lib, '→ replaced by core module');
});

// def(lib, '$loaded$', loaded);

// Okay, export it.
module.exports = lib;

const ns = require('./ns');
const jq = require('./jq');