(function($, observable)
{
  "use strict";

  if (window.Nano === undefined)
  {
    console.log("fatal error: Nano core not loaded");
    return;
  }

  /**
   * A Model API base core. Use this as the foundation for your API objects.
   */
  Nano.ModelAPI = function ModelAPI (conf)
  {
    /**
     * A reference to ourself. If observable() is found, we apply it.
     */
    var self;
    if (observable !== undefined)
      self = observable(this);
    else
      self = this;

    /**
     * The model property stores our model data and backend services.
     */
    self.model = {};

    /**
     * The conf property stores a copy of our initialization data.
     */
    self.conf = conf;

    /**
     * Debugging information. Can be a list of tags.
     */
    self.debugging = conf.debug !== undefined ? conf.debug : {};

    /**
     * See if we have debugging in the hash.
     */
    if (location.hash === '#debug')
    { // Enable all debugging.
      self.debugging['*'] = true;
    }

    /**
     * TODO: query string debugging, more flexible than #hash style.
     */

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
  Nano.ModelAPI.prototype.need = function (group, func, conf)
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
  Nano.ModelAPI.prototype._init = function (initgroup, conf)
  {
    for (var initfunc in this[initgroup])
    {
      if (initfunc === '_inittab' || initfunc === 'prototype') continue;

      this.need(this[initgroup], initfunc, conf);
    }
  }

  // predefined init groups.

  Nano.ModelAPI.prototype.pre_init = function (conf)
  {
    this._init('pre_init', conf);
  }

  Nano.ModelAPI.prototype.init = function (conf)
  {
    this._init('init', conf);
  }

  Nano.ModelAPI.prototype.post_init = function (conf)
  {
    this._init('post_init', conf);
  }

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

  /**
   * Check to see if debugging is enabled on a certain tag.
   */
  Nano.ModelAPI.prototype.isDebug = function (tag)
  {
    if (tag !== undefined && tag !== null && 
        tag in this.debugging && this.debugging[tag])
    { // Check for the explicit tag.
      return true;
    }
    else if ('*' in this.debugging && this.debugging['*'])
    { // Check for the wildcard tag.
      return true;
    }
    return false;
  }

  /**
   * Check debugging tag, and if true, send the rest of the arguments
   * to the console log.
   */
  Nano.ModelAPI.prototype.onDebug = function (tag)
  {
    if (this.isDebug(tag))
    {
      var args = Array.prototype.slice.call(arguments, 1);
      console.log.apply(console, args);
    }
  }

  /**
   * Toggle debugging on tags.
   */
  Nano.ModelAPI.prototype.debug = function (tag, toggle)
  {
    if ($.isArray(tag))
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
   * Add a model source definition, then load the model.
   */
  Nano.ModelAPI.prototype.addSource = function (name, source)
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
  Nano.ModelAPI.prototype._loadModel = function (name, source)
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
  Nano.ModelAPI.prototype._load_ws_model = function (name, source)
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
   * @param str     name     The name of the model container.
   * @param object  source   Rules for building the model container.
   *
   * Source rules:
   *
   *  'getdata'        Options for getting the data.
   *                   This will have 'name', 'source', and 'parent'
   *                   properties added to it, so don't define those.
   *
   *    'function'     A function/closure to retreive the data.
   *
   *    'method'       A method in the API subclass to retreive the data.
   *
   *    If no 'function' or 'method' are passed, then the
   *    '_default_get_json' method will be used.
   *
   *  'extend'         Options for extending our JSON data.
   *                   This will have 'name', 'source', 'parent', and 'data'
   *                   properties added to it, so don't define those.
   *                   It can have one of 'class', 'function' or 'method' to
   *                   determine the technique we'll use to extend the data.
   *
   *    'class'          A class to wrap around the data.
   *
   *    'function'       A function/closure that returns the extended data.
   *
   *    'method'         A method in the API subclass that returns the data.
   *
   *    If none of 'class', 'function', or 'method' are passed, then the
   *    '_default_extend_json' method will be used.
   *
   * The object returned from any of the extention options must support
   * a save() method, that should support: object.save({changed: false}) 
   * which should tell the model container to save any changes without sending
   * a change notification event.
   */
  Nano.ModelAPI.prototype._load_json_model = function (name, source)
  {
    var jsondata;
    var getopts = 'getdata' in source ? source.getdata : {};
    getopts.name   = name;
    getopts.source = source;
    getopts.parent = this;

    if ('function' in getopts)
    { // A custom function or closure.
      var func = getopts.function;
      jsondata = func(getopts);
    }
    else if ('method' in getopts)
    { // A custom method.
      jsondata = this[getopts.method](getopts);
    }
    else
    { // Use the default method.
      jsondata = this._default_load_json_element(getopts);
    }

    if (jsondata !== undefined)
    {
      // Options to extend our model data with.
      var extendopts = 'extend' in source ? source.extend : {};
      extendopts.name    = name;
      extendopts.source  = source;
      extendopts.parent  = this;
      extendopts.data    = jsondata;

      if ('class' in extendopts)
      { // Use a custom class for our model data.
        var dataclass = extendopts.class;
        jsondata = new dataclass(extendopts);
      }
      else if ('function' in extendopts)
      { // Use a function to initialize our model data.
        var func = extendopts.function;
        jsondata = func(extendopts);
      }
      else if ('method' in extendopts && typeof this[extendopts.method] === 'function')
      { // Use a method in the API subclass to initialize our model data.
        jsondata = this[extendopts.method](extendopts);
      }
      else
      { // Use the default model data enhancement method.
        jsondata = this._default_extend_json(extendopts);
      }

      // We changed something, time to save.
      if (source.save_changes)
        jsondata.save({changed: false});

      // Assign it to our model structure.
      this.model[name] = jsondata;
    } // if element exists
  }

  /**
   * The default data aquisition method if no other option is supplied.
   *
   * @param object dataopts   The data aquiring options (see _load_json_model)
   *
   * Any of these options can be in the dataopts, or the dataopts.source:
   *
   *  'element'        A selector for the element containing the JSON text.
   *                   Default: '#name' where name is dataopts.name
   *
   *  'enforceObject'  If the data is an empty array, make it an object instead.
   *
   * Requires the json.jq and exists.jq jQuery extensions.
   */
  Nano.ModelAPI.prototype._default_load_json_element = function (dataopts)
  {
    var source = dataopts.source;

    var elname;
    if ('element' in dataopts)
      elname = dataopts.element;
    else if ('element' in source)
      elname = source.element;
    else
      elname = '#' + name;

    var element = $(elname);
    if (element.exists())
    {
      if (source.save === undefined)
      {
        if (source.extend === undefined)
        {
          source.extend = {save:'_default_save_json_element'};
        }
        else if (source.extend.save === undefined)
        {
          source.extend.save = '_default_save_json_element';
        }
      }
      var enforceObj = false;
      if ('enforceObject' in dataopts)
        enforceObj = dataopts.enforceObject;
      else if ('enforceObject' in source)
        enforceObj = source.enforceObject;

      this.onDebug('loadModel', '-- Loading JSON', name, elname);
      var jsondata = element.JSON();
      if (enforceObj === true)
      {
        if ($.isArray(jsondata) && jsondata.length == 0)
        {
          jsondata = {};
          source.save_changes = true;
        }
      }
      return jsondata;
    }
  }

  /**
   * The default data save method.
   */
  Nano.ModelAPI.prototype._default_save_json_element = function (dataopts)
  {
    var source   = dataopts.source;
    var jsondata = dataopts.data;

    var changeHandler;
    if ('changed' in dataopts)
      changeHandler = dataopts.changed;
    else if ('changed' in source)
      changeHandler = source.changed;

    if (sopts.target && sopts.retarget)
      elname = sopts.target;
    if (!sopts.target)
      sopts.target = elname;
    $(sopts.target).JSON(this);

    if (sopts.changed === undefined)
      sopts.changed = true;

    if (!sopts.changed) return;

    if (typeof changeHandler === 'function')
    {
      changeHandler(this, target);
    }
    else if (typeof changeHandler === 'string')
    {
      $(changeHandler).val(1);
    }
  }

  /**
   * The default extention method if no other option is supplied.
   *
   * @param object dataopts   The data extension options (see _load_json_model)
   *
   * If the dataopts or dataopts.source 
   */
  Nano.ModelAPI.prototype._default_extend_json = function (dataopts)
  {
    var source   = dataopts.source;
    var jsondata = dataopts.data;

    var saveHandler;
    if ('save' in dataopts)
      saveHandler = dataopts.save;
    else if ('save' in source)
      saveHandler = source.save;

    if (!saveHandler)
    {
      console.log("no save handler specified, cannot continue.");
      return;
    }

    // Add a special "save" function.
    Nano.addProperty(jsondata, 'save', function (sopts)
    {
      if (typeof saveHandler === 'function')
      {
        saveHandler(dataopts);
      }
      if (typeof saveHandler === 'string' && typeof this[saveHandler] === 'function')
      {
        this[saveHandler](dataopts);
      }
    });

    // Add a special "json" function. This requires the
    // format_json library to have been loaded.
    Nano.addProperty(jsondata, 'json', function (format)
    {
      var json = JSON.stringify(this);
      if (format)
        return Nano.format_json(json);
      else
        return json;
    });

    return jsondata;
  }

  Nano.ModelAPI.makeAPI = function ()
  {
    var self = this;
    var newAPI = function (apiConf)
    {
      self.call(this, apiConf);
    }
    Nano.extend(self, newAPI);
    return newAPI;
  }

})(jQuery,                       // jQuery is always required. 
window.riot 
  ? window.riot.observable       // If 'riot' exists, use it.
  : window.Nano.observable       // Nano may contain the observable trait.
);

