/**
 * A promise interface for older browsers.
 */

(function($, observable)
{ 
  "use strict";

  if (window.Nano === undefined)
  {
    console.log("fatal error: missing Nano global namespace");
    return;
  }

  /**
   * Promise interface, from Riot.js example app.
   */
  Nano.Promise = function (fn)
  {
    var self = observable(this);
    $.map(['done', 'fail', 'always'], function(name) 
    {
      self[name] = function(arg) 
      {
        return self[$.isFunction(arg) ? 'on' : 'trigger'](name, arg);
      };
    });
  }

})(
jQuery,                          // jQuery must exist with its full name.
window.riot 
  ? window.riot.observable       // If 'riot' exists, use it.
  : window.Nano.observable       // Nano may contain the observable trait.
); 

