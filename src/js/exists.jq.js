/*
 * A jQuery plugin that adds an exists() method to selectors, so you can
 * see if an element exists.
 */

Lum.jq('exists',
function(Lum, $) 
{
  $.fn.exists = function ()
  {
    return this.length !== 0;
  };
});
