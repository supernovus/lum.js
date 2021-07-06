(function(Nano)
{
"use strict";

if (Nano === undefined)
{
  throw new Error("Missing Lum core");
}

Nano.markLib('observable');

/**
 * Make an object support the observable API.
 *
 * Adds on(), off(), one(), and trigger() methods.
 * 
 * @param {object} el  The object we are making observable.
 * @param {object} opts  Options that define behaviours.
 *
 *  'wildcard' (string)  =>  The event name used as a wildcard (default: '*')
 *  'wrapthis' (boolean) =>  If true, 'this' will be a wrapper (default: false)
 *  'addname'  (boolean) =>  If true callbacks with multiple events will have
 *                           the name of the triggered event added as the first
 *                           parameter. 
 *
 * If 'wrapthis' is true, the function will be called with a wrapper object as 
 * the 'this' variable instead of the target object. The wrapper will be:
 *
 * {
 *   self: el,        // The target object.
 *   name: event,     // The event name that was triggered.
 *   wildcard: bool,  // Will be true if this was a wildcard event handler.
 *   func: function,  // The function being called.
 * }
 *
 * This library was original based on the observable library from riot.js,
 * but has been refactored and expanded a lot since then.
 *
 * @returns {object} el
 */
Nano.observable = function(el={}, opts={}) 
{
  if (el === null || (typeof el !== 'object' && typeof el !== 'function'))
  { // Don't know how to handle this, sorry.
    throw new Error("non-object sent to observable()");
  }

  if (typeof opts === 'boolean')
  { // Assume it's the wrapthis option.
    opts = {wrapthis: opts};
  }
  else if (typeof opts !== 'object' || opts === null)
  {
    opts = {};
  }

  const wildcard = opts.wildcard || '*';

  const wrapthis = (typeof opts.wrapthis === 'boolean') 
    ? opts.wrapthis 
    : false;

  const addname = (typeof opts.addname === 'boolean') 
    ? opts.addname 
    : !wrapthis;

  const slice = Array.prototype.slice;

  function onEachEvent (e, fn) 
  { 
    e.replace(/\S+/g, fn);
  }

  function defineProperty (key, value) 
  {
    Object.defineProperty(el, key, 
    {
      value: value,
      enumerable: false,
      writable: false,
      configurable: false
    });
  }

  function runCallback (name, fn, args)
  {
    if (fn.busy) return;
    fn.busy = 1;

    let fthis;

    if (wrapthis)
    {
      const isWild = (name === wildcard);
      const fname = isWild ? (addname ? args[0] : args.shift()) : name;
      fthis = 
      {
        self: el,
        name: fname,
        func: fn,
        wildcard: isWild,
      };
    }
    else
    {
      fthis = el;
    }

    let fargs = (fn.typed && addname) ? [name].concat(args) : args;

    fn.apply(fthis, fargs);

    fn.busy = 0;
  }

  let callbacks = {};

  /**
   * Listen to the given space separated list of `events` and execute the `callback` each time an event is triggered.
   * @param  { String } events - events ids
   * @param  { Function } fn - callback function
   * @returns { Object } el
   */
  defineProperty('on', function(events, fn) 
  {
    if (typeof fn !== 'function')
    {
      console.error("non-function passed to on()");
      return el;
    }

    onEachEvent(events, function(name, pos) 
    {
      (callbacks[name] = callbacks[name] || []).push(fn);
      fn.typed = pos > 0;
    });

    return el;
  });

  /**
   * Removes the given space separated list of `events` listeners
   * @param   { String } events - events ids
   * @param   { Function } fn - callback function
   * @returns { Object } el
   */
  defineProperty('off', function(events, fn) 
  {
    if (events === wildcard && !fn) 
    { // Clear all callbacks.
      callbacks = {};
    }
    else 
    {
      onEachEvent(events, function(name) 
      {
        if (fn) 
        { // Find a specific callback to remove.
          var arr = callbacks[name]
          for (var i = 0, cb; cb = arr && arr[i]; ++i) 
          {
            if (cb == fn) arr.splice(i--, 1);
          }
        } 
        else 
        { // Remove all callbacks for this event.
          delete callbacks[name];
        }
      });
    }
    return el
  });

  /**
   * Listen to the given space separated list of `events` and execute the `callback` at most once
   * @param   { String } events - events ids
   * @param   { Function } fn - callback function
   * @returns { Object } el
   */
  defineProperty('one', function(events, fn) 
  {
    function on() 
    {
      el.off(events, on)
      fn.apply(el, arguments)
    }
    return el.on(events, on);
  });

  /**
   * Execute all callback functions that listen to the given space separated list of `events`
   * @param   { String } events - events ids
   * @returns { Object } el
   */
  defineProperty('trigger', function(events) 
  {
    // getting the arguments
    // skipping the first one
    const args = slice.call(arguments, 1);

    onEachEvent(events, function(name) 
    {
      const fns = slice.call(callbacks[name] || [], 0);

      for (var i = 0, fn; fn = fns[i]; ++i) 
      {
        runCallback(name, fn, args);
        if (fns[i] !== fn) { i-- }
      }

      if (callbacks[wildcard] && name != wildcard)
      { // Trigger the wildcard.
        el.trigger.apply(el, ['*', name].concat(args));
      }

    });

    return el
  });

  return el

} // observable()

/**
 * Check if an object has 'trigger' and 'on' methods.
 */
Nano.observable.is = function (obj)
{
  return (typeof obj === 'object' && obj !== null
    && typeof obj.trigger === 'function'
    && typeof obj.on === 'function');
}

})(window.Lum);
