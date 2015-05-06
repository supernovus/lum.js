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

