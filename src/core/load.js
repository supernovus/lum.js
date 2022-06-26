//++ core/load ++//

  // A list of valid Lum.load modes.
  const LUM_LOAD_MODES = ['auto','data','js'];
  if (ctx.isWindow) 
    LUM_LOAD_MODES.push('css');

  // Default Lum.load settings.
  const LUM_LOAD_DEFAULTS =
  {
    mode: 'auto',
    func: null,
    loc:  (ctx.isWindow ? document.head : null),
    validate: true,
    usePromise: ctx.has.Promise,
    useReadyState: false,
    useOnLoad: true,
    scriptProps: {},
    scriptAttrs: {},
    linkProps:   {},
    linkAttrs:   {},
    modulePrefix: '/scripts/nano/',
    moduleSuffix: '.js',
  }

  // Which properties should always check for defaults?
  const LUM_LOAD_DEFAULT_OPTS = 
  [
    'usePromise', 'useReadyState', 'useOnLoad',
  ];

  // Validators when setting values.
  const LUM_LOAD_VALID =
  {
    mode: (val) => (typeof val === S && LUM_LOAD_MODES.includes(val)),
    func: (val) => (typeof val === F || val === null),
    loc:  function(val)
    {
      if (ctx.isWindow)
      {
        if (val instanceof Element)
        { // We're good.
          return true;
        }
        else if (Lum.jq.is(val) && val.length > 0)
        { // It's a jQuery selector.
          return val[0];
        }
      }
      else
      { // In any other context, 'loc' is not used.
        return false;
      }
    },
    validate: (val) => (typeof val === B),
    scriptAttrs: isObj,
    linkAttrs: isObj,
  }

  // Error information when validation fails.
  const LUM_LOAD_INVALID =
  {
    mode: ["Must be one of: ", LUM_LOAD_MODES],
    func: ["Must be a function or null"],
    loc:  [(ctx.isWindow 
      ? "Must be an Element object instance, or a jQuery result with a single matching element" 
      : "Is not supported in this context")],
    validate: ["Must be a boolean value"],
  }

  { // Now we'll assign some extra settings for prefixes and suffixes.

    const AUTO = 'auto';
    const MOD  = 'module';

    const IS_STRING = (val) => (typeof val === S);
    const IS_STRING_HELP = ["Must be a string"];
    const LUM_LOAD_PATH_OPTS = ['Prefix', 'Suffix'];

    for (let mode of LUM_LOAD_MODES)
    {
      if (mode === AUTO)
      { // The auto mode has no options, but module mode does.
        mode = MOD;
      }

      for (const optType of LUM_LOAD_PATH_OPTS)
      {
        const opt = mode + optType;
        if (mode !== MOD)
        { // The default for path options is an empty string.
          LUM_LOAD_DEFAULTS[opt] = '';
        }
        LUM_LOAD_VALID[opt] = IS_STRING;
        LUM_LOAD_INVALID[opt] = IS_STRING_HELP;
      }
    }

    // Now for the special 'module*' load mode.
    for (const optType of LUM_LOAD_PATH_OPTS)
    {
      const opt = 'module' + optType;
      LUM_LOAD_VALID[opt] = IS_STRING;
      LUM_LOAD_INVALID[opt] = IS_STRING_HELP;
    }

  } // Prefix/suffix assignment block.
  
  // The function that does the validation.
  function validateLoadSetting(prop, value, reportInvalid, reportUnknown)
  {
    if (typeof LUM_LOAD_VALID[prop] === F)
    { // Call the validator, which will return `true`, `false`, or in some cases, a new valid value.
      const isValid = LUM_LOAD_VALID[prop].call(Lum.load, value)
      if (reportInvalid && isValid === false)
      { // Did not pass the test.
        const help = LUM_LOAD_INVALID[prop];
        console.error("Invalid value for setting", prop, value, ...help);
      }
      return isValid;
    }
    else if (reportUnknown)
    {
      console.error("Unknown setting");
    }
    return false;
  }

  /**
   * A simple resource loader.
   * 
   * In any context it can load JS files and data files.
   * In a browser context it can also load CSS stylesheets, and HTML fragments.
   * Replaces the old 'load.js' library which is now empty.
   */
  prop(Lum, 'load', function()
  {
    return Lum.load.globalContext.loadFrom(...arguments);
  });

  // Used by the loader functions to determine how to get secondary arguments.
  prop(Lum.load, 'isLoadSettings', false);

  // Make a new clone, and pass all arguments to it's `loadUsing()` method.
  function loadFromSetting ()
  {
    return this.clone().loadUsing(...arguments);
  }

  // Look for resources to load using the current settings.
  function loadUsingSetting ()
  {
    for (let a=0; a < arguments.length; a++)
    {
      const arg = arguments[a];

      if (arg === null || arg === undefined) continue; // These are invalid values for the loader.

      let url = null;

      // See if the argument is one of detectable option values.
      const foundSetting = this.setValue(arg);
      if (foundSetting)
      { // Settings were found and changed, time to move on.
        continue;
      }

      if (isObj(arg))
      { 
        if (Array.isArray(arg))
        { // An array of sub-arguments will get its own settings context.
          this.loadFrom(...arg);
          continue; // Now we're done.
        }

        // Check for settings we can set.
        this.set(arg, this.validate, false);

        // Look for mode-specific things.
        for (const mode of LUM_LOAD_MODES)
        {
          if (mode === 'auto') continue; // Nothing applicable to 'auto' mode here.

          if (Array.isArray(arg[mode]))
          { // An array of further options applicable to that mode.
            const subLoader = this.clone();
            const subArgs = arg[mode];
            subLoader.set({mode}, false);
            subLoader.loadUsing(...subArgs)
          }
        }

        // Finally, if there is a 'url' property, set our URL.
        if (typeof arg.url === S)
        {
          url = arg;
        }

      }
      else if (typeof arg === S)
      { // This is the only valid argument type left.
        url = arg;
      }
      
      if (typeof url === S)
      { // Okay, time to pass it on to a loader method.
        let loaderFunc;
        if (this.mode === 'auto')
        { // Determine the loader to use based on the extension.
          if (url.endsWith('.js'))
          {
            loaderFunc = Lum.load.js;
          }
          else if (ctx.isWindow && url.endsWith('.css'))
          {
            loaderFunc = Lum.load.css;
          }
          else
          {
            loaderFunc = Lum.load.data;
          }
        } 
        else
        { // Use a directly specified loading mode.
          loaderFunc = Lum.load[this.mode];
        }
        loaderFunc.call(this, url);
      }

    }
  }

  // The `settings.set()` method, assigned by the `setupSettings()` function.
  // Allows us to set a bunch options all at once, and validate the values.
  function changeSettings (opts, validate, reportUnknown=true)
  {
    if (!isObj(opts))
    {
      throw new Error("set opts must be an object");
    }

    if (typeof validate !== B)
    {
      validate = this.validate;
    }

    for (const prop in opts)
    {
      if (LUM_LOAD_MODES.includes(prop)) continue; // Skip mode properties.

      let val = opts[prop];
      let okay = true;

      if (validate)
      { // Let's get the value.
        okay = validateLoadSetting(prop, val, true, reportUnknown);
        if (typeof okay !== B)
        { // A replacement value was passed.
          val = okay;
          okay = true;
        }
      }

      if (okay)
      { // Assign the setting.
        this[prop] = val;
      }
    }
  } // changeSettings()

  // The `settings.setValue()` method, assigned by the `setupSettings()` function.
  // Will return the name of a matching setting if one was found, or `null` otherwise.
  function updateMatchingSetting(value)
  {
    const DETECT_SETTINGS = ['mode', 'func', 'loc'];
    for (const prop in DETECT_SETTINGS)
    {
      const okay = validateLoadSetting(prop, value, false, false);
      if (okay !== false)
      { // Something other than false means a setting was found.
        if (okay !== true)
        { // Something other than true means a custom value was returned.
          value = okay;
        }
        this[prop] = value;
        return prop;
      }
    }

    // If we made it here, nothing matched.
    return null;
  }

  // The function to initialize a `Lum.load()` *settings object*.
  function setupSettings (settings)
  {
    if (!isObj(settings))
    {
      throw new Error("Settings must be an object");
    }

    // Yee haa.
    prop(settings, 'isLoadSettings', true);

    // Clone this *settings object* and run `setupSettings()` on the clone.
    prop(settings, 'clone', function()
    {      
      return setupSettings(clone(this));;
    });

    // Add a `set()` method that handles validation automatically.
    prop(settings, 'set', changeSettings);

    // Add a `setValue()` method that detects the type of value and sets an appropriate setting.
    prop(settings, 'setValue', updateMatchingSetting);

    // Load resources from a clone of these settings.
    prop(settings, 'loadFrom', loadFromSetting);

    // Load resources using these settings.
    prop(settings, 'loadUsing', loadUsingSetting);

    // Get a plain object with a specified subset of our properties.
    prop(settings, 'extract', function()
    {
      const set = {};
      for (const arg of arguments)
      {
        if (typeof arg === S)
        {
          set[arg] = this[arg];
        }
        else 
        {
          throw new TypeError("Property names must be strings");
        }
      }
      return set;
    });

    // Given an object and a list of properties, if the object does not
    // have the said properties, set them from the settings.
    prop(settings, 'populate', function(obj, ...props)
    {
      if (!isObj(obj)) throw new TypeError("");
    })

    // Return the settings object.
    return settings;
  }

  // Global load defaults. Should only be changed via `Lum.load.set()`
  prop(Lum.load, 'globalContext', setupSettings({}));

  /**
   * Update global settings for the `Lum.load()` method.
   */
  prop(Lum.load, 'set', function (opts, validate)
  {
    return Lum.load.globalContext.set(opts, validate);
  });

  /**
   * Reset the global settings for the `Lum.load()` method.
   */
  prop(Lum.load, 'reset', function()
  {
    Lum.load.set(LUM_LOAD_DEFAULTS, false);
  });

  Lum.load.reset(); // Set the defaults now.

  function getLoaderOpts(caller, args, objProps, objAttrs)
  {
    const DEFS = LUM_LOAD_DEFAULT_OPTS;
    const GC = Lum.load.globalContext;
    let opts;

    if (typeof args[0] === O && typeof args[0].url === S)
    { // Named options can be passed directly.
      opts = args[0];
      for (const opt of DEFS)
      {
        if (opts[opt] === undefined)
        { // Use the global context for default values.
          opts[opt] = GC[opt];
        }
      }
    }
    else if (caller.isLoadSettings && typeof args[0] === S)
    { // We get all our options from the current settings object.
      opts = caller;
      opts.url = args[0];
    }
    else
    { // Loop the arguments to look for more options.
      opts = GC.extract(...DEFS);

      const hasProps = typeof objProps === S;
      const hasAttrs = typeof objAttrs === S;

      for (const arg of args)
      {
        if (opts.url === undefined && typeof arg === S)
        { 
          opts.url = arg;
        }
        else if (opts.func === undefined && typeof arg === F)
        {
          opts.func = arg;
        }
        else if (opts.loc === undefined && arg instanceof Element)
        {
          opts.loc = arg;
        }
        else if (opts.loc === undefined && Lum.jq.is(arg) && arg.length > 0)
        {
          opts.loc = arg[0];
        }
        else if (hasProps && opts[objProps] === undefined && isObj(arg))
        { // First time we see a raw object, it's Element properties.
          opts[objProps] = arg;
        }
        else if (hasAttrs && opts[objAttrs] === undefined && isObj(arg))
        { // The second time we see a raw object, it's Element attributes.
          opts[objAttrs] = arg;
        }
        else
        {
          console.error("Unknown or invalid parameter", 
            arg, caller, args, objProps, objAttrs);
        }
      }
    }

    if (!(typeof opts.url === S))
    {
      throw new Error("Could not find a valid 'url' parameter");
    }

    if (ctx.isWindow && !isInstance(opts.loc, Element))
    { // Let's add the default loc.
      opts.loc = document.head;
    }

    return opts;
  }

  /**
   * Load JS
   */
  prop(Lum.load, 'js', function ()
  { 
    const opts = getLoaderOpts(this, arguments, 'scriptProps', 'scriptAttrs');

    const prefix = opts.jsPrefix || '';
    const suffix = opts.jsSuffix || '';

    const url = prefix + opts.url + suffix;

    // TODO: support usePromise in a few forms.

    if (ctx.isWindow)
    {
      const script = document.createElement('script');
      if (typeof opts.scriptProps === O)
      {
        for (const prop in opts.scriptProps)
        {
          script[prop] = opts.scriptProps[prop];
        }
      }
      if (typeof opts.scriptAttrs === O)
      {
        for (const attr in opts.scriptAttrs)
        {
          script.setAttribute(attr, opts.scriptAttrs[attr]);
        }
      }
      if (typeof opts.func === F)
      {
        script.$lumLoadOptions = opts;
        if (opts.useOnLoad)
          script.onload = opts.func;
        if (opts.useReadyState)
          script.onreadystatechange = opts.func;
      }
      script.src = url;
      opts.loc.appendChild(script);
      if (typeof opts.func === F && !opts.useOnLoad && !opts.useReadyState)
      {
        opts.func.call(Lum, opts);
      }
    }
    else if (ctx.isWorker)
    { // A Worker or ServiceWorker.
      self.importScripts(url);
      if (typeof opts.func === F)
      {
        opts.func.call(opts);
      }
    }
    else if (ctx.node)
    { // Node works differently.
      if (Lum.load.$required === undefined)
      {
        Lum.load.$required = {};
      }
      const lib = Lum.load.$required[opts.url] = require(url);
      if (typeof opts.func  === F)
      {
        opts.func.call(opts, lib, Lum);
      }
    }
    else 
    {
      console.error("Lum.load.js() is not supported in this context", 
        arguments, this, ctx, Lum);
    }
  });

  /**
   * Load CSS
   */
  prop(Lum.load, 'css', function ()
  {
    // TODO: support usePromise in a few forms.

    if (ctx.isWindow)
    {
      const opts = getLoaderOpts(this, arguments, 'linkProps', 'linkAttrs');

      const prefix = opts.cssPrefix || '';
      const suffix = opts.cssSuffix || '';

      const url = prefix + opts.url + suffix;

      const link = document.createElement('link');
      if (typeof opts.linkProps === O)
      {
        for (const prop in opts.linkProps)
        {
          link[prop] = opts.linkProps[prop];
        }
      }
      if (typeof opts.linkAttrs === O)
      {
        for (const attr in opts.linkAttrs)
        {
          link.setAttribute(attr, opts.linkAttrs[attr]);
        }
      }
      link.rel = 'stylesheet';
      link.type = 'text/css';
      if (typeof opts.func === F)
      {
        link.$lumLoadOptions = opts;
        if (opts.useOnLoad)
          link.onload = opts.func;
        if (opts.useReadyState)
          link.onreadystatechange = opts.func;
      }
      link.href = url;
      loc.appendChild(link);
      if (typeof opts.func === F && !opts.useOnLoad && !opts.useReadyState)
      {
        opts.func.call(opts, link);
      }
    }
    else 
    {
      console.error("Lum.load.css() is not supported in this context", 
        arguments, this, ctx, Lum);
    }
  });

  /**
   * Load arbitrary data, uses the Fetch API.
   */
  prop(Lum.load, 'data', function ()
  {
    if (!ctx.has.fetch)
    {
      throw new Error("The Fetch API is not supported, cannot continue");
    }

    const opts = getLoaderOpts(this, arguments, 'fetch');

    const prefix = opts.dataPrefix || '';
    const suffix = opts.dataSuffix || '';

    const url = prefix + opts.url + suffix;

    const init = opts.fetch ?? {};

    const promise = fetch(url, init);

    if (typeof opts.func === F)
    { // The function handles both success and failure.
      return promise.then(function(response)
      {
        return opts.func.call(opts, response, true);
      }, 
      function(err)
      {
        return opts.func.call(opts, err, false);
      });
    }
    else 
    { // Return the fetch promise.
      return promise;
    }
  });

  /**
   * A convenience method for loading Lum.js modules.
   * This isn't an actual loader mode.
   */
  prop(Lum.load, 'modules', function(...modules)
  {
    // TODO: support usePromise 
    return Lum.load(
    {
      jsPrefix: this.globalContext.modulePrefix, 
      jsSuffix: this.globalContext.moduleSuffix,
      js: modules,
    });
  });

//-- core/load --//