/**
 * Modal dialog boxes, and UI masks made easy.
 *
 * A lightweight alternative to jQuery UI's Dialog, this isn't dragable,
 * any doesn't set up things like buttons automatically. It's simply a way
 * to create portions of the page that can be shown and hidden on demand, 
 * and to control a mask element to grey out/disable the rest of the page.
 *
 * Requires jQuery.
 */

(function ($)
{

  if (window.Nano === undefined)
  {
    console.log("fatal error: Nano core not loaded");
    return;
  }

  var Mask = Nano.Mask = function (options)
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

  Mask.prototype.isHidden = function ()
  {
    return this.element.css('display') == 'none';
  }

  Mask.prototype.show = function (fade)
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

  Mask.prototype.hide = function (fade)
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

  var Modal = Nano.ModalDialog = function (options)
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
        this.mask = new Mask(options.mask);
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
  
  }

/**
 * Globally known display types.
 *
 * These are registered as a global object, not as instance objects.
 * Keep that in mind when considering extending it.
 */
  Modal.displayTypes = {};

  Modal.displayTypes.below = function (content, offset)
  {
    var x = offset.left;
    var y = offset.top;
    return {x:x, y:y};
  }

  Modal.displayTypes.belowCenter = function (content, offset)
  {
    var x = offset.left + (pos.width() - content.width()) / 2;
    var y = offset.top + 10;
    return {x:x, y:y};
  }

  Modal.displayTypes.center = function (content, offset)
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

  Modal.displayTypes.abscenter = function (content, offset)
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

  Modal.displayTypes.avgCenter = function (content, offset)
  {
    content.css(
    {
      position: 'fixed',
      left:     '25%',
      top:      '25%',
    });
  }

  Modal.displayTypes.uiElementCenter = function (content, offset, pos)
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
      return Modal.displayTypes.belowCenter(content, offset);
    }
  }

  Modal.displayTypes.uiWindowCenter = function (content, offset, pos)
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
      return Modal.displayTypes.abscenter(content, offset);
    }
  }

/**
 * Show the dialog, at a specific position relative to a passed element.
 */
  Modal.prototype.show = function (posElement)
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

    if (display in Modal.displayTypes)
    {
      content.show();
      var coords = Modal.displayTypes[display](content, offset, pos);
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
  Modal.prototype.hide = function ()
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

})(jQuery);

