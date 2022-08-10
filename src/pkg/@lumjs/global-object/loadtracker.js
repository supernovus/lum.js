
const core = require('@lumjs/core');
const {F,S,B,needObj,needType,def} = core.types

/**
 * Track if libraries, plugins, or whatever are loaded.
 * 
 * Automatically manages events that are trigged on load.
 * Also will automatically run events assigned *after* the 
 * desired item has been loaded.
 * 
 * Can handle custom tests in addition to the default
 * test which simply see's if the `loadTracker.mark()`
 * method has been called for the specified name.
 * 
 * @class Lum.LoadTracker
 */
class LoadTracker
{
  /**
  * Build a LoadTracker
  * 
  * @param {object} [opts] - Named options for custom behaviours.
  * 
  * @param {function} [opts.or] A custom test for `is()` method.
  *   If this returns true, `is()` will return true immediately.
  *   Mutually exclusive with the `opts.and` option.
  * 
  *   The function will have `this` set to the `LoadTracker` instance.
  *   It will be passed the same arguments sent to the `is()` method.
  *   The function must return a boolean value indicating if the item
  *   is considered *loaded* for the purposes of this loader instance.
  * 
  * @param {function} [opts.and] A custom test for `is()` method.
  *   If this returns false, `is()` will return false immediately.
  *   Mutually exclusive with the `opts.or` option.
  * 
  *   The same function notes as `opts.or` apply to this as well.
  * 
  * @param {boolean} [opts.before=false] When to run the custom test.
  *   If `true` the custom test is run before the standard test.
  *   If `false` the custom test is run after the standard test.
  * 
  *   If `opts.or` was used, and whichever test is ran first returns 
  *   `true`, the other test won't be run at all.
  * 
  *   Likewise, if `opts.and` was used, and whichever test is ran first
  *   returns `false`, the other test won't be run at all.
  *
  * @param {function} [opts.check] A custom test for the `check*` methods.
  *   If specified, this will be ran *before* checking the rest of the
  *   arguments. The first parameter passed to the function is a boolean,
  *   indicating if only a single return value is expected; `checkOne()` 
  *   passes `true` while `checkAll()` passes false. All subsequent
  *   parameters will be the arguments passed to the calling method.
  *   The function will have `this` set to the `LoadTracker` instance.
  * 
  *   When called from `checkOne()` if it returns a string, that will
  *   be returned as the missing item name. Return nil if no errors.
  * 
  *   When called from `checkAll()` if it returns an Array, all items
  *   from that array will be added to the list of missing items, and
  *   then the regular `checkAll()` logic will continue. If however it
  *   returns a string, then that will be returned as the sole item in
  *   the missing list without running any further `checkAll()` logic.
  *   Return nil or an *empty* array if no errors.
  * 
  */
  constructor(opts={})
  {
    needObj(opts);

    def(this, '$loaded', {}); // List of loaded libraries.
    def(this, '$onload', {}); // Events to trigger when libraries are loaded.

    let isTest = false, testOr = false;
    if (typeof opts.or === F)
    { // A test that can override 
      isTest = opts.or;
      testOr = true;
    }
    else if (typeof opts.and === F)
    {
      isTest = opts.and;
      testOr = false;
    }
    
    def(this, '$isTest',  isTest);
    def(this, '$isOr',    testOr);
    def(this, '$is1st',   opts.before ?? false);
    def(this, '$check',   opts.check  ?? false);
    def(this, '$typeOne', opts.type   ?? 'item');
    def(this, '$typeAll', opts.types  ?? this.$typeOne + 's');
    
  }

  /**
  * Assign a callback function to be called.
  * 
  * All callbacks for a given `name` will be ran when
  * that `name` has been passed to `mark()` or `call()`.
  * 
  * @param {string}   name  - The name of the item to be loaded.
  * @param {function} event - The callback function.
  *  
  * @returns {boolean} - Is the method call deferred?
  *   If `true` the `name` has not been marked as loaded, so the
  *   method has been added to a queue that will be called
  */
  on(name, event)
  {
    needType(S, name,  "Name must be a string");
    needType(F, event, "Event must be a function");

    if (!Array.isArray(this.$onload[name]))
    { // Add an array of events.
      def(this.$onload, name, []);
    }

    this.$onload[name].push(event);

    if (this.is(name))
    { // Execute the function right now.
      event.call(Lum, name, false);
      return false;
    }

    return true;
  }

  /**
  * Mark an item as loaded.
  * 
  * @param {string} name - Item being marked as loaded.
  * @param {boolean} [call=true]     Also call `call()` method?
  * @param {boolean} [skipTest=true] Passed to `call()` method.
  */
  mark(name, call=true, skipTest=true)
  { 
    def(this.$loaded, name, true);
    if (call)
    {
      this.call(name, skipTest);
    }
  }

  /**
  * Call all of the callback function for an item.
  * 
  * @param {string} name - The name of the item. 
  * @param {boolean} [skipTest=false] Skip the `is()` test?
  *  If `false` we call `this.is(name)` and will only continue
  *  if it returns a true value. If `true` we call without testing.
  *  
  * @returns {boolean} - If the events were called or not.
  */
  call(name, skipTest=false)
  {
    if (!skipTest && !this.is(name))
    { // Okay, we cannot call if the item isn't loaded.
      console.error("Cannot call events if item is not loaded", name, this);
      return false;
    }

    if (Array.isArray(this.$onload[name]))
    {
      for (const event of this.$onload[name])
      {
        event.call(Lum, name, true);
      }
    }

    return true;
  }

  /**
  * Check if the item is loaded.
  * 
  * @param {string} name - The item to check.
  * @returns {boolean}
  */
  is(name)
  {
    if (typeof name !== S)
    {
      console.error("Name must be a string", name);
      return false;
    }

    let okay = false;

    const hasTest = (typeof this.$isTest === F);
    const test1st = this.$is1st;
    const testOr  = this.$isOr;

    // A test that indicates we can return `okay` value.
    const done = () => (!hasTest || (testOr && okay) || (!testOr && !okay));

    if (hasTest && test1st)
    { // A custom test that is called before the normal test.
      okay = this.$isTest(...arguments);
      console.debug("is:before", okay, this);
      if (done()) return okay;
    }

    // Call the normal test, is the name marked?
    okay = (this.$loaded[name] ?? false);
    if (done()) return okay;

    if (hasTest && !test1st)
    { // A custom test that is called after the normal test.
      okay = this.$isTest(...arguments);
      console.debug("is:after", okay, this);
    }

    return okay;
  }

  /**
  * Get a list of loaded items.
  * 
  * This only includes items that have been marked using the
  * `mark()` method.
  * 
  * @param {(boolean|function)} [sort=false] Should we sort the results?
  *   If this is `true` we use the default sorting algorithm.
  *   If this is a function, it's passed to the `array.sort()` method.
  *   Any other value and the list will be in the order returned
  *   by the `Object.keys()` method.
  * 
  * @returns {Array} The list of loaded items.
  */
  list(sort=false)
  {
    let list = Object.keys(this.$loaded);
    if (sort === true)
    { // If sort is boolean true, use default sorting algorithm.
      list.sort();
    }
    else if (typeof sort === F)
    { // A custom sort function.
      list.sort(sort);
    }
    return list;
  }

  /**
  * The same output as `list(false)` but as a readonly accessor property.
  */
  get keys()
  {
    return Object.keys(this.$loaded);
  }

  /**
  * Return the first item that isn't loaded.
  * 
  * @param {string} ...names - Any items you want to look for.
  * 
  * @returns {string|undefined} If no items are missing, will be undefined.
  */
  checkOne()
  {
    if (typeof this.$check === F)
    {
      const check = this.$check(true, ...arguments);
      console.debug("checkOne:$check", check, this);
      if (typeof check === S && check.trim() !== '')
      { // A non-empty string was passed.
        return check;
      }
    }

    for (const lib of arguments)
    {
      if (!this.is(lib))
      {
        return lib;
      }
    }
  }

  /**
  * Return a full list of any missing items.
  * 
  * @param {string} ...names - Any items you want to look for.
  * 
  * @returns {Array} A list of missing items.
  */
  checkAll()
  {
    const missing = [];

    if (typeof this.$check === F)
    {
      const check = this.$check(false, ...arguments);
      console.debug("checkAll:$check", check, this);
      if (Array.isArray(check))
      { // May have missing items, or be empty.
        missing.push(...check);
      }
      else if (typeof check === S)
      { // A string indicates we can continue no further.
        missing.push(check);
        return missing;
      }
    }

    for (const lib of arguments)
    {
      if (!this.is(lib))
      {
        missing.push(lib);
      }
    }

    return missing;
  }

  /**
  * Setup a namespace object with wrapper methods.
  * 
  * @param {object} ns - The namespace object, may also be a function. 
  * @param {object} [names] A map of alternate names for the methods.
  * 
  * The default method names are:
  * 
  * `mark`     → Call `lt.mark`, returns `ourself()`.
  * `has`      → Proxy `lt.is`.
  * `check`    → Proxy `lt.checkOne`.
  * `checkAll` → Proxy `lt.checkAll`.
  * `list`     → Proxy `lt.list`.
  * `need`     → Call `check`, if any missing, throw Error.
  * `want`     → Call `check`, return true if all are loaded, false if not.
  * `onLoad`   → Proxy `on`.
  * 
  * If any of the method names are already present, they will be skipped.
  * 
  */
  setupNamespace(ns, names={})
  {
    needObj(ns, true, "Invalid namespace object");
    needObj(names, false, "Names must be an object");

    const thisLoad = this; // Contextual instance reference.
    let propName;          // Will be set by hasnt() closure.

    const getname = (name) => names[name] ?? name;

    const hasnt = (name) => 
    {
      propName = getname(name);
      return (ns[propName] === undefined);
    }

    const addfunc = (func) => def(ns, propName, func);
    const addgetter = (func) => def(ns, propName, {get: func});

    // Options for need() and want().
    const loadOpts = def(ns, '$loadOpts', 
    {
      checkAll: false,
      warnings: false,
    }).$loadOpts;

    if (hasnt('mark'))
    {
      addfunc(function()
      {
        thisLoad.mark(...arguments);
        return ourself();
      });
    }
    
    if (hasnt('has'))
    {
      addfunc(function()
      {
        return thisLoad.is(...arguments);
      });
    }

    if (hasnt('check'))
    {
      addfunc(function()
      {
        return thisLoad.checkOne(...arguments);
      })
    }

    if (hasnt('checkAll'))
    {
      addfunc(function()
      {
        return thisLoad.checkAll(...arguments);
      });
    }

    if (hasnt('list'))
    {
      addfunc(function()
      {
        return thisLoad.list(...arguments);
      });
    }

    if (hasnt('missing'))
    {
      addfunc(function(
      {
        fatal = false, 
        all   = loadOpts.checkAll, 
        warn  = loadOpts.warnings, 
        ok    = this,
      },
        ...items)
      {
        const thisCheck = all ? getname('checkAll') : getname('check');
        const result = ns[thisCheck](...items);

        if (typeof result === S 
          || (all && Array.isArray(result) && result.length > 0))
        { // There are missing libraries.
          const typeName = all ? thisLoad.$typeAll : thisLoad.$typeOne;
          const missing = fatal ? JSON.stringify(result) : result;

          if (fatal)
          {
            throw new Error(`Missing required ${typeName}: ${missing}`);
          }
          else 
          {
            if (warn)
            {
              console.warn("Missing", typeName, missing);
            }
            return false;
          }
        }

        // If we reached here, nothing was reported as missing.
        return ok;
      });
    }

    if (hasnt('need'))
    {
      addfunc(function()
      {
        const missing = getname('missing');
        return ns[missing]({fatal: true, ok: ourself()}, ...arguments);
      });
    }

    if (hasnt('want'))
    {
      addfunc(function()
      {
        const missing = getname('missing');
        return ns[missing]({fatal: false, ok: true}, ...arguments);
      });
    }

    if (hasnt('all'))
    {
      addgetter(function()
      {
        loadOpts.checkAll = true;
        return ns;
      });
    }

    if (hasnt('one'))
    {
      addgetter(function()
      {
        loadOpts.checkAll = false;
        return ns;
      });
    }

    if (hasnt('showWarnings'))
    {
      addfunc(function(val)
      {
        if (typeof val === B)
        {
          loadOpts.warnings = val;
          return this;
        }
        else 
        {
          return loadOpts.warnings;
        }
      });
    }

    if (hasnt('onLoad'))
    {
      addfunc(function()
      {
        return thisLoad.on(...arguments);
      });
    }

  }
} // LoadTracker class

module.exports = LoadTracker;
