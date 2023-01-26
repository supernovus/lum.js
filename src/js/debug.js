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

Lum.lib(
{
  name: 'debug',
  jq: true,
}, 
function (Lum, $)
{
  "use strict";
  
  /**
   * A class to help with debugging.
   * 
   * As of Nano.js v5 the underlying class returned here depends
   * on if the `hash` library is loaded.
   * 
   * If it is, this will be the `@lumjs/web-debug` class.
   * If it isn't, this will be the `@lumjs/debug` class.
   */
  Lum.Debug 
    = Lum.lib.has('hash') 
    ? require('@lumjs/web-debug') 
    : require('@lumjs/debug');
  
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

      if (!Lum.lib.has('format_json'))
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

      btn.on('click', handler);

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

  // Finally, a quick old alias for limited backwards compatibility.
  Lum.debug = Lum.Debug.Elements;

});
