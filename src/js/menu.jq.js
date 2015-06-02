/**
 * Build a simple context menu.
 */

(function($)
{
  /**
   * Build a menu. Use it on an element containing child elements representing
   * the menu items. By default we expect the menu to be a <ul> with <li>
   * menu items, but you can override this if you want.
   *
   * Options:
   *
   *  childItem:   If passed, the single-event handler will use this as
   *               the selector for child menu items. Otherwise we use 'li'.
   *  
   *  handler:     If passed, this should be a function, used to handle all
   *               menu items (child item set to 'this' within the function.)
   *
   *  items:       An object where the property names are child selectors, and
   *               property values are functions to handle the selector.
   *               Again, the child item will be set as 'this' in the function.
   *
   */
  $.fn.makeMenu = function (options)
  {
    if (options.handler)
    {
      var itemEl = options.childItem ? options.childItem : 'li';
      this.on('click', itemEl, options.handler);
    }
    else if (options.items)
    {
      for (var item in options.items)
      {
        this.on('click', item, options.items[item]);
      }
    }
  };

  var display_menu = function (menu, loc, event)
  {
    // Clicking outside
    $('body').one('click', function ()
    {
      menu.hide();
    });

    event.stopPropagation();

    if (jQuery.ui)
    {
      menu.css({display: 'block'}).position(
      {
        my: "left-10 top+10",
        of: loc
      });
    }
    else
    {
      var offset = loc.offset();
      menu.css(
      {
        display: 'block',
        top:     offset.top + 10,
        left:    offset.left - 5,
      });
    }
  };

  /**
   * Display a named menu at the location of a target.
   * Use on the target, and pass it the selector for the menu.
   */
  $.fn.showMenu = function (menu, event)
  {
    display_menu($(menu), this, event);
  };

  /**
   * An alternative to showMenu.
   * Use it on the menu, and pass it the selector for the target location.
   */
  $.fn.showMenuAt = function (loc, event)
  {
    display_menu(this, $(loc), event);
  };

})(jQuery);

