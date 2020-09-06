(function(Nano, $, observable)
{
  "use strict";

  if (Nano === undefined)
  {
    throw new Error("Missing Lum core");
  }

  Nano.needLibs('helpers');

  Nano.markLib('modelapi');

  // TODO: rewrite the debugging stuff, and move into the new debug.js
  var debug = typeof console.debug === 'function' ? console.debug : console.log;

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
   *  hash.js
   *  observable.js
   *
   * Requirements for JSON model sources:
   *
   *  helpers.js
   *  exists.jq.js
   *  json.jq.js
   *
   */
  Nano.ModelAPI = class
  {
    /**
     * Build a ModelAPI instance.
     */
    constructor (conf={})
    {
      if (observable !== undefined)
      {
        observable(this);
        this.make_observable = observable;
      }

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
  
      /**
       * Should we show the 'tag' when using onDebug() calls?
       */
      this.showDebugTag = false;
  
      /**
       * See if we have debugging in the hash.
       */
      this.updateDebug(conf.debug);
 
      /**
       * Before we do any further initialization, load extensions.
       */
      if (typeof this.constructor._extensions === 'object'
        && this.constructor._extensions.length)
      {
        let extClasses = this.constructor._extensions;
        for (let i = 0; i < extClasses.length; i++)
        {
          let extClass = extClasses[i];
          if (typeof extClass === 'function')
          {
            let extInstance = new extClass(this);
            this._exts.push(extInstance);
            let name = null;
            if (typeof extInstance.name === 'string')
            { // There was a name provided as a property.
              name = extInstance.name;
            }
            else if (typeof extInstance.getExtensionName === 'function')
            { // There's a function to return the name.
              name = extInstance.getExtensionName();
            }
            if (name !== null)
            {
              this.ext[name] = extInstance;
            }
            if (typeof extInstance.preInit === 'function')
            { // Pre-initialization methods.
              extInstance.preInit(conf);
            }
          }
        }
      }

      /**
       * Stuff to do before loading our sources.
       */
      this.pre_init(conf);
      
      /**
       * Load our sources, and other such features.
       */
      this.init(conf);
  
      /**
       * Stuff to do after loading our sources.
       */
      this.post_init(conf);
  
      /**
       * Finally, after ALL initialization, see if any loaded
       * extensions have post initialization calls to make.
       */
      if (this._exts.length)
      {
        for (let i = 0; i < this._exts.length; i++)
        {
          let ext = this._exts[i];
          if (typeof ext.postInit === 'function')
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
      if (group._inittab && group._inittab[func]) return; // Already called.
      if (group[func] === undefined)              return; // Invalid function.
      group[func].call(this, conf);                       // Call it.
      if (group._inittab === undefined) 
        group._inittab = {};
      group._inittab[func] = true;                        // Mark it as called.
    }
  
    /**
     * Call an entire group of initialization methods.
     */
    _init (initgroup, conf)
    {
      for (var initfunc in this[initgroup])
      {
        if (initfunc === '_inittab' || initfunc === 'prototype') continue;
  
        this.need(this[initgroup], initfunc, conf);
      }
    }
  
    // predefined init groups.
  
    pre_init (conf)
    {
      this._init('pre_init', conf);
    }
  
    init (conf)
    {
      this._init('init', conf);
    }
  
    post_init (conf)
    {
      this._init('post_init', conf);
    }

    /**
     * Update debugging flags based on URL hash.
     *
     * You can use #debug to toggle the '*' flag, which turns on all debugging.
     * Or #debug=flag to set a single one.
     * Or #debug=flag1=flag2=flag3 to set a few.
     *
     * If debugValues are passed then:
     * #debug={"flag1":true,"flag2":false} is also available.
     */
    updateDebug (debugValues)
    {
      if (debugValues !== undefined)
      { // Use the pre-determined values.
        this.debugging = debugValues;
      }
      else
      { // Start with a fresh slate.
        this.debugging = {};
      }
  
      if (Nano.Hash === undefined)
      { // The Hash library wasn't loaded.
        return;
      }
  
      var hashOpts = 
      {
        shortOpt: true,
        json: (debugValues !== undefined)
      }
      var hash = new Nano.Hash(hashOpts);
      var debugFlags = hash.getOpt('debug');
  
      if (debugFlags === undefined)
      { // Nothing found, we don't do anything.
        return; 
      }
  
      if (debugFlags === null)
      { // The null value means #debug was passed, which is an alias for '*'
        debug("Enabling global debugging.");
        this.debug('*', true);
        return;
      }
  
      if (typeof debugFlags === 'string')
      { // A single flag was passed.
        this.debug(debugFlags, true);
        return;
      }
  
      if (Array.isArray(debugFlags))
      { // Output was an array of debug flags.
        for (var k in debugFlags)
        {
          var keyword = debugFlags[k];
          debug("Enabling debugging on", keyword);
          this.debug(keyword, true);
        }
        return;
      }
  
      if (typeof debugFlags === 'object')
      { // Advanced use, probably not super useful.
        for (var key in debugFlags)
        {
          var val = debugFlags[key];
          debug("Settings debug flag", key, val);
          this.debug(key, val);
        }
        return;
      }
  
    }
  
    /**
     * Check to see if debugging is enabled on a certain tag.
     */
    isDebug (tag)
    {
      if (Array.isArray(tag))
      { // Check one of a bunch of tags.
        for (var t in tag)
        {
          if (this.isDebug(tag[t]))
          { // One of the tags matched, we're good!
            return true;
          }
        }
        // None of the tags matched.
        return false;
      }
      else if (typeof tag === 'string' && 
          tag in this.debugging && this.debugging[tag])
      { // Explicit tag matched.
        return true;
      }
      else if ('*' in this.debugging && this.debugging['*'])
      { // Wildcard tag was set.
        return true;
      }
      return false;
    }
  
    /**
     * Check debugging tag, and if true, send the rest of the arguments
     * to the console log.
     */
    onDebug (tag)
    {
      if (this.isDebug(tag))
      {
        var slicePos = this.showDebugTag ? 0 : 1;
        var args = Array.prototype.slice.call(arguments, slicePos);
        debug.apply(console, args);
      }
    }
  
    /**
     * Toggle debugging on tags.
     */
    debug (tag, toggle)
    {
      if (Array.isArray(tag))
      { // An array of tags, recurse it.
        for (var t in tag)
        {
          this.debug(tag[t], toggle);
        }
      }
      else
      {
        if (toggle === undefined || toggle === null)
        { // Invert the current setting.
          toggle = this.debugging[tag] ? false : true;
        }
  
        // Update the debugging setting.
        this.debugging[tag] = toggle;
  
        // Check for web services that we can toggle debugging on.
        var models  = this.model;
        var sources = this.conf.sources;
        if (tag == '*')
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
          if (tag in models && tag in sources && sources[tag].type == 'ws')
            models[tag]._debug = toggle;
        }
      }
    }
  
    /**
     * Toggle all currently registered debugging options.
     */
    toggleDebug (toggle)
    {
      for (var key in this.debugging)
      {
        var val = this.debugging[key];
        if (val)
        {
          this.debug(key, toggle);
        }
      }
    }

    /**
     * Add an extension class.
     *
     * Extensions are added to the Model class itself, rather than
     * the instance, and upon building the instance, each of the
     * extension classes will be built as well.
     */
    static addExtension (extension)
    {
      if (extension.prototype instanceof Nano.ModelAPI.Extension)
      {
        if (this._extensions === undefined)
          this._extensions = [];
        this._extensions.push(extension);
      }
      else
      {
        throw new Error("addExtension() called with non Extension");
      }
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
  
      if (typeof this[loader] === 'function')
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
      var wsclass = 'class' in opts ? opts.class : Nano.WebService;
      if (name in this.debugging)
      {
        opts.debug = this.debugging[name];
      }
      else if ('*' in this.debugging && this.debugging['*'])
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
     * Requires the json.jq and exists.jq jQuery extensions, as well as
     * the helpers library (which adds the addProperty() method, used here.)
     */
    _load_json_model (name, source)
    {
      Nano.needLib('helpers');
      Nano.needJq('JSON', 'exists');

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
        Nano.addProperty(jsondata, 'save', function (target)
        {
          if (!target)
            target = elname;
          $(target).JSON(this);
          if (typeof changeHandler === 'string')
          {
            $(changeHandler).val(1);
          }
          else if (typeof changeHandler === 'function')
          {
            changeHandler(this, target, element);
          }
        });
  
        // Add a special "json" function. This requires the
        // format_json library to have been loaded.
        Nano.addProperty(jsondata, 'json', function (format)
        {
          var json = JSON.stringify(this);
          if (format && typeof Nano.format_json === 'function')
            return Nano.format_json(json);
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
  
    static makeAPI ()
    {
      console.debug("makeAPI is deprecated");
      return class extends this {};
    }

  } // class Nano.ModelAPI

  /**
   * Extensions to the ModelAPI should extend this class.
   */
  Nano.ModelAPI.Extension = class
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
      if (!(apiInstance instanceof Nano.ModelAPI))
      {
        throw new Error("Extension must be passed it's parent Model");
      }

      this.parent = apiInstance;

      if (typeof this.setup === 'function')
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

      if (typeof this[srcName] === 'function')
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
      if (typeof methodsToAdd === 'object')
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
            if (typeof methSpec === 'string')
            {
              this.addHandledMethod(srcName, methSpec);
            }
            else if (typeof methSpec === 'boolean')
            {
              this.addHandledMethod(srcName, null, methSpec);
            }
            else if (typeof methSpec === 'object')
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
  } // class Nano.ModelAPI.Extension

  /**
   * Load a bunch of models at once.
   */
  Nano.ModelAPI.prototype.init.loadSources = function (conf)
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

})(
  window.Lum,
  window.jQuery,                 // jQuery is always required. 
  window.riot
  ? window.riot.observable       // If 'riot' exists, use it.
  : window.Lum.observable  // We may contain the observable trait.
);

