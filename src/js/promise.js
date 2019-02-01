/**
 * A Promise interface that provides a simple API based on jQuery.Deferred
 */

(function(observable)
{ 
  "use strict";

  if (window.Nano === undefined)
  {
    throw new Error("Nano core not loaded");
  }

  /**
   * Build the Promise object.
   *
   * @param (object|boolean) options Options for the Promise object.
   *
   *  If options is a boolean, it's assumed to be the 'jquery' option.
   *
   *  Recognized properties if options is an object:
   *
   *   jquery: (boolean)  If true, run this._extendJQuery(options);
   *                      If false, run this._extendObservable(options);
   *
   */
  Nano.Promise = function (options)
  {
    if (typeof options === 'boolean')
    { // Assume the 'jquery' option was passed implicitly.
      options = {jquery: options};
    }
    else
    { // Ensure options is an object.
      options = options || {};
    }

    if (options.jquery)
    {
      this._extendJQuery(options)
    }
    else
    {
      this._extendObservable(options);
    }
  }

  /**
   * Add the methods from jQuery.Deferred to ourself.
   *
   * If jQuery is not loaded, this will throw an error.
   */
  Nano.Promise.prototype._extendJQuery = function (options)
  {
    if (window.jQuery === undefined)
    {
      throw new Error("Cannot use 'jquery' without jQuery loaded.");
    }
    var def = jQuery.Deferred();
    for (var f in def)
    {
      this[f] = def[f];
    }
  }

  /**
   * Use the observable library, and add the following methods:
   *
   *  Setters:             done(), fail(), always(), progress()
   *  Triggers:            resolve(), reject(), notify()
   *  Info:                state()
   *
   * If observable isn't loaded, this will throw an error.
   *
   * NOTE: this is very limited compared to the jQuery version, and
   * has not been tested well. Use with caution.
   */
  Nano.Promise.prototype._extendObservable = function (options)
  {
    if (typeof observable !== 'function')
    {
      throw new Error("No observable library loaded.");
    }

    // Using observable to add 'on' and 'trigger', used for event handlers.
    var self = observable(this);

    // Private storage for the state of the Promise.
    var state = 'pending';

    // Private storage for the arguments used to resolve/reject.
    var final_args;

    // Private function to create a listener.
    function create_listener (name)
    {
      var listener = function ()
      {
        var args = Array.prototype.slice.call(arguments);
        for (var i = 0; i < args.length; i++)
        {
          if (typeof args[i] === 'object' && Array.isArray(args[i]))
          { // An array of callbacks, recurse them.
            listener.apply(self, args[i]);
          }
          else if (typeof args[i] === 'function')
          {
            if (state === 'pending')
            { // Add the callback to the appropriate listener queue.
              self.on(name, args[i]);
            }
            else if (
              (state === 'resolved' && (name === 'done' || name === 'always'))
              || 
              (state === 'rejected' && (name === 'fail' || name === 'always'))
            )
            { // Execute the callback now.
              args[i].apply(self, final_args);
            }
          }
          else
          {
            console.warn("Unhandled parameter passed to "+name, args[i]);
          }
        }
        return self;
      }
      return listener;
    }

    // Add our event assignment methods.
    var meths = ['done','fail','always','progress'];
    for (var m in meths)
    {
      var name = meths[m];
      self[name] = create_listener(name);
    }

    // Add our trigger methods.
    self.resolve = function ()
    {
      if (state === 'pending')
      {
        state = 'resolved';
        final_args = Array.prototype.slice.call(arguments);
        var args = Array.prototype.slice.call(arguments);
        args.unshift('always');
        self.trigger.apply(self, args)
        args[0] = 'done';
        self.trigger.apply(self, args);
      }
    }

    self.reject = function ()
    {
      if (state === 'pending')
      {
        state = 'rejected';
        final_args = Array.prototype.slice.call(arguments);
        var args = Array.prototype.slice.call(arguments);
        args.unshift('always');
        self.trigger.apply(self, args);
        args[0] = 'fail';
        self.trigger.apply(self, args);
      }
    }

    self.notify = function ()
    {
      if (state === 'pending')
      {
        var args = Array.prototype.slice.call(arguments);
        args.unshift('progress');
        self.trigger.apply(self, args);
      }
    }

    self.state = function ()
    {
      return state;
    }
  }

  /**
   * Execute a delayed 'done' action.
   *
   * @param mixed  obj      The object to send to the done().
   * @param str    ts       The textStatus to send to done().
   * @param mixed  xhr      Object to use as XHR (default is this.)
   * @param int    timeout  The timeout (in ms) defaults to 5.
   */
  Nano.Promise.prototype.deferDone = function (obj, ts, xhr, timeout)
  {
    var self = this;
    if (timeout === undefined)
      timeout = 5; // 5ms should be enough time to register .done events.
    if (xhr === undefined)
      xhr = self;
    self.doneTimer = setTimeout(function() 
    { 
      self.resolve(obj, ts, xhr);
    }, timeout);
  }

  /**
   * Execute a delayed 'fail' action.
   *
   * @param mixed  error    The message, code, or object to send to fail().
   * @param str    ts       The textStatus to send to fail().
   * @param mixed  xhr      Object to use as XHR (default is this.)
   * @param int    timeout  The timeout (in ms) defaults to 5.
   */
  Nano.Promise.prototype.deferFail = function (error, ts, xhr, timeout)
  {
    var self = this;
    if (timeout === undefined)
      timeout = 5;
    if (xhr === undefined)
      xhr = self;
    self.failTimer = setTimeout(function () 
    {
      self.reject(self, ts, error);
    }, timeout);
  }

})(
(window.Nano && window.Nano.observable) 
  ? window.Nano.observable
  : window.riot 
  ? window.riot.observable
  : null
); 

