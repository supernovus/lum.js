/*
 * Modal dialog boxes, and UI masks made easy.
 */

(function ($)
{

  if (window.Nano === undefined)
  {
    window.Nano = {};
  }

  /**
   * Quick class to represent a Mask to cover the UI when a Modal is open.
   *
   * @class Nano.Mask
   */
  Nano.Mask = class
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
        if (typeof fade === 'number')
          $(this.element).fadeIn(fade);
        else if (typeof fade === 'boolean' && fade && this.fadeIn)
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
        if (typeof fade === 'number')
          $(this.element).fadeOut(fade);
        else if (typeof fade === 'boolean' && fade && this.fadeOut)
          $(this.element).fadeOut(this.fadeOut);
        else
          $(this.element).hide();    
      }
    }
  } // class Nano.Mask

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
  Nano.ModalDialog = class
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
        this.content.display = options.display ? options.display : 'below';
        this.content.fadeOut = options.fadeOut; // There is no fadeIn, sorry.
      }
      else
      {
        this.content = null;
        console.log("No 'element' selector passed to ModalDialog constructor.");
      }
  
      // Process any mask related options.
      if (typeof options.mask === 'object')
      {
        if (typeof options.mask.show === 'function')
        { // It's already an initialized Mask object. Set it directly.
          this.mask = options.mask;
        }
        else
        { // It's a set of options to build a new Mask object.
          this.mask = new Nano.Mask(options.mask);
        }
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
   * Show the dialog, at a specific position relative to a passed element.
   */
    show (posElement)
    {
      // Sanity check.
      if (!this.content) { return; }
  
      var pos = $(posElement);
  
      var before = this.events.beforeShow;
      if (before !== null && before !== undefined)
      {
        before.call(this, pos);
      }
    
      var content = this.content.element;
      var display = this.content.display;
      var offset = pos.offset();
  
      if (display in dt)
      {
        content.show();
        var coords = dt[display](content, offset, pos);
        if (coords && 'x' in coords && 'y' in coords)
        {
          content.css(
          { 
            position: 'absolute', 
            left:     coords.x+'px', 
            top:      coords.y+'px' 
          });
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
      }   
  
      var after = this.events.afterShow;
      if (after !== null && after !== undefined)
      {
        after.call(this, pos);
      }
  
    }
  
  /**
   * Hide the dialog.
   */
    hide ()
    {
      // Sanity check.
      if (!this.content) { return; }
  
      var before = this.events.beforeHide;
      if (before !== null && before !== undefined)
      {
        before.call(this, pos);
      }
  
      // First, close the dialog itself.
      var content = this.content.element;
      var fade = this.content.fadeOut;
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
      }
  
      var after = this.events.afterHide;
      if (after !== null && after !== undefined)
      {
        after.call(this, pos);
      }
  
    }

  } // ModalDialog

/*
 * Globally known display types.
 *
 * These are registered as a global object, not as instance objects.
 * Keep that in mind when considering extending it.
 */
  var dt = Nano.ModalDialog.displayTypes = {};

  dt.below = function (content, offset)
  {
    var x = offset.left;
    var y = offset.top;
    return {x:x, y:y};
  }

  dt.belowCenter = function (content, offset)
  {
    var x = offset.left + (pos.width() - content.width()) / 2;
    var y = offset.top + 10;
    return {x:x, y:y};
  }

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

  dt.avgCenter = function (content, offset)
  {
    content.css(
    {
      position: 'fixed',
      left:     '25%',
      top:      '25%',
    });
  }

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

})(jQuery);

