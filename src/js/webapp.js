/**
 * A new web app core using Riot.js and jQuery as the core foundations.
 *
 * This requires coreutils.js to initialize the namespace and add core
 * utilities.
 *
 * This is marked DEPRECATED. 
 * The ModelAPI class has been split into it's own class, and a new
 * ViewController class has been added to work with it. 
 *
 * As soon as any old code that uses this has been ported to the new
 * methodology, I will remove this library entirely.
 *
 * Nothing in this file should be used in new code.
 */

(function($, observable)
{ 
  "use strict";

  if (window.Nano === undefined)
  {
    console.log("fatal error: Nano core not loaded");
    return;
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
    var app = observable(function (arg)
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
    this.API = this.makeAPI(appConf.apiClass);

    if (this.API === undefined)
    {
      console.log("fatal error: couldn't load requested API class");
      return;
    }

    // A short cut to starting the application.
    this.API.prototype.start = function ()
    {
      this.trigger("ready");
    }

    // Create our Nano.webApp instance.
    this.webApp = Nano.webApp(this.API);
  }

  /**
   * A quick method to get an empty API class, ready to be populated.
   */
  Nano.EasyWebApp.prototype.makeAPI = function (apiClass)
  {
    // First, if no apiClass was called, use the Nano.ModelAPI class.
    if (apiClass === undefined || apiClass === null)
    {
      if (Nano.ModelAPI !== undefined)
      {
        return Nano.ModelAPI.makeAPI();
      }
      else
      {
        console.log("fatal error: could not find suitable API class.");
        return;
      }
    }

    // Next, if the apiClass provides a makeAPI method, use it.
    if (apiClass.makeAPI !== undefined)
    {
      return apiClass.makeAPI();
    }

    // Finally, if the apiClass doesn't provide a makeAPI method, we use the
    // singular syntax of the Nano.extend() method.
    return Nano.extend(apiClass);
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
jQuery,                          // jQuery must exist with its full name.
window.riot 
  ? window.riot.observable       // If 'riot' exists, use it.
  : window.Nano.observable       // Nano may contain the observable trait.
); 

