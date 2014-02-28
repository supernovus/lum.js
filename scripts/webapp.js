/**
 * A new web app core using Riot.js and jQuery as the core foundations.
 *
 * This replaces App.js in all capacities.
 */

(function(root, $, riot)
{ 
  "use strict";

  /** 
   * Set up the Nano namespace.
   */
  if (root.Nano === undefined)
    root.Nano = {};

  /**
   * Promise interface, from Riot.js example app.
   */
  Nano.Promise = function Promise (fn)
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
   * A factory function to build your own modular applications.
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
   * Extend function. 
   */
  Nano.extend = function (base, sub, methods)
  {
    sub.prototype = Object.create(base.prototype);
    if (methods)
    {
      for (var name in methods)
      {
        sub.prototype[name] = methods[name];
      }
    }
    return sub;
  }

  /**
   * Add a "magical" function to a JS object.
   * These functions are marked as indomitable, do not affect
   * enumeration, and are ignored by JSON.
   */
  Nano.addProperty = function (object, pname, pfunc, opts)
  {
    if (opts === undefined || opts === null)
      opts = {};
    var props =
    {
      value:         pfunc,
      enumerable:    'enumerable'   in opts ? opts.enumerable   : false,
      configurable:  'configurable' in opts ? opts.configurable : false,
      writable:      'writable'     in opts ? opts.writable     : false,
    }; 
    Object.defineProperty(object, pname, props);
  }

  /**
   * Clone a simple object, using a simple JSON chain.
   */
  Nano.clone = function clone (object)
  {
    return JSON.parse(JSON.stringify(object));
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
    self.debugging = 'debug' in conf ? conf.debug : {};

    /**
     * We can specify multiple model data sources and backend services.
     */
    for (var name in conf.sources)
    {
      var source = conf.sources[name];
      self._loadModel(name, source);
    } // for (sources)

  } // end ModelAPI

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
   */
  Nano.ModelAPI.prototype._loadModel = function (name, source)
  {
    var type = source.type;

    if (type == 'ws')
    { // Web service, requires a webservice library to be loaded.
      var opts = source.opts;
      this.onDebug('loadModel', '-- Loading web service', name, opts);
      var wsclass = 'class' in opts ? opts.class : Nano.WebService;
      if (name in this.debugging)
      {
        opts.debug = this.debugging[name];
      }
      this.model[name] = new wsclass(opts);
    }

    else if (type == 'json')
    { // Requires the json.jq and exists.jq jQuery extensions.
      var elname;
      if ('element' in source)
        elname = source.element;
      else
        elname = '#' + name;

      var element = $(elname);
      if (element.exists())
      {
        this.onDebug('loadModel', '-- Loading JSON', name, elname);
        var jsondata = this.model[name] = element.JSON();
        var save_changes = false;
        if (source.enforceObject === true)
        {
          if ($.isArray(jsondata) || jsondata.length == 0)
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
        // format_json library.
        Nano.addProperty(jsondata, 'json', function (format)
        {
          var json = JSON.stringify(this);
          if (format)
            return format_json(json);
          else
            return json;
        });

        // We changed something, time to save.
        if (save_changes)
          jsondata.save();

      } // if element exists
    } // if type == json
  }

})(
window,                          // Top level window object.
jQuery,                          // jQuery must exist with its full name.
window.riot ? window.riot        // If 'riot' exists, use it.
  : jQuery.observable ? jQuery   // If jQuery has riot methods, use it.
  : $                            // Assume a standalone $ object.
); 

