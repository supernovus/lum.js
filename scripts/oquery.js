/**
 * oQuery, searches for objects within an array matching certain
 * property values. This is the new API, which takes named options.
 *
 *  single   if true, we return the first matching object.
 *  index    if true, we return the index position in the array.
 *
 */
var oQuery = function (query, objarr, opts)
{
//  console.log("we're in oQuery()");

  var matched = [];

  if (opts === undefined || opts === null)
  {
    opts = {};
  }

  if (typeof query != 'object')
  {
    if (opts.single === true)
    { // The query will be matched against the 'id' property.
      query = { id: query };
    }
    else
    {
      console.log("Invalid query passed to oQuery()");
      return matched;
    }
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
 * Compatibility wrapper for the older API.
 */
oQuery.find = function (query, objarray, single, returnindex)
{
  return oQuery(query, objarray, {single: single, index: returnindex});
}

/**
 * Get a single object from a container.
 */
oQuery.get = function (query, objarray)
{
  return oQuery(query, objarray, {single: true});
}

/**
 * Get the index of a single object in a container.
 */
oQuery.pos = function (query, objarray)
{
  return oQuery(query, objarray, {single: true, index: true});
}

/**
 * Get the index of multiple objects in a container.
 */
oQuery.indexes = function (query, objarray)
{
  return oQuery(query, objarray, {index: true});
}

