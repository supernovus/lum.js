(function($, observable)
{
  if (window.Nano === undefined)
  {
    console.log("fatal error: missing Nano global namespace");
    return;
  }

  Nano.ViewController = function ()
  {
    /**
     * A reference to ourself. If observable() is found, we apply it.
     */
    var self;
    if (observable !== undefined)
      self = observable(this);
    else
      self = this;

    if (observable === undefined)
      self.readyHandlers = [];

    self.defaultAttrNamespace = 'nano';
    self.defaultTmplNamespace = 'tmpl';
  }

  Nano.ViewController.prototype.add = function (func)
  {
    if (this.readyHandlers)
    {
      this.readyHandlers.push(func);
    }
    else
    {
      this.on("ready", func);
    }
  }

  Nano.ViewController.prototype.start = function (modelclass, conf)
  { // Register all of our functions. Make sure the page is loaded first.
    var self = this;
    $(function()
    {
      var api;
      if (typeof modelclass === 'function')
      {
        api = new modelclass(conf);
      }
      else if (typeof modelclass === 'object')
      {
        api = modelclass;
      }
      else
      {
        console.error("Invalid model passed to ViewController.start()");
        return;
      }
      self.apiInstance = api;
      if (self.readyHandlers)
      {
        for (var c in self.readyHandlers)
        {
          var handler = self.readyHandlers[c];
          handler.call(self, api);
        }
      }
      else
      {
        self.trigger("ready", api);
      }

      // Once we've triggered all of our handlers, tell the API.
      if (typeof api.trigger === 'function')
      {
        api.trigger("ready", self);
      }
      else if (typeof api.ready === 'function')
      {
        api.ready(self);
      }
    });
  }

  Nano.ViewController.prototype.getHook = function (hookname)
  {
    if (this.readyHandlers)
    {
      Nano.warn("getHook requires 'observable' library to be loaded.");
      return;
    }
    var self = this;
    var hook = function (evnt)
    {
      var element = $(this);
      self.trigger(hookname, element, evnt);
    }
    return hook;
  }

  Nano.ViewController.prototype.attrNS = function (selector, aname, aval, opts)
  {
    if (opts === undefined)
      opts = {};
    else if (typeof opts === 'function')
      opts = {each: opts};
    else if (typeof opts === 'string')
      opts = {ns: opts};

    var ns = 'ns' in opts ? opts.ns : this.defaultAttrNamespace;

    var matching = $(selector).filter(function()
    {
      return $(this).attr(ns+':'+aname) == aval;
    });

    if (typeof opts.each === 'function')
    {
      matching.each(opts.each);
    }

    return matching;
  }

  Nano.ViewController.prototype.addTemplate = function (name, def, register)
  {
    if (def === undefined && register === undefined)
    { // Passed a single option.
      def = name;
      register = false;
    }
    else if (typeof name !== 'string')
    {
      console.error("Invalid template name", name, def);
      return;
    }

    if (typeof def === 'string')
    {
      def = {html: def};
    }
    else if (typeof def !== 'object')
    {
      console.error("Invalid template definition", name, def);
      return;
    }

    var render;
    if ('render' in def)
    {
      render = def.render;
    }
    else if ('clone' in def)
    {
      console.error("The 'clone' option requires a 'render' option.", name, def);
      return;
    }
    else if (Nano.render !== undefined && Nano.render.riot2 !== undefined)
    {
      render = Nano.render.riot2;
    }
    else if (Nano.render !== undefined && Nano.render.riot1 !== undefined)
    {
      render = Nano.render.riot1;
    }
    else
    {
      console.error("Could not find a rendering engine to use", name, def);
      return;
    }

    var template;
    if ('html' in def)
    {
      var html = $(def.html).html();
      template = function (data)
      {
        return $(render(html, data));
      }
    }
    else if ('clone' in def)
    {
      var toClone = def.clone;
      template = function (data)
      {
        var clone = $(toClone).clone();
        var result = render(clone, data);
        if (result === undefined)
        {
          return clone;
        }
        else
        {
          return result;
        }
      }
    }
    else
    {
      console.error("No 'html' or 'clone' in template definition", name, def);
      return;
    }

    if (register === undefined)
    {
      register = true;
    }

    if (register)
    {
      var prop = this.defaultTmplNamespace;
      if (this[prop] === undefined)
      {
        this[prop] = {};
      }
      this[prop][name] = template;
    }

    return template;
  }

  Nano.ViewController.prototype.formChanged = function (options)
  {
    if (typeof options === 'boolean')
    {
      options = {toggle: options};
    }
    else if (typeof options !== 'object' || options === null)
    {
      options = {};
    }

    var toggle = true;
    if (typeof options.toggle === 'boolean')
    {
      toggle = options.toggle;
    }
    else if (typeof options.toggle === 'function')
    {
      toggle = options.toggle.call(this, options);
    }

    if (toggle)
    {
      if (!this._formChanged)
      {
        this._formChanged = function ()
        {
          return "All unsaved changes will be lost if you proceed.";
        }
        $(window).on('beforeunload', this._formChanged);
      }
    }
    else
    {
      if (this._formChanged)
      {
        $(window).off('beforeunload', this._formChanged);
        delete this._formChanged;
      }
    }

    if (typeof this.trigger === 'function')
    {
      this.trigger('formChanged', toggle);
    }
  }

  Nano.ViewController.prototype.watchChanges = function (options)
  {
    var formEl = 'form' in options ? options.form : 'form';
    var eventName = 'event' in options ? options.event : 'change';
    var childSelector = 'selector' in options ? options.selector
      : 'input,select,textarea';
    var self = this;
    $(formEl).on(eventName, childSelector, function (e)
    {
      self.formChanged(true);
    });
  }

  Nano.ViewController.prototype.selectFile = function (opts)
  {
    var self = this;
    opts = opts || {};
    var fileBox;
    if (typeof opts.fileSelector === 'string')
    {
      fileBox = $(opts.fileSelector);
    }
    else if (typeof opts.fileElement === 'object')
    {
      fileBox = opts.fileElement;
    }
    else
    {
      fileBox = $('<input type="file">');
    }

    var clickNow = opts.clickNow;

    var callback = opts.onSelect;
    if (typeof callback === 'function')
    {
      fileBox.on('change', function (e)
      {
        if (e.target && e.target.files)
        { // One or more files found.
          callback.call(self, e.target.files, e);
        }
      });
      if (typeof clickNow !== 'boolean')
      { // If a callback is specified, but clickNow isn't, default to true.
        clickNow = true;
      }
    }

    if (clickNow)
    { // Click the box, you know you want to!
      fileBox.click();
    }

    return fileBox;
  }

  Nano.ViewController.makeGUI = function (replicate)
  {
    return Nano.extend(this, null, replicate);
  }

})(
  jQuery,                        // jQuery is always required. 
  window.riot 
  ? window.riot.observable       // If 'riot' exists, use it.
  : window.Nano.observable       // Nano may contain the observable trait.
);

