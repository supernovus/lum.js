/**
 * A copy of the Observable library from riot.js without the rest of
 * the riot.js framework. I want to keep it small and simple.
 */
(function()
{

"use strict";

if (window.Nano === undefined)
{
  console.log("fatal error: Nano core not loaded");
  return;
}

Nano.observable = function(el) {

  /**
   * Extend the original object or create a new empty one
   * @type { Object }
   */

  el = el || {}

  /**
   * Private variables and methods
   */
  var callbacks = {},
    slice = Array.prototype.slice,
    onEachEvent = function(e, fn) { e.replace(/\S+/g, fn) },
    defineProperty = function (key, value) {
      Object.defineProperty(el, key, {
        value: value,
        enumerable: false,
        writable: false,
        configurable: false
      })
    }

  /**
   * Listen to the given space separated list of `events` and execute the `callback` each time an event is triggered.
   * @param  { String } events - events ids
   * @param  { Function } fn - callback function
   * @returns { Object } el
   */
  defineProperty('on', function(events, fn) {
    if (typeof fn != 'function')  return el

    onEachEvent(events, function(name, pos) {
      (callbacks[name] = callbacks[name] || []).push(fn)
      fn.typed = pos > 0
    })

    return el
  })

  /**
   * Removes the given space separated list of `events` listeners
   * @param   { String } events - events ids
   * @param   { Function } fn - callback function
   * @returns { Object } el
   */
  defineProperty('off', function(events, fn) {
    if (events == '*' && !fn) callbacks = {}
    else {
      onEachEvent(events, function(name) {
        if (fn) {
          var arr = callbacks[name]
          for (var i = 0, cb; cb = arr && arr[i]; ++i) {
            if (cb == fn) arr.splice(i--, 1)
          }
        } else delete callbacks[name]
      })
    }
    return el
  })

  /**
   * Listen to the given space separated list of `events` and execute the `callback` at most once
   * @param   { String } events - events ids
   * @param   { Function } fn - callback function
   * @returns { Object } el
   */
  defineProperty('one', function(events, fn) {
    function on() {
      el.off(events, on)
      fn.apply(el, arguments)
    }
    return el.on(events, on)
  })

  /**
   * Execute all callback functions that listen to the given space separated list of `events`
   * @param   { String } events - events ids
   * @returns { Object } el
   */
  defineProperty('trigger', function(events) {

    // getting the arguments
    // skipping the first one
    var args = slice.call(arguments, 1),
      fns

    onEachEvent(events, function(name) {

      fns = slice.call(callbacks[name] || [], 0)

      for (var i = 0, fn; fn = fns[i]; ++i) {
        if (fn.busy) return
        fn.busy = 1
        fn.apply(el, fn.typed ? [name].concat(args) : args)
        if (fns[i] !== fn) { i-- }
        fn.busy = 0
      }

      if (callbacks['*'] && name != '*')
        el.trigger.apply(el, ['*', name].concat(args))

    })

    return el
  })

  return el

}

})();
