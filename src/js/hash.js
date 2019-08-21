(function()
{
  if (window.Nano === undefined)
  {
    window.Nano = {};
  }

  const JSON_ALL = /^(\[.*?\]|\{.*?\})$/;
  const JSON_ARR = /^\[.*?\]$/;
  const JSON_OBJ = /^\{.*?\}$/;

  /**
   * Nano URL Hash management class.
   *
   * You can create an instance of this for any library that uses URL
   * hashes, and it supports a wide variety of URL hash functionality.
   */
  Nano.Hash = class
  {
    /**
     * Create a URLHash instance.
     *
     * @param object options   Named options to override default functionality.
     *
     *   'shortOpt'  Allow short option fallback.
     *               See getOpt() for a description of what this does.
     *               Default: false
     *
     *   'json'      Allow JSON strings to be used (see below for values).
     *
     *   'autoArray' Use smart array format detection when serializing.
     *               Only applicable if 'json' is not false.
     *               Default: true
     *
     *   'getters'   An object that can contain the following sub-options:
     *
     *     'separate'  Split value for options (default: ';').
     *     'assign'    Split value for assignments (default: '=').
     *     'true'      Match value for true (default: /^(true|yes)$/i).
     *     'false'     Match value for false (default: /^(false|no)$/i).
     *
     *   'setters'   An object that can contain the following sub-options:
     *
     *     'separate'  String for options (default: ';').
     *     'assign'    String for assignments (default: '=').
     *     'true'      String for true (default: 'true').
     *     'false'     String for false (default: 'false').
     *
     *   'getHash'   A function to return the hash string to use.
     *               By default we return location.hash (the browser URL hash.)
     *
     *   'setHash'   A function to set the hash string to a new value.
     *               By default we set location.hash (the browser URL hash.)
     *
     * Match and Split values may be either strings or RegExps.
     *
     * The 'true' and 'false' sub-options can be set to false
     * to disable the parsing or serialization of those values.
     *
     * The 'json' option can be one of the following values.
     *
     *   false         Don't parse or serialize JSON at all (default).
     *   true          Match/serialize both arrays and objects.
     *   'array'       Match/serialize only arrays.
     *   'object'      Match/serialize only objects.
     *
     * See below for methods to change the options passed to the constructor
     * on an already initialized instance.
     */
    constructor (opts={})
    {
      this._getHash = (typeof opts.getHash === 'function') 
      ? opts.getHash 
      : function ()
      {
        return location.hash;
      }

      this._setHash = (typeof opts.setHash === 'function') 
      ? opts.setHash 
      : function (newhash)
      {
        location.hash = newhash;
      }

      this.shortOpt = (typeof opts.shortOpt === 'boolean')
      ? opts.shortOpt
      : false;

      this.autoArray = (typeof opts.autoArray === 'boolean')
      ? opts.autoArray
      : true;

      if ('json' in opts)
      { // Set the JSON parsing/serialization options.
        this.useJson(opts.json);
      }
      else
      { // Don't use JSON.
        this._json = null;
      }

      this._getters =
      { // Default getters.
        separate: ';',
        assign:   '=',
        true:    /^(true|yes)$/i,
        false:   /^(false|no)$/i,
      }

      this._setters =
      { // Default setters.
        separate: ';',
        assign:   '=',
        true:     'true',
        false:    'false',
      }

      if ('getters' in opts)
      {
        this.setGetters(opts.getters);
      }

      if ('setters' in opts)
      {
        this.setSetters(opts.setters);
      }
    }

    /**
     * Parse a URL Hash string into a query string like object.
     *
     * @param object getOpts    Options specific to this method (optional).
     *
     *   'defaults'  A pre-populated object with defaults for the hash options.
     *
     * If an option does not have an assignment, it's value will be set to null.
     */
    getOpts (getOpts={})
    {
      var hashOpts = (typeof getOpts.defaults === 'object' && getOpts.defaults !== null) ? Nano.clone(getOpts.defaults) : {};
  
      var hash = this._getHash();
  
      if (hash && hash != '#')
      { // We have a hash, let's split it up.
  
        let sep = this._getters.separate;
        let ass = this._getters.assign;
        let tv  = this._getters.true;
        let fv  = this._getters.false;
        let jc  = this._json;
  
        function getVal (input)
        {
          if (jc && input.match(jc))
          {
            let output;
            try
            {
              output = JSON.parse(decodeURI(input));
            }
            catch (e) 
            {
              console.error("Invalid JSON in URL hash", input);
            }
            return output;
          }
          if (tv && input.match(tv))
          {
            return true;
          }
          if (fv && input.match(fv))
          {
            return false;
          }
          return input;
        }

        if (hash.substr(0,1) === '#')
        { // Remove the '#' character.
          hash = hash.substr(1);
        }
        else
        { // Show a warning in the logs.
          console.error("Hash string did not start with # character");
        }
  
        let segments = hash.split(sep);
        for (let s = 0; s < segments.length; s++)
        {
          let segment = segments[s];
          let assignment = segment.split(ass);
          if (assignment.length == 1)
          { // No assignment, set value to an explicit null.
            hashOpts[segment] = null;
          }
          else if (assignment.length == 2)
          { // Assignment of a name to a value. Check for special values.
            hashOpts[assignment[0]] = getVal(assignment[1]);
          }
          else
          { // Direct multiple value assignment, no magic values.
            hashOpts[assignment[0]] = assignment.slice(1);
          }
        }
      }
  
      return hashOpts;
    }

    /**
     * Get a single Hash option.
     *
     * @param string name      The name of the option you want to find.
     * @param object getOpts   Options specific to this method (optional).
     *
     *   'default'     The default value if nothing else matches.
     *   'shortOpt'    Override the 'shortOpt' property for this call.
     *
     * If 'shortOpt' is true (either globally, or just for this call), then
     * if the named hash option isn't found, but only a single hash option was 
     * defined, we assume the hash wasn't using named options at all, 
     * and the single option was the value itself.
     *
     * Note that the getOpts are passed to getOpts() as well, so any
     * options applicable to that method may also be specified.
     */
    getOpt (name, getOpts={})
    {
      var shortOpt = 'shortOpt' in getOpts 
        ? getOpts.shortOpt
        : this.shortOpt;

      var hashOpts = this.getOpts(getOpts);

      if (hashOpts[name] !== undefined)
      { // A named option was found.
        return hashOpts[name];
      }
      else
      {
        let keys = Object.keys(hashOpts);
        if (shortOpt && keys.length == 1 && hashOpts[keys[0]] === null)
        { // Only one key, whose value is null. Return it.
          return keys[0];
        }
        else
        { // Nothing else matched, return the default.
          return getOpts.default;
        }
      }      
    }

    /**
     * Serialize an object into a URL Hash string.
     *
     * @param object obj       The object we are serializing.
     * @param object setOpts   Options specific to this method (optional).
     *
     *   'autoArray'   Override the 'autoArray' property for this call.
     *
     * @return string   The URL Hash string.
     *
     * If an array value is found, how it's handled depends on the current
     * 'json'/useJson() property value. If we aren't serializing JSON, then
     * it will expect the array to contain only strings and/or values that
     * can be converted to strings, and it will output as:
     *
     *   name=value1=value2=value3
     *
     * If we have JSON serialization enabled, then the serialization format
     * depends on if 'autoArray' is true or false.
     *
     * If 'autoArray' is true (the default), we check every member of the
     * array to see the type, if all are 'string' or 'number', we serialize
     * using the simple format above. If any value is something other than
     * a string or number, we serialize using JSON.
     *
     * If 'autoArray' is false and JSON serialization is enabled, we
     * always serialize arrays into JSON format.
     *
     * You probably don't need to run this method manually, see the
     * update() method for the more common front-end to this.
     */
    serialize (obj, setOpts={})
    {
      var autoArray = 'autoArray' in setOpts 
        ? setOpts.autoArray 
        : this.autoArray;

      var hashString = '#'; // Always start with a # character.
      var doneFirst = false;

      var sep = this._setters.separate;
      var assign = this._setters.assign;
      var tv = this._setters.true;
      var fv = this._setters.false;

      // An internal function to serialize an array using multiple assignment.
      function serializeArray (array)
      {
        let string = '';
        for (var a = 0; a < array.length; a++)
        {
          var item = array[a];
          if (typeof item === 'string' || typeof item === 'number')
          { // Only strings and numbers are stringified in simple arrays.
            string += assign + item;
          }
          else
          { // Display a warning.
            console.error("Cannot serialize item into simple array", item);
          }
        }
        return string;
      }

      for (let key in obj)
      {
        let val = obj[key];
        if (doneFirst)
        { // Add a separator.
          hashString += sep;
        }
        else
        { // Mark that we've done the first option.
          doneFirst = true;
        }
        hashString += key;
        if (val === null)
        { // Null means there's no assignment to be done.
          continue;
        }
        if (val === true && tv)
        {
          hashString += assign + tv;
        }
        else if (val === false && fv)
        {
          hashString += assign + fv;
        }
        else if (typeof val === 'object')
        {
          if (Array.isArray(val))
          { // It's an array.
            if (this.serializeJsonArray())
            { // What we do next depends on autoArray setting.
              if (autoArray)
              {
                let useJson = false;
                for (let a = 0; a < val.length; a++)
                {
                  var subval = val[a];
                  if (typeof subval !== 'string' && typeof subval !== 'number')
                  { // Found something that can't be serialized.
                    useJson = true;
                    break;
                  }
                }
                if (useJson)
                { // Serialize with JSON.
                  hashString += assign + JSON.stringify(val);
                }
                else
                { // Serialize with multiple assignment.
                  hashString += serializeArray(val);
                }
              }
              else
              { // Serialize with JSON.
                hashString += assign + JSON.stringify(val);
              }
            }
            else
            { // Serialize as a multiple assignment.
              hashString += serializeArray(val);
            }
          }
          else
          { // It's another kind of object.
            if (this.serializeJsonObject())
            {
              hashString += assign + JSON.stringify(val);
            }
            else
            {
              throw new Error("Cannot serialize object when JSON is disabled");
            }
          }
        }
        else if (typeof val === 'string' || typeof val === 'number')
        { // Assign the value directly.
          hashString += assign + val;
        }
        else
        {
          throw new Error("Invalid valid type passed to serialize()");
        }
      }

      return hashString;
    }

    /**
     * Update the referenced Hash string.
     *
     * @param object obj       The object we are saving to the hash.
     * @param object setOpts   Options to send to serialize (optional).
     *
     * @return undefined
     *
     * Serialize the object into a Hash string, then set the referenced
     * Hash to the new string. This is probably the method you want to use
     * instead of serialize().
     */
    update (obj, setOpts={})
    {
      var newstring = this.serialize(obj, setOpts);
      this._setHash(newstring);
    }

    /**
     * Set a bunch of 'getters' properties at once.
     *
     * @param object obj   The properties you want to see.
     *
     * See constructor for valid 'getters' properties.
     */
    setGetters (obj)
    {
      if (typeof obj === 'object')
      {
        for (let key in obj)
        {
          let val = obj[key];
          this.setGetter(key, val);
        }
      }
      else
      {
        throw new Error("Invalid object passed to setGetters()");
      }
    }

    /**
     * Set a bunch of 'setters' properties at once.
     *
     * @param object obj   The properties you want to see.
     *
     * See constructor for valid 'setters' properties.
     */
    setSetters (obj)
    {
      if (typeof obj === 'object')
      {
        for (let key in obj)
        {
          let val = obj[key];
          this.setSetter(key, val);
        }
      }
      else
      {
        throw new Error("Invalid object passed to setSetters()");
      }
    }

    /**
     * Set a 'getters' property.
     *
     * @param string name   The property you want to set.
     * @param mixed value   The value you want to set.
     *
     * See constructor for valid 'getters' properties and accepted values.
     */
    setGetter (name, value)
    {
      if (name === 'true' || name === 'false')
      { // Either a string, RegExp, or false.
        if (typeof value === 'string' || value === false
        || (typeof value === 'object' && value instanceof RegExp))
        {
          this._getters[name] = value;
        }
        else
        {
          throw new Error("Invalid '"+name+"' value passed to setGetter()");
        }
      }
      else if (name === 'separate' || name === 'assign')
      { // These setters must be a string or RegExp.
        if (typeof value === 'string' 
        || (typeof value === 'object' && value instanceof RegExp))
        {
          this._getters[name] = value;
        }
        else
        {
          throw new Error("Invalid '"+name+"' value passed to setGetter()");
        }
      }
      else
      {
        throw new Error("Unknown getter name '"+name+"' passed to setGetter()");
      }
    }

    /**
     * Set a 'setters' property.
     *
     * @param string name   The property you want to set.
     * @param mixed value   The value you want to set.
     *
     * See constructor for valid 'setters' properties and accepted values.
     */
    setSetter (name, value)
    {
      if (name === 'true' || name === 'false')
      { // Either a string or false.
        if (typeof value === 'string' || value === false)
        {
          this._setters[name] = value;
        }
        else
        {
          throw new Error("Invalid '"+name+"' value passed to setSetter()");
        }
      }
      else if (name === 'separate' || name === 'assign')
      { // These setters must be a string.
        if (typeof value === 'string')
        {
          this._setters[name] = value;
        }
        else
        {
          throw new Error("Invalid '"+name+"' value passed to setSetter()");
        }
      }
      else
      {
        throw new Error("Unknown setter name '"+name+"' passed to setSetter()");
      }
    }

    /**
     * Do we want to parse/serialize JSON values?
     *
     * See the constructor for valid 'json' values.
     */
    useJson (value)
    {
      if (value === false)
      { // Don't use JSON at all.
        this._json = null;
      }
      else if (value === true)
      { // Match arrays or objects.
        this._json = JSON_ALL;
      }
      else if (value === 'array')
      {
        this._json = JSON_ARR;
      }
      else if (value === 'object')
      {
        this._json = JSON_OBJ;
      }
      else
      {
        throw new Error("Invalid value passed to useJson()");
      }
    }

    /**
     * Can we serialize Arrays to JSON?
     */
    serializeJsonArray ()
    {
      return (this._json === JSON_ARR || this._json === JSON_ALL);
    }

    /**
     * Can we serialize Objects to JSON?
     */
    serializeJsonObject ()
    {
      return (this._json === JSON_OBJ || this.json === JSON_ALL);
    }

  }
})();