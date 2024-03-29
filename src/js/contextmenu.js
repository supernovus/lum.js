/**
 * A quick Lum library for making Context menus.
 * Replaces the older menu.jq.js, this will override that if used.
 */
Lum.lib(
{
  name: 'contextmenu',
  jq: true,
  assign: 'ContextMenu',
},
function(Lum, $)
{
  "use strict";

  // TODO: make jQuery optional.
  //const $ = Lum.jq.need().jq.get();

  let $registered = false; // Private storage for $register() static method.

  return class
  {
    constructor (options={})
    {
      this._options = options;
      this.onCancel = options.onCancel;
      this.onShow   = options.onShow;
      if (options.element !== undefined)
      {
        this.registerMenu(options.element, options);
      }
      this.paddingTop = ('paddingTop' in options) ? options.paddingTop : 10;
      this.paddingLeft = ('paddingLeft' in options) ? options.paddingLeft : 5;
    }

    static $isRegistered ()
    {
      return $registered;
    }

    /**
     * Register jQuery handlers made to be compatible with menu.jq.js
     */
    static $register (registerOptions)
    {
      if ($registered) return;
  
      var registerDynamic = false;
      if (typeof registerOptions === 'boolean')
      {
        registerDynamic = registerOptions;
      }
      else if (typeof registerOptions === 'object')
      {
        if (typeof registerOptions.registerDynamic === 'boolean')
        {
          registerDynamic = registerOptions.registerDynamic;
        }
      }
      
      $.fn.makeMenu = function (options)
      {
        options = options || {};
        if ('element' in options)
        { // that's not valid!
          console.error("options.element is ignored with $.makeMenu");
          delete options.element;
        }
        var menu = new Lum.ContextMenu(options);
        menu.registerMenu(this, options);
      }
  
      $.fn.showMenu = $.fn.showMenuAt = function ()
      {
        var menu, loc, ev, opts;
        if (arguments.length === 1)
        { // One argument. This is preferred.
          menu = this;
  
          if ('target' in arguments[0])
          { // It's the event object.
            ev = arguments[0];
          }
          else
          { // Let's check for parameters.
            opts = arguments[0];
            if ('event' in opts)
              ev = opts.event;
            if ('loc' in arguments[0])
              loc = opts.loc;
          }
  
          if (this.data('menu') === undefined)
          {
            if (registerDynamic)
            { // register dynamically.
              this.makeMenu(opts);
            }
            else
            {
              console.error("invalid menu element specified with $.showMenu");
              return;
            }
          }
        }
        else if (arguments.length === 2)
        { // The old two-parameter signature, for compatibility.
          ev = arguments[1];
          if (this.data('menu') === undefined)
          { // The calling object wasn't the menu, so it must be the parameter.
            menu = $(arguments[0]);
            if (menu.data('menu') === undefined)
            {
              console.error("invalid menu passed to $.showMenu");
              return;
            }
            loc = this;
          }
          else
          { // The calling object was the menu, the second parameter is the loc.
            menu = this;
            loc = $(arguments[0]);
          }
        }
        else
        {
          console.error("invalid number of parameters passed to $.showMenu");
          return;
        }
        var menuInstance = menu.data('menu');
        menuInstance.showMenu(ev, loc);
      }
  
      $.fn.getMenu = function ()
      {
        return this.data('menu');
      }
  
      $registered = true;
    }
  
    registerMenu (el, options)
    {
  //    console.log("registerMenu", el, options);
      if (options === undefined)
      {
        console.error("registerMenu requires options");
        return;
      }
      this.menuElem = $(el);
      if (options.handler)
      {
        var itemEl = options.childItem ? options.childItem : 'li';
        this.menuElem.on('click', itemEl, options.handler);
      }
      else if (options.items)
      {
        for (var item in options.items)
        {
          this.menuElem.on('click', item, options.items[item]);
        }
      }
      this.menuElem.data('menu', this);
      return this.menuElem;
    }
  
    unregisterMenu ()
    {
      var options = this._options;
      if (options.handler)
      {
        var itemEl = options.childItem ? options.childItem : 'li';
        this.menuElem.off('click', itemEl, options.handler);
      }
      else if (options.items)
      {
        for (var item in options.items)
        {
          this.menuElem.off('click', item, options.items[item]);
        }
      }
      this.menuElem.removeData('menu');
    }


  
    showMenu (ev, loc)
    {
      var el = this.menuElem;
      var onCancel = this.onCancel;
      var onShow   = this.onShow;
  
      if (el.css('display') === 'block')
      { // Already shown, go away.
        return false;
      }
  
      if (typeof onShow === 'function')
      {
  //      console.log("calling onShow function");
        onShow.call(this, ev);
      }
  
      ev.stopPropagation();
      ev.preventDefault();
  
  //    console.log("showMenu", ev, loc, el);
  
      var self = this;
  
      function onClickHandler ()
      {
        if (typeof onCancel === 'function')
        { // Run the callback.
          onCancel.call(self, ev);
        }
        el.hide();
      }

      this._onBodyClick = onClickHandler;
      $('body').one('click', onClickHandler);
  
      var pt = this.paddingTop;
      var pl = this.paddingLeft;
  
      if (loc !== undefined)
      { // A location element was specified.
        if ($.ui)
        { // We're using jQuery UI to place things.
          el.css({display: 'block'}).position(
          {
            my: "left-"+pl.toString()+" top+"+pt.toString(),
            of: loc,
          });
        }
        else
        { // We're using traditional offsets to place things.
          var offset = loc.offset();
          el.css(
          {
            display: 'block',
            top:     offset.top+pt,
            left:    offset.left-pl,
          });
        }
      }
      else if (ev.clientX !== undefined && ev.clientY !== undefined)
      { // We're using the cursor position to place things.
        var cx = ev.clientX;
        var cy = ev.clientY;
        var top = cy+pt;
        var left = cx-pl;
  //      console.log("displaying using event position", el, top, left, cy, cx);
        el.css(
        {
          display: 'block',
          top:     top,
          left:    left,
        });
      }
      else
      {
        console.error("could not determine where to open menu");
      }
  
      return false;
    }

    close() 
    {
      if (typeof this._onBodyClick === 'function')
      {
        $('body').off('click', this._onBodyClick);
        delete this._onBodyClick;
      }
      this.menuElem.hide();
    }

    hide()
    {
      this.close();
    }

  } // class Lum.ContextMenu

});
