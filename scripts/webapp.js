/**
 * A new web app core using Riot.js and jQuery as the core foundations.
 *
 * This replaces App.js in all capacities.
 */

(function(root, $)
{ 
  "use strict";

  /** 
   * Set up the Nano namespace.
   */
  if (root.Nano === undefined)
    var Nano = root.Nano = {};

  /**
   * Promise interface, from Riot.js example app.
   */
  Nano.Promise = function Promise (fn)
  {
    var self = $.observable(this);
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
    var app = $.observable(function (arg)
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
    var props =
    {
      value:         pfunc,
      enumerable:    enumerable in opts   ? opts.enumerable   : false,
      configurable:  configurable in opts ? opts.configurable : false,
      writable:      writable in opts     ? opts.writable     : false,
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
    var self = $.observable(this);

    /**
     * The model property stores our model data and backend services.
     */
    self.model = {};

    /**
     * The conf property stores a copy of our initialization data.
     */
    self.conf = conf;

    /**
     * We can specify multiple model data sources and backend services.
     */
    for (var name in conf.sources)
    {
      var source = conf.sources[name];
      var type = source.type;

      if (type == 'ws')
      { // Web service, requires a webservice library to be loaded.
        var opts = source.opts;
        var wsclass = 'class' in opts ? opts.class : Nano.WebService;
        self.model[name] = new wsclass(opts);
      }

      else if (type == 'json')
      { // Requires the json.jq and exists.jq jQuery extensions.
        var elname;
        if ('element' in opts)
          elname = opts.element;
        else
          elname = '#' + name;

        var element = $(elname);
        if (element.exists())
        {
          var jsondata = self.model[name] = $(element).JSON();
          var save_changes = false;
          if (opts.enforceObject === true)
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

          // We changed something, time to save.
          if (save_changes)
            jsondata.save();
        }
      }

    } // for (sources)

  }); // end ModelAPI

})(window, $); // We are assuming browser with jQuery and Riot.js loaded.

