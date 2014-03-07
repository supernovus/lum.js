/**
 * Web Service Framework.
 *
 * I'd previously written two different web service frameworks, and this is my
 * attempt at merging them together. Common functionality is done here, and
 * then any API-specific functionality can be added in higher level classes
 * using jQuery's $.extend() function.
 *
 * Requires jQuery and JSON.stringify().
 */

(function (root, $) // Set here, but we're not indenting.
{ 
  
"use strict";

if (root.Nano === undefined)
  root.Nano = {};

Nano.WebService = function (options)
{
  if (options === undefined)
    options = {};

  this._base_url  = options.url;     // Specify the base URL.

  // The data type and mime type are determined by the following options.
  // If the autoType is true, we determime the encoding method and MIME
  // type based on the data type. If it is false, we use jQuery's built in
  // request encoder, which works with PHP and a few other bindings.
  this._data_type = options.dataType ? options.dataType : 'json';
  this._auto_type = (options.autoType !== undefined) ? options.autoType : true;

  /**
   * The default HTTP methods.
   *
   * If you set 'default_http_method' it will be used by both function
   * and object defined service methods.
   *
   * Otherwise, you can set 'default_http' with 'function'
   * and 'object' properties to customize the values separately.
   *
   * The default is 'POST' for handlers defined as functions,
   * and 'GET' for handlers defined as objects (that don't override it.)
   */
  var def_http_meth = options.default_http_method;
  this._default_http = 'default_http' in options ? options.default_http :
  {
    'function' : def_http_meth ? def_http_meth : 'POST',
    'object'   : def_http_meth ? def_http_meth : 'GET',
  };

  if ('onError' in options)
  {
    this._onError = options.onError; // A global onError handler.
  }

  if ('onSuccess' in options)
  {
    this._onSuccess = options.onSuccess; // A wrapper above the handler.
  }

  if ('methods' in options)
  {
    this._methods = options.methods; // Save for later.
    for (var method_name in options.methods)
    {
      var method_handler = options.methods[method_name];
      this._addHandler(method_name, method_handler);
    }
  }

  // A data-type to MIME-type map.
  this._mime_types =
  {
    'json' : 'application/json'
  };

  // Enable debugging.
  this._debug = 'debug' in options ? options.debug : false;

}

/**
 * Create an object method to handle a known API call.
 */
Nano.WebService.prototype._addHandler = function (method_name, method_handler)
{
  if (typeof method_handler === "string")
  { // An alias.
    if (method_handler in this._methods)
    {
      this[method_name] = function (method_data, method_path)
      {
        this._send_request(method_handler, method_data, method_path, 
            this._methods[method_handler]);
      }
    }
  }
  else
  { // We create a new handler function.
    this[method_name] = function (method_data, method_path)
    {
      this._send_request(method_name, method_data, method_path, method_handler);
    }
  }
}

/**
 * Build the request object.
 *
 * This supports a wide variety of configurations, based on the many types
 * of Web Services we've designed.
 */
Nano.WebService.prototype._build_request = function (name, data, path, def)
{
  // Our request object, which we will populate as needed.
  var request = 
  {
    dataType: this._data_type, // Our data type (default is 'json'.)
  };

  // Set up our URL and HTTP method.
  var deftype = typeof def;
  var url = this._base_url.replace(/\/+$/, '');
  if (deftype === "function")
  { // Simple handler, works as it did before.
    url += '/' + name;
    request.handler = def;
    request.type    = this._default_http['function'];
  }
  else if (deftype === "object")
  {
    request.type = this._default_http.object;
    var url_path; 
    if ($.isArray(def))
    {
      if (def.length == 2)
      { // [pathspec, handler]
        url_path        = def[0];
        request.handler = def[1];
      }
      else if (def.length == 3)
      { // [httpmethod, pathspec, handler]
        request.type    = def[0];
        url_path        = def[1];
        request.handler = def[2];
      }
      else
      {
        console.log("build_request> invalid array method definition.");
        return;
      }
    }
    else
    { // { path: uri_path, func: handler_function, http: http_method}
      //   The 'http' parameter can be left off to use the default.
      if ('path' in def && 'func' in def)
      {
        url_path        = def.path;
        request.handler = def.func;
        if ('http' in def)
        {
          request.type = def.http;
        }
      }
      else
      {
        console.log("build_request> invalid object method definition.");
      }
    }

    var missing = []; // Missing parameters will mean failure.

    var self = this;

    // Okay, let's do the method substitution.
    url_path = url_path.replace(/\:([\w-]+)/g, 
    function (match, param, offset, string)
    {
      if (data && param in data)
      {
        // The parameter was found. Extract and remove it from the data.
        var value = data[param];
        delete data[param];
        return value;
      }
      else
      {
        missing.push(param);
        return '';
      }
    });

    if (missing.length > 0)
    {
      console.log("build_request> missing parameters: " + missing.join(", "));
      return;
    }

    if (url_path.substr(0, 1) != '/')
    {
      url += '/';
    }
    url += url_path;
  } // if deftype === object
  else
  {
    console.log("build_request> unsupported method definition.");
  }

  // Handle additional path information.
  if (path)
  {
    var mtype = typeof path;
    url = url.replace(/\/+$/, '')
    if (mtype === "string" || mtype === "number")
    {
      url += '/' + path;
    }
    else if ($.isArray(path))
    {
      url += '/' + path.join('/');
    }
  }

  // Okay, assign our request URL.
  request.url = url;

  // Build the request data.
  if (this._auto_type === true && data)
  { // We're encoding data in the desired format.
    var request_data = null;
    var build_data = "_build_" + this._data_type + "_request_data";
    if (build_data in this && typeof this[build_data] === "function")
    {
      request_data = this[build_data](data, name);
    }
    else
    {
      console.log("build_request> unknown data type, ignoring.");
    }

    // Set the request MIME type.
    if (request_data)
    {
      request.data        = request_data;
      request.contentType = this._mime_types[this._data_type];
    }
  }
  else if (data)
  { // We're using jQuery's request format.
    request.data = data;
  }

  return request;
}

/**
 * Build the request data in "JSON" format.
 */
Nano.WebService.prototype._build_json_request_data = function (data, name)
{
  return JSON.stringify(data);
}

/**
 * Send a request, and return the jqXHR. If we have defined a global error 
 * handler and/or method-specific success handlers, they will be applied using
 * .fail() and .done() respectively.
 */
Nano.WebService.prototype._send_request = 
function (method_name, method_data, method_path, method_def)
{
  if (this._debug && method_data)
    console.log("request_data> ", method_data);

  // The _build_request() function handles a lot of the internal details.
  var request = 
    this._build_request(method_name, method_data, method_path, method_def);

  if (!request)
  {
    console.log("send_request> request failed to be built, cannot continue.");
    return;
  }

  // Split our handler out of the request object.
  var method_handler = request.handler;
  delete request.handler;

  if (this._debug)
  {
    console.log("request> ", request);
  }

  // Send the request.
  var response = jQuery.ajax(request);

  // Create a reference to ourself to be used in callbacks.
  var ws = this;

  if (this._debug)
  {
    response.always(function (response, status, info)
    {
      console.log("response>", response, "status>", status, "info>", info);
    });
  }

  if ('_onError' in this)
  {
    response.fail(function (jq, msg, http)
    {
      ws._onError(jq, msg, http);
    });
  }

  if ('_onSuccess' in this)
  { // Send the method handler to our _onSuccess wrapper.
    response.done(function (res, msg, jq)
    {
      ws._onSuccess(res, msg, jq, method_handler);
    });
  }
  else if (typeof method_handler === "function")
  { // Call the method handler directly.
    response.done(function (res, msg, jq)
    {
      method_handler(res, msg, jq);
    });
  }

  // We return the response, so you can assign your own Promise events.
  return response;
}

})(window, jQuery); // End of class.

