/**
 * oQuery: a way of searching through an array of objects for objects
 * matching certain property values.
 */

(function ()
{
  "use strict";

  if (window.Nano === undefined)
  {
    window.Nano = {};
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

 *  return   if set, used in nested queries to determine the object to return.
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
    console.debug("Invalid query passed to oQuery()");
    if (opts.single === true)
      return null;
    else
      return matched;
  }

  if (!Array.isArray(objarr))
  { // It's not an array of objects, it's probably a portion of a sub-query.
    // In this case, we will return the object if it matches all queries.
    console.debug("objarr isn't an object array, nested query assumed", objarr, query);
    let match = true;
    for (let key in query)
    {
      if (typeof query[key] === 'object')
      {
        let submatch = oq(query[key], objarr[key], opts);
        if (opts.single && submatch === null)
        {
          match = false;
          break;
        }
        else if (!opts.single && submatch.length === 0)
        {
          match = false;
          break;
        }
      }
      else if (typeof query[key] === 'function')
      {
        match = query[key](objarr[key]);
        if (!match) break;
      }
      else if (objarr[key] != query[key])
      {
        match = false;
        break;
      }
    }

    if (match)
    {
      if (opts.single === true)
        return objarr;
      else
        return [objarr];
    }
    else
    {
      if (opts.single === true)
        return null;
      else
        return matched;
    }
  }

  for (let i in objarr)
  {
//    console.log("iterating item ", i);
    let item = objarr[i];
    let match = true;
    for (let key in query)
    {
//      console.log("checking value of ", key);
      if (typeof query[key] === 'object')
      {
        console.log("a subquery", query[key], item[key]);
        if (typeof item[key] !== 'object')
        { // Couldn't find the nested item.
//          console.log("the item didn't have a "+key+" property.");
          return null;
        }
        let subresults = oq(query[key], item[key], opts);
        console.log("subresults: ", subresults);
        if (opts.return === key)
        { // We're using a return filter.
          match = false;
          if (opts.single && subresults !== null)
          {
            return subresults;
          }
          else if (!opts.single && subresults.length > 0)
          {
            matched = matched.concat(subresults);
          }
        }
        else
        {
          if
          ( 
            (opts.single && subresults === null)
            ||
            (!opts.single && subresults.length === 0)
          )
          {
            match = false;
            break;
          }
        }
      }
      else if (typeof query[key] === 'function')
      { // Pass the item through the function, and see what it returns.
        if (!query[key](item[key]))
        {
          match = false;
          break;
        }
      }
      else if (item[key] != query[key])
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

