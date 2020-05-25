/**
 * A Promise-like object that offers the jQuery Deferred API.
 *
 * You might want to just use native Promises for most things. This is only
 * for cases where existing apps/libraries expect done(), fail(), etc.
 */

(function(Nano, jQuery)
{ 
  "use strict";

  if (Nano === undefined)
  {
    throw new Error("Missing Lum core");
  }

  Nano.markLib('promise');

  /**
   * @class Nano.Promise
   *
   * Build the Promise object.
   *
   * @param (object|boolean) options Options for the Promise object.
   *
   *  If options is a boolean, it's assumed to be the 'jquery' option.
   *
   *  Recognized properties if options is an object:
   *
   *   jquery: (boolean)  If true, run this._extendJQuery(options);
   *                      If false, run this._extendInternal(options);
   */
  Nano.Promise = function (options)
  {
    if (typeof options === 'boolean')
    { // Assume the 'jquery' option was passed implicitly.
      options = {jquery: options};
    }
    else if (typeof options !== 'object' || options === null)
    { // Ensure options is an object, and auto-select jQuery if it's loaded.
      options = {jquery: (jQuery !== undefined)};
    }

    if (options.jquery)
    {
      this._extendJQuery(options)
    }
    else
    {
      this._extendInternal(options);
    }
  }

  /**
   * Add the methods from jQuery.Deferred to ourself.
   *
   * If jQuery is not loaded, this will throw an error.
   */
  Nano.Promise.prototype._extendJQuery = function (options)
  {
    if (jQuery === undefined)
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
   * Create our own internal represenation of the Deferred API.
   *
   *  Setters:             done(), fail(), always(), progress()
   *  Promise chaining:    then(), catch()
   *  Triggers:            resolve(), reject(), notify()
   *  Targetted triggers:  resolveWith(), rejectWith(), notifyWith()
   *  Info:                state()
   *
   */
  Nano.Promise.prototype._extendInternal = function (options)
  {
    // A copy of this for use in closures.
    var self = this;

    // Private storage for the state of the Promise.
    var state = 'pending';

    // Private storage for the arguments used to resolve/reject.
    var final_args;

    // Private storage for the 'this' object to use in callbacks.
    var final_this = this;

    var callbacks =
    {
      always: [],
      done: [],
      fail: [],
      progress: [],
    };

    // Private function to run registered callbacks.
    function apply_callbacks (name, args, current_this)
    {
      if (args === undefined)
      {
        args = final_args;
      }
      if (current_this === undefined)
      {
        current_this = final_this;
      }
      var cbs = callbacks[name];
      if (cbs && cbs.length)
      {
        for (var i = 0; i < cbs.length; i++)
        {
          var cb = cbs[i];
          cb.apply(current_this, args);
        }
      }
    }

    // Private function to create a listener.
    function create_listener (name, validStates)
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
              callbacks[name].push(args[i]);
            }
            else if (validStates.indexOf(state) != -1)
            { // Execute the callback now.
              args[i].apply(final_this, final_args);
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
    var meths = 
    {
      done: ['resolved'],
      fail: ['rejected'],
      always: ['resolved', 'rejected'],
      progress: [],
    };
    for (var mname in meths)
    {
      var mstate = meths[mname];
      self[mname] = create_listener(mname, mstate);
    }

    // Add our trigger methods.
    self.resolve = function ()
    {
      if (state === 'pending')
      {
        var args = Array.prototype.slice.call(arguments);
        if (args.length === 1 && typeof args[0] === 'object' && 
          typeof args[0].then === 'function')
        { // Passed a promise. We'll 'then' it, and resolve again from it.
          args[0].then(function ()
          {
            self.resolve.apply(self, arguments);
          });
        }
        else
        { // Not a promise, let's do this.
          state = 'resolved';
          final_args = args;
          apply_callbacks('always');
          apply_callbacks('done');
        }
      }
    }

    self.resolveWith = function (withObj)
    {
      if (state === 'pending')
      {
        final_this = withObj;
        var resolveArgs = Array.prototype.slice.call(arguments, 1);
        self.resolve.apply(self, resolveArgs);
      }
    }

    self.reject = function ()
    {
      if (state === 'pending')
      {
        var args = Array.prototype.slice.call(arguments);
        if (args.length === 1 && typeof args[0] === 'object' && 
          typeof args[0].then === 'function')
        { // Passed a promise. We'll 'then' it, and resolve again from it.
          args[0].then(null, function ()
          {
            self.reject.apply(self, arguments);
          });
        }
        else
        { // Not a promise, let's do this.
          state = 'rejected';
          final_args = args;
          apply_callbacks('always');
          apply_callbacks('fail');
        }
      }
    }

    self.rejectWith = function (withObj)
    {
      if (state === 'pending')
      {
        final_this = withObj;
        var rejectArgs = Array.prototype.slice.call(arguments, 1);
        self.reject.apply(self, rejectArgs);
      }
    }

    self.notify = function ()
    {
      if (state === 'pending')
      {
        var args = Array.prototype.slice.call(arguments);
        if (args.length === 1 && typeof args[0] === 'object' && 
          typeof args[0].then === 'function')
        { // Passed a promise. We'll 'then' it, and resolve again from it.
          args[0].then(null, null, function ()
          {
            self.notify.apply(self, arguments);
          });
        }
        else
        { // Not a promise, let's do this.
          apply_callbacks('progress', args);
        }
      }
    }

    self.notifyWith = function (withObj)
    {
      if (state === 'pending')
      {
        var args = Array.prototype.slice.call(arguments, 1);
        if (args.length === 1 && typeof args[0] === 'object' && 
          typeof args[0].then === 'function')
        { // Passed a promise. We'll 'then' it, and resolve again from it.
          args[0].then(null, null, function ()
          {
            var subargs = Array.prototype.slice.call(arguments);
            subargs.unshift(withObj);
            self.notifyWith.apply(self, subargs);
          });
        }
        else
        { // Not a promise, let's do this.
          apply_callbacks('progress', args, withObj);
        }
      }
    }

    self.catch = function (failFilter)
    {
      return self.then(null, failFilter);
    }

    self.then = function (doneFilter, failFilter, progressFilter)
    {
      var newPromise = new Nano.Promise(false);

      function make_callback (filterSpec)
      {
        var callback = function ()
        {
          var useWith = (this !== self);
          var args = Array.prototype.slice.call(arguments);
          var result = filterSpec.filter.apply(this, args);
          if (useWith)
          {
            newPromise[filterSpec.methodWith](this, result);
          }
          else
          {
            newPromise[filterSpec.methodName](result);
          }
        }
        return callback;
      }

      var filterSpecs =
      {
        done:
        {
          filter: doneFilter,
          methodName: 'resolve',
          methodWith: 'resolveWith',
        },
        fail:
        {
          filter: failFilter,
          methodName: 'reject',
          methodWith: 'rejectWith',
        },
        progress:
        {
          filter: progressFilter,
          methodName: 'notify',
          methodWith: 'notifyWith',
        },
      };

      for (var onName in filterSpecs)
      {
        var filterSpec = filterSpecs[onName];
        if (typeof filterSpec.filter === 'function')
        {
          var callback = make_callback(filterSpec);
          self[onName](callback);
        }
      }

      return newPromise;
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
      self.reject(xhr, ts, error);
    }, timeout);
  }

})(window.Lum, window.jQuery); 

