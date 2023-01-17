Lum.lib(
{
  name: 'encode'
}, 
function(Lum)
{
  "use strict";
  
  const enc = require('@lumjs/encode');

  /**
   * The 'ord' method from PHP.
   */
  Lum.ord = enc.ord;

  /**
   * Convert a hex string into an array for encoding purposes.
   * Only really used by Lum.Hashifier.base91() at this point.
   */
  Lum.hexByteArray = enc.numByteArray;

  /**
   * A static object wrapper around the CryptoJS Base64 library.
   */
  Lum.Base64 = enc.Base64;

  /**
   * URL-safe variants of the Base64 algorithm, with v3 data extension.
   */
  Lum.Safe64 = enc.Safe64;
 
  /**
   * A class for building simple crypto hashes.
   */
  Lum.Hashifier = enc.Hash;

});