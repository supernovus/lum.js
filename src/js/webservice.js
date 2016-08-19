/**
 * Web Service Framework.
 *
 * I'd previously written two different web service frameworks, and this is my
 * attempt at merging them together. Common functionality is done here, and
 * then any API-specific functionality can be added in higher level classes
 * using Nano.extend() or jQuery.extend()
 *
 * Requires jQuery, JSON and the coreutils library.
 */

(function ($) // Set here, but we're not indenting.
{ 
  
"use strict";

if (window.Nano === undefined)
{
  console.log("fatal error: Nano core not loaded");
  return;
}

Nano.WebService = function (options)
{
  if (options === undefined)
    options = {};

  this._base_url = options.url;     // Specify the base URL.
  if (this._base_url === true)
  { // We'll use the current URL as a base for the rest.
    this._base_url = document.URL.split('#')[0];
  }

  // The data type and mime type are determined by the following options.
  // If the autoType is true, we determime the encoding method and MIME
  // type based on the data type. If it is false, we use jQuery's built in
  // request encoder, which works with PHP and a few other bindings.
  // If autoGet is true (new default) then if the request type is GET, we
  // force the use of the jQuery request encoder instead of the one used for
  // PUT, POST, etc.
  this._data_type = options.dataType ? options.dataType : 'json';
  this._auto_type = (options.autoType !== undefined) ? options.autoType : true;
  this._auto_get  = (options.autoGet  !== undefined) ? options.autoGet  : true;

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

  if ('reqOptions' in options)
  {
    this._request_options = options.reqOptions;
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
        var mspec =
        {
          name: method_handler,
          data: method_data,
          def:  this._methods[method_handler],
          path: method_path,
        };
        return this._send_request(mspec);
      }
    }
  }
  else
  { // We create a new handler function.
    this[method_name] = function (method_data, method_path)
    {
      var mspec =
      {
        name: method_name,
        data: method_data,
        def:  method_handler,
        path: method_path,
      };
      return this._send_request(mspec);
    }
  }
}

/**
 * Build the request object.
 *
 * This supports a wide variety of configurations, based on the many types
 * of Web Services we've designed.
 */
Nano.WebService.prototype._build_request = function (method_spec)
{
  var name = method_spec.name;
  var data = method_spec.data;
  var path = method_spec.path;
  var def  = method_spec.def;

  // The top level request wrapper.
  var wrapper = 
  {
    spec: method_spec, // keep a reference to the original spec.
  };

  // Our AJAX request parameters, which we will populate as needed.
  var request = wrapper.request =
  {
    dataType: this._data_type, // Our data type (default is 'json'.)
  };

  // Set up our URL and HTTP method.
  var deftype = typeof def;
  var url = this._base_url.replace(/\/+$/, '');
  if (deftype === "function")
  { // Simple handler, works as it did before.
    url += '/' + name;
    wrapper.handler = def;
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
        var subdeftype = typeof def[1];
        if (subdeftype === 'string')
          request.type  = def[1];
        else if (subdeftype === 'function')
          wrapper.handler = def[1];
      }
      else if (def.length == 3)
      { // [httpmethod, pathspec, handler]
        request.type    = def[0];
        url_path        = def[1];
        wrapper.handler = def[2];
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
      if ('path' in def)
      {
        url_path        = def.path;
        if ('func' in def)
        {
          wrapper.handler = def.func;
        }
        if ('http' in def)
        {
          request.type = def.http;
        }
        if ('keep' in def)
        {
          wrapper.preserve = def.keep;
        }
      }
      else
      {
        console.log("build_request> invalid object method definition.");
      }
    }

    var missing = []; // Missing parameters will mean failure.

    var self = this;

    // We want a copy of the data, so we don't modify the original.
    if (data !== undefined && data !== null)
      data = Nano.clone(data, wrapper.preserve);

    // Okay, let's do the method substitution.
    url_path = url_path.replace(/\:([\w-]+)/g, 
    function (match, param, offset, string)
    {
      if (data && data[param] !== undefined)
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

  // If we have request_options, added them now.
  if (this._request_options)
  {
    for (var opt in this._request_options)
    {
      request[opt] = this._request_options[opt];
    }
  }

  // Handle additional path information.
  if (path)
  {
    var mtype = typeof path;
    if (mtype === "string" || mtype === "number")
    { // Append to the URL.
      url = url.replace(/\/+$/, '');
      url += '/' + path;
    }
    else if ($.isArray(path))
    { // Append each element to the URL.
      url = url.replace(/\/+$/, '');
      url += '/' + path.join('/');
    }
    else if (mtype === "object")
    { // Named options to be added directly to the request.
      for (var opt in path)
      {
        request[opt] = path[opt];
      }
    }
  }

  // Okay, assign our request URL.
  request.url = url;

  // Build the request data.
  if (this._auto_type === true && data)
  { // We're encoding data in the desired format.
    if (this._auto_get === true && request.type == 'GET')
    { // Use the jQuery request data format.
      request.data = data;
    }
    else
    { // Auto-content generation.
      var noEmpty = (request.type == 'GET' || request.type == 'DELETE')
        ? true : false;
      var request_data = null;
      var build_data = "_build_" + this._data_type + "_request_data";
      if (build_data in this && typeof this[build_data] === "function")
      {
        request_data = this[build_data](data, wrapper, noEmpty);
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
  }
  else if (data)
  { // We're using jQuery's request format.
    request.data = data;
  }

  return wrapper;
}

/**
 * Build the request data in "JSON" format.
 */
Nano.WebService.prototype._build_json_request_data = 
function (indata, wrapper, noEmpty)
{
  var outdata = JSON.stringify(indata);
  if (noEmpty)
  {
    if (outdata == '{}' || outdata == '[]' || outdata == 'null')
    {
      return null;
    }
  }
  return outdata;
}

/**
 * Send a request, and return the jqXHR. If we have defined a global error 
 * handler and/or method-specific success handlers, they will be applied using
 * .fail() and .done() respectively.
 */
Nano.WebService.prototype._send_request = function (method_spec)
{
  if (this._debug)
    console.log("request_spec> ", method_spec);

  // The _build_request() function handles a lot of the internal details.
  var request_def = this._build_request(method_spec);

  if (!request_def)
  {
    console.log("send_request> request failed to be built, cannot continue.");
    return;
  }

  // Split our handler and request objects out.
  var method_handler = request_def.handler;
  var request        = request_def.request;

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
      ws._onError(jq, msg, http, request_def);
    });
  }

  if ('_onSuccess' in this)
  { // Send the method handler to our _onSuccess wrapper.
    // It can get the request_def.handler to process it further.
    response.done(function (res, msg, jq)
    {
      ws._onSuccess(res, msg, jq, request_def);
    });
  }
  else if (typeof method_handler === "function")
  { // Call the method handler directly.
    response.done(function (res, msg, jq)
    {
      method_handler(res, msg, jq, request_def);
    });
  }

  // We return the response, so you can assign your own Promise events.
  return response;
}

})(jQuery); // End of class.

