Lum.lib(
{
  name: 'modelapi',
  jq: true,
},
function(Lum)
{
  "use strict";

  const {F,O,N,S,B,is_obj} = Lum._;
 
  /**
   * A Model API base core. Use this as the foundation for your API objects.
   *
   * External requirements:
   *
   *  jQuery
   *
   * Internal requirements:
   *
   *  core.js
   * 
   * Internal recommendations:
   *
   *  debug.js
   *
   * Requirements for JSON model sources:
   *
   *  helpers.js
   *  exists.jq.js
   *  json.jq.js
   *
   */
  Lum.ModelAPI = class
  {
    /**
     * Build a ModelAPI instance.
     *
     * @param {object} conf   An optional set of configuration options.
     *
     *  'observable' {object}   If set, options for the Lum.observable() call.
     *  'debug'      {object}   If set, it's default debugging options.
     *
     */
    constructor (conf={})
    {
      if (conf === null || typeof conf !== O)
      { // Sorry, that's not valid.
        throw new Error("ModelAPI constructor only accepts an object");
      }


      const obsopts = (conf.observable !== undefined)
        ? conf.observable
        : this._default_observable;
      //console.debug("modelapi observable", conf, obsopts, this);
      Lum.observable(this, obsopts);

      /**
       * The model property stores our model data and backend services.
       */
      this.model = {};

      /**
       * Extensions with names stored here.
       */
      this.ext = {};

      /**
       * Flat list of extensions stored here in the order they were added.
       */
      this._exts = [];
  
      /**
       * The conf property stores a copy of our initialization data.
       */
      this.conf = conf;

      if (Lum.lib.has('debug'))
      { // Set up the debugging.

        let dbgopts = {};
        if (typeof conf.debug === O && conf.debug !== null)
        { // Let's see if it's the debug conf, or the list of flags.
          if (conf.debug.flags === undefined 
            && conf.debug.showFlag === undefined)
          { // It doesn't have either of the options, so it's flags.
            dbgopts = {flags: conf.debug};
          }
          else
          { // It had one or more of the options, use it.
            dbgopts = conf.debug;
          }
        }

        if (typeof conf.hash === O && dbgopts.hash === undefined)
        { // A shortcut.
          dbgopts.hash = conf.hash;
        }

        /**
         * Our debug instance.
         */
        this.debug = new Lum.Debug(dbgopts);

        // Now set up some handlers.
        const self = this;
        this.debug.on('toggle', function (flag, toggle)
        {
          self.toggleDebug(flag, toggle, true);
        });

      } // if hasLib('debug')
  
      // See if there's any init groups registered, and make sure they have
      // the proper 'api' property set.
      if (typeof this._initGroups === O)
      {
        for (let groupName in this._initGroups)
        {
          this._initGroups[groupName].api = this;
        }
      }
      else
      { // Add it.
        this._initGroups = {};
      }

      // See if there's any legacy init groups to be set up.
      const groups = ['pre_init','init','post_init'];
      for (let g in groups)
      {
        const groupName = groups[g];
        const legacyGroup = this[groupName];
        if (Object.keys(legacyGroup).length > 0)
        { // There's legacy init items.          
          if (this._initGroups[groupName] === undefined)
          {
            this._initGroups[groupName] = new InitGroup(groupName, this);
          }

          const initGroup = this._initGroups[groupName];
          
          for (let legacyName in legacyGroup)
          {
            if (legacyName === '@init@') continue;
            let legacyFunc = legacyGroup[legacyName];
            initGroup.add(legacyName, legacyFunc, true);
          }

          legacyGroup['@init@'] = initGroup;
        }
      }

      /**
       * Stuff to do prior to loading extensions.
       */
      this._init('pre_ext_init', conf);
 
      /**
       * Before we do any further initialization, load extensions.
       */
      if (typeof this.constructor._extensions === O
        && this.constructor._extensions.length)
      {
        let extClasses = this.constructor._extensions;
        for (let i = 0; i < extClasses.length; i++)
        {
          let extClass = extClasses[i];
          if (typeof extClass === F)
          {
            let extInstance = new extClass(this);
            this._exts.push(extInstance);
            let name = null;
            if (typeof extInstance.name === S)
            { // There was a name provided as a property.
              name = extInstance.name;
            }
            else if (typeof extInstance.getExtensionName === F)
            { // There's a function to return the name.
              name = extInstance.getExtensionName();
            }
            if (name !== null)
            {
              this.ext[name] = extInstance;
            }
            if (typeof extInstance.preInit === F)
            { // Pre-initialization methods.
              extInstance.preInit(conf);
            }
          }
        }
      }

      /**
       * Stuff to do before loading our sources.
       */
      this._init('pre_init', conf);
      
      /**
       * Load our sources added via conf.sources.
       */
      this._loadSources(conf);

      /**
       * Run init stuff that adds more sources.
       */
      this._init('init', conf);
  
      /**
       * Stuff to do after loading our sources.
       */
      this._init('post_init', conf);
  
      /**
       * Finally, after ALL initialization, see if any loaded
       * extensions have post initialization calls to make.
       */
      if (this._exts.length)
      {
        for (let i = 0; i < this._exts.length; i++)
        {
          let ext = this._exts[i];
          if (typeof ext.postInit === F)
          {
            ext.postInit(conf);
          }
        }
      }

    } // end ModelAPI
  
    /**
     * Call an initialization method, but only once.
     */
    need (group, func, conf)
    {
      if (typeof group === O && typeof group['@init@'] === O)
      { // It's a legacy group.
        console.warn("Deprecated use of ModelAPI.need()", group, func, conf);
        return group['@init@'].need(func, conf);
      }
      else if (typeof group === S 
        && typeof this._initGroups[group] === O)
      { // The modern groups are easy as pie.
        return this._initGroups[group].need(func, conf);
      }
      return false;
    }
  
    /**
     * Call an entire group of initialization methods.
     */
    _init (group, conf)
    {
      if (typeof this._initGroups[group] === O)
      {
        return this._initGroups[group].run(conf);
      }
    }
    
    isDebug ()
    {
      if (this.debug)
      {
        return this.debug.is.apply(this.debug, arguments);
      }
    }
  
    onDebug ()
    {
      if (this.debug)
      {
        return this.debug.when.apply(this.debug, arguments);
      }
    }
    
    /**
     * A handler for when this.debug.toggle() is called.
     */
    toggleDebug (flag, toggle)
    {
      // Check for web services that we can toggle debugging on.
      var models  = this.model;
      var sources = this.conf.sources;
      if (flag == '*')
      { // Wildcard. We will change all web services.
        for (var modelname in models)
        {
          if (modelname in sources && sources[modelname].type == 'ws')
          {
            models[modelname]._debug = toggle;
          }
        }
      }
      else
      { // Check for specific web service.
        if (flag in models && flag in sources && sources[flag].type == 'ws')
          models[flag]._debug = toggle;
      }
    } // toggleDebug()

    /**
     * Add an extension class.
     *
     * Extensions are added to the Model class itself, rather than
     * the instance, and upon building the instance, each of the
     * extension classes will be built as well.
     */
    static addExtension (extension)
    {
      if (extension.prototype instanceof Lum.ModelAPI.Extension)
      {
        if (this._extensions === undefined)
          this._extensions = [];
        this._extensions.push(extension);
      }
      else
      {
        throw new Error("addExtension() called with non Extension");
      }

      return this;
    }

    /**
     * Add a function to an init group.
     *
     * @param string name  The name of the init function.
     * @param function func  The actual function to run during the init stage.
     * @param string group  The name of the init group.
     *
     *                      'pre_ext_init': Called before extensions are loaded.
     *                      'pre_init': Called before model data is loaded.
     *                      'init': Called to load model data.
     *                      'post_init': Called after model data is loaded.
     *
     *                      The default if omitted is 'init'.
     */
    static onInit (name, func, group='init')
    {
      if (typeof name !== S)
      {
        throw new Error("onInit() function name must be a string");
      }

      if (typeof func === S && typeof group === F)
      { // Reversed order of parameters.
        let temp = group;
        group = func;
        func = temp;
      }
      else if (typeof func !== F)
      {
        throw new Error("onInit() passed non-function");
      }

      if (this.prototype._initGroups === undefined)
      {
        this.prototype._initGroups = {};
      }

      if (this.prototype._initGroups[group] === undefined)
      {
        this.prototype._initGroups[group] = new InitGroup(name);
      }

      this.prototype._initGroups[group].add(name, func);

      return this;
    }

    /**
     * Load a bunch of models at once.
     */
    _loadSources (conf)
    {
      if (conf.sources === undefined || conf.sources === null)
      {
        return;
      }
  
      for (var name in conf.sources)
      {
        var source = conf.sources[name];
        this._loadModel(name, source);
      } // for (sources)
    }


    /** 
     * Add a model source definition, then load the model.
     */
    addSource (name, source)
    {
      this.conf.sources[name] = source;
      this._loadModel(name, source);
    }
  
    /**
     * Load the actual model object.
     *
     * This is not usually called directly, but invoked either by the
     * constructor, or the addSource() method.
     *
     * This is now a stub function, that extracts the source type, and
     * looks for a _load_{type}_model() function, and calls it.
     */
    _loadModel (name, source)
    {
      var type = source.type;
  
      var loader = '_load_'+type+'_model';
  
      this.onDebug('loadModel', ' -- Calling', loader);
  
      if (typeof this[loader] === F)
      {
        this[loader](name, source);
      }

    }
  
    /**
     * Load a Web Service model.
     * Requires the 'webservice' library to be loaded.
     */
    _load_ws_model (name, source)
    {
      var opts = source.opts;
      this.onDebug('loadModel', '-- Loading web service', name, opts);
      var wsclass = 'class' in opts ? opts.class : Lum.WebService;
      if (this.debug && this.debug.is(name))
      {
        opts.debug = true;
      }
      this.model[name] = new wsclass(opts);
    }
  
    /**
     * Load a JSON data structure from a hidden element.
     *
     * We will add some magical methods to the object, including a save()
     * function that will save any changes back to the hidden element.
     *
     * Requires the json.jq and exists.jq jQuery extensions.
     */
    _load_json_model (name, source)
    {
      Lum.jq.need('JSON', 'exists');

      var elname;
      if ('element' in source)
        elname = source.element;
      else
        elname = '#' + name;
  
      var element = $(elname);
      if (element.exists())
      {
        this.onDebug('loadModel', '-- Loading JSON', name, elname);
        var jsondata = element.JSON();
        var save_changes = false;
        if (source.enforceObject === true)
        {
          if (Array.isArray(jsondata) && jsondata.length == 0)
          {
            jsondata = {};
            save_changes = true;
          }
        }
  
        var changeHandler;
        if ('changed' in source)
        {
          changeHandler = source.changed;
        }
  
        // Add a special "save" function.
        Lum.prop(jsondata, 'save', function (target)
        {
          if (!target)
            target = elname;
          $(target).JSON(this);
          if (typeof changeHandler === S)
          {
            $(changeHandler).val(1);
          }
          else if (typeof changeHandler === F)
          {
            changeHandler(this, target, element);
          }
        });
  
        // Add a special "json" function. This requires the
        // format_json library to have been loaded.
        Lum.prop(jsondata, 'json', function (format)
        {
          var json = JSON.stringify(this);
          if (format && typeof Lum.format_json === F)
            return Lum.format_json(json);
          else
            return json;
        });
  
        // We changed something, time to save.
        if (save_changes)
          jsondata.save();
  
        // Assign it to our model structure.
        this.model[name] = jsondata;
      } // if element exists
    }

    /**
     * A static wrapper around onInit() specifically designed to add
     * new web service definitions, taking care of most boilerplate
     * automatically. 
     *
     * @param {string} name     The name of the web service we're adding.
     * @param {string} baseUrl  (Optional) The base URL of the web service.
     * @param {object} methods  (Optional) Method definitions.
     * @param {object} wsOpts   (Optional) Extra options for the webservice.
     * 
     * If you don't specify the `methods` 
     */
    static addWS(name, baseUrl, methods, wsOpts={})
    {
      //console.debug("addWS", name, baseUrl, methods, wsOpts, arguments);
      
      if (!is_obj(wsOpts))
      {
        throw new Error("The 'wsOpts' parameter must be an object");
      }

      this.onInit(name, 'pre_init', function (conf)
      {
        //console.debug("addWS::pre_init", name, conf, this);
        if (conf.sources === undefined)
        { // First method adding model sources.
          conf.sources = {};
        }
        else if (conf.sources[name] !== undefined)
        { // This web service has been added already!
          throw new Error(`Web service ${name} already defined`);
        }

        if (typeof baseUrl === S)
          wsOpts.url = baseUrl;
        if (is_obj(methods))
          wsOpts.methods = methods;

        conf.sources[name] =
        {
          type: 'ws',
          opts: wsOpts,
        }
      });

      if (!is_obj(methods))
      { // No methods off the bat? That's okay, we'll use a builder.
        // Just call methods on the builder to populate the WS definition.
        return new Lum.WebService.Builder(wsOpts);
      }

    } // addWS

    /**
     * A static wrapper around onInit() designed to extend a web service
     * previously added with addWS(). This allows us to have extension-specific
     * methods that aren't in the base web service model.
     *
     * @param {string} wsName    The name of the web service we're extending.
     * @param {string} extName   A name for this specific extension set.
     * @param {object} methods   (Optional) Methods to add to the web service.
     * @param {object} addOpts   (Optional) More options to add.
     *
     *  You can add any options other than `url` and `methods`.
     *
     */
    static extendWS(wsName, extName, methods, addOpts)
    {
      //console.debug("extendWS", wsName, extName, methods, addOpts);

      this.onInit(wsName+'_'+extName, 'pre_init', function (conf)
      { // Let's do this.
        //console.debug("extendWS::pre_init", wsName, extName, conf, this);

        this.need(wsName, conf);

        if (conf.sources === undefined 
          || typeof conf.sources[wsName].opts.methods !== O)
        { // No such source.
          throw new Error(`Web service ${wsName} was not defined before ${extName} tried to extend it`);
        }

        const wsOpts = conf.sources[wsName].opts;

        if (typeof addOpts === O)
        {
          for (const opt in addOpts)
          {
            if (opt === 'url' || opt === 'methods') continue;
            wsOpts[opt] = addOpts[opt];
          }

          if (!is_obj(methods) && is_obj(addOpts.methods))
          { // Using the methods from the addOpts.
            methods = addOpts.methods;
          }
        }

        if (is_obj(methods))
        {
          const wsMeths = wsOpts.methods;

          for (const meth in methods)
          { // Let's add the new methods to the existing ones.
            wsMeths[meth] = methods[meth];
          }
        }
      }); // this.onInit() 

      if (!is_obj(methods) && !is_obj(addOpts))
      { // Let's use a builder like we do in `addWS()`
        addOpts = {};
        return new Lum.WebService.Builder(addOpts);
      }

    } // extendWS
  
    static makeAPI ()
    {
      console.debug("makeAPI is deprecated");
      return class extends this {};
    }

  } // class Lum.ModelAPI

  /**
   * Extensions to the ModelAPI should extend this class.
   */
  Lum.ModelAPI.Extension = class
  {
    /**
     * The extension is passed a copy of the Model instance during it's
     * construction. This is done prior to the various "init" stages.
     * You can create a method called setup() which will also be passed
     * the Model instance. You should NOT depend on anything being
     * initialized in the Model in your setup() method, as the extensions
     * are loaded before any of the "init" groups are called.
     *
     * You can add a method called preInit() which will be passed a copy
     * of the configuration object used to construct the Model. It's also
     * called before any of the "init" groups, but after this constructor
     * and any setup() calls have completed.
     *
     * Finally you can add a method called postInit() which will be passed
     * a copy of the configuration object used to construct the Model.
     * It's called after all of the "init" groups have completed.
     */
    constructor(apiInstance)
    {
      if (!(apiInstance instanceof Lum.ModelAPI))
      {
        throw new Error("Extension must be passed it's parent Model");
      }

      this.parent = apiInstance;

      if (typeof this.setup === F)
      {
        this.setup(apiInstance);
      }
    }

    /**
     * Call this from your setup(), preInit(), or postInit() methods.
     *
     * It will add a method in the Model which simply calls a method
     * in the extension using apply(), all arguments passed to the model
     * method will be passed to the extension method.
     *
     * @param string srcName   The name of the method in the extension.
     * @param string destName  The name of the method to add (optional).
     *                         If null/false/omitted, we use srcName.
     * @param bool modelIsThis If true, set 'this' to model.
     *                         If null/false/omitted, 'this' is the extension.
     * @param bool canReplace  If true, we can overwrite existing Model
     *                         properties/methods. If falsey, we will throw
     *                         and Error if a property/method already exists!
     *                         This is really dangerous, only use it if you
     *                         really know what you are doing!
     */
    addHandledMethod(srcName, destName, modelIsThis, canReplace)
    {
      destName = destName || srcName;

      if (typeof this[srcName] === F)
      {
        if (canReplace || this.parent[destName] === undefined)
        {
          let ext = this;
          let applyThis = modelIsThis ? this.parent : this;
          this.parent[destName] = function ()
          {
            ext[srcName].apply(applyThis, arguments);
          }
        }
        else
        {
          throw new Error(destName+" was already defined in the Model");
        }
      }
      else
      {
        throw new Error(srcName+" method not found in the Extension");
      }
    }

    /**
     * A wrapper for addHandledMethod() that allows you to add a whole
     * bunch of wrappers all at once!
     *
     * @param object methodsToAdd  Object describing the methods to add.
     *
     * If methodsToAdd is an Array object, it's assumed that every member
     * of the array is a srcName parameter for addHandledMethod() and
     * that default options will be used for them all.
     *
     * If methodsToAdd is any other kind of object, the keys will be used as 
     * the srcName parameter for addHandledMethod(), and the values may take
     * several different forms:
     *
     *  string:  If the value is a string, it's assumed to be the destName.
     *  bool:    If the value is a boolean, it's assumed to be modelIsThis.
     *  object:  If the value is an object then it specifies options.
     *
     *  Options supported all have the same name as the corresponding
     *  parameter in the addHandledMethod() method.
     *
     *   destName:    string
     *   modelIsThis: bool
     *   canReplace:  bool
     *
     * There's a lot of flexibility in this method!
     */
    addHandledMethods(methodsToAdd)
    {
      if (typeof methodsToAdd === O)
      {
        if (Array.isArray(methodsToAdd))
        { // An array of source names.
          for (var m in methodsToAdd)
          {
            var methodName = methodsToAdd[m];
            this.addHandledMethod(methodName);
          }
        }
        else
        { // An object with potential values.
          for (var srcName in methodsToAdd)
          {
            var methSpec = methodsToAdd[srcName];
            if (typeof methSpec === S)
            {
              this.addHandledMethod(srcName, methSpec);
            }
            else if (typeof methSpec === B)
            {
              this.addHandledMethod(srcName, null, methSpec);
            }
            else if (typeof methSpec === O)
            {
              this.addHandledMethod(
                srcName,
                methSpec.destName,
                methSpec.modelIsThis,
                methSpec.canReplace
              );
            }
          }
        }
      }
      else
      {
        console.error("Non-object sent to addHandledMethods()", methodsToAdd);
      }
    }
  } // class Lum.ModelAPI.Extension

  // A private class used by the new init system.
  class InitGroup
  {
    constructor(name, api=null)
    {
      this.api = api;
      this.name = name;
      this.methods = {};
    }

    add(name, method, apiIsThis=false)
    {
      if (typeof name === S && typeof method === F)
      {
        if (this.methods[name] === undefined)
        {
          method._run_init = false;
          method._this_api = apiIsThis;
          this.methods[name] = method;
          return true;
        }
        else
        {
          console.error("cannot overwrite init method", name, method, this); 
        }
      }
      else
      {
        console.error("invalid init method", name, method, this);
      }
      return false;
    }

    /**
     * Run a named init script in this group.
     */
    need (name, conf)
    {
      const meth = this.methods[name];

      if (typeof meth !== F)
      {
        console.error("invalid init method requested", name, this, conf);
        return false;
      }

      if (meth._run_init)
      { // This function has already been run.
        return true;
      }

      const wantThis = (meth._this_api && this.api) ? this.api : this;

      const ret = meth.call(wantThis, conf);
      meth._run_init = true;
      
      return ret;
    }

    /**
     * Run all init scripts in this group.
     */
    run(conf)
    {
      for (const name in this.methods)
      {
        this.need(name, conf);
      }
    }

  } // class InitGroup

  // The next three lines are for the old init system.
  Lum.ModelAPI.prototype.pre_init = {};
  Lum.ModelAPI.prototype.init = {};
  Lum.ModelAPI.prototype.post_init = {};

  /**
   * And finally for backwards compatibility, the default settings for
   * the observable trait if it's loaded. You can override this in your
   * child classes if you want different defaults.
   */
  Lum.ModelAPI.prototype._default_observable = {addme: 'make_observable'};

});

