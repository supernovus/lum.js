Lum.lib(
{
  name: 'format_json',
  assign: 'format.json',
},
function (Lum)
{
  "use strict";

  const formatJSON = require('@lumjs/formatting/json');

  const $ = Lum.jq.get();

  if ($ !== undefined)
  {
    require('@lumjs/jquery-formatting/json').enable($);
  }

  // We're done.
  return formatJSON;

});
