/**
 * Webservice v4 backwards compatibility wrapper.
 *
 * Makes v4 support MOST v3 features that were removed or changed.
 *
 * Should only be used on legacy code.
 * To that end, it will report any deprecated method calls or
 * usages to the Javascript console. Once you've refactored your code, you
 * can stop loading this library, as it does add a bit of overhead.
 *
 * This does not guarantee 100% backwards compatibility, as if your code was
 * using any internal structures, they've all pretty much changed. It was never
 * recommended using internal structures to begin with, so refactor your code!
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

  console.log("Using WebService compat library. Look for DEPRECATED messages.");

  var wsp = Nano.WebService.prototype;
  var wsr = Nano.WebService.Request.prototype;

  function deprecated (message)
  {
    console.log("DEPRECATED", message);
  }

  // The old default for namedAlias was true.
  wsp._optionDefaults.namedAlias = true;

  // The old default for cloneData was true.
  wsp._optionDefaults.cloneData = true;

  // Add the magic 'UPLOAD' method.
  wsp._addHTTP('UPLOAD',
  {
    formData: true,
    cloneData: false,
    http: 'POST',
    _deprecated: "Using 'UPLOAD' magic HTTP method, use {http: 'POST', formData: true, cloneData: false} in your method definition instead. If you really want to keep using 'UPLOAD', add it yourself to your WebService instance with: wsInstance._addHTTP('UPLOAD', {http: 'POST', formData: true, cloneData: false});",
  });

  wsp._addHandler = function (method_name, method_handler)
  {
    deprecated("Call to _addHandler(), use _addMethod() instead.");
    return this._addMethod(method_name, method_handler);
  }

  wsr._parse_function_spec = function (spec)
  {
    var wo = this.ws._options;
    deprecated("Using raw function as method call. Use something nicer.");
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

    // We create a horrible approximation of the old request wrapper.
    var wrapper =
    {
      spec:    req,
      request: req,
      preserve: req.cloneData,
      handler: (req.onDone.length > 0 ? req.onDone[0] : undefined),
    };

    var onError = wo.onError || ws._onError;
    var onSuccess = wo.onSuccess || ws._onSuccess;

    var appendMsg = " refactor using a Response class. Note that the request wrapper is simulated, so if you depended on internal structures, things will likely be broken.";

    if (onError)
    {
      deprecated("Using 'onError' handler,"+appendMsg);
      promise.fail(function (jq, msg, http)
      {
        onError.call(ws, jq, msg, http, wrapper);
      });
    }
    else
    {
      this._attach_fail_handlers(promise);
    }

    if (onSuccess)
    {
      deprecated("Using 'onSuccess' handler,"+appendMsg);
      promise.done(function (res, msg, jq)
      {
        onSuccess.call(ws, res, msg, jq, wrapper);
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
    if ('_deprecated' in spec)
    {
      deprecated(spec._deprecated);
    }
    if ('func' in spec)
    {
      deprecated("Using 'func' in method call spec, use 'onDone' instead.");
      this.done(spec.func);
    }
    if ('keep' in spec)
    {
      deprecated("Using 'keep' in method call spec, use 'preserveClone' instead.");
      this.preserveClone = spec.keep;
    }
    if ('upload' in spec)
    {
      deprecated("Using 'upload' in method call spec, use 'onUpload' instead.");
      this.progress(spec.upload);
    }
    return this._parse_object_spec_orig(spec);
  }

  wsr._parse_string_args = function (arg)
  {
    deprecated("Passing path string directly to method call. You should be using placeholders instead.");
    this.appendPath(arg)
  }

  // We replace the build in version with a version that supports the old
  // array of path arguments option.
  wsr._parse_array_args = function (arg)
  {
    if (this.data === undefined)
    {
      this.setData(arg);
    }
    else
    {
      deprecated("Passing array of paths directly to method call. You should be using placeholders instead, or if you really need to append an arbitrary number of paths, get the Request object and call req.appendPath(paths) on it.");
      this.appendPath(arg);
    }
  }

})();