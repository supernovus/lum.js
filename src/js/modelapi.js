(function($, observable)
{
  "use strict";

  if (window.Nano === undefined || Nano.addProperty === undefined)
  {
    throw new Error("Nano core not loaded");
  }

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
   *  coreutils.js
   * 
   * Internal recommendations:
   *
   *  hash.js
   *  observable.js
   *  exists.jq.js
   *  json.jq.js
   *
   */
  Nano.ModelAPI = class
  {
    /**
     * Build a ModelAPI instance.
     */
    constructor (conf)
    {
      if (conf === undefined)
        conf = {};
  
      /**
       * A reference to ourself. If observable() is found, we apply it.
       */
      var self;
      if (observable !== undefined)
      {
        self = observable(this);
        self.make_observable = observable;
      }
      else
      {
        self = this;
      }
  
      /**
       * The model property stores our model data and backend services.
       */
      self.model = {};
  
      /**
       * The conf property stores a copy of our initialization data.
       */
      self.conf = conf;
  
      /**
       * Should we show the 'tag' when using onDebug() calls?
       */
      self.showDebugTag = false;
  
      /**
       * See if we have debugging in the hash.
       */
      self.updateDebug(conf.debug);
  
      /**
       * Stuff to do before loading our sources.
       */
      self.pre_init(conf);
      
      /**
       * Load our sources, and other such features.
       */
      self.init(conf);
  
      /**
       * Stuff to do after loading our sources.
       */
      self.post_init(conf);
  
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
     * Requires the json.jq and exists.jq jQuery extensions.
     */
    _load_json_model (name, source)
    {
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
  jQuery,                        // jQuery is always required. 
  window.riot
  ? window.riot.observable       // If 'riot' exists, use it.
  : window.Nano.observable       // Nano may contain the observable trait.
);

