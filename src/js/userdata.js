/**
 * Get a bunch of user data.
 */
Lum.lib(
{
  name: 'userdata',
  ns: 'UserData',
},
function(Lum, ns)
{
  /* jshint asi: true */
  "use strict";

  const {getTimezone,getInfo} = require('@lumjs/web-user-data');

  ns._add('getTimezone', getTimezone);
  ns._add('getInfo', getInfo);

});