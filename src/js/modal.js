/*
 * Modal dialog boxes, and UI masks made easy.
 */

Lum.lib(
{
  name: ['modal','mask'],
  jq: true,
},
function (Lum, $)
{
  "use strict";

  const {F,O,N,B,S} = Lum._;

  /**
   * Quick class to represent a Mask to cover the UI when a Modal is open.
   *
   * @class Lum.Mask
   */
  Lum.Mask = class
  {
    constructor (options)
    {
      if (options === undefined)
        options = {};

      var selector = 'element' in options ? options.element : '#mask';
      this.selector = selector;
      this.element  = $(selector);
      if (options.autoHide === undefined)
      {
        this.autoHide = options.depth ? false : true;
      }
      else
      {
        this.autoHide = options.autoHide;
      }
      this.showDepth = options.depth;
      this.hideDepth = null;
      this.fadeIn = options.fadeIn;
      this.fadeOut = options.fadeOut;
      this.autoFade = options.autoFade;
    }

    isHidden ()
    {
      return this.element.css('display') == 'none';
    }
  
    show (fade)
    {
      if (this.isHidden())
      {
        if (fade === undefined)
          fade = this.autoFade;
        if (typeof fade === N)
          $(this.element).fadeIn(fade);
        else if (typeof fade === B && fade && this.fadeIn)
          $(this.element).fadeIn(this.fadeIn);
        else
          $(this.element).show();
      }

      if (this.showDepth)
      {
        // Save the current z-index, to reset to on close.
        this.hideDepth = this.element.css('z-index');
        // Now set the new z-index.
        this.element.css('z-index', this.showDepth);
      }
    }

    hide (fade)
    {
      if (this.hideDepth) // Restore the old depth.
      {
        this.element.css('z-index', this.hideDepth);
      }
      if (this.autoHide)
      {
        if (fade === undefined)
          fade = this.autoFade;
        if (typeof fade === N)
          $(this.element).fadeOut(fade);
        else if (typeof fade === B && fade && this.fadeOut)
          $(this.element).fadeOut(this.fadeOut);
        else
          $(this.element).hide();    
      }
    }

    /**
     * Set an event handler on our element.
     */
    on ()
    {
      const elem = this.element;
      return elem.on.apply(elem, arguments);
    }

    /**
     * Remove an event handler on our element.
     */
    off ()
    {
      const elem = this.element;
      return elem.off.apply(elem, arguments);
    }

  } // class Lum.Mask

  /**
   * Simple Modal Dialog class.
   *
   * A lightweight alternative to jQuery UI's Dialog, this isn't dragable,
   * any doesn't set up things like buttons automatically. It's simply a way
   * to create portions of the page that can be shown and hidden on demand, 
   * and to control a mask element to grey out/disable the rest of the page.
   *
   * Requires jQuery.
   */
  Lum.ModalDialog = class
  {
    constructor (options)
    {
      if (options === undefined)
        options = {};
  
      // Set our content.
      if (options.element)
      {
        this.content = {};
        this.content.selector = options.element;
        this.content.element  = $(options.element);
        this.content.display = options.display ? options.display : dt.default;
        this.content.fadeOut = options.fadeOut; // This always works.
        this.content.fadeIn  = options.fadeIn;  // A real kludge.
      }
      else
      {
        this.content = null;
        console.log("No 'element' selector passed to ModalDialog constructor.");
      }
  
      // Process any mask related options.
      if (typeof options.mask === O)
      {
        if (typeof options.mask.show === F)
        { // It's already an initialized Mask object. Set it directly.
          this.mask = options.mask;
        }
        else
        { // It's a set of options to build a new Mask object.
          this.mask = new Lum.Mask(options.mask);
        }
        this.hideOnMask = options.hideOnMask ?? false;
      }
      else
      { // No mask being used.
        this.mask = null;
      }
  
      // Register some events.
      this.events =
      {
        beforeShow:   options.beforeShow,
        beforeHide:   options.beforeHide,
        afterShow:    options.afterShow,
        afterHide:    options.afterHide,
      };
    } // constructor()

    /**
     * Set an event handler on our content element.
     */
    on ()
    {
      if (!this.content) { return; }
      const elem = this.content.element;
      return elem.on.apply(elem, arguments);
    }

    /**
     * Remove an event handler on our content element.
     */
    off ()
    {
      if (!this.content) { return; }
      const elem = this.content.element;
      return elem.off.apply(elem, arguments);
    }

    /**
     * Find another element in our content element.
     */
    find ()
    {
      if (!this.content) { return; }
      const elem = this.content.element;
      return elem.find.apply(elem, arguments);
    }

    /**
     * Show the dialog, at a specific position relative to a passed element.
     */
    show (posElement='body')
    {
      // Sanity check.
      if (!this.content) 
      { 
        console.error("No content, cannot show()", this);
        return; 
      }

      if (posElement === null
        || (typeof posElement !== S && typeof posElement !== O))
      {
        console.error("Invalid posElement", posElement, this);
        return;
      }
  
      const pos = this.lastPos = $(posElement);
      const content = this.content.element;
  
      const before = this.events.beforeShow;
      if (typeof before === F)
      {
        const ret = before.call(this, pos, content);
        if (ret === false)
        { // Something went wrong, goodbye.
          return;
        }
      }
  
      const fade   = this.content.fadeIn;
      const offset = pos.offset();

      let display = this.content.display;

      if (typeof display === S && display in dt)
      {
        display = dt[display];
      }

      if (typeof display === F)
      {
        let sbf = display.showBeforeFade;
        if (!fade || sbf)
        { // Show the content right away.
          content.show();
        }
        var coords = display(content, offset, pos);
        if (coords && 'x' in coords && 'y' in coords)
        {
          content.css(
          { 
            position: 'absolute', 
            left:     coords.x+'px', 
            top:      coords.y+'px' 
          });
        }
        if (fade)
        { // This is iffy at best.
          if (sbf)
          { // Hide it again.
            content.hide();
          }
          content.fadeIn(fade);
        }
      }
      else
      {
        console.log("unknown display type, no repositioning can be done.");
        content.show();
      }
  
      if (this.mask)
      {
        this.mask.show(true);
        if (this.hideOnMask)
        {
          let modal = this;
          this.$maskFunc = function(e)
          {
            modal.hide();
          }
          this.mask.on('click', this.$maskFunc);
        }
      }
  
      const after = this.events.afterShow;
      if (typeof after === F)
      {
        const ret = after.call(this, pos, content);
        if (ret !== undefined)
        { // It's something specific we want to return.
          return ret;
        }
      }
  
      return content;
    }
  
    /**
     * Hide the dialog.
     */
    hide ()
    {
      // Sanity check.
      if (!this.content) 
      {
        console.error("No content, cannot hide()", this);
        return; 
      }
  
      const content = this.content.element;

      const before = this.events.beforeHide;
      if (typeof before === F)
      {
        const ret = before.call(this, content);
        if (ret === false)
        { // Bye bye
          return;
        }
      }
  
      // First, close the dialog itself.
      const fade = this.content.fadeOut;
      if (fade)
      {
        content.fadeOut(fade);
      }
      else
      {
        content.hide();
      }
  
      // Next deal with the mask if its being used.
      if (this.mask)
      {
        this.mask.hide(true);
        if (typeof this.$maskFunc === F)
        {
          this.mask.off('click', this.$maskFunc);
          this.$maskFunc = null;
        }
      }
  
      var after = this.events.afterHide;
      if (after !== null && after !== undefined)
      {
        const ret = after.call(this, content);
        if (ret !== undefined)
        { // Send it off.
          return ret;
        }
      }
  
      return content;
    }

  } // ModalDialog

  /*
   * Globally known display types.
   *
   * These are registered as a global object, not as instance objects.
   * Keep that in mind when considering extending it.
   */
  const dt = Lum.ModalDialog.displayTypes = {};

  dt.below = function (content, offset)
  {
    var x = offset.left;
    var y = offset.top;
    return {x:x, y:y};
  }
  dt.below.showBeforeFade = false;

  dt.belowCenter = function (content, offset)
  {
    var x = offset.left + (pos.width() - content.width()) / 2;
    var y = offset.top + 10;
    return {x:x, y:y};
  }
  dt.belowCenter.showBeforeFade = true;

  dt.center = function (content, offset)
  {
    var x = Math.max(0, 
      (($(window).height() - content.outerHeight()) / 2) + 
        $(window).scrollTop()
    );
    var y = Math.max(0,
      (($(window).width() - content.outerWidth()) / 2) +
        $(window).scrollLeft()
    );
    return {x:x, y:y};
  }
  dt.center.showBeforeFade = true;

  dt.abscenter = function (content, offset)
  {
    var marginx = (content.outerHeight() / 2) * -1;
    var marginy = (content.outerWidth()  / 2) * -1;
    content.css(
    { 
      position:      'fixed', 
      left:          '50%', 
      top:           '50%',
      'margin-left':  marginx,
      'margin-top':   marginy,
    });
  }
  dt.showBeforeFade = true;

  dt.avgCenter = function (content, offset)
  {
    content.css(
    {
      position: 'fixed',
      left:     '25%',
      top:      '25%',
    });
  }
  dt.showBeforeFade = false;

  dt.uiElementCenter = function (content, offset, pos)
  {
    if (jQuery.ui)
    {
      content.position(
      {
        of: pos
      });
    }
    else
    {
      return dt.belowCenter(content, offset);
    }
  }
  dt.showBeforeFade = true;

  dt.uiWindowCenter = function (content, offset, pos)
  {
    if (jQuery.ui)
    {
      content.position(
      {
        of: window
      });
    }
    else
    {
      return dt.abscenter(content, offset);
    }
  }
  dt.showBeforeFade = true;

  // The new default is uiWindowCenter.
  dt.default = dt.uiWindowCenter;

});

