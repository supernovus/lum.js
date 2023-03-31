// Old ModelAPI library
Lum.lib(
{
  name: 'modelapi',
  jq: true,
},
function(Lum, $)
{
  "use strict";

  const MAPI = require('@lumjs/compat-modelapi');
 
  Lum.ModelAPI = MAPI.Model;
  Lum.ModelAPI.Extension = MAPI.Extension;

});
