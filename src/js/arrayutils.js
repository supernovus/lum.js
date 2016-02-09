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

})();

