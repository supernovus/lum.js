/**
 * A new web app core using Riot.js and jQuery as the core foundations.
 *
 * This requires coreutils.js to initialize the namespace and add core
 * utilities.
 *
 * This replaces App.js in all capacities.
 */

(function(root, $, riot)
{ 
  "use strict";

  if (root.Nano === undefined)
  {
    console.log("fatal error: missing Nano global namespace");
    return;
  }

  /**
   * Promise interface, from Riot.js example app.
   */
  Nano.Promise = function (fn)
  {
    var self = riot.observable(this);
    $.map(['done', 'fail', 'always'], function(name) 
    {
      self[name] = function(arg) 
      {
        return self[$.isFunction(arg) ? 'on' : 'trigger'](name, arg);
      };
    });
  }

  /**
   * A factory function to build riot 1.x style modular applications.
   *
   * Pass it the API class object (not an instance!)
   * Assign the returned value to a root level name for use everywhere.
   */
  Nano.webApp = function (API)
  {
    var instance;
    var app = riot.observable(function (arg)
    {
      // admin() --> return instance
      if (!arg) return instance;

      // admin(fn) --> add a new module
      if ($.isFunction(arg)) 
      {
        app.on("ready", arg);
      }

      // admin(conf) --> initialize the application
      else 
      {
        instance = new API(arg);
        instance.on("ready", function() 
        {
          app.trigger("ready", instance);
        });
      }

      return instance;
    });

    return app;
  }

  /**
   * A Model API base core. Use this as the foundation for your API objects.
   *
   * In order to use this with the modular trigger mechanism in the webApp
   * function, ensure you trigger the "ready" event on the API.
   */
  Nano.ModelAPI = function ModelAPI (conf)
  {
    /**
     * An observable reference to ourself.
     */
    var self = riot.observable(this);

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
   * We will add some magical methods to the object, including a save()
   * function that will save any changes back to the hidden element.
   *
   * Requires the json.jq and exists.jq jQuery extensions.
   */
  Nano.ModelAPI.prototype._load_json_model = function (name, source)
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
        if ($.isArray(jsondata) && jsondata.length == 0)
        {
          jsondata = {};
          save_changes = true;
        }
      }

      // Add a special "save" function.
      Nano.addProperty(jsondata, 'save', function (target)
      {
        if (!target)
          target = elname;
        $(target).JSON(this);
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

      // We changed something, time to save.
      if (save_changes)
        jsondata.save();

      // Assign it to our model structure.
      this.model[name] = jsondata;
    } // if element exists
  }

  /**
   * A quick method to get an empty API class, ready to be populated.
   */
  Nano.makeAPI = function (apiClass)
  {
    if (apiClass === undefined || apiClass === null)
      apiClass = Nano.ModelAPI;

    var API = function (apiConf)
    {
      apiClass.call(this, apiConf);
    }
    Nano.extend(apiClass, API);

    return API;
  }

  /**
   * An optional wrapper around the webApp and ModelAPI classes.
   *
   * Usage:
   *
   *   var app = new Nano.EasyWebApp();
   *   app.addAPI('method_name', function () { // do something in the API });
   *   app.listen(function (api) { // do something in the App });
   *   app.start();
   *
   */
  Nano.EasyWebApp = function (appConf)
  { // Our global configuration.
    if (appConf === undefined)
      appConf = {};

    // Save the appConf for later reference.
    this.appConf = appConf;

    // Create our API class. This is the class object, not the instance.
    this.API = Nano.makeAPI(appConf.apiClass);

    // A short cut to starting the application.
    this.API.prototype.start = function ()
    {
      this.trigger("ready");
    }

    // Create our Nano.webApp instance.
    this.webApp = Nano.webApp(this.API);
  }

  Nano.EasyWebApp.prototype.addAPI = function (name, func)
  {
    this.API.prototype[name] = func;
  }

  Nano.EasyWebApp.prototype.listen = function (func)
  {
    if ($.isFunction(func))
    {
      this.webApp(func);
    }
    else
    {
      console.log("warning: only functions should be passed to listen()");
    }
  }

  Nano.EasyWebApp.prototype.start = function ()
  {
    this.webApp(this.appConf).start();
  }

})(
window,                          // Top level window object.
jQuery,                          // jQuery must exist with its full name.
window.riot ? window.riot        // If 'riot' exists, use it.
  : jQuery.observable ? jQuery   // If jQuery has riot methods, use it.
  : $                            // Assume a standalone $ object.
); 

