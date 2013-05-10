/**
 * A JSON Web Service wrapper.
 * Requires jQuery and JSON.stringify().
 * Set .done() and .fail() on the returned jqXHR object to set handlers.
 */

call_json = function (url, data)
{
  return jQuery.ajax(
  {
    type:         "POST",
    data:         JSON.stringify(data),
    url:          url,
    contentType:  "application/json; charset=utf-8",
    dataType:     "json",
  }); 
}
