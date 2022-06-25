Lum.lib(
{
  name: 'viewcontroller',
  jq: true,
  assign: 'ViewController',
},
function(Lum, $)
{
  "use strict";

  const {O,F,S,B,is_obj} = Lum._;

  /**
   * A class to represent a View Controller in a GUI.
   */
  class ViewController
  {
    constructor (conf={})
    {

      console.debug("Using observable for ViewController");
      Lum.observable(this, conf.observable);

      this.defaultAttrNamespace = 'nano';
      this.defaultTmplNamespace = 'tmpl';
    }
  
    add (func)
    {
      return this.on("ready", func);
    }
  
    start (modelclass, conf)
    { // Register all of our functions. Make sure the page is loaded first.
      var self = this;
      $(function()
      {
        var api;
        if (typeof modelclass === F)
        {
          api = new modelclass(conf);
        }
        else if (is_obj(modelclass))
        {
          api = modelclass;
        }
        else
        {
          console.error("Invalid model passed to ViewController.start()");
          return;
        }
        self.apiInstance = api;

        self.trigger("ready", api);
        
        // Once we've triggered all of our handlers, tell the API.
        if (typeof api.trigger === F)
        {
          api.trigger("ready", self);
        }
        else if (typeof api.ready === F)
        {
          api.ready(self);
        }
      });
    }
  
    getHook (hookname)
    {
      var self = this;
      var hook = function (evnt)
      {
        var element = $(this);
        self.trigger(hookname, element, evnt);
      }
      return hook;
    }
  
    attrNS (selector, aname, aval, opts)
    {
      if (opts === undefined)
        opts = {};
      else if (typeof opts === F)
        opts = {each: opts};
      else if (typeof opts === S)
        opts = {ns: opts};
  
      var ns = 'ns' in opts ? opts.ns : this.defaultAttrNamespace;
  
      var matching = $(selector).filter(function()
      {
        return $(this).attr(ns+':'+aname) == aval;
      });
  
      if (typeof opts.each === F)
      {
        matching.each(opts.each);
      }
  
      return matching;
    }
  
    addTemplate (name, def, register)
    {
      if (def === undefined && register === undefined)
      { // Passed a single option.
        def = name;
        register = false;
      }
      else if (typeof name !== S)
      {
        console.error("Invalid template name", name, def);
        return;
      }
  
      if (typeof def === S)
      {
        def = {html: def};
      }
      else if (!is_obj(def))
      {
        console.error("Invalid template definition", name, def);
        return;
      }
  
      var render;
      if (typeof def.render === F)
      { // A custom render function, cool.
        render = def.render;
      }
      else if ('clone' in def)
      {
        console.error("The 'clone' option requires a 'render' option.", name, def);
        return;
      }
      else if (Lum.lib.has('render.riot2'))
      {
        render = Lum.render.riot2;
      }
      else if (Lum.lib.has('render.riot1'))
      {
        render = Lum.render.riot1;
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
  
    formChanged (options)
    {
      if (typeof options === B)
      {
        options = {toggle: options};
      }
      else if (!is_obj(options))
      {
        options = {};
      }
  
      var toggle = true;
      if (typeof options.toggle === B)
      {
        toggle = options.toggle;
      }
      else if (typeof options.toggle === F)
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
  
      if (typeof this.trigger === F)
      {
        this.trigger('formChanged', toggle);
      }
    }
  
    watchChanges (options)
    {
      options = options || {};
      const formEl = options.form ?? 'form';
      const eventName = options.event ?? 'change';
      var childSelector = options.selector ?? 'input,select,textarea';
      var self = this;

      $(formEl).on(eventName, childSelector, function (e)
      {
        self.formChanged(true);
      });
    }
  
    selectFile (opts)
    {
      opts = opts || {};

      const self = this;

      let fileBox;
      let removeFromDOM = false;

      if (typeof opts.fileSelector === S)
      { // A string selector.
        fileBox = $(opts.fileSelector);
      }
      else if (is_obj(opts.fileElement))
      { // A jQuery instance, or a DOM Element.
        fileBox = Lum.jq.wrap(opts.fileElement);
        if (fileBox === null)
        {
          console.error("Invalid 'fileElement' option", opts);
          return;
        }
      }
      else
      {
        fileBox = $('<input type="file">');

        if (typeof opts.multiple === B)
        {
          fileBox.prop('multiple', opts.multiple);
        }
        if (typeof opts.accept === S)
        {
          fileBox.prop('accept', opts.accept);
        }

        const addToDOM = opts.addToDOM ?? true;
        if (addToDOM)
        { // Add the element to the body, needed for some browsers.
          $('body').append(fileBox);
          removeFromDOM = true; // Remove when done with it.
        }
      }
  
      let clickNow = opts.clickNow;
      const callback = opts.onSelect;

      if (typeof callback === F)
      {
        fileBox.on('change', function (e)
        {
          let retval = undefined;
          if (e.target && e.target.files)
          { // One or more files found.
            const files = e.target.files;
            retval = callback.call(self, files, e);
          }

          if (removeFromDOM)
          { // The temporary element needs to be removed.
            fileBox.remove();
          }
          return retval;
        });

        if (typeof clickNow !== B)
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

    dropTarget (opts)
    {
      if (typeof opts === S)
      { // Assume it's a selector.
        opts = {element: opts};
      }
      else if (!is_obj(opts))
      {
        console.error("Invalid options passed to dropTarget()", opts);
        return;
      }

      let element;

      if ('element' in opts)
      { // Looks like a regular options object.
        element = Lum.jq.wrap(opts.element);
      }
      else
      { // May be that the element object itself was passed, do some magic.
        element = Lum.jq.wrap(opts);
        opts = {element: element}; 
      }

      if (element === null)
      {
        console.error("Could not find valid dropTarget element", opts);
        return;
      }

      function assignHandler(ev, handler)
      {
        if (typeof handler !== F)
        { // Do nothing.
          return;
        }

        if (typeof opts.target === S)
        { // We're using a target delegate.
          element.on(ev, opts.target, handler);
        }
        else
        { // Direct element handler with no delegation.
          element.on(ev, handler);
        }
      }

      function assignEvent (ev, defaultHandler)
      {
        return assignHandler(ev, (opts[ev] ?? defaultHandler));
      }

      const defaultDrag = function (e)
      {
        e.stopPropagation();
        e.preventDefault();
        return false;
      }

      assignEvent('dragenter', defaultDrag);
      assignEvent('dragover',  defaultDrag);

      if (typeof opts.onFiles === F)
      { // The drop area can accept files.
        const self = this;
        assignHandler('drop', function(e)
        {
          const data = Lum.jq.dataTransfer(e); 
          if (is_obj(data) && is_obj(data.files) && data.files.length > 0)
          { // We have files, let's do this!
            const files = data.files;
            const callback = opts.onFiles;
            const elThis = opts.elThis ?? false;
            const cbThis = elThis ? this : self;
            const cbLast = elThis ? self : this;
            const retval = callback.call(cbThis, files, e, cbLast);
            return ((typeof retval === B) ? retval : false);
          }
          else if (typeof opts.drop === F)
          { // No files, but there is a drop event, so proxy to it.
            const handler = opts.drop;
            return handler.call(this, e);
          }
        });
      }
      else
      { // No file callback, okay, let's just try assigning the 'drop' event.
        assignEvent('drop'); // No default handler for drop.
      }

    }
  
    static makeGUI ()
    { // In a static method, 'this' refers to the class not the instance.
      console.debug("makeGUI is deprecated");
      return class extends this {};
    }

  } // class Lum.ViewController

  return ViewController;

});

