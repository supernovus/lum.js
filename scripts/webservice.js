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

"use strict";

if (window.Nano === undefined)
{
  window.Nano = {};
}

Nano.WebService = function (options)
{
  if (options === undefined)
    options = {};

  this._base_url  = options.url;     // Specify the base URL.
  this._data_type = 'json';          // We currently only support JSON.

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

}

/**
 * Create an object method to handle a known API call.
 */
Nano.WebService.prototype._addHandler = function (method_name, method_handler)
{
  if (method_handler === true)
  { // The client can set up their own .done() routine.
    this[method_name] = function (method_data)
    {
      this._send_request(method_name, method_data);
    }
  }
  else if (typeof method_handler === "function")
  { // We have a method success handler.
    this[method_name] = function (method_data)
    {
      this._send_request(method_name, method_data, method_handler);
    }
  }
  else
  { // Sorry, we don't support aliases or other features yet.
    console.log("Unsupported method handler '"+method_name+"'.");
  }
}

/**
 * Build the request data, based on a data object.
 */
Nano.WebService.prototype._build_request = function (data)
{
  var request = null;
  if (this._data_type == 'json')
  {
    request = JSON.stringify(data);
  }
  else
  {
    console.log("Unknown data type.");
  }
  return request;
}

/**
 * Send a request, and return the jqXHR. If we have defined a global error 
 * handler and/or method-specific success handlers, they will be applied using
 * .fail() and .done() respectively.
 */
Nano.WebService.prototype._send_request = 
function (method_name, method_data, method_handler)
{
  if (method_data === undefined)
  {
    method_data = {};
  }
  var request = this._build_request(method_data, method_name);
  if (request !== null)
  {
    var url = this._base_url.replace(/\/+$/, '') + '/' + method_name;
    var response = jQuery.ajax(
    {
      type:        "POST",
      data:        request,
      url:         url,
      contentType: this._mime_types[this._data_type],
      dataType:    this._data_type,
    });
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
          method_handler(res, msg, hq);
        });
      }
    }
    return response;
  }
  return null;
}

