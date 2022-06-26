//++ core/observable ++//

  /**
   * Make an object support the observable API.
   *
   * Adds on(), off(), one(), and trigger() methods.
   * 
   * @param {object} el  The object we are making observable.
   * @param {object} opts  Options that define behaviours.
   *
   *  'wildcard' (string)  =>  The event name used as a wildcard. 
   *                           Default: '*'
   *  'wrapthis' (boolean) =>  If true, 'this' will be a wrapper. 
   *                           Default: false
   *  'addname'  (boolean) =>  If true callbacks with multiple events will have
   *                           the name of the triggered event added as the first
   *                           parameter. 
   *                           Default: !wrapthis
   *  'addis'    (boolean) =>  If true, add immutable 'isObservable' property.
   *                           Default: wrapthis
   *  'addme'    (string)  =>  If set, add a method with this name to the object
   *                           that is a version of Lum.observable with the
   *                           default settings being the options passed here.
   *                           Default: (wrapthis ? 'makeObservable' : null)
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
   function observable (el={}, opts={}) 
   {
     //console.debug("observable", el, opts);
 
     if (!isComplex(el))
     { // Don't know how to handle this, sorry.
       throw new Error("non-object sent to observable()");
     }
 
     if (observable.is(el))
     { // It's already observable.
       return el;
     }
 
     if (typeof opts === 'boolean')
     { // Assume it's the wrapthis option.
       opts = {wrapthis: opts};
     }
     else if (!isObj(opts))
     {
       opts = {};
     }
 
     const noSpace = /^\S+$/;
 
     const wildcard = (typeof opts.wildcard === S 
       && noSpace.test(opts.wildcard))
       ? opts.wildcard
       : '*';
 
     const wrapthis = (typeof opts.wrapthis === 'boolean') 
       ? opts.wrapthis 
       : false;
 
     const addname = (typeof opts.addname === 'boolean') 
       ? opts.addname 
       : !wrapthis;
 
     const addis = (typeof opts.addis === 'boolean')
       ? opts.addis
       : wrapthis;
 
     const validIdent = /^[a-zA-Z_$][0-9a-zA-Z_$]*$/;
 
     const addme = (typeof opts.addme === 'string'
       && validIdent.test(opts.addme))
       ? opts.addme
       : (wrapthis ? 'makeObservable' : null);
 
     const slice = Array.prototype.slice;
 
     function onEachEvent (e, fn) 
     { 
       e.replace(/\S+/g, fn);
     }
 
     const add = prop(el);
 
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
      * Assign an event handler
      * 
      * Listen to the given space separated list of `events` and execute
      * the `callback` each time an event is triggered.
      * @param  {string} events - events ids
      * @param  {function} fn - callback function
      * @returns {object} el
      */
     add('on', function(events, fn) 
     {
       if (typeof fn !== F)
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
      * 
      * @param   {string} events - events ids
      * @param   {function} fn - callback function
      * @returns {object} el
      */
     add('off', function(events, fn) 
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
      * Add a one-shot event handler.
      * 
      * Listen to the given space separated list of `events` and execute 
      * the `callback` at most once.
      * 
      * @param   {string} events - events ids
      * @param   {function} fn - callback function
      * @returns {object} el
      */
     add('one', function(events, fn) 
     {
       function on() 
       {
         el.off(events, on)
         fn.apply(el, arguments)
       }
       return el.on(events, on);
     });
 
     /**
      * Execute all callback functions that listen to the given space 
      * separated list of `events`
      * @param   {string} events - events ids
      * @returns {object} el
      */
     add('trigger', function(events) 
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
 
     if (addis)
     {
       add('isObservable', true);
     }
 
     if (addme)
     { // Add a wrapper for observable() that sets new default options.
       const ourProps = Object.keys(opts);
       add(addme, function (obj=null, mopts={})
       {
         if (ourProps.length > 0)
         {
           for (const prop of ourProps)
           {
             if (mopts[prop] === undefined)
             {
               mopts[prop] = opts[prop];
             }
           }
         }
         return Lum.observable(obj, mopts);
       });
     }
 
     return el
 
   } // observable()
 
   prop(Lum, 'observable', observable);
 
   /**
    * Check if an object has 'trigger' and 'on' methods.
    */
   prop(observable, 'is', function (obj)
   {
     return (typeof obj === 'object' && obj !== null
       && typeof obj.trigger === 'function'
       && typeof obj.on === 'function');
   });

//-- core/observable --//
