Lum.lib(
{
  name: 'format_xml',
  assign: 'format.xml',
},
function (Lum)
{
  "use strict";

  const formatXML = require('@lumjs/formatting/xml');

  const $ = Lum.jq.get();

  if ($ !== undefined)
  {
    require('@lumjs/jquery-formatting/xml').enable($);
  }

  return formatXML;

});
