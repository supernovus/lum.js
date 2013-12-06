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

if (window.Nano === undefined)
{
  window.Nano = {};
}

Nano.ModalDialog = function (options)
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
 * Globally known display types.
 *
 * These are registered as a global object, not as instance objects.
 * Keep that in mind when considering extending it.
 */
Nano.ModalDialog.displayTypes = {};

Nano.ModalDialog.displayTypes.below = function (content, offset)
{
  var x = offset.left;
  var y = offset.top;
  return {x:x, y:y};
}

Nano.ModalDialog.displayTypes.belowCenter = function (content, offset)
{
  var x = offset.left + (pos.width() - content.width()) / 2;
  var y = offset.top + 10;
  return {x:x, y:y};
}

Nano.ModalDialog.displayTypes.center = function (content, offset)
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

Nano.ModalDialog.displayTypes.abscenter = function (content, offset)
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

/**
 * Show the dialog, at a specific position relative to a passed element.
 */
Nano.ModalDialog.prototype.show = function (posElement)
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

  if (display in Nano.ModalDialog.displayTypes)
  {
    content.show();
    var coords = Nano.ModalDialog.displayTypes[display](content, offset);
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
Nano.ModalDialog.prototype.hide = function ()
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

