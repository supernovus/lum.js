/**
 * A Promise interface that provides the jQuery Deferred API.
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
   * Build the Promise object.
   *
   * @param boolean  deferred  Use the jQuery Deferred as base class?
   *                           If true, the Promise will be derived from
   *                           the jQuery Deferred class, and offer it's API.
   *                           If false or omitted, the Promise will have
   *                           an extremely simple API based on an example
   *                           from the Riot.js v1 example application.
   *                           In either case, 'done, 'fail', and 'always'
   *                           methods will be available to send handlers to.
   */
  Nano.Promise = function (deferred)
  {
    if (deferred)
    {
      var def = $.Deferred();
      for (var f in def)
      {
        this[f] = def[f];
      }
    }
    else
    {
      if (observable === undefined)
      {
        console.log("fatal error: No observable method found");
        return;
      }
      var self = observable(this);
      $.map(['done', 'fail', 'always'], function(name) 
      {
        self[name] = function(arg) 
        {
          return self[$.isFunction(arg) ? 'on' : 'trigger'](name, arg);
        };
      });
    }
  }

  /**
   * Execute a delayed 'done' action.
   *
   * @param mixed  obj      The object to send to the done().
   * @param str    ts       The textStatus to send to done().
   * @param int    timeout  The timeout (in ms) defaults to 5.
   */
  Nano.Promise.prototype.deferDone = function (obj, ts, timeout)
  {
    var self = this;
    if (timeout === undefined)
      timeout = 5; // 5ms should be enough time to register .done events.
    self.doneTimer = setTimeout(function() 
    { 
      if (typeof self.resolve === 'function')
      {
        self.resolve(obj, ts, self);
      }
      else
      {
        self.always(obj, ts, self);
        self.done(obj, ts, self); 
      }
    }, timeout);
  }

  /**
   * Execute a delayed 'fail' action.
   *
   * @param mixed  error    The message, code, or object to send to fail().
   * @param str    ts       The textStatus to send to fail().
   * @param int    timeout  The timeout (in ms) defaults to 5.
   */
  Nano.Promise.prototype.deferFail = function (error, ts, timeout)
  {
    var self = this;
    if (timeout === undefined)
      timeout = 5;
    self.failTimer = setTimeout(function () 
    {
      if (typeof self.reject === 'function')
      {
        self.reject(self, ts, error);
      }
      else
      {
        self.always(self, ts, error);
        self.fail(self, ts, error); 
      }
    }, timeout);
  }

})(
jQuery,                          // jQuery must exist with its full name.
window.riot 
  ? window.riot.observable       // If 'riot' exists, use it.
  : window.Nano.observable       // Nano may contain the observable trait.
); 

