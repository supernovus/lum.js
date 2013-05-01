/**
 * Modal dialog boxes made easy.
 *
 * A lightweight alternative to jQuery UI's Dialog, this isn't dragable,
 * any doesn't set up things like buttons automatically. It's simply a way
 * to create portions of the page that can be shown and hidden on demand, 
 * and to control a mask element to grey out/disable the rest of the page.
 *
 * Requires jQuery.
 */

function ModalDialog (options)
{
  if (options === undefined)
    options = {};

  // Set our content.
  if (options.element)
  {
    this.content = {};
    this.content.selector = options.element;
    this.content.element  = jQuery(options.element);
    this.content.display = options.display ? options.display : 'below';
    this.content.fadeOut = options.fadeOut; // There is no fadeIn, sorry.
  }
  else
  {
    this.content = null;
    console.log("No 'element' selector passed to ModalDialog constructor.");
  }

  // Process any mask related options.
  if (options.mask && options.mask.element)
  {
    this.mask = {};
    this.mask.selector = options.mask.element;
    this.mask.element  = jQuery(options.mask.element);
    if (options.mask.hide === null || options.mask.hide === undefined)
    {
      this.mask.hide = options.mask.depth ? false : true;
    }
    else
    {
      this.mask.hide = options.mask.hide;
    }
    this.mask.show_depth  = options.mask.depth;
    this.mask.hide_depth = null; // Not populated until show() call.

    // Do we want the mask to fade in and out?
    this.mask.fadeIn  = options.mask.fadeIn;
    this.mask.fadeOut = options.mask.fadeOut;
  }
  else
  {
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
 * Show the dialog, at a specific position relative to a passed element.
 */
ModalDialog.prototype.show = function (posElement)
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
  if (display === 'below')
  {
    content.show();
    var x = offset.left; // - pos.outerWidth() + content.outerWidth();
    var y = offset.top;
    content.css({ 'left': x+'px', 'top': y+'px' });
  }
  else if (display === 'belowCenter')
  {
    content.show();
    var x = offset.left + (pos.width() - content.width()) / 2;
    var y = offset.top + 10;
    content.css({ 'left': x+'px', 'top': y+'px' });
  }
  else if (display === 'center')
  {
    content.show();
    var x = Math.max(0, 
      (($(window).height() - content.outerHeight()) / 2) + 
        $(window).scrollTop()
    );
    var y = Math.max(0,
      (($(window).width() - content.outerWidth()) / 2) +
        $(window).scrollLeft()
    );
    content.css({ 'left': x+'px', 'top': y+'px' });
  }   
  else
  {
    console.log("unknown display type, no repositioning can be done.");
    content.show();
  }

  if (this.mask)
  {
    var mask = this.mask.element;
    var hidden = mask.css('display') == 'none' ? true : false;
    var fade = this.mask.fadeIn;
    if (fade && hidden)
    {
      mask.fadeIn(fade);
    }
    else if (hidden)
    {
      mask.show();
    }
    if (this.mask.show_depth)
    {
      // Save the current z-index, to reset to on close.
      this.mask.hide_depth = mask.css('z-index');
      // Now set the new z-index.
      mask.css('z-index', this.mask.show_depth);
    }
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
ModalDialog.prototype.hide = function ()
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
    var mask = this.mask.element;
    if (this.mask.show_depth) // If show_depth is set, restore the old depth.
    {
      mask.css('z-index', this.mask.hide_depth);
    }
    if (this.mask.hide)
    {
      fade = this.mask.fadeOut; // Yup, we reuse the 'fade' variable.
      if (fade)
      {
        mask.fadeOut(fade);
      }
      else
      {
        mask.hide();
      }
    }
  }

  var after = this.events.afterHide;
  if (after !== null && after !== undefined)
  {
    after.call(this, pos);
  }

}

