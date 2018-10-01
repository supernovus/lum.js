/**
 * Cross platform, fast versions of indexOf and contains.
 */

(function ()
{
  "use strict";

  if (window.Nano === undefined)
  {
    console.log("fatal error: Nano core not loaded");
    return;
  }

  Nano.array = {};

  Nano.array.indexOf = function (array, value)
  {
    var index  = -1,
        length = array.length;

    while (++index < length)
    {
      if (array[index] === value)
      {
        return index;
      }
    }
    return -1;
  }

  Nano.array.contains = function (array, value)
  {
    var index  = -1,
        length = array.length;

    while (++index < length)
    {
      if (array[index] === value)
      {
        return true;
      }
    }
    return false;
  }

  Nano.array.powerset = function (ary) 
  {
    var ps = new Array(new Array());
    for (var i=0; i < ary.length; i++) 
    {
      // we modify the ps array in the next loop,
      // so can't use the ps.length property directly in the loop condition.
      var current_length = ps.length;
      for (var j = 0; j < current_length; j++) 
      {
        ps.push(ps[j].concat(ary[i]));
      }
    }
    return ps;
  }

  Nano.array.random = function (array)
  {
    return array[Math.floor(Math.random()*array.length)];
  }

  Nano.array.extend = function (array, method)
  {
    // Don't override existing methods.
    if (array[method] === undefined && typeof Nano.array[method] === 'function')
    {
      Nano.addProperty(array, method, function ()
      {
        var args = Array.prototype.slice.call(arguments);
        args.unshift(this);
        return Nano.array[method].apply(Nano.array, args);
      });
    }
  }

})();

