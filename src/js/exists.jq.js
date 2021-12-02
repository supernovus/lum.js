/*
 * A jQuery plugin that adds an exists() method to selectors, so you can
 * see if an element exists.
 */

(function($) 
{
  $.fn.exists = function ()
  {
    return this.length !== 0;
  };
})(self.jQuery);

