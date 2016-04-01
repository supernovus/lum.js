(function($)
{
  "use strict";

  if (window.Nano === undefined)
  {
    console.log("fatal error: Nano core not loaded");
    return;
  }

  if (!Nano.hasNamespace('Nano.ModelAPI'))
  {
    console.log("fatal error: Nano.ModelAPI not loaded");
    return;
  }

  /**
   * Load a JSON data structure using all kinds of data sources.
   *
   * @param str     name     The name of the model container.
   * @param object  source   Rules for building the model container.
   *
   * Source rules:
   *
   *  'getdata'        Options for getting the data.
   *                   This will have 'name', 'source', and 'parent'
   *                   properties added to it, so don't define those.
   *
   *    'function'     A function/closure to retreive the data.
   *
   *    'method'       A method in the API subclass to retreive the data.
   *
   *    If no 'function' or 'method' are passed, then the
   *    '_default_get_json' method will be used.
   *
   *  'extend'         Options for extending our JSON data.
   *                   This will have 'name', 'source', 'parent', and 'data'
   *                   properties added to it, so don't define those.
   *                   It can have one of 'class', 'function' or 'method' to
   *                   determine the technique we'll use to extend the data.
   *
   *    'class'          A class to wrap around the data.
   *
   *    'function'       A function/closure that returns the extended data.
   *
   *    'method'         A method in the API subclass that returns the data.
   *
   *    If none of 'class', 'function', or 'method' are passed, then the
   *    '_default_extend_json' method will be used.
   *
   * The object returned from any of the extention options must support
   * a save() method, that should support: object.save({changed: false}) 
   * which should tell the model container to save any changes without sending
   * a change notification event.
   */
  Nano.ModelAPI.prototype._load_extjson_model = function (name, source)
  {
    var jsondata;
    var getopts = 'getdata' in source ? source.getdata : {};
    getopts.name   = name;
    getopts.source = source;
    getopts.parent = this;

    if ('function' in getopts)
    { // A custom function or closure.
      var func = getopts.function;
      jsondata = func(getopts);
    }
    else if ('method' in getopts)
    { // A custom method.
      jsondata = this[getopts.method](getopts);
    }
    else
    { // Use the default method.
      jsondata = this._default_load_json_element(getopts);
    }

    if (jsondata !== undefined)
    {
      // Options to extend our model data with.
      var extendopts = 'extend' in source ? source.extend : {};
      extendopts.name    = name;
      extendopts.source  = source;
      extendopts.parent  = this;
      extendopts.data    = jsondata;

      if ('class' in extendopts)
      { // Use a custom class for our model data.
        var dataclass = extendopts.class;
        jsondata = new dataclass(extendopts);
      }
      else if ('function' in extendopts)
      { // Use a function to initialize our model data.
        var func = extendopts.function;
        jsondata = func(extendopts);
      }
      else if ('method' in extendopts && typeof this[extendopts.method] === 'function')
      { // Use a method in the API subclass to initialize our model data.
        jsondata = this[extendopts.method](extendopts);
      }
      else
      { // Use the default model data enhancement method.
        jsondata = this._default_extend_json(extendopts);
      }

      // We changed something, time to save.
      if (source.save_changes)
        jsondata.save({changed: false});

      // Assign it to our model structure.
      this.model[name] = jsondata;
    } // if element exists
  }

  /**
   * The default data aquisition method if no other option is supplied.
   *
   * @param object dataopts   The data aquiring options (see _load_json_model)
   *
   * Any of these options can be in the dataopts, or the dataopts.source:
   *
   *  'element'        A selector for the element containing the JSON text.
   *                   Default: '#name' where name is dataopts.name
   *
   *  'enforceObject'  If the data is an empty array, make it an object instead.
   *
   * Requires the json.jq and exists.jq jQuery extensions.
   */
  Nano.ModelAPI.prototype._default_load_json_element = function (dataopts)
  {
    var source = dataopts.source;

    var elname;
    if ('element' in dataopts)
      elname = dataopts.element;
    else if ('element' in source)
      elname = source.element;
    else
      elname = '#' + name;

    var element = $(elname);
    if (element.exists())
    {
      if (source.save === undefined)
      {
        if (source.extend === undefined)
        {
          source.extend = {save:'_default_save_json_element'};
        }
        else if (source.extend.save === undefined)
        {
          source.extend.save = '_default_save_json_element';
        }
      }
      var enforceObj = false;
      if ('enforceObject' in dataopts)
        enforceObj = dataopts.enforceObject;
      else if ('enforceObject' in source)
        enforceObj = source.enforceObject;

      this.onDebug('loadModel', '-- Loading JSON', name, elname);
      var jsondata = element.JSON();
      if (enforceObj === true)
      {
        if ($.isArray(jsondata) && jsondata.length == 0)
        {
          jsondata = {};
          source.save_changes = true;
        }
      }
      return jsondata;
    }
  }

  /**
   * The default data save method.
   */
  Nano.ModelAPI.prototype._default_save_json_element = function (dataopts)
  {
    var source   = dataopts.source;
    var jsondata = dataopts.data;

    var changeHandler;
    if ('changed' in dataopts)
      changeHandler = dataopts.changed;
    else if ('changed' in source)
      changeHandler = source.changed;

    if (sopts.target && sopts.retarget)
      elname = sopts.target;
    if (!sopts.target)
      sopts.target = elname;
    $(sopts.target).JSON(this);

    if (sopts.changed === undefined)
      sopts.changed = true;

    if (!sopts.changed) return;

    if (typeof changeHandler === 'function')
    {
      changeHandler(this, target);
    }
    else if (typeof changeHandler === 'string')
    {
      $(changeHandler).val(1);
    }
  }

  /**
   * The default extention method if no other option is supplied.
   *
   * @param object dataopts   The data extension options (see _load_json_model)
   *
   * If the dataopts or dataopts.source 
   */
  Nano.ModelAPI.prototype._default_extend_json = function (dataopts)
  {
    var source   = dataopts.source;
    var jsondata = dataopts.data;

    var saveHandler;
    if ('save' in dataopts)
      saveHandler = dataopts.save;
    else if ('save' in source)
      saveHandler = source.save;

    if (!saveHandler)
    {
      console.log("no save handler specified, cannot continue.");
      return;
    }

    // Add a special "save" function.
    Nano.addProperty(jsondata, 'save', function (sopts)
    {
      if (typeof saveHandler === 'function')
      {
        saveHandler(dataopts);
      }
      if (typeof saveHandler === 'string' && typeof this[saveHandler] === 'function')
      {
        this[saveHandler](dataopts);
      }
    });

    // Add a special "json" function. This requires the
    // format_json library to have been loaded.
    Nano.addProperty(jsondata, 'json', function (format)
    {
      var json = JSON.stringify(this);
      if (format)
        return Nano.format_json(json);
      else
        return json;
    });

    return jsondata;
  }

})(jQuery);

