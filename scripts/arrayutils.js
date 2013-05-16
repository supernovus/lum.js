/**
 * Cross platform, fast versions of indexOf and contains.
 */

if (window.Nano === undefined)
{
  window.Nano = {};
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

