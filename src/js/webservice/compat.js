/**
 * Webservice v4 backwards compatibility wrapper.
 *
 * Makes v4 support MOST v3 features that were removed or changed.
 *
 * Should only be used on legacy code.
 * To that end, it will by default report any deprecated method calls or
 * usages to the Javascript console. This can optionally be turned off, but
 * I recommend refactoring the code to use the new APIs directly instead.
 *
 * This does not guarantee 100% backwards compatibility, as some features are
 * simply not supported anymore. If your code was using really obscure features
 * that depending on certain internal structures, you'll have to fix it.
 */
(function ()
{
  "use strict";

  if (window.Nano === undefined)
  {
    throw new Error("Nano core library not loaded");
  }

  if (!Nano.hasNamespace('Nano.WebService'))
  {
    throw new Error("Missing Nano.WebService library");
  }

  var wsp = Nano.WebService.prototype;
  var wsr = Nano.WebService.Request.prototype;

  // Change this to false if you want to not show deprecation messages.
  wsp._optionDefaults.reportDeprecated = true;

  // The old default for namedAlias was true.
  wsp._optionDefaults.namedAlias = true;

  // The old default for cloneData was true.
  wsp._optionDefaults.cloneData = true;

  // Add the magic 'UPLOAD' method.
  wsp._known_http_methods.push('UPLOAD');
  wsp._http_method_options.UPLOAD =
  {
    formData: true,
    http: 'POST',
    _deprecated: "Using 'UPLOAD' magic HTTP method",
  }

  wsp._addHandler = function (method_name, method_handler)
  {
    var wo = this._options;
    if (wo.reportDeprecated)
    {
      console.log("DEPRECATED", "Call to _addHandler()");
    }
    return this._addMethod(method_name, method_handler);
  }

  wsr._parse_function_spec = function (spec)
  {
    var wo = this.ws._options;
    if (wo.reportDeprecated)
    {
      console.log("DEPRECATED", "Using raw function as method call");
    }
    this.parsePath = false;
    this.appendPath(this.name);
    if (wo.defaultHTTP === undefined)
    { // These old methods all used 'POST'.
      this.setMethod('POST');
    }
    this.done(spec);
  }

  // Save a backup copy of the original.
  wsr._attach_handlers_orig = wsr._attach_handlers;

  // We replace _attach_handlers with a new version.
  wsr._attach_handlers = function (promise)
  {
    var wo = this.ws._options;
    var ws = this.ws;
    var req = this;

    var onError = wo.onError || ws._onError;
    var onSuccess = wo.onSuccess || ws._onSuccess;

    if (onError)
    {
      if (wo.reportDeprecated)
      {
        console.log("DEPRECATED", "Using onError handler");
      }
      promise.fail(function (jq, msg, http)
      {
        onError.call(ws, jq, msg, http, req);
      });
    }
    else
    {
      this._attach_fail_handlers(promise);
    }

    if (onSuccess)
    {
      if (wo.reportDeprecated)
      {
        console.log("DEPRECATED", "Using onSuccess handler");
      }
      promise.done(function (res, msg, jq)
      {
        onSuccess.call(ws, res, msg, jq, req);
      });
    }
    else
    {
      this._attach_done_handlers(promise);
    }
  }

  // Extend the functionality of object specs for backwards compatibility.
  wsr._parse_object_spec_orig = wsr._parse_object_spec;
  wsr._parse_object_spec = function (spec)
  {
    var wo = this.ws._options;
    if ('_deprecated' in spec)
    {
      if (wo.reportDeprecated)
      {
        console.log("DEPRECATED", spec._deprecated);
      }
    }
    if ('func' in spec)
    {
      if (wo.reportDeprecated)
      {
        console.log("DEPRECATED", "Using 'func' in method call spec");
      }
      this.done(spec.func);
    }
    if ('keep' in spec)
    {
      if (wo.reportDeprecated)
      {
        console.log("DEPRECATED", "Using 'keep' in method call spec");
      }
      this.preserveClone = spec.keep;
    }
    if ('upload' in spec)
    {
      if (wo.reportDeprecated)
      {
        console.log("DEPRECATED", "Using 'upload' in method call spec");
      }
      this._addCallbacks('onUpload', spec.upload);
    }
    return this._parse_object_spec_orig(spec);
  }

  wsr._parse_string_args = function (arg)
  {
    var wo = this.ws._options;
    if (wo.reportDeprecated)
    {
      console.log("DEPRECATED", "Passing path string directly to method call");
    }
    this.appendPath(arg)
  }

  wsr._parse_array_args = function (arg)
  {
    var wo = this.ws._options;
    if (wo.reportDeprecated)
    {
      console.log("DEPRECATED", "Passing array of paths directly to method call");
    }
    this.appendPath(arg);
  }

  // TODO: add backwards compatibility code.

})();