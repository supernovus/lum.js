/**
 * Utils for working with Arrays.
 */
Lum.lib('arrayutils', 
{
  ns: 'array',
}, 
function (Lum, arr)
{
  "use strict";

  //const arr = Lum.lib.mark('arrayutils').ns.new('array');

  /**
   * Find the index of a value in an array.
   *
   * This isn't really needed anymore as Array.indexOf() is a thing now.
   * It's kept for backwards compatibility only.
   *
   * @param {Array} array  The array.
   * @param {mixed} value  The value to look for.
   *
   * @return {number}  The index or -1 if the value was not found.
   */
  arr.indexOf = function (array, value)
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

  /**
   * See if an array contains a value.
   *
   * This isn't really needed anymore as Array.includes() is a thing now.
   * It's kept for backwards compatibility only.
   *
   * @param {Array} array  The array.
   * @param {mixed} value  The value to look for.
   *
   * @return {boolean}  Was the value in the array?
   */
  arr.contains = function (array, value)
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

  /**
   * Return a Powerset of values in the array.
   *
   * @param {Array} array  The array to make the powerset from.
   *
   * @return {Array}  The powerset.
   */
  arr.powerset = function (array) 
  {
    var ps = new Array(new Array());
    for (var i=0; i < array.length; i++) 
    {
      // we modify the ps array in the next loop,
      // so can't use the ps.length property directly in the loop condition.
      var current_length = ps.length;
      for (var j = 0; j < current_length; j++) 
      {
        ps.push(ps[j].concat(array[i]));
      }
    }
    return ps;
  }

  /**
   * Get a random element from an array.
   *
   * @param {Array} array  The array to get an item from.
   *
   * @return {mixed}  The randomly selected item.
   */
  arr.random = function (array)
  {
    return array[Math.floor(Math.random()*array.length)];
  }

  /**
   * Add a bound version of a arr method to an array itself.
   *
   * @param {Array} array  The array to add the method to.
   * @param {string} method  The name of the arr method to add.
   */
  arr.extend = function (array, method)
  {
    if (Array.isArray(array) && typeof method === 'string')
    { 
      if (array[method] === undefined && typeof this[method] === 'function')
      {
        Lum.prop(array, method, this[method].bind(this, array));
      }
      else
      {
        console.error("Cannot overwrite existing method", array, method);
      }
    }
    else
    {
      throw new Error("Invalid parameters passed to arr.extend()");
    }
  }

}); //(self.Lum);

