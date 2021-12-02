/*
 * A jQuery plugin that adds the ability to load and save JSON from form
 * fields. It's designed with <input/> or <textarea/> type fields in mind
 * and uses val() to get and/or set the value.
 *
 * To load JSON from the field: $('#element').JSON();
 * To save JSON into the field: $('#element').JSON(object);
 *
 * This does not support multiple elements, and thus does not use this.each()
 * Also, when loading, we return the JSON, so chaining is unsupported.
 *
 */

(function($) 
{
  $.fn.JSON = function (obj, rep, space)
  {
    if (obj === undefined)
    {
      return JSON.parse(this.val());
    }
    else
    {
      return this.val(JSON.stringify(obj, rep, space));
    }
  };
})(self.jQuery);

