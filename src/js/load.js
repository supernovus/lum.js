/**
 * A simple JS and CSS loader that doesn't use jQuery, RequireJS, or yepnope.
 */
(function (Lum)
{
  "use strict";

  if (Lum === undefined) throw new Error("Lum core not found");

  Lum.lib.mark('load');

  console.error("The load library has been replaced by a built-in core module");

})(self.Lum);