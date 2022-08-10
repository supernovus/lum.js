/**
 * Utils for working with Arrays.
 */
Lum.lib(
{
  name: 'arrayutils', 
  ns: 'array',
}, 
function (Lum, arr)
{
  "use strict";

  core = require('@lumjs/core');

  /**
   * Find the index of a value in an array.
   *
   * @deprecated Use `Array.indexOf()` now.
   *
   * @param {Array} array  The array.
   * @param {mixed} value  The value to look for.
   *
   * @return {number}  The index or -1 if the value was not found.
   */
  arr.indexOf = function (array, value)
  {
    console.warn("Deprecated: use Array.indexOf()");
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
   * @deprecated Use `Array.includes()` now.
   *
   * @param {Array} array  The array.
   * @param {mixed} value  The value to look for.
   *
   * @return {boolean}  Was the value in the array?
   */
  arr.contains = function (array, value)
  {
    console.warn("Deprecated: use Array.includes()");
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

  arr.powerset = core.arrays.powerset;
  arr.random = core.arrays.random;

  /**
   * Add a bound version of a arr method to an array itself.
   *
   * @deprecated This is just weird and unnecessary.
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

});

