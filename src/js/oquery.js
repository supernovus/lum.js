/**
 * oQuery: a way of searching through an array of objects for objects
 * matching certain property values.
 */

(function ()
{
  "use strict";

  if (window.Nano === undefined)
  {
    console.log("fatal error: Nano core not loaded");
    return;
  }

/**
 * Search through an array of objects.
 *
 * @param Mixed  query      Either an array of property values, or a string.
 * @param Array  objarray   An Array of Objects to search through.
 * @param Object opts       Options to change return values:
 *
 *  single   if true, we return the first matching object.
 *  index    if true, we return the index position in the array.
 *
 * If the query parameter is a string or number, then single will be forced on,
 * and we will search for a property called 'id' with that value.
 *
 * @return Mixed    Either an array of matches, or a single matching object.
 *                  If single was true, and nothing matched, we return null.
 */
var oq = Nano.oQuery = function (query, objarr, opts)
{
//  console.log("we're in oQuery()");

  var matched = [];

  if (opts === undefined || opts === null)
  {
    opts = {};
  }

  var qtype = typeof query;
  if (qtype === 'string' || qtype === 'number')
  {
    query = { id: query };
    opts.single = true;
  }
  else if (qtype !== 'object')
  {
    Nano.warn("Invalid query passed to oQuery()");
    if (opts.single === true)
      return null;
    else
      return matched;
  }

  for (var i in objarr)
  {
//    console.log("iterating item #"+i);
    var item = objarr[i];
    var match = true;
    for (var key in query)
    {
//      console.log("checking value of "+key);
      if (item[key] != query[key])
      {
        match = false;
        break;
      }
    }
    if (match) 
    {
//      console.log("we found a match");
      if (opts.single === true)
      {
//        console.log("returning the single item");
        if (opts.index === true)
        {
          return i;
        }
        else
        {
          return item;
        }
      }
      if (opts.index === true)
      {
        matched.push(i);
      }
      else
      {
        matched.push(item);
      }
    }
  }

  if (opts.single === true)
    return null;

  return matched;
}

/**
 * Get a single object from a container.
 */
oq.get = function (query, objarray)
{
  return oq(query, objarray, {single: true});
}

/**
 * Get the index of a single object in a container.
 */
oq.pos = function (query, objarray)
{
  return oq(query, objarray, {single: true, index: true});
}

/**
 * Get the index of multiple objects in a container.
 */
oq.indexes = function (query, objarray)
{
  return oq(query, objarray, {index: true});
}

})();

