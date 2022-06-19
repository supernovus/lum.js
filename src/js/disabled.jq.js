/*
 * A jQuery plugin that adds 'enable()' and 'disable()' methods to
 * elements, which makes dynamic disabling and re-enabling of UI elements
 * much easier.
 */

Lum.jq('disabled', {}, 
function(Lum, $) 
{
  $.fn.enable = function ()
  {
    //return this.removeAttr('disabled');
    return this.prop('disabled', false);
  }
  $.fn.enabled = function ()
  {
    return (this.prop('disabled') ? false : true);
  }
  $.fn.disable = function ()
  {
    //return this.attr('disabled','disabled');
    return this.prop('disabled', true);
  }
  $.fn.disabled = function ()
  {
    return this.prop('disabled');
  }
});

