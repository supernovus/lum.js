/*
 * Nano Webservice Framework v4.
 *
 * A modular client library for working with web services.
 *
 * Can have multiple transport libraries.
 * Can have multiple data formats.
 * Can have multiple request and response types.
 * Can be extended by plugins, and/or sub-classes.
 *
 * See webservice/compat.js for backwards compatibility with v3.
 *
 */

(function (Nano)
{
  "use strict";

  if (Nano === undefined)
  {
    throw new Error("Missing Lum core");
  }

  Nano.needLibs('helpers');

  Nano.markLib('webservice');

  /**
   * Build a WebService instance.
   */  
  Nano.WebService = class 
  {
    constructor (options)
    {
      options = this._loadOptions(options);
  
      if (typeof options.requestClass !== 'function' 
        || typeof options.requestClass.prototype.send !== 'function')
      {
        throw new Error("Invalid 'requestClass' passed to Webservice");
      }
  
      var transport = options.transportClass;
      if (typeof transport === 'function')
      {
        transport = new transport(this);
      }
  
      if (typeof transport !== 'object' 
        || typeof transport.sendRequest !== 'function')
      {
        throw new Error("Invalid 'transportClass' passed to Webservice");
      }
  
      this._transport = transport;
  
      this._options = options;
      this._debug = options.debug;
  
      if ('customHTTP' in options)
      { // Add some custom HTTP methods to our list of detected strings.
        if (Array.isArray(options.customHTTP))
        { // Flat list, no options by default.
          for (let m in options.customHTTP)
          {
            this._addHTTP(options.customHTTP[m]);
          }
        }
        else if (typeof options.customHTTP === 'object')
        { // Any other object should have options specified.
          for (let meth in options.customHTTP)
          {
            let methOpts = options.customHTTP[meth];
            this._addHTTP(meth, methOpts);
          }
        }
        else
        {
          throw new Error("Invalid customHTTP property: "+JSON.stringify(options.customHTTP));
        }
      }

      if ('useQueryString' in options 
        && typeof options.useQueryString === 'object'
        && options.useQueryString.length
      )
      {
        let methOpts = this._http_method_options;
        for (let i = 0; i < options.useQueryString.length; i++)
        {
          let methName = options.useQueryString[i];
          if (!(methName in methOpts))
          {
            methOpts[methName] = {};
          }
          methOpts[methName].useQueryString = true;
        }
      }
  
      if (options.url === true)
      { // A bit of magic, if options.url is true, we use the current URL.
        // We strip the query string and location hash.
        options.url = document.URL.split('#')[0];
        if (options.urlStripQuery)
          options.url = options.url.split('?')[0];
      }
  
      if ('methods' in options)
      { // We're pre-defining some methods.
        for (var method_name in this._options.methods)
        {
          var method_handler = options.methods[method_name];
          this._addMethod(method_name, method_handler);
        }
      }
    }
  
    /**
     * Add a custom HTTP method, or override HTTP method options.
     */
    _addHTTP (name, options)
    {
      let known = this._known_http_methods;
      let httpOpts = this._http_method_options;

      if (known.indexOf(name) === -1)
      {
        known.push(name);
      }

      if (typeof options === 'object' && options !== null)
      {
        httpOpts[name] = options;
      }
    }
  
    /**
     * Load options, applying defaults. 
     */
    _loadOptions (specified)
    {
      var options = {}, key, defaults = this._optionDefaults;
  
      for (key in defaults)
      {
        options[key] = defaults[key];
      }
  
      for (key in specified)
      {
        options[key] = specified[key];
      }
  
      return options;
    }
  
    /**
     * Add a method to handle a known API call.
     */
    _addMethod (method_name, method_handler, save_spec)
    {
      if (typeof method_handler === 'string')
      { // Adding an alias using the default 'namedAlias' setting.
        return this._addAlias(method_name, method_handler);
      }
      else if (typeof method_handler === 'object' && method_handler.alias)
      { // Adding an alias with specific settings.
        var target_name, is_named;
        if (typeof method.handler.alias === 'string')
        { // Using the default 'namedAlias' setting.
          target_name = method_handler.alias;
        }
        else if (typeof method.handler.alias.name === 'string' 
          && typeof method.handler.alias.named === 'boolean')
        { // Using an explicit 'named' option.
          target_name = method_handler.alias.name;
          is_named = method.handler.alias.named;
        }
        else
        {
          throw new Error("Invalid 'alias' method spec: "+JSON.stringify(method_handler));
        }
        // If we reached here, add the alias.
        return this._addAlias(method_name, target_name, is_named);
      }
      else
      { // Anything else is an actual method definition, not an alias.
        this[method_name] = function ()
        {
          var mcall =
          {
            name: method_name,
            args: Array.prototype.slice.apply(arguments),
            spec: method_handler,
          };
          return this._makeRequest(mcall);
        }
        if (save_spec)
        { // Save the spec to the options (if it isn't there already.)
          if (this._options.methods === undefined)
          {
            this._options.methods = {};
          }
          if (this._options.methods[method_name] === undefined)
          {
            this._options.methods[method_name] = method_handler;
          }
        }
      }
    }
  
    /**
     * Add an alias. May be a simple alias, or a named alias.
     */
    _addAlias (alias_name, target_name, is_named)
    {
      if (typeof is_named !== 'boolean')
      {
        is_named = this._options.namedAlias;
      }
      if (is_named)
      { // Use a named alias. It uses the spec, but has it's own name.
        if (this._options.methods === undefined 
          || this._options.methods[target_name] === undefined)
        {
          throw new Error("Tried to create named alias with no corresponding method definition in the options.");
        }
        this[alias_name] = function ()
        {
          var mcall =
          {
            name: alias_name,
            args: Array.prototype.slice.apply(arguments),
            spec: this._options.methods[target_name],
          };
          return this._makeRequest(mcall);
        }
      }
      else
      { // Use a simple alias. This maps the function directly.
        if (typeof this[target_name] !== 'function')
        {
          throw new Error("Tried to create simple alias to non-existent method.");
        }
        this[alias_name] = this[target_name];
      }
    }
  
    /**
     * Update the base URL.
     */
    _setURL (new_url)
    {
      this._options.url = new_url;
    }
  
    /**
     * Build a Request object, and possibly send it.
     *
     * This isn't typically called manually, but is used when we call a method
     * that was added by 'addMethod' or 'addAlias'.
     *
     * The return value depends on if is sent or not.
     *
     * If it is sent, we return the response from request.send();
     * If it's not sent, we return the Request.
     *
     */
    _makeRequest (request_opts)
    {
      if (this._debug)
        console.debug("makeRequest", request_opts);
  
      var request = this._buildRequest(request_opts);
  
      if (request.sendImmediately)
      { // We want to run the request.send() method now, and return the Response.
        return request.send();
      }
      else
      { // Return the Request object itself for further processing.
        return request;
      }
    }
  
    /**
     * Build a request object, and return it.
     *
     * This is not typically called manually, but is used by _makeRequest().
     *
     * @param object request_opts  The options to pass to the Request class.
     * @return object The request instance.
     */
    _buildRequest (request_opts)
    {
      return new this._options.requestClass(request_opts, this);
    }
  
    /**
     * Get a response and send it to the client.
     *
     * This is generally not called manually, but from Response.send().
     *
     * @param object transport_response The response from the transport.
     * @param object request  The request object that called this.
     *
     * @return object The responseClass instance, or transport_response.
     *
     * If responseClass or wrapResponse are set in the Request instance, those
     * will be used, otherwise if they are set in the WebService options, those
     * will be used. 
     *
     * The responseClass is processed first, so if both responseClass and
     * wrapResponse are set, the wrapResponse function will be passed the
     * responseClass instance.
     *
     * If neither of those are set, the transport_response is returned unchanged.
     */
    _buildResponse (transport_response, request)
    {
      var respClass = (request.responseClass !== undefined)
        ? request.responseClass
        : this._options.responseClass;
  
      var respFunc = (request.wrapResponse !== undefined)
        ? request.wrapResponse
        : this._options.wrapResponse;
  
      if (typeof respClass === 'function')
      { 
        var resp_instance = new respClass(transport_response, request, this);
        if (typeof respFunc === 'function')
        {
          return respFunc.call(this, resp_instance, request);
        }
        else
        {
          return resp_instance;
        }
      }
      else
      {
        if (typeof respFunc === 'function')
        {
          return respFunc.call(this, transport_response, request);
        }
        else
        {
          return transport_response;
        }
      }
    }

    static join_path (path1, path2)
    {
      return path1.replace(/\/+$/, '') + '/' + path2.replace(/^\/+/,'');
    }

  } // class Nano.WebService

  var wsp = Nano.WebService.prototype;

  /**
   * A dataType to MIME-type map. Feel free to populate with more values.
   */
  wsp._mime_types =
  {
    json: 'application/json',
  }

  /**
   * HTTP methods we detect in array-style method definitions.
   */
  wsp._known_http_methods =
  [
    'GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS', 'PATCH',
  ];

  /**
   * Extra properties to set when using certain HTTP methods.
   */
  wsp._http_method_options =
  {
    GET:
    {
      useQueryString: true,
    },
    HEAD:
    {
      useQueryString: true,
    },
  };

  /**
   * Default options, used by _loadOptions() method.
   *
   * We add extra values to this further down.
   */
  wsp._optionDefaults =
  {
    url: true,            // If no base URL passed, generate one.
    dataType: 'json',     // Use JSON as our default data type.
    responseClass: null,  // Response class to return from web service calls.
    wrapResponse: null,   // Function to pass response through.
    namedAlias: false,    // If true, use named aliases instead of simple.
    debug: false,         // If true, enable debugging.
    urlStripQuery: true, // If true, strip query string from URL.

  }

  let join_path = Nano.WebService.join_path;

  /**
   * An object representing a request.
   *
   * @param object request_opts  An object with a few properties (see below.)
   * @param object webservice  The Webservice instance that spawned us.
   */
  Nano.WebService.Request = class
  {
    constructor (request_opts, webservice)
    {
      if (request_opts.name === undefined
        || request_opts.args === undefined
        || request_opts.spec === undefined)
      {
        throw new Error("Invalid Request options passed");
      }
  
      this.ws = webservice;
      this.name = request_opts.name;
      this.data = undefined;
      this.path = '';
      this.opts = {};
      this.onDone = [];
      this.onFail = [];
      this.onUpload = [];
      this.parsePath = true;
      this.formData = false;
  
      // Parse options, and set our defaults.
      this._parse_opts(request_opts);
  
      // Parse the method call spec.
      this._parse_spec(request_opts.spec);
  
      // Parse arguments passed to webservice method.
      this._parse_args(request_opts.args);
    }
  
    _addCallbacks (slot, callbacks)
    {
      if (typeof this[slot] !== 'object' || !Array.isArray(this[slot]))
      {
        throw new Error("Invalid slot sent to _addCallback: "+slot);
      }
      if (Array.isArray(callbacks))
      {
        for (var i = 0; i < callbacks.length; i++)
        {
          this[slot].push(callbacks);
        }
      }
      else if (typeof callbacks === 'function')
      {
        this[slot].push(callbacks);
      }
    }
  
    /**
     * Add to our onDone callbacks.
     */
    done (callbacks)
    {
      this._addCallbacks('onDone', callbacks);
      return this;
    }
  
    /**
     * Add to our onFail callbacks.
     */
    fail (callbacks)
    {
      this._addCallbacks('onFail', callbacks);
      return this;
    }
  
    /**
     * Add to our onUpload callbacks.
     */
    progress (callbacks)
    {
      this._addCallbacks('onUpload', callbacks);
      return this;
    }
  
    /**
     * Parse options and defaults.
     */
    _parse_opts (request_opts)
    {
      var wo = this.ws._options;
  
      this.dataType = wo.dataType
  
      // Default HTTP method if it's not specified in the spec.
      this.http = (wo.defaultHTTP !== undefined)
        ? wo.defaultHTTP
        : 'GET';
  
      // Default value of sendImmediately. This may be changed in the args.
      this.sendImmediately = (wo.sendImmediately !== undefined)
        ? wo.sendImmediately
        : true;
  
      // Attach handlers before or after response class is processed?
      this.attachBefore = (wo.attachBefore !== undefined)
        ? wo.attachBefore
        : false;
  
      // Clone the data sent to the method call?
      this.cloneData = (wo.cloneData !== undefined)
        ? wo.cloneData
        : false;
  
      // If cloning, what preserve options should we send?
      this.preserveClone = (wo.preserveClone !== undefined)
        ? wo.preserveClone
        : false;

      this.useQueryString = (wo.useQueryString !== undefined)
        ? wo.useQueryString
        : false;
  
      if (typeof wo.reqOptions === 'object')
      { // Add global request options.
        this.setOpts(wo.reqOptions);
      }
    }
  
    /**
     * Set the data.
     */
    setData (data)
    {
      if (this.cloneData)
      {
        data = Nano.clone(data, this.preserveClone);
      }
      this.data = data;
    }
  
    /**
     * Set options.
     */
    setOpts (opts)
    {
      for (var opt in opts)
      {
        this.opts[opt] = opts[opt];
      }
    }
  
    /**
     * Append item(s) to the request path.
     *
     * @param (string|array) String(s) to add to path.
     */
    appendPath (path)
    {
      this.path = join_path(this.path, 
        (Array.isArray(path) ? path.join('/') : path));
    }
  
    /**
     * Parse arguments passed to the Request method call.
     */
    _parse_args (args)
    { 
      if (args.length === 0) return;
      for (var i = 0; i < args.length; i++)
      {
        var arg = args[i];
        var atype = typeof arg;
        if (atype === 'object' && Array.isArray(arg))
        {
          atype = 'array';
        }
        var ameth = '_parse_'+atype+'_args';
        if (typeof this[ameth] === 'function')
        {
          this[ameth](arg);
        }
        else
        {
          console.error("Ignoring "+atype+" argument passed to "+this.name+'()');
        }
      }
    }
  
    /**
     * Parse an object argument.
     *
     * This does a bit of magic, based on the assumption that our data should
     * usually be an object (if it isn't set sendImmediately to false and 
     * populate the data manually.)
     *
     * If our data is undefined, the object will be assigned to the data.
     * If we already have data, the object will be assumed to be transport
     * request options, and all properties will be copied to our 'opts'.
     */
    _parse_object_args (arg)
    {
      if (this.data === undefined)
      { // No data has been set, assume this is the data.
        this.setData(arg);
      }
      else
      { // Assume transport request options.
        this.setOpts(arg);
      }
    }
  
    /**
     * Parse an array argument.
     */
    _parse_array_args (arg)
    {
      if (this.data === undefined)
      {
        this.setData(arg);
      }
      else
      {
        console.warn("Unknown array argument passed after data has been set, skipping.");
      }
    }
  
    /**
     * A function argument is assumed to be an onDone callback.
     */
    _parse_function_args (arg)
    {
      this.done(arg);
    }
  
    /**
     * A boolean argument is assumed to override the 'sendImmediately' option.
     */
    _parse_boolean_args (arg)
    {
      this.sendImmediately = arg;
    }
  
    /**
     * Build request specifics from a spec document in various formats.
     */
    _parse_spec (spec)
    {
      var stype = typeof spec;
      if (stype === 'object' && Array.isArray(spec))
      {
        stype = 'array';
      }
      var smeth = '_parse_'+stype+'_spec';
      if (typeof this[smeth] === 'function')
      {
        this[smeth](spec);
      }
      else
      {
        throw new Error("Cannot build request from a "+stype+" spec");
      }
    }
  
    /**
     * Parse Array method specs.
     */
    _parse_array_spec (spec)
    {
      var knownHttp = this.ws._known_http_methods;
      for (var i = 0; i < spec.length; i++)
      {
        var opt = spec[i];
        var otype = typeof opt;
        if (otype === 'string')
        { // A string, might be an HTTP method, or a path.
          if (knownHttp.indexOf(opt) !== -1)
          { // It's a known HTTP method.
            this.setMethod(opt);
          }
          else
          { // It's a path.
            this.appendPath(opt);
          }
        }
        else if (otype === 'function')
        { // Assume it's an onDone event handler.
          this.done(opt);
        }
  
      }
    }
  
    /**
     * Parse object method specs.
     */
    _parse_object_spec (spec)
    {
      if ('http' in spec)
      { // Set the HTTP method, handling magic methods automatically.
        this.setMethod(spec.http);
      }
      if ('path' in spec)
      {
        this.appendPath(spec.path);
      }
      if ('onDone' in spec)
      {
        this.done(spec.onDone);
      }
      if ('onFail' in spec)
      {
        this.fail(spec.onFail);
      }
      var opts = 
      [
        'cloneData', 'preserveClone', 'attachBefore', 'sendImmediately',
        'parsePath', 'responseClass', 'wrapResponse', 'contentType', 
        'formData',  'useQueryString',
      ];
      for (var i in opts)
      {
        var opt = opts[i];
        if (opt in spec)
        {
          this[opt] = spec[opt];
        }
      }
      if (this.formData && 'onUpload' in spec)
      {
        this.progress(spec.onUpload);
      }
      if ('reqOptions' in spec)
      { // Set additional request options.
        this.setOpts(spec.reqOptions);
      }
    }
  
    /**
     * Set the HTTP method.
     */
    setMethod (http)
    {
      this.http = http;
      var opts = this.ws._http_method_options;
      if (typeof opts[http] === 'object')
      { // Add any extra options specific to this HTTP type.
        this._parse_object_spec(opts[http]);
      }
    }
  
    /**
     * Send the request using the transport class.
     */
    send ()
    {
      var transport = this.ws._transport;
      var promise = transport.sendRequest(this);
      if (this.attachBefore)
      {
        this._attach_handlers(promise);
      }
      promise = this.ws._buildResponse(promise, this);
      if (!this.attachBefore)
      {
        this._attach_handlers(promise);
      }
      return promise;
    }
  
    /**
     * Attach our event handlers directly to the promise.
     */
    _attach_handlers (promise)
    {
      this._attach_fail_handlers(promise);
      this._attach_done_handlers(promise);
    }
  
    _attach_done_handlers (promise)
    {
      if (this.onDone.length > 0 && typeof promise.done === 'function')
      {
        for (var i = 0; i < this.onDone.length; i++)
        {
          promise.done(this.onDone[i]);
        }
      }
    }
  
    _attach_fail_handlers (promise)
    {
      if (this.onFail.length > 0 && typeof promise.fail === 'function')
      {
        for (var i = 0; i < this.onFail.length; i++)
        {
          promise.fail(this.onFail[i]);
        }
      }
    }
  
    /**
     * Get our URL path.
     */
    getPath ()
    {
      var base_url = this.ws._options.url;
      var url_path = this.path;
      if (this.parsePath)
      {
        var self = this;
        var missing = [];
        url_path = url_path.replace(/\:([\w-]+)/g, 
        function (match, param, offset, string)
        {
          if (self.data && self.data[param] !== undefined)
          {
            // The parameter was found. Extract and remove it from the data.
            var value = self.data[param];
            delete self.data[param];
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
          throw new Error("Missing URL parameters: "+missing.join(", "));
        }
      }
      return join_path(base_url, url_path);
    }
  
    /**
     * Get our data in the desired format.
     */
    getData ()
    {
      if (this.formData)
      {
        return this._build_request_form_data();
      }
      else
      {
        var buildOpts = this._get_build_options();
        var buildFunc = "_build_" + this.dataType + "_request_data";
        if (typeof this[buildFunc] === 'function')
        {
          return this[buildFunc](buildOpts);
        }
        else
        {
          throw new Error("Unhandled dataType: "+this.dataType);
        }
      }
    }
  
    _get_build_options ()
    {
      var options =
      {
        noEmpty: (this.http == 'GET' || this.http == 'DELETE'),
      };
      return options;
    }
  
    _build_request_form_data (data)
    {
      if (window.FormData === undefined)
      {
        throw new Error("Missing FormData API");
      }
      if (data === undefined)
      {
        data = this.data;
      }
      var fdata = new FormData();
      for (var key in data)
      {
        fdata.append(key, data[key]);
      }
      return fdata;
    }
  
    _build_json_request_data (options)
    {
      var json;
      if (typeof this.data === 'string')
      { // Assume JSON data.
        json = this.data;
      }
      else
      { // Stringify the data.
        json = JSON.stringify(this.data);
      }
      if (options.noEmpty)
      {
        if (json == '{}' || json == '[]' || json == 'null')
        { // Don't return JSON representing empty objects.
          return;
        }
      }
      return json;
    }
  
    /**
     * Get our Content-Type from our data type.
     */
    getContentType ()
    {
      if (this.contentType !== undefined)
      { // Explicitly set content type.
        return this.contentType;
      }
      else
      { // Get the content type from our data type.
        var mtypes = this.ws._mime_types;
        return mtypes[this.dataType];
      }
    }

  } // class Nano.WebService.Request

  Nano.WebService.jQueryTransport = class
  {
    constructor (ws)
    {
      if (window.jQuery === undefined)
      {
        throw new Error("Cannot use jQueryTransport without jQuery");
      }
      this.ws = ws;
      this.jq = jQuery;
    }
  
    sendRequest (request)
    {
      var reqopts = this._build_request_opts(request);
      if (this.ws._debug)
      {
        console.debug("sendRequest", reqopts);
      }
      return this.jq.ajax(reqopts);
    }
  
    _build_request_opts (request)
    {
      var reqopts = Nano.clone(request.opts);
  
      reqopts.type = request.http;
  
      if (reqopts.dataType === undefined && !request.formData)
      {
        reqopts.dataType = request.dataType;
      }
  
      // Set the URL.
      reqopts.url = request.getPath();
  
      if (request.useQueryString)
      { // Using the data directly, which will turn it into a query string.
        reqopts.data = request.data;
      }
      else
      { // Build the data in the appropriate format.
        reqopts.data = request.getData();
        if (request.formData)
        { // If we're using formData, there's a few other options to set.
          reqopts.contentType = false;
          reqopts.processData = false;
        }
        else
        { // Not using formData, so set the Content-Type header.
          reqopts.contentType = request.getContentType();
        }
        if (request.onUpload.length > 0)
        {
          reqopts.xhr = function ()
          {
            var xhr = jQuery.ajaxSettings.xhr();
            if (xhr.upload)
            {
              for (var i = 0; i < request.onUpload.length; i++)
              {
                var callback = request.onUpload[i];
                xhr.upload.addEventListener('progress', callback, false)
              }
            }
            return xhr;
          }
        }
      }
      
      return reqopts;
    }

  } // class Nano.WebService.jQueryTransport

  // TODO: Add transport for 'fetch' using Nano.Promise for Deferred object.
  // TODO: Add transports for other common transports in plugin files.

  /**
   * Here we set the default 'requestClass' to Nano.WebService.Request
   */
  wsp._optionDefaults.requestClass = Nano.WebService.Request;

  /**
   * And we set the default 'transportClass' to Nano.WebService.jQueryTransport
   *
   * In the future we should detect what features are available and auto-select
   * an appropriate transport based on that. Users can always override it.
   */
  wsp._optionDefaults.transportClass = Nano.WebService.jQueryTransport;

})(window.Lum);