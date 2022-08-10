// Lum.ns

const core = require('@lumjs/core');
const 
{
  S,B,isObj,isNil,notNil,nonEmptyArray,doesDescriptorTemplate,def,
} = core.types;
const {getNamespace,setNamespace,nsArray,nsString} = core.obj.ns;
const {ourself,Lum} = require('./self');

/**
 * The default global namespace we'll export to.
 * @alias module:@lumjs/global-namespace.ns.name
 * @type {string}
 * @see module:@lumjs/global-namespace.ns.$self
 */
exports.name = 'Lum';

/**
 * Define the default methodology to assign namespace objects.
 * @alias module:@lumjs/global-namespace.ns.useProp
 * @type {(boolean|object)}
 * @see module:@lumjs/global-namespace.ns.add
 */
 exports.useProp = true;

/**
 * Register a global Namespace.
 *
 * As of the modular codebase, this is now a wrapper around the
 * `@lumjs/core/obj.setNamespace` method.
 * 
 * @alias module:@lumjs/global-namespace.ns.add
 *
 * @param {(string|string[])} namespaces  The namespace we are registering.
 *
 * Generally passed as a single string like:
 *
 * `'MyCompany.MyApp.MyPage'`
 *
 * It will create a global object called `MyCompany` with a child
 * object called `MyApp` with a child object called `MyPage`.
 *
 * You can also pass an array of strings representing the namespace path.
 * So the above would be passed as:
 *
 * `['MyCompany','MyApp','MyPage']`
 *
 * The latter syntax may be slightly faster, but it looks more cumbersome.
 * The choice is yours.
 *
 * @param {*} [value] Assign to the last element of the namespace.
 *   Only used if it is not `null` or `undefined`.
 *
 * @param {(boolean|object)} [opts] Options for the `setNamespace()` method.
 * 
 *   When specified as an object, `opts.desc` and  `opts.assign` properties 
 *   will override the values normally assigned by the `useprop` parameter.
 *  
 *   However, if a valid `value` parameter was passed, it will take precedence 
 *   over an existing `opts.value` property in the options.
 * 
 *   If specified as a boolean value, it's assumed to be the `opts.overwrite`
 *   option, which is only used if a valid `value` parameter was specified.
 * 
 * @param {(boolean|object))} [useprop=Lum.ns.useProp] How to assign the added namespaces.
 *
 *   If this is an `object` that is a valid *descriptor template*, it will be
 *   set as the `opts.desc` option for `setNamespace()`.
 *
 *   If this is `false` then we'll set the `opts.assign` option to `true`.
 * 
 *   Any other value here will be ignored (including the default of `true`.)
 * 
 * @returns {*} - Typically the last element of the namespace added.
 *   The return value may be changed via specific `opts` properties.
 *   See the `setNamespace()` and `setObjectPath()` API docs.
 */
exports.add = function (namespaces, value, opts={}, useprop=exports.useProp)
{
  if (typeof opts === B)
  {
    opts = {overwrite: opts};
  }
  else if (!isObj(opts))
  {
    opts = {};
  }

  if (notNil(value))
  { 
    opts.value = value;
  }

  if (isNil(opts.desc) && doesDescriptorTemplate(useprop))
  { 
    opts.desc = useprop;
  }
  else if (isNil(opts.assign) && useprop === false)
  {
    opts.assign = true;
  }

  return setNamespace(namespaces, opts);
} // Lum.ns.add()

/**
 * A wrapper around `add()` for adding sub-namespaces to our global namespace.
 * 
 * @alias module:@lumjs/global-namespace.ns.new
 * @param {(string|string[])} namespaces - The child namespace path.
 * @param {*} [value={}] An optional value to assign.
 * @param {(string|string[])} [prefix=Lum.ns.name] The namespace prefix to prepend.
 * @param {*} [useprop=Lum.ns.useProp] 
 * @returns {}
 */
exports.new = function(namespaces, value, prefix=exports.name, useprop=exports.useProp)
{
  console.debug("Lum.ns.new", {namespaces, value, prefix, useprop}, arguments);
  const PRE = 'Prefix';
  const NS  = 'Namespace';

  if (typeof namespaces === S)
  {
    prefix = nsString(prefix, PRE);
    namespaces = `${prefix}.${namespaces}`;
  }
  else if (nonEmptyArray(namespaces))
  {
    prefix = nsArray(prefix, PRE);
    namespaces.unshift(...prefix);
  }
  else
  {
    throw SOA(NS);
  }

  return exports.add(namespaces, value, false, useprop);
} // Lum.ns.new()

/**
 * A wrapper around `new()` to make building libraries easier.
 * @alias module:@lumjs/global-namespace.ns.build
 * @param {(object|string)} opts - Options for building the namespace.
 *   If this is a `string` it's assumed to be the `opts.ns` option.
 * @param {string} [opts.ns] The nested namespace to add.
 * @param {string} [opts.name] An alias for `opts.ns`.
 * @param {string} [opts.path] Another alias for `opts.ns`.
 * @param {string} [opts.prefix=Lum.ns.name] The `prefix` parameter for `new()`.
 * @returns 
 */
exports.build = function(opts)
{
  console.debug("Lum.ns.build", opts, arguments);
  const INVOPTS = "Options must be an object or string";

  if (typeof opts === S)
  { // Assume it's the ns option.
    opts = {ns: opts};
  }
  else if (!isObj(opts))
  {
    throw new TypeError(INVOPTS);
  }

  const prefix   = opts.prefix  ?? exports.name;
  const addProp  = opts.addProp ?? '_add';
  const subProp  = opts.subProp;

  const ns = opts.ns ?? opts.name ?? opts.path;

  // Build the library namespace object.
  const newNS = exports.new(ns, opts.value, prefix, opts.useProp);

  if (typeof addProp === S && newNS[addProp] === undefined)
  { // Add a method to add new properties.
    def(newNS, addProp, def(newNS));
  }

  if (typeof subProp === S && newNS[subProp] === undefined)
  { // Add a method to add nested namespaces.
    def(newNS, subProp, function (subOpts)
    {
      if (typeof subOpts === S)
      {
        subOpts = {ns: subOpts};
      }
      else if (!isObj(subOpts))
      {
        throw new TypeError(INVOPTS);
      }

      // Yeah we're forcing the use of string prefixes here.
      subOpts.prefix = nsString(prefix) + '.' + nsString(ns);
      
      const moreProps = {addProp, subProp};
      for (const key in moreProps)
      {
        if (subOpts[key] === undefined)
        {
          subOpts[key] = moreProps[key];
        }
      }
      
      return exports.build(subOpts);
    });
  }

  // Finally, return the library object.
  return newNS;
} // Lum.ns.build()

/**
 * Get a namespace.
 *
 * As of the modular codebase, this is just an alias
 * for the `@lumjs/core/obj.getNamespace` method.
 * 
 * @alias module:@lumjs/global-namespace.ns.get
 * @param {(string|string[])} namespaces - A namespace path.
 * @param {(boolean|object)} [opts] See `getNamespace()` docs for details.
 * @return {*} The namespace if it exists, or `undefined` if it doesn't.
 */
exports.get = core.obj.ns.getNamespace;

/**
 * See if a namespace exists.
 *
 * @alias module:@lumjs/global-namespace.ns.has
 *
 * @param {(string|string[])} namespaces - A namespace definition.
 * @param {boolean} [logerror=false] Log errors for missing namespaces?
 * @return {boolean} Does the namespace exist?
 */
exports.has = function (namespaces, logerror=false)
{
  return (getNamespace(namespaces, logerror) !== undefined);
} // Lum.ns.has()

/**
 * Check for needed namespaces.
 *
 * @param {...string} Any arguments are the names of namespaces we need.
 *
 * @return {Lum} - The Lum core object.
 *
 * @throw Error - If a required namespace is missing, an error is thrown.
 *
 * @alias module:@lumjs/global-namespace.ns.need
 */
exports.need = function ()
{
  for (let n = 0; n < arguments.length; n++)
  {
    let ns = arguments[n];
    if (!exports.has(ns))
    {
      throw new Error("Missing required namespace/library: "+JSON.stringify(ns));
    }
  }
  return ourself();
} // Lum.ns.need();

/**
 * Export a global namespace to another global namespace.
 *
 * @param {string|strings[]} source  The namespace to export.
 * @param {string|strings[]} target  The target namespace.
 * @param {boolean} [overwrite=false]
 * @alias module:@lumjs/global-namespace.ns.export
 */
exports.export = function (source, target, overwrite=false)
{
  if (!overwrite && exports.has(target))
  {
    console.error("Will not overwrite namespace", target);
    return;
  }
  let ns = getNamespace(source, true);
  if (ns === undefined)
  { // Nothing to export, goodbye.
    return;
  }
  return exports.add(target, ns, overwrite);
} // Lum.ns.export()

/**
 * Make a link to a library/function into another namespace.
 *
 * @alias module:@lumjs/global-namespace.ns.link
 *
 * As an example, if there's a global function called base91() and we want to
 * make an alias to it called Lum.Base91.mscdex() then we'd call:
 *
 *  Lum.ns.link(self.base91, 'Base91.mscdex');
 *
 * @param {object|function} obj - The library/function we're linking to.
 * @param {string} target - The namespace within {prefix} we're assigning to.
 * @param {boolean} [overwrite=false] Overwrite existing target namespace?
 * @param {string} [prefix="Lum."] Prefix for the namespace target.
 *
 * @return {object} The core Lum library is returned for chaining purposes.
 */
exports.link = function (obj, target, overwrite=false, prefix="Lum.")
{
  exports.add(prefix+target, obj, overwrite);
  return ourself();
} // Lum.ns.link()

/**
 * Register a global variable (or multiple) for Lum itself.
 * @alias module:@lumjs/global-namespace.ns.$self
 * @param {...string} [ns] - The global namespaces to register.
 * If not specified, will default to the value of the `Lum.ns.name` property.
 */
exports.$self = function (...gns)
{
  const self = ourself(Lum.$nsSelfUnwrapped);

  if (gns.length === 0) gns[0] = exports.name; // Default name.
  
  for (const ns of gns)
  {
    exports.add(ns, self);
  }
} // Lum.ns.$self()

//-- core/ns --//