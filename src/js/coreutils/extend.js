(function()
{
  "use strict";

  if (window.Nano === undefined || Nano.copyProperties === undefined)
  {
    throw new Error("Nano core not loaded");
  }

  /**
   * Extend a new class using a parent base class.
   *
   * If the subclass parameter is undefined or null, we'll create a default
   * function that simply calls the base class constructor with all arguments
   * passed as is. This allows for easy construction of child classes:
   *
   * ```
   *   var childclass = Nano.extend(parentclass);
   * ```
   * 
   * or if you want to copy public properties from the base class that aren't
   * in the prototype, then:
   *
   * ```
   *   var childclass = Nano.extend(parentclass, null, true);
   * ```
   *
   * If you need to specify your own child class constructor,
   * make sure it calls any necessary parent constructors.
   *
   * If copyDef is the boolean true value, it becomes {copyProperties: true}.
   * If copyDef is an object, it may have the following properties:
   *
   *  copyProperties: A propOpts value to be passed to Nano.copyProperties();
   *  copyInto: An array of sources to send to Nano.copyInto();
   *
   * The copyProperties call if used will look like:
   *  Nano.copyProperties(base, sub, copyDef.copyProperties);
   *
   * The copyProperties and copyInto copyDef properties can be used together.
   *
   * @param {function} base  The base class we are extending from.
   * @param {function} sub  The sub class we are creating.
   * @param {boolean|object} copyDef  See below.
   *
   * @return {function} The new class after extending has been completed.
   *
   * @deprecated This is no longer needed now that we're using ES2015+ classes.
   * In fact, trying to make a subclass using this from a class defined with
   * the ES2015 class syntax, will throw an error. Don't do it.
   */
  Nano.extend = function (base, sub, copyDef)
  {
//    console.error("Nano.extend()", base, sub, copyall);
    if (typeof base !== 'function')
    {
      console.error("Nano.extend(base): base passed was not function", arguments);
      return;
    }

    if (sub === undefined || sub === null)
    {
      sub = function ()
      {
        var args = Array.prototype.slice.call(arguments);
        base.apply(this, args);
      }
//      console.log("Generated empty child", sub);
    }
    else if (typeof sub !== 'function')
    {
      console.error("Nano.extend(base, sub): sub passed was not function", arguments);
      return;
    }

    sub.prototype = Object.create(base.prototype);

    // Shortcut for copying all base class properties.
    if (copyDef === true)
    {
      copyDef = {copyProperties: true};
    }

    // Copy class properties from the base class.
    if (copyDef && copyDef.copyProperties)
    {
      Nano.copyProperties(base, sub, copyDef.copyProperties);
    }

    // Copy properties in from mixin/trait objects.
    if (copyDef && copyDef.copyInto)
    {
      var copyInto = [sub];
      for (var c = 0; c < copyDef.copyInto.length; c++)
      {
        copyInto.push(copyDef.copyInto[c]);
      }
      Nano.copyInto.apply(Nano, copyInto);
    }

    return sub;
  }

})();
