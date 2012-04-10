/**
 * Session State Storage
 *
 * Javascript client facing side.
 * See Nano.php's "lib/nano3/state.php" for the server facing side.
 */

function StateStore (url)
{
  this.url = url;    // The URL to our session state service.
  this.data = null;  // Results of the last request.
  this.xhr  = null;  // The jqXHR returned from the last request.
}

/**
 * Our default callback helper.
 * Sets our own data property to the results returned by the service.
 */
StateStore.prototype.callback = function (data)
{
  this.data = data;
  return this;
}

/**
 * Send a request. 
 * We can set fields, and get fields, in a single request.
 * The 'get' requests can have default values which will be returned
 * if the field does not exist within the storage object.
 *
 * You can use the full get_ and set_ names, or you can include
 * 'get' and 'set' objects which will be changed to the prefixed names.
 *
 * E.g.
 *
 *  results = service.request
 *  (
 *    {
 *      "get" : {"id":0, "type":"field"}, 
 *      "set" : {"tz":tzone}
 *    }
 *  );
 *
 *  Is the same as (and will be converted to):
 *
 *  results = service.request
 *  (
 *    {
 *      "get_id"   : 0,
 *      "get_type" : "field",
 *      "set_tz"   : tzone
 *    }
 *  );
 *
 *  Which form you want to use, is up to you.
 */
StateStore.prototype.request = function (opts)
{
  if (opts.get !== null)
  {
    for (var key in opts.get)
    {
      var val = opts.get[key];
      opts["get_"+key] = val;
    }
    delete opts.get;
  }
  if (opts.set !== null)
  {
    for (var key in opts.set)
    {
      var val = opts.set[key];
      opts["set_"+key] = val;
    }
    delete opts.set;
  }

  // Send the request.
  this.xhr = $.getJSON(this.url, opts, this.callback);
  return this.data;
}

/**
 * A wrapper to get a single value.
 */
StateStore.prototype.get = function (key, defval)
{
  var keyname = "get_" + key;
  var opts = {keyname : defval};
  this.request(opts);
  return this.data[key];
}

/**
 * A wrapper to set a single value.
 */
StateStore.prototype.set = function (key, val)
{
  var keyname = "set_" + key;
  var opts = {keyname : val};
  this.request(opts);
  return this;
}

