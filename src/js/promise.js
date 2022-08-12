/**
 * A Promise-like object that offers the jQuery Deferred API.
 *
 * I'm going to say this is deprecated now that native Promises
 * are available. If for whatever reason you need the Deferred API in a
 * Promise-like container with a couple convenience wrappers, you can use this.
 *
 */

Lum.lib('promise', 
function(Lum)
{ 
  Lum.Promise = require('@lumjs/compat/v4/promise');
}); 
