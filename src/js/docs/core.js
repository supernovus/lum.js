/** 
 * This file is for additional core.js documentation.
 * 
 * Virtual methods like those added by internal setup methods will be documented here.
 */

/**
 * Mark a library as loaded.
 * 
 * @method Lum.lib.mark
 *
 * @param {string} lib  The name of the library we are marking as loaded.
 */

/**
 * See if a library is loaded.
 * 
 * @method Lum.lib.has
 *
 * @param {string} lib - The name of the library we are looking for.
 *
 * @return {bool} - If the library is loaded or not.
 */

/**
 * Check for loaded libraries. 
 * 
 * @method Lum.lib.check
 *
 * They must have been marked as loaded to pass the test.
 *
 * Any arguments are the names of libraries we need.
 *
 * Returns the name of the first missing library, or undefined if all
 * requested libraries are loaded.
 */

/**
 * Get a list of missing libraries.
 * 
 * @method Lum.load.checkAll
 * 
 * A version of `check()` that returns a list of missing
 * dependencies. If all are there it'll return an
 * empty array.
 */

/**
 * Run checkLibs; if it returns a string, throw a fatal error.
 * 
 * @method Lum.lib.need
 */

/**
 * Run checkLibs; return false if the value was a string, or true otherwise.
 * 
 * @method Lum.lib.want
 */

/**
 * Get a list of loaded libraries.
 * 
 * @method Lum.lib.list
 */

/**
 * Mark a Lum-specific jQuery plugin as loaded.
 * 
 * @method Lum.jq.mark
 */

 /**
   * Check for needed jQuery plugins.
   * 
   * @method Lum.jq.check
   */
 

  /**
   * Check for needed jQuery plugins.+
   * 
   * @method Lum.jq.checkAll
   */
  
  /**
   * Run checkJq; if it returns a string, throw a fatal error.
   * 
   * @method Lum.jq.need
   */
  

  /**
   * Run checkJq; return false if the value was a string, or true otherwise.
   * 
   * @method Lum.jq.want
   */
 