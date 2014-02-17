/**
 * Web Service Framework.
 *
 * I'd previously written two different web service frameworks, and this is my
 * attempt at merging them together. Common functionality is done here, and
 * then any API-specific functionality can be added in higher level classes
 * using jQuery's $.extend() function.
 *
 * TODO:
 * 
 *  - Better support for REST-based APIs:
 *    - Support URL strings like '/api/:firm/:user/details'.
 *    - Support different HTTP Methods on each call.
 *    - Backwards compatibility with existing usage.
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
 * Build the request data, based on a data object.
 */
Nano.WebService.prototype._build_request = function (data, name)
{
  var request = null;
  if (this._auto_type === true)
  { // We're encoding data in the desired format.
    var method_name = "_build_" + this._data_type + "_request";
    if (method_name in this && typeof this[method_name] === "function")
    {
      request = this[method_name](data, name);
    }
    else
    {
      console.log("Unknown data type.");
    }
  }
  else
  { // We're using jQuery's request format.
    request = data;
  }
  return request;
}

/**
 * Build the request data in "JSON" format.
 */
Nano.WebService.prototype._build_json_request = function (data, name)
{
  return JSON.stringify(data);
}

/**
 * Send a request, and return the jqXHR. If we have defined a global error 
 * handler and/or method-specific success handlers, they will be applied using
 * .fail() and .done() respectively.
 */
Nano.WebService.prototype._send_request = 
function (method_name, method_data, method_path, method_handler)
{
  if (method_data === undefined)
  {
    method_data = {};
  }
  if (this._debug && method_data)
    console.log("request_data> ", method_data);

  var request = this._build_request(method_data, method_name);
  if (request !== null || !this._auto_type)
  {
    var url = this._base_url.replace(/\/+$/, '') + '/' + method_name;
    if (method_path)
    {
      var mtype = typeof method_path;
      if (mtype === "string" || mtype == "number")
      {
        url += '/' + method_path;
      }
      else if ($.isArray(method_path))
      {
        url += '/' + method_path.join('/');
      }
    }

    var reqopts = 
    {
      type:        "POST",
      data:        request,
      url:         url,
      dataType:    this._data_type,
    };

    if (this._debug)
    {
      console.log("request> ", reqopts);
    }

    if (this._auto_type === true)
    { // Use an automatic content type based on our data type.
      reqopts.contentType = this._mime_types[this._data_type];
    }

    var response = jQuery.ajax(reqopts);

    if ('_onError' in this)
    {
      response.fail(this._onError);
    }

    if (method_handler !== undefined && typeof method_handler === "function")
    {
      if ('_onSuccess' in this)
      { // A wrapper around the handler.
        var ws = this;
        response.done(function (res, msg, jq)
        {
          ws._onSuccess(res, msg, jq, method_handler);
        });
      }
      else
      { // Call the handler directly.
        response.done(function (res, msg, jq)
        {
          method_handler(res, msg, jq);
        });
      }
    }

    return response;
  }
}

})(window, $); // End of class.


