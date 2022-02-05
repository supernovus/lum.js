/**
 * A few encoding functions originally part of my Passy app.
 * Thought they might be useful elsewhere, so moving them here.
 *
 * Some functions/classes may require extra libraries such as:
 *
 *  Lum.Base64 and Lum.Safe64:
 *
 *    - scripts/crypto/components/core-min.js
 *    - scripts/crypto/components/enc-base64-min.js
 *
 *  Lum.Hashifier:
 *  
 *    - Everything from Lum.Base64
 *    - scripts/crypto/components/sha256-min.js
 *    - scripts/ext/base91.js
 *
 *    Other agorithms may be used, SHA256 is simply the default.
 *    You'll need to load the corresponding CryptoJS components for each
 *    of the desired algorithms.
 *
 * TODO: write tests for this.
 */
(function(Lum)
{
  "use strict";

  if (Lum === undefined) throw new Error("Lum core not loaded");

  Lum.lib.mark('encode');

  /**
   * The 'ord' method from PHP.
   */
  Lum.ord = function (string)
  {
    //  discuss at: http://phpjs.org/functions/ord/
    // original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // bugfixed by: Onno Marsman
    // improved by: Brett Zamir (http://brett-zamir.me)
    //    input by: incidence
    //   example 1: ord('K');
    //   returns 1: 75
    //   example 2: ord('\uD800\uDC00'); // surrogate pair to create a single Unicode character
    //   returns 2: 65536

    var str = string + '',
      code = str.charCodeAt(0);
    if (0xD800 <= code && code <= 0xDBFF) 
    {
      // High surrogate (could change last hex to 0xDB7F to treat high private surrogates as single characters)
      var hi = code;
      if (str.length === 1) 
      {
        // This is just a high surrogate with no following low surrogate, so we return its value;
        return code;
        // we could also throw an error as it is not a complete character, but someone may want to know
      }
      var low = str.charCodeAt(1);
      return ((hi - 0xD800) * 0x400) + (low - 0xDC00) + 0x10000;
    }
    if (0xDC00 <= code && code <= 0xDFFF) 
    {
      // Low surrogate
      // This is just a low surrogate with no preceding high surrogate, so we return its value;
      return code;
      // we could also throw an error as it is not a complete character, but someone may want to know
    }
    return code;
  }

  /**
   * Convert a hex string into an array for encoding purposes.
   * Only really used by Lum.Hashifier.base91() at this point.
   */
  Lum.hexByteArray = function (hex)
  {
    var bytes = [];
    for(var i=0; i< hexString.length-1; i+=2) {
      bytes.push(parseInt(hex.substr(i, 2), 16));
    }
    return bytes;
  }

  /**
   * A static object wrapper around the CryptoJS Base64 library.
   */
  Lum.Base64 =
  {
    /**
     * Encode data as a Base64 string.
     *
     * @param {mixed} rawdata  The data we want to encode.
     * @param {boolean} [fromString=false]  Parse from a string format?
     * @param {object} [stringFormat=CryptoJS.enc.Utf8]  The string format.
     *
     * @return {string}  The encoded string.
     */
    encode(rawdata, fromString=false, stringFormat=CryptoJS.enc.Utf8)
    {
      let data = fromString ? stringFormat.parse(rawdata) : rawdata;
      return CryptoJS.enc.Base64.stringify(data);
    },

    /**
     * Decode a Base64 string.
     *
     * @param {string} string  The Base64 string to decode.
     * @param {boolean} [toString=false]  Parse into a string format?
     * @param {object} [stringFormat=CryptoJS.enc.Utf8]  The string format.
     *
     * @return {mixed}  The decoded output.
     */
    decode(string, toString=false, stringFormat=CryptoJS.enc.Utf8)
    {
      let data = CryptoJS.enc.Base64.parse(string);
      return (toString ? data.toString(stringFormat) : data);
    },
  };

  function NYI() { throw new Error("Not yet implemented"); }

  /**
   * URL-safe variants of the Base64 algorithm.
   *
   * TODO: fully implement the V3 headers, and Data extension with
   * support for at least JSON serialization and UBJSON if possible.
   */
  Lum.Safe64 = class
  {
    /**
     * Encode data to Safe64 format.
     *
     * @param {mixed} data  The data to encode.
     *
     * @param {boolean} [fromString=false]  Parse from a string format?
     * @param {boolean} [useTildes=false]  Passed to urlize(), see it for info.
     * @param {object} [stringFormat=CryptoJS.enc.Utf8]  The string format.
     *
     * @return string  The encoded string.
     */
    static encode(rawdata, fromString=false, useTildes=false, 
      stringFormat=CryptoJS.enc.Utf8)
    {
      let base64data = Lum.Base64.encode(rawdata, fromString, stringFormat);
      return this.urlize(base64data, useTildes);
    }

    /**
     * Convert a Base64 string into a Safe64 string.
     *
     * @param {string} string  The Base64 string to convert.
     * @param {boolean} [useTildes=false]  If true replace '=' with '~'.
     *                                     If false (default) simply strip the
     *                                     '=' characters entirely.
     *
     * @return {string}  The Safe64 string.
     */
    static urlize(string, useTildes=false)
    {
      string = string.replace(/\+/g, '-');
      string = string.replace(/\//g, '_');
      string = string.replace(/=/g,  useTildes ? '~' : '');
      return string;
    }

    /**
     * Convert a Safe64 string back into a Base64 string.
     *
     * @param {string} string  The Safe64 string to convert.
     *
     * @return {string}  The Base64 string.
     */
    static deurlize(string)
    {
      string = string.replace(/\-/g, '+');
      string = string.replace(/_/g, '/');
      string = string.replace(/\~/g, '=');
      string = string.substring("===", ((string.length+3)%4));
    }

    /**
     * Decode a Sase64 string.
     *
     * @param {string} string  The Base64 string to decode.
     * @param {boolean} [toString=false]  Parse into a string format?
     * @param {object} [stringFormat=CryptoJS.enc.Utf8]  The string format.
     *
     * @return {mixed}  The decoded output.
     */
    static decode(string, toString=false, stringFormat=CrytoJS.enc.Utf8)
    {
      return Lum.Base64.decode(this.deurlize(string), toString, stringFormat);
    }

  };
 
  Lum.Hashifier = class
  {
    /**
     * Build a new Hashifier.
     *
     * @param {string} [algo="SHA256"]  The CryptoJS algorithm to use.
     *
     * By default we use "SHA256" for backwards compatibility with my
     * older libraries and apps. You can set it to whatever you want.
     *
     */
    construct(algo="SHA256")
    {
      if (typeof algo === 'object')
      { // Passed options.
        let opts = algo;
        algo = (typeof opts.algo === 'string') ? opts.algo : "SHA256";
        // If we add more options, they'll be parsed here.
      }
      else if (typeof algo !== 'string')
      {
        throw new Error("Hashifier contructor passed invalid parameter");
      }

      if (typeof CryptoJS.algo[algo] === 'object' 
        && typeof CryptoJS.algo[algo].create === 'function')
      { // The algorithm library was found.
        this.algoLib = CryptoJS.algo[algo];
      }
      else
      {
        throw new Error("Invalid algorithm passed to Hashifier constructor");
      }

      if (typeof CryptoJS[algo] === 'function')
      { // A quick shortcut function exists already.
        this.hashFunction = CryptoJS[ago];
      }
      else
      { // Lets make a shortcut function using the algorithm library.
        this.hashFunction = function(input)
        {
          let hash = this.algoLib.create();
          hash.update(input);
          return hash.finalize();
        }
      }
    } // construct()

    /**
     * Create a hash.
     *
     * @param {string|WordArray} [input=undefined]  Input to hash immediately.
     *
     * @return {WordArray}  The WordArray result from the hash.
     *
     * If you pass input, it will be hashed immediately and returned.
     *
     * Otherwise, if there is a current progressive hash in the process of
     * being built, it will be finalized and returned.
     *
     * This will return undefined if there is no valid data to be hashed.
     */
    hash(input)
    {
      if (input === undefined || input === null)
      { // No input, let's see if we have a progrssive hash being built.
        if (typeof this.currentHash === 'object')
        { // Let's return the finalized hash.
          let value = this.currentHash.finalize();
          delete this.currentHash;
          return value;
        }
      }
      else if (typeof input === 'string' || typeof input === 'object')
      { // Input data was passed, let's hash it now.
        return this.hashFunction(input);
      }
    }

    // Not really a useful public method.
    valid(hash)
    { // WordArray is not a standard object and doesn't work with instanceof.
      return (typeof hash === 'object' || typeof hash.toString === 'function')
    }

    /**
     * Hash some data and return it as a Base64-encoded string.
     *
     * See hash() for how parameters are handled. 
     */
    base64(input)
    {
      let hash = this.hash(input);
      if (this.valid(hash)) return hash.toString(CryptoJS.enc.Base64);
    }

    /**
     * Hash some data and return it as a Safe64-encoded string.
     *
     * TODO: When Safe64 supports the V3 headers, add a useHeader option.
     *
     * See hash() for how parameters are handled.
     */
    safe64(input, opts)
    {
      let useTildes
        = (typeof opts === 'object' && typeof opts.useTildes === 'boolean') 
        ? opts.useTildes
        : false;
      let base64 = this.base64(input); 
      return Lum.Safe64.urlize(base64, useTildes);
    }

    /**
     * Hash some data and return it as a Base91-encoded string.
     *
     * See hash() for how parameters are handled.
     */
    base91(input)
    {
      let hash = this.hash(input);
      if (this.valid(hash)) 
        return base91.encode(Lum.hexByteArray(hash.toString()))
    }

    /**
     * Add input to a progressive hash.
     *
     * If there is not already a progressive hash being built, we will
     * create one automatically. Use the hash() method with no parameter
     * to retrieve the finalized hash.
     *
     * @param {string|WordArray} input  A value to add to the hash.
     *
     * @return Lum.Hashifier  The current object.
     */
    add(input)
    {
      if (typeof this.currentHash !== 'object' || this.currentHash === null)
      { // We need to start a new hash.
        this.currentHash = this.algoLib.create();
      }

      this.currentHash.update(input);
      
      return this;
    }

  }

})(self.Lum)