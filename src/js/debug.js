/**
 * A couple libraries meant for debugging web apps.
 *
 * Requirements for Lum.Debug: core observable
 *
 * Recommended for Lum.Debug: hash
 *
 * Requirements for Lum.Debug.Elements: jQuery, json.jq, exists.jq
 *
 * Recommended for Lum.Debug.Elements: format_json
 *
 */

(function ($)
{
  "use strict";

  if (window.Lum === undefined)
  {
    throw new Error("Missing Lum core");
  }

  Lum.markLib('debug');

  /**
   * A class to help with debugging.
   *
   * With the optional URL Hash setting, you can use:
   *
   *  #debug               Turns on ALL debugging ('*' flag.)
   *  #debug=flag          Turn on a single flag.
   *  #debug=flag1=flag2   Turn on multiple flags.
   * 
   * If you specify the 'hash.json' config option, you can also use:
   *
   *  #debug={"flag1":true,"flag2":false}
   * 
   */
  Lum.Debug = class
  {
    constructor(opts={})
    {
      this.showFlag = (typeof opts.showFlag === 'boolean') 
        ? opts.showFlag 
        : false;

      // Call the method to initialize or update our flags.
      this.update(opts.flags);

      if (Lum.hasLib('hash'))
      {
        if (typeof opts.hash === 'object')
        { // Might be options to build a Hash instance, or a Hash instance.
          if (opts.hash instanceof Lum.Hash)
          { // It's an existing instance.
            this.hash = opts.hash;
          }
          else
          { // Assume it's options for creating an instance.
            this.hash = new Lum.Hash(opts.hash);
          }
        }
        else
        { // Create a default Hash instance with the 'shortOpt' option.
          this.hash = new Lum.Hash({shortOpt: true});
        }
      }

      Lum.observable(this, opts.observable);
    }

    toggle(flag, toggle)
    {
      if (!flag)
      { // If flag is ommitted, toggle everything.
        for (var key in this.flags)
        {
          this.toggle(key, toggle);
        }
      }
      else if (Array.isArray(flag))
      { // An array of flags, recurse it.
        for (var t in flag)
        {
          this.toggle(flag[t], toggle);
        }
      }
      else if (typeof flag === 'string')
      { // A single flag that we're toggling.
        if (toggle === undefined || toggle === null)
        { // Invert the current setting.
          toggle = this.flags[flag] ? false : true;
        }
  
        // Update the flag setting.
        this.flags[flag] = toggle;

        this.trigger('toggle', flag, toggle);
      }
    }

    is (flag)
    {
      if ('*' in this.flags && this.flags['*'])
      { // Wildcard flag was set, all debugging is enabled.
        return true;
      }
      
      if (Array.isArray(flag))
      { // Check one of a bunch of flags.
        for (var t in flag)
        {
          if (this.is(flag[t]))
          { // One of the flags matched, we're good!
            return true;
          }
        }
        // None of the flags matched.
        return false;
      }
      else if (typeof flag === 'string' && 
          flag in this.flags && this.flags[flag])
      { // Explicit flag matched.
        return true;
      }
      return false;
    }

    when (flag)
    {
      if (this.is(flag))
      {
        var slicePos = this.showFlag ? 0 : 1;
        var args = Array.prototype.slice.call(arguments, slicePos);
        console.debug.apply(console, args);
        this.trigger('when', flag, args);
      }
    }

    update (flags)
    {
      if (flags !== undefined)
      { // Use the pre-determined values.
        this.flags = flags;
      }
      else
      { // Start with a fresh slate.
        this.flags = {};
      }

      if (!this.hash) return;
  
      var debugFlags = this.hash.getOpt('debug');
  
      if (debugFlags === undefined)
      { // Nothing found, we don't do anything.
        return; 
      }
  
      if (debugFlags === null)
      { // The null value means #debug was passed, which is an alias for '*'
        console.debug("Enabling global debugging.");
        this.toggle('*', true);
        return;
      }
  
      if (typeof debugFlags === 'string')
      { // A single flag was passed.
        this.toggle(debugFlags, true);
        return;
      }
  
      if (Array.isArray(debugFlags))
      { // Output was an array of debug flags.
        for (var k in debugFlags)
        {
          var keyword = debugFlags[k];
          console.debug("Enabling debugging on", keyword);
          this.toggle(keyword, true);
        }
        return;
      }
  
      if (typeof debugFlags === 'object')
      { // Advanced use, probably not super useful.
        for (var key in debugFlags)
        {
          var val = debugFlags[key];
          console.debug("Settings debug flag", key, val);
          this.toggle(key, val);
        }
        return;
      }
    } // update()

  } // Lum.Debug

  /**
   * A class meant for making debugging UIs.
   *
   * Not something I commonly do these days, as most browsers have pretty
   * decent consoles these days. Kept for compatibility with old code, as
   * well as cases where I might not have access to a debug console.
   */
  Lum.Debug.Elements = class
  {
    // Super simple constructor.
    constructor(opts)
    {
      for (let prop in this.constructor.defaults)
      {
        this._set_opt(prop, opts);
      }
    }

    // Internal static method to look for options, and support defaults..
    static _get_opt(opt, opts)
    {
      if (typeof opts === 'object' && opts !== null && (opt in opts))
      { // We found the option in the passed options.
        return opts[opt];
      }
      else if (opt in this.defaults)
      {
        return this.defaults[opt];
      }
    }

    // Internal class method to set a property using the _get_opt() method.
    _set_opt(opt, opts)
    {
      this[opt] = this.constructor._get_opt(opt, opts);
    }

    // Internal class method to populate opts with our properties.
    _get_opts(opts)
    {
      if (typeof opts !== 'object' || opts === null)
      { // Make an empty object.
        opts = {};
      }

      for (let prop in this.constructor.defaults)
      {
        if (!(prop in opts))
        {
          opts[prop] = this[prop];
        }
      }

      return opts;
    }

    // Internal method for field() and element() to use for parameters.
    static _params(prefix, opts)
    {
      let p = {};

      p.format = this._get_opt(prefix+'format_json', opts);
      p.space = this._get_opt(prefix+'json_spaces', opts);
      p.rep = this._get_opt(prefix+'json_replacer', opts);

      const fallback = this._get_opt(prefix+'fallback_spaces', opts);

      if (!Lum.hasLib('format_json'))
      { // The format_json library isn't loaded.
        if (p.format && !p.space)
        { // Let's use the fallback specifically for this purpose.
          p.space = fallback;
        }
        // Now nix format as it's not needed.
        p.format = false;
      }
      
      return p;
    }

    /**
     * Take the contents of an object, serialize it into JSON, and put
     * the JSON string into a <textarea> or <pre> element.
     */
    static field(obj, toel, opts)
    {
      if (!toel)
      {
        toel = this._get_opt('element', opts);
      }

      const p = this._params('field_', opts);
      const el = $(toel);

      if (el.exists())
      { // First call el.JSON() to populate the JSON string.
        el.JSON(obj, p.rep, p.space);
        if (p.format)
        { // 
          el.formatJSON();
        }

        return el;
      }
    } // static field()

    /**
     * Take the value of a <textarea>, <select>, or <input>, and put it into
     * another <textarea> element.
     *
     * By default if the value appears to be a JSON string, and the
     * format_json library has been loaded, we'll reformat the output.
     */
    static element (fromel, toel, opts)
    {
      if (!toel)
      {
        toel = this._get_opt('element', opts);
      }
  
      const p = this._params('element_', opts);
      const to = $(toel);
      const from = $(fromel);
  
      if (to.exists() && from.exists())
      {
        if (!p.space && !p.rep)
        { // No space, no replacer, let's just copy the value directly.
          to.val(from.val());
        }
        else
        { // If either space or replacer is defined, we do this instead.
          to.JSON(from.JSON(), p.rep, p.space);
        }

        if (p.format)
        { // Finally if format was true, let's apply it.
          to.formatJSON();
        }

        return to;
      }
    } // static element()
  
    /**
     * Debugging buttons made easy.
     *
     * If the source is a closure, it's expected to return a Javascript
     * object, which will be processed using the debug.field() method.
     *
     * If the source is a string, it's the name of a source element to use
     * with the debug.element() method.
     *
     * If the source is undefined, we assume an element with an id
     * of the fieldname.
     */
    static button (fieldname, source, opts)
    {
      const prefix = this._get_opt('prefix', opts);
      const stype = typeof source;

      let btn;
      if (fieldname instanceof jQuery)
      { // The button element was passed instead of a field name.
        btn = fieldname;
      }
      else
      {
        btn = $(prefix+fieldname);
      }
      
      let handler;
      const self = this;

      if (stype === 'function')
      {
        handler = function ()
        {
          self.field(source(), null, opts);
        };
      }
      else
      {
        if (stype === 'undefined' && typeof fieldname === 'string')
        {
          source = '#' + fieldname;
        }
        else if (stype !== 'string')
        {
          console.error("invalid source");
          return;
        }
        handler = function ()
        {
          self.element(source, null, opts);
        }
      }

      $(elname).on('click', handler);

    } // static button()

    field(obj, opts)
    {
      return this.constructor.field(obj, null, this._get_opts(opts));
    }

    element(from, opts)
    {
      return this.constructor.element(from, null, this._get_opts(opts));
    }

    button(fieldname, source, opts)
    {
      return this.constructor.button(fieldname, source, this._get_opts(opts));
    }

  } // Lum.Debug.Elements

  // Some static defaults for backwards compatibility.
  Lum.Debug.Elements.defaults =
  {
    element: '#debug',
    prefix:  '#debug_',
    field_format_json: true,
    field_json_spaces: null,
    field_json_replace: null,
    field_fallback_spaces: 2,
    element_format_json: true,
    element_json_spaces: null,
    element_json_replace: null,
    element_fallback_spaces: 2,
  };

  // Finally, a quick alias for limited backwards compatibility.
  // Not guaranteed to stick around forever, but it's here for now.
  Lum.debug = Lum.Debug.Elements;

})(window.jQuery);

