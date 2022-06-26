//++ core/ns ++//

  /**
   * Namespace management object.
   *
   * @namespace Lum.ns
   */
   prop(Lum, 'ns', {name: 'Lum'});

   /**
    * Register a global Namespace.
    *
    * @method Lum.ns.add
    *
    * @param {string|string[]} namespaces  The namespace we are registering.
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
    * @param {mixed} [value] Assign to the last element of the namespace.
    *
    *   If this is null or undefined, it won't be used. Anything else will be.
    *
    * @param {boolean} [overwrite=false] Overwrite the last element if it exists.
    *  
    *  Only applicable if assign was used.
    *
    * @param {mixed} [useprop=null] How to assign the added namespaces.
    *
    *   If this is `true` we will use Lum.prop() to assign them, with the
    *   descriptor object set in `Lum.ns.add.defaultDescriptor`;
    *
    *   If this is `false` will will simply use direct assignment.
    *
    *   If this is an {object} we will use Lum.prop() with it as the descriptor.
    *
    *   If this is anything else (including null), we will set it to the
    *   value in the `Lum.ns.add.useProp` property.
    *
    * @return {object} - The last element of the namespace added.
    */
   prop(Lum.ns, 'add', function (namespaces, value, 
     overwrite=false, 
     useprop=null)
   {
     namespaces = nsArray(namespaces);
 
     let desc = Lum.ns.defaultDescriptor;
 
     if (isObj(useprop))
     { // An explicit descriptor was passed, use it.
       desc = useprop;
       useprop = true;
     }
     else if (typeof useprop !== B)
     { // Use the default useprop value.
       useprop = Lum.ns.useProp;
     }
 
     function assign(obj, prop, val={})
     {
       if (useprop)
       {
         Lum.prop(obj, prop, val, desc);
       }
       else
       {
         obj[prop] = val;
       }
     }
 
     let cns = root;
     let nscount = namespaces.length;
     let lastns = nscount - 1;
 
     let dbg = {namespaces, assign, overwrite, nscount, lastns, value, useprop};
     console.debug("Lum.ns.add", dbg, arguments);
 
     for (let n = 0; n < nscount; n++)
     {
       let ns = namespaces[n];
 //      console.debug("Looking for namespace", n, ns, cns, cns[ns]);
 
       if (cns[ns] === undefined)
       { // Nothing in this namespace yet.
         if (n == lastns && notNil(value))
         { // We have a value to assign.
           assign(cns, ns, value);
 //          console.debug("Assigned", ns, cns[ns], value);
         }
         else
         { // Nothing to assign, create an empty object instead.
           assign(cns, ns);
         }
       }
       else if (overwrite && n == lastns && notNil(value))
       {
         assign(cns, ns, value);
       }
 
       cns = cns[ns];
     }
 
     return cns;
   }); // Lum.ns.add()
 
   // API to add new child namespaces, by default under the Lum prefix.
   prop(Lum.ns, 'new', function(namespaces, value, prefix='Lum', useprop=null)
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
 
     return Lum.ns.add(namespaces, value, false, useprop);
   });
 
   // Use prop() to register namespaces.
   Lum.ns.useProp = true;
 
   // The descriptor used by default to register namespaces.
   Lum.ns.defaultDescriptor = DESC.DEF;
 
   // A wrapper around `new()` to make building libraries easier.
   prop(Lum.ns, 'build', function(opts)
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
 
     const prefix   = opts.prefix  ?? 'Lum';
     const addProp  = opts.addProp ?? '_add';
     const subProp  = opts.subProp;
 
     const ns = opts.ns ?? opts.name ?? opts.path;
 
     // Build the library namespace object.
     const newNS = Lum.ns.new(ns, opts.value, prefix, opts.useProp);
 
     if (typeof addProp === S && newNS[addProp] === undefined)
     { // Add a method to add new properties.
       prop(newNS, addProp);
     }
 
     if (typeof subProp === S && newNS[subProp] === undefined)
     { // Add a method to add nested namespaces.
       prop(newNS, subProp, function (subOpts)
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
         
         return Lum.ns.build(subOpts);
       });
     }
 
     // Finally, return the library object.
     return newNS;
   });
 
   /**
    * Get a namespace.
    *
    * @method Lum.ns.get
    *
    * @param {string|array} namespaces  A namespace definition.
    * @param {boolean} [logerror=false] Log errors for missing namespaces?
    *
    * @return {mixed} The namespace if it exists, or `undefined` if it doesn't.
    */
   prop(Lum.ns, 'get', getNamespace);
 
   /**
    * See if a namespace exists.
    *
    * @method Lum.ns.has
    *
    * @param {string|array} namespaces  A namespace definition.
    * @param {boolean} [logerror=false] Log errors for missing namespaces?
    *
    * @return {boolean} Does the namespace exist?
    */
   prop(Lum.ns, 'has', function (namespaces, logerror=false)
   {
     return (Lum.ns.get(namespaces, logerror) !== undefined);
   });
 
   /**
    * Check for needed namespaces.
    *
    * @param {...string} Any arguments are the names of namespaces we need.
    *
    * @return {Lum} - The Lum core object.
    *
    * @throw Error - If a required namespace is missing, an error is thrown.
    *
    * @method Lum.ns.need
    */
   prop(Lum.ns, 'need', function ()
   {
     for (let n = 0; n < arguments.length; n++)
     {
       let ns = arguments[n];
       if (!Lum.ns.has(ns))
       {
         throw new Error("Missing required namespace/library: "+JSON.stringify(ns));
       }
     }
     return ourself();
   });
 
   /**
    * Export a global namespace to another global namespace.
    *
    * @param {string|strings[]} source  The namespace to export.
    * @param {string|strings[]} target  The target namespace.
    * @param {boolean} [overwrite=false]
    */
   prop(Lum.ns, 'export', function (source, target, overwrite=false)
   {
     if (!overwrite && Lum.ns.has(target))
     {
       console.error("Will not overwrite namespace", target);
       return;
     }
     let ns = Lum.ns.get(source, true);
     if (ns === undefined)
     { // Nothing to export, goodbye.
       return;
     }
     return Lum.ns.add(target, ns, overwrite);
   });
 
   /**
    * Make a link to a library/function into another namespace.
    *
    * @method Lum.ns.link
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
   prop(Lum.ns, 'link', function (obj, target, overwrite=false, prefix="Lum.")
   {
     Lum.ns.add(prefix+target, obj, overwrite);
     return ourself();
   });
 
   // Register a global variable (or multiple) for Lum itself.
   prop(Lum.ns, '$self', function ()
   {
     const self = ourself(Lum.$nsSelfUnwrapped);
     const args = Array.prototype.slice.call(arguments);
 
     if (args.length === 0) args[0] = 'Lum'; // Default name.
     
     for (let i = 0; i < args.length; i++)
     {
       Lum.ns.add(args[i], self);
     }
   });

//-- core/ns --//