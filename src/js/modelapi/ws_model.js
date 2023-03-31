// Old WS extension
Lum.lib(
{
  name: ['modelapi/ws_model', 'modelapi.ws_model'],
  deps: ['modelapi', 'promise'],
},
function(Lum)
{
  "use strict";

  const MAPI = require('@lumjs/compat-modelapi');
  MAPI.enableWS(Lum.ModelAPI);

});
